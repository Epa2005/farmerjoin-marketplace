// Integration patch for server.js
// Add these lines to your existing server.js file

// 1. Add this at the top with other requires
const mlRoutes = require('./ml_api_routes');

// 2. Add this after your existing routes
// ML API Routes
app.use('/api/ml', mlRoutes);

// 3. Add this table creation to your database setup
const createLearningTable = `
CREATE TABLE IF NOT EXISTS user_learning_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    question TEXT NOT NULL,
    context VARCHAR(255),
    learning_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
`;

// Execute table creation
db.query(createLearningTable, (err) => {
    if (err) {
        console.error('Error creating learning table:', err);
    } else {
        console.log('Learning table created or already exists');
    }
});

// 4. Add this middleware to handle CORS for ML endpoints
app.use('/api/ml', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

console.log('ML Integration loaded successfully!');
