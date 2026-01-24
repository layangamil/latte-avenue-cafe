const express = require('express');
const mysql = require('mysql2');

const app = express();
const PORT = 3000;

//MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Ibar2001Ayan',
    database: 'latte_avenue_cafe'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database!');
});

//Test endpoint
app.get('/', (req, res) => {
    res.send('Latte Avenue backend is running');
});

//Get menu from database
app.get('/api/menu', (req, res) => {
    db.query('SELECT * FROM product', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});