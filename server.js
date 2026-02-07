require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// ================= AUTH MIDDLEWARE =================
function auth(req, res, next) {
    const header = req.headers['authorization'];
    if (!header) return res.sendStatus(403); // No token = forbidden

    const token = header.split(' ')[1];

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


// ================= AUTH ADMIN =================
function adminOnly(req, res, next) {
    if (req.user.role !== 'staff') {
        return res.status(403).json({ message: "Admins only" });
    }
    next();
}




//Get menu from database
app.get('/api/menu', (req, res) => {
    db.query('SELECT * FROM product', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// ================= GET ITEMS =================
app.get('/api/items', (req, res) => {
    db.query('SELECT * FROM product', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// ================= ADD NEW ITEMS(STAFF) =================
app.post('/api/items', auth, adminOnly, (req, res) => {
    const { name, price, category, ingredients, is_available } = req.body;

    const sql = `
    INSERT INTO product (name, price, category, ingredients, is_available)
    VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [name, price, category, ingredients, is_available ?? true],
    (err, result) => {
        if (err) return res.status(400).json({ error: err });
        res.json({ message: "Item added", id: result.insertId });
    });
});


// ================= UPDATE ITEMS(STAFF) =================
app.put('/api/items/:id', auth, adminOnly, (req, res) => {
    const { id } = req.params;
    const { name, price, category, ingredients, is_available } = req.body;

    const sql = `
    UPDATE product
    SET name=?, price=?, category=?, ingredients=?, is_available=?
    WHERE product_id=?
    `;

    db.query(sql, [name, price, category, ingredients, is_available, id],
    (err) => {
        if (err) return res.status(400).json({ error: err });
        res.json({ message: "Item updated" });
    });
});


// ================= DELETE ITEMS(STAFF) =================
app.delete('/api/items/:id', auth, adminOnly, (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM product WHERE product_id=?', [id], (err) => {
        if (err) return res.status(400).json({ error: err });
        res.json({ message: "Item deleted" });
    });
});



// ================= REGISTER USER =================
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name } = req.body;

    //HASH PASSWORD HERE
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, first_name, last_name, 'customer']
    );

    res.json({ message: 'User created successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
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
