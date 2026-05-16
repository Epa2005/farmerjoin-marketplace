const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error('DATABASE_URL is required');
    }

    const pool = new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
    });

    const sqlPath = path.join(__dirname, '..', 'bootstrap_supabase.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    try {
        await pool.query(sql);
        console.log('Supabase bootstrap completed successfully.');
    } finally {
        await pool.end();
    }
}

main().catch((err) => {
    console.error('Supabase bootstrap failed:', err.message);
    process.exit(1);
});
