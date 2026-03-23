const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "project6"
});

db.connect(err => {
    if (err) {
        console.log("Database connection failed:", err);
    } else {
        console.log("Connected to project1 database");

        // Create photo column if it doesn't exist
        db.query("ALTER TABLE users ADD COLUMN photo VARCHAR(255) DEFAULT NULL", (err, result) => {
            if (err) {
                console.log("Photo column may already exist or table issue:", err.message);
            } else {
                console.log("Photo column added to users table");
            }
        });

        // Create cooperatives table if it doesn't exist
        const createCooperativesTable = `
            CREATE TABLE IF NOT EXISTS cooperatives (
                cooperative_id INT(11) NOT NULL AUTO_INCREMENT,
                user_id INT(11) NOT NULL,
                cooperative_name VARCHAR(150) DEFAULT NULL,
                location VARCHAR(255) DEFAULT NULL,
                phone VARCHAR(20) DEFAULT NULL,
                description TEXT DEFAULT NULL,
                profile_photo VARCHAR(255) DEFAULT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
                PRIMARY KEY (cooperative_id),
                KEY fk_cooperatives_user (user_id),
                CONSTRAINT fk_cooperatives_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
            )
        `;

        db.query(createCooperativesTable, (err, result) => {
            if (err) {
                console.log("Cooperatives table may already exist or table issue:", err.message);
            } else {
                console.log("Cooperatives table created successfully");
            }
        });
    }
});

module.exports = db;