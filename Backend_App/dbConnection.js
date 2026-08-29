const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mysql = require('mysql2');
const { Pool } = require('pg');

const dbHost = process.env.DB_HOST || '';
const dbPort = String(process.env.DB_PORT || '');
const usePostgres =
    Boolean(process.env.DATABASE_URL) ||
    process.env.DB_CLIENT === 'postgres' ||
    dbPort === '5432' ||
    dbPort === '6543' ||
    dbHost.includes('supabase.com');

if (usePostgres) {
    const normalizeDatabaseUrl = (rawUrl) => {
        if (!rawUrl) return rawUrl;
        try {
            const parsed = new URL(rawUrl);
            parsed.searchParams.delete('sslmode');
            parsed.searchParams.delete('ssl');
            return parsed.toString();
        } catch (_) {
            return rawUrl;
        }
    };

    const rejectUnauthorized = String(process.env.DB_SSL_REJECT_UNAUTHORIZED || 'false').toLowerCase() === 'true';
    const maxPoolSize = Number(process.env.DB_POOL_MAX || 15);
    const idleTimeoutMillis = Number(process.env.DB_IDLE_TIMEOUT_MS || 60000);
    const connectionTimeoutMillis = Number(process.env.DB_CONNECTION_TIMEOUT_MS || 30000);
    const maxUses = Number(process.env.DB_MAX_USES || 7500);

    const poolConfig = {
        connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL),
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'postgres',
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 6543,
        ssl: { rejectUnauthorized },
        max: maxPoolSize,
        idleTimeoutMillis,
        connectionTimeoutMillis,
        maxUses,
        allowExitOnIdle: false,
        pgbouncer: true
    };

    let pool = new Pool(poolConfig);
    let directPool = null;
    let directPoolAttempted = false;

    const tryResolveHost = (hostname) => {
        try {
            const dns = require('dns');
            return new Promise((resolve) => {
                dns.resolve4(hostname, (err, addresses) => {
                    if (err || !addresses || addresses.length === 0) {
                        dns.resolve6(hostname, (err6, addrs6) => {
                            resolve(err6 || !addrs6 || addrs6.length === 0 ? null : { addresses: addrs6, family: 6 });
                        });
                    } else {
                        resolve({ addresses, family: 4 });
                    }
                });
            });
        } catch (_) {
            return Promise.resolve(null);
        }
    };

    const getOrCreateDirectPool = async () => {
        if (directPool) return directPool;
        if (directPoolAttempted) return null;
        directPoolAttempted = true;

        const rawUser = process.env.DB_USER || '';
        const projectRef = rawUser.replace(/^postgres\./, '') || 'tzcouxmcpliptxerrjcr';
        const directHost = `db.${projectRef}.supabase.co`;

        const resolved = await tryResolveHost(directHost);
        if (!resolved) {
            console.warn(`Direct connection host ${directHost} has no DNS records (may be IPv6-only or unreachable). Skipping direct fallback.`);
            return null;
        }

        console.warn(`Creating direct PostgreSQL connection to ${directHost} (${resolved.family === 6 ? 'IPv6' : 'IPv4'})...`);
        directPool = new Pool({
            ...poolConfig,
            host: directHost,
            port: 5432,
            user: rawUser.includes('.') ? rawUser.split('.')[1] : rawUser,
            connectionString: undefined,
            family: resolved.family
        });
        return directPool;
    };

    const executeWithFallback = async (runner, queryText, values) => {
        try {
            return await runner.query(queryText, values);
        } catch (err) {
            if (err && err.message && err.message.includes('EMAXCONNSESSION') && runner === pool) {
                console.warn('PgBouncer pool exhausted, switching to direct connection...');
                const direct = await getOrCreateDirectPool();
                if (direct) {
                    pool = direct;
                    return await pool.query(queryText, values);
                }
                console.error('No direct connection available. PgBouncer sessions may need time to clear.');
            }
            throw err;
        }
    };

    let transactionClient = null;
    const primaryKeyCache = new Map();

    const toPgPlaceholders = (sql) => {
        // If querying information_schema.tables without schema, add public schema to avoid ambiguity
        try {
            if (typeof sql === 'string' && /information_schema\.tables/i.test(sql) && /table_name\s*=\s*\?/i.test(sql)) {
                sql = sql.replace(/table_name\s*=\s*\?/i, "table_schema = 'public' AND table_name = ?");
            }
        } catch (e) {
            // ignore and proceed
        }

        let i = 0;
        return sql.replace(/\?/g, () => `$${++i}`);
    };

    const getInsertTableName = (sql) => {
        const match = sql.match(/^\s*INSERT\s+INTO\s+["`]?([a-zA-Z0-9_]+)["`]?/i);
        return match ? match[1] : null;
    };

    const getPrimaryKeyColumn = async (tableName) => {
        if (!tableName) return null;
        if (primaryKeyCache.has(tableName)) return primaryKeyCache.get(tableName);

        const pkQuery = `
            SELECT a.attname AS column_name
            FROM pg_index i
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
            WHERE i.indrelid = $1::regclass
              AND i.indisprimary
            LIMIT 1
        `;

        try {
            const result = await pool.query(pkQuery, [tableName]);
            const pk = result.rows?.[0]?.column_name || null;
            primaryKeyCache.set(tableName, pk);
            return pk;
        } catch (_) {
            primaryKeyCache.set(tableName, null);
            return null;
        }
    };

    const buildInsertResult = (result, primaryKey) => {
        const insertedValue = primaryKey && result.rows?.[0] ? result.rows[0][primaryKey] : null;
        const numericInsertId = insertedValue !== null && insertedValue !== undefined && !Number.isNaN(Number(insertedValue))
            ? Number(insertedValue)
            : null;

        return {
            affectedRows: result.rowCount || 0,
            insertId: numericInsertId,
            rows: result.rows
        };
    };

    const db = {
        query(sql, params, callback) {
            let values = params;
            let cb = callback;

            if (typeof params === 'function') {
                cb = params;
                values = [];
            }

            const normalizedSql = (sql || '').trim();

            (async () => {
                const upperSql = normalizedSql.toUpperCase();
                const isInsert = upperSql.startsWith('INSERT');
                const hasReturning = /\bRETURNING\b/i.test(normalizedSql);
                const queryTextBase = toPgPlaceholders(normalizedSql);

                const run = async () => {
                    const runner = transactionClient || pool;
                    if (isInsert && !hasReturning) {
                        const tableName = getInsertTableName(normalizedSql);
                        const primaryKey = await getPrimaryKeyColumn(tableName);
                        if (primaryKey) {
                            const queryText = `${queryTextBase} RETURNING "${primaryKey}"`;
                            const result = await executeWithFallback(runner, queryText, values || []);
                            return buildInsertResult(result, primaryKey);
                        }
                    }
                    const result = await executeWithFallback(runner, queryTextBase, values || []);
                    return result;
                };

                const result = await run();
                const command = (result.command || '').toUpperCase();

                if (command === 'SELECT') {
                    return cb(null, result.rows);
                }

                if (command === 'INSERT') {
                    return cb(null, buildInsertResult(result, null));
                }

                return cb(null, {
                    affectedRows: result.rowCount || 0,
                    insertId: null,
                    rows: result.rows
                });
            })().catch((err) => cb(err));
        },

        beginTransaction(callback) {
            // Release any stuck transaction client first
            if (transactionClient) {
                const oldRelease = transactionClient.__release;
                if (typeof oldRelease === 'function') oldRelease();
                transactionClient = null;
            }
            const tryConnect = async (targetPool) => {
                targetPool.connect((err, client, release) => {
                    if (err && err.message && err.message.includes('EMAXCONNSESSION') && targetPool === pool) {
                        console.warn('PgBouncer pool exhausted in beginTransaction, switching to direct...');
                        getOrCreateDirectPool().then((direct) => {
                            if (direct) {
                                pool = direct;
                                tryConnect(pool);
                            } else {
                                callback(err);
                            }
                        }).catch(() => callback(err));
                        return;
                    }
                    if (err) return callback(err);
                    client.query('BEGIN', (beginErr) => {
                        if (beginErr) {
                            release();
                            return callback(beginErr);
                        }
                        transactionClient = client;
                        transactionClient.__release = release;
                        callback(null);
                    });
                });
            };
            tryConnect(pool);
        },

        commit(callback) {
            const cb = typeof callback === 'function' ? callback : () => { };
            if (!transactionClient) return cb(null);
            transactionClient.query('COMMIT', (err) => {
                const release = transactionClient.__release;
                transactionClient = null;
                if (typeof release === 'function') release();
                cb(err || null);
            });
        },

        rollback(callback) {
            const cb = typeof callback === 'function' ? callback : () => { };
            if (!transactionClient) return cb(null);
            transactionClient.query('ROLLBACK', (err) => {
                const release = transactionClient.__release;
                transactionClient = null;
                if (typeof release === 'function') release();
                cb(err || null);
            });
        },

        healthCheck(callback) {
            return this.query('SELECT 1 AS ok', (err, rows) => {
                if (callback) return callback(err, rows);
            });
        }
    };

    pool.query('SELECT NOW()', (err) => {
        if (err) {
            console.error('PostgreSQL connection failed:', err && err.message ? err.message : err);
        } else {
            console.log(`PostgreSQL connected successfully (pool max: ${maxPoolSize})`);
        }
    });

    // Attach error handler for connected clients to avoid unhandled 'error' events
    pool.on('connect', (client) => {
        client.on('error', (err) => {
            console.error('PostgreSQL client error:', err && err.message ? err.message : err);
        });
    });

    pool.on('error', (err) => {
        console.error('Unexpected PostgreSQL pool error:', err && err.message ? err.message : err);
    });

    // Periodically check pool health and log status
    setInterval(() => {
        const totalCount = pool.totalCount;
        const idleCount = pool.idleCount;
        const waitingCount = pool.waitingCount;
        if (totalCount > 0 || waitingCount > 0) {
            console.log(`[DB Pool] total: ${totalCount}, idle: ${idleCount}, waiting: ${waitingCount}`);
        }
    }, 60000).unref();

    module.exports = db;
} else {
    const useMySqlSsl = String(process.env.DB_SSL || 'false').toLowerCase() === 'true';
    const connection = mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'project6',
        port: process.env.DB_PORT || 3306,
        ...(useMySqlSsl ? { ssl: { rejectUnauthorized: false } } : {})
    });

    connection.connect((err) => {
        if (err) {
            console.error('Database connection failed:', err);
        } else {
            console.log('Database connected successfully');
        }
    });

    connection.healthCheck = (callback) => {
        connection.query('SELECT 1 AS ok', callback);
    };

    module.exports = connection;
}
