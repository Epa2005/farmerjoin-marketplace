const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: "project6"

});
connection.connect((err) => {
    if (err) {
        console.error('connection failed', err);
    }
    else {
        console.log('database connected sucssefuly');
    }
});
module.exports = connection;
