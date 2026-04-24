const mysql = require('mysql2/promise');
require('dotenv').config();

async function addLocationFields() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'project6'
    });

    try {
        console.log('Adding province, district, sector, and cell columns to farmers table...');

        // Add new columns
        await connection.execute(`
            ALTER TABLE farmers 
            ADD COLUMN province VARCHAR(100) DEFAULT NULL AFTER location,
            ADD COLUMN district VARCHAR(100) DEFAULT NULL AFTER province,
            ADD COLUMN sector VARCHAR(100) DEFAULT NULL AFTER district,
            ADD COLUMN cell VARCHAR(100) DEFAULT NULL AFTER sector
        `);
        console.log('Columns added successfully');

        // Fetch all farmers with location data
        const [farmers] = await connection.execute('SELECT farmer_id, location FROM farmers WHERE location IS NOT NULL AND location != ""');
        console.log(`Found ${farmers.length} farmers with location data`);

        // Parse and update location data
        for (const farmer of farmers) {
            const location = farmer.location.trim();
            let province = null;
            let district = null;
            let sector = null;
            let cell = null;

            // Parse comma-separated location (format: province,district,sector,cell)
            if (location.includes(',')) {
                const parts = location.split(',').map(p => p.trim());
                province = parts[0] || null;
                district = parts[1] || null;
                sector = parts[2] || null;
                cell = parts[3] || null;
            } else {
                // Single location - assume it's district (most common case)
                district = location;
            }

            // Update the farmer record
            await connection.execute(
                `UPDATE farmers SET province = ?, district = ?, sector = ?, cell = ? WHERE farmer_id = ?`,
                [province, district, sector, cell, farmer.farmer_id]
            );
            console.log(`Updated farmer ${farmer.farmer_id}: ${location} -> province:${province}, district:${district}, sector:${sector}, cell:${cell}`);
        }

        console.log('Migration completed successfully');
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Columns already exist, skipping migration');
        } else {
            console.error('Error:', error);
        }
    } finally {
        await connection.end();
    }
}

addLocationFields();
