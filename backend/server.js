require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// ================= AUTH MIDDLEWARE =================
function auth(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.sendStatus(403); // No token = forbidden

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.sendStatus(401); // Bad token
        req.user = decoded; // Save user info
        next(); // Continue to route
    });
}

// MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
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


// ================= REGISTER USER =================
app.post('/api/register', async (req, res) => {
    const { email, password, first_name, last_name, role } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
        INSERT INTO users (email, password_hash, first_name, last_name, role)
        VALUES (?, ?, ?, ?, ?)
        `;

        db.query(sql, [email, hashedPassword, first_name, last_name, role || 'customer'], 
        (err, result) => {
            if (err) return res.status(400).json({ error: err });
            res.json({ message: "User registered successfully" });
        });

    } catch (err) {
        res.status(500).json({ error: err });
    }
});

// ================= LOGIN ROUTE =================
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err || results.length === 0)
            return res.status(400).json({ message: "User not found" });

        const user = results[0];

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ message: "Wrong password" });

        const token = jwt.sign(
            { id: user.user_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token });
    });
});


// ================= PROFILE (PROTECTED) =================
app.get('/api/profile', auth, (req, res) => {
    res.json({ message: "Access granted", user: req.user });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});