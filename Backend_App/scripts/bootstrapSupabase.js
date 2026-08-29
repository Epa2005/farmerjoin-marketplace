const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
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

    // 1. Run schema SQL
    const sqlPath = path.join(__dirname, '..', 'bootstrap_supabase.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await pool.query(sql);
    console.log('Schema created successfully.');

    // 2. Seed default users with proper bcrypt hashes
    const adminHash = await bcrypt.hash('admin123', 10);
    const farmerHash = await bcrypt.hash('farmer123', 10);
    const buyerHash = await bcrypt.hash('buyer123', 10);

    // Admin user
    await pool.query(
        `INSERT INTO users (full_name, email, phone, password, role, status, created_at)
         VALUES ($1, $2, $3, $4, $5, 'active', NOW())
         ON CONFLICT (email) DO NOTHING`,
        ['Admin User', 'admin@farmerjoin.com', '+250 788 000 000', adminHash, 'admin']
    );

    // Farmer user
    await pool.query(
        `INSERT INTO users (full_name, email, phone, password, role, status, created_at)
         VALUES ($1, $2, $3, $4, $5, 'active', NOW())
         ON CONFLICT (email) DO NOTHING`,
        ['Demo Farmer', 'farmer@farmerjoin.com', '+250 788 111 111', farmerHash, 'farmer']
    );

    // Buyer user
    await pool.query(
        `INSERT INTO users (full_name, email, phone, password, role, status, created_at)
         VALUES ($1, $2, $3, $4, $5, 'active', NOW())
         ON CONFLICT (email) DO NOTHING`,
        ['Demo Buyer', 'buyer@farmerjoin.com', '+250 788 222 222', buyerHash, 'buyer']
    );

    // Create farmer profile
    await pool.query(
        `INSERT INTO farmers (user_id, farm_name, bio, location, phone)
         SELECT u.user_id, 'Demo Farm', 'Welcome to our demo farm!', 'Kigali, Rwanda', u.phone
         FROM users u WHERE u.email = 'farmer@farmerjoin.com'
         AND NOT EXISTS (SELECT 1 FROM farmers f WHERE f.user_id = u.user_id)`
    );

    // Create buyer profile
    await pool.query(
        `INSERT INTO buyers (user_id)
         SELECT u.user_id FROM users u WHERE u.email = 'buyer@farmerjoin.com'
         AND NOT EXISTS (SELECT 1 FROM buyers b WHERE b.user_id = u.user_id)`
    );

    console.log('Seed data inserted successfully.');
    console.log('--- Demo Accounts ---');
    console.log('Admin: admin@farmerjoin.com / admin123');
    console.log('Farmer: farmer@farmerjoin.com / farmer123');
    console.log('Buyer: buyer@farmerjoin.com / buyer123');

    await pool.end();
}

main().catch((err) => {
    console.error('Supabase bootstrap failed:', err.message);
    process.exit(1);
});
