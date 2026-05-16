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

    const pool = new Pool({
        connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL),
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'postgres',
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
        ssl: { rejectUnauthorized }
    });

    let transactionClient = null;
    const primaryKeyCache = new Map();

    const toPgPlaceholders = (sql) => {
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

            const runner = transactionClient || pool;
            const normalizedSql = (sql || '').trim();

            (async () => {
                const upperSql = normalizedSql.toUpperCase();
                const isInsert = upperSql.startsWith('INSERT');
                const hasReturning = /\bRETURNING\b/i.test(normalizedSql);
                const queryTextBase = toPgPlaceholders(normalizedSql);

                if (isInsert && !hasReturning) {
                    const tableName = getInsertTableName(normalizedSql);
                    const primaryKey = await getPrimaryKeyColumn(tableName);

                    if (primaryKey) {
                        const queryText = `${queryTextBase} RETURNING "${primaryKey}"`;
                        const result = await runner.query(queryText, values || []);
                        return cb(null, buildInsertResult(result, primaryKey));
                    }
                }

                const result = await runner.query(queryTextBase, values || []);
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
            pool.connect((err, client, release) => {
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
        },

        commit(callback) {
            const cb = typeof callback === 'function' ? callback : () => {};
            if (!transactionClient) return cb(null);
            transactionClient.query('COMMIT', (err) => {
                const release = transactionClient.__release;
                transactionClient = null;
                if (typeof release === 'function') release();
                cb(err || null);
            });
        },

        rollback(callback) {
            const cb = typeof callback === 'function' ? callback : () => {};
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
            console.error('PostgreSQL connection failed:', err.message);
        } else {
            console.log('PostgreSQL connected successfully');
        }
    });

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
