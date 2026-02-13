// Load environment variables from .env file into process.env
require('dotenv').config();
// Import the Express framework for building web servers
const express = require('express');
// Import MySQL2 library for database operations (PROMISE version)
const mysql = require('mysql2/promise');
// Import bcrypt library for password hashing and comparison
const bcrypt = require('bcrypt');
// Import jsonwebtoken library for creating/verifying JWT tokens
const jwt = require('jsonwebtoken');
// Import CORS middleware to enable Cross-Origin Resource Sharing
const cors = require('cors');
// Import path module for working with file paths
const path = require('path');
// Create an Express application instance
const app = express();
// Define the port number the server will listen on
const PORT = 5000;
// Middleware to parse JSON request bodies
app.use(express.json());
// Middleware to parse URL-encoded request bodies (extended: true allows rich objects/arrays)
app.use(express.urlencoded({ extended: true }));
// Middleware to enable CORS for all routes
app.use(cors());

//======================SERVE FRONTEND FILES========================
//Serve static files from frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// ================= AUTH MIDDLEWARE ===================================================================
// Define authentication middleware function
function auth(req, res, next) {
    // Get Authorization header from request
    const header = req.headers['authorization'];
    // If no header exists, send 403 Forbidden status
    if (!header) return res.sendStatus(403); // No token = forbidden

    // Split "Bearer TOKEN" and get the token part (index 1)
    const token = header.split(' ')[1];

    // Verify the JWT token using the secret from environment variables
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        // If verification fails, send 401 Unauthorized
        if (err) return res.sendStatus(401); // Bad token
        // Attach decoded user data to request object
        req.user = decoded; // Save user info
        // Call next() to continue to the next middleware/route handler
        next(); // Continue to route
    });
}

// Create MySQL database connection POOL using environment variables
const db = mysql.createPool({
    host: process.env.DB_HOST,     // Database host from .env
    user: process.env.DB_USER,     // Database username from .env
    password: process.env.DB_PASS, // Database password from .env
    database: process.env.DB_NAME,  // Database name from .env
    waitForConnections: true,      // Fixed: was waitForConnection (missing 's')
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection (fixed: getConnection not getconnection)
db.getConnection((err, connection) => {
    if (err) {
        // Log error if connection fails
        console.error('Database connection failed:', err);
        return;
    }
    // Log success message when connected
    console.log('Connected to MySQL database!');
    connection.release(); // Release the connection back to the pool
});

// Test endpoint - responds to GET requests at root URL
app.get('/', (req, res) => {
    // Send simple text response
    res.send('Latte Avenue backend is running');
});

// ================= AUTH ADMIN ====================================================================
// Define admin-only middleware function
function adminOnly(req, res, next) {
    // Check if user role is not 'staff' (admin)
    if (req.user.role !== 'staff') {
        // If not admin, send 403 Forbidden with message
        return res.status(403).json({ message: "Admins only" });
    }
    // If admin, continue to next middleware/route handler
    next();
}

// ================= MENU & ITEMS ENDPOINTS (CONVERTED TO ASYNC/AWAIT) ============================

// Get menu from database
app.get('/api/menu', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM product');
        res.json(results);
    } catch (err) {
        console.error('Error fetching menu:', err);
        res.status(500).json({ error: 'Failed to fetch menu' });
    }
});

// Get all items
app.get('/api/items', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM product');
        res.json(results);
    } catch (err) {
        console.error('Error fetching items:', err);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

// Add new item (staff only)
app.post('/api/items', auth, adminOnly, async (req, res) => {
    try {
        const { name, price, category, ingredients, is_available } = req.body;

        const sql = `
            INSERT INTO product (name, price, category, ingredients, is_available)
            VALUES (?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(sql, [name, price, category, ingredients, is_available ?? true]);
        res.json({ message: "Item added", id: result.insertId });
    } catch (err) {
        console.error('Error adding item:', err);
        res.status(400).json({ error: err.message });
    }
});

// Update item (staff only)
app.put('/api/items/:id', auth, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, category, ingredients, is_available } = req.body;

        const sql = `
            UPDATE product
            SET name=?, price=?, category=?, ingredients=?, is_available=?
            WHERE product_id=?
        `;

        await db.query(sql, [name, price, category, ingredients, is_available, id]);
        res.json({ message: "Item updated" });
    } catch (err) {
        console.error('Error updating item:', err);
        res.status(400).json({ error: err.message });
    }
});

// Delete item (staff only)
app.delete('/api/items/:id', auth, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM product WHERE product_id=?', [id]);
        res.json({ message: "Item deleted" });
    } catch (err) {
        console.error('Error deleting item:', err);
        res.status(400).json({ error: err.message });
    }
});

// ================= REGISTER USER ===================================================================
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, first_name, last_name } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
            [email, hashedPassword, first_name, last_name, 'customer']
        );

        res.json({ message: 'User created successfully' });

    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// ================= LOGIN ROUTE ===============================================================
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Login attempt - email:", email);

        // Query database for user with matching email
        const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        // If no user found, send 400 Bad Request
        if (results.length === 0) {
            console.log("User not found in database");
            return res.status(400).json({ message: "User not found" });
        }

        const user = results[0];

        // Compare provided password with hashed password in database
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            console.log("Password mismatch");
            return res.status(401).json({ message: "Wrong password" });
        }

        // Create JWT token
        const token = jwt.sign(
            { id: user.user_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log("Login successful for:", email);
        res.json({ token });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// ================= SHOPPING CART ENDPOINTS (CONVERTED TO ASYNC/AWAIT) ===========================

// GET /api/cart - get user's cart
app.get('/api/cart', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        const sql = `
            SELECT sc.cart_id, sc.product_id, sc.quantity, p.name, p.price, p.category, p.ingredients
            FROM shopping_cart sc
            JOIN product p ON sc.product_id = p.product_id
            WHERE sc.user_id = ?
        `;

        const [results] = await db.query(sql, [userId]);

        let total = 0;
        results.forEach(item => {
            total += parseFloat(item.price) * item.quantity;
        });

        res.json({
            items: results,
            total: total
        });
    } catch (err) {
        console.error('Error fetching cart:', err);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

// POST /api/cart - add items to cart
app.post('/api/cart', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { product_id, quantity } = req.body;

        if (!product_id) {
            return res.status(400).json({ error: 'Product ID is required' });
        }

        // Check if product exists & is available
        const [productResults] = await db.query(
            'SELECT * FROM product WHERE product_id = ? AND is_available = TRUE',
            [product_id]
        );

        if (productResults.length === 0) {
            return res.status(404).json({ error: 'Product not found or unavailable' });
        }

        // Check if item already in cart
        const [cartResults] = await db.query(
            'SELECT * FROM shopping_cart WHERE user_id = ? AND product_id = ?',
            [userId, product_id]
        );

        if (cartResults.length > 0) {
            // Item exists - update the quantity
            const newQuantity = cartResults[0].quantity + (quantity || 1);
            await db.query(
                'UPDATE shopping_cart SET quantity = ? WHERE cart_id = ?',
                [newQuantity, cartResults[0].cart_id]
            );
            res.json({ message: 'Cart updated successfully' });
        } else {
            // Item doesn't exist - insert new
            const [result] = await db.query(
                'INSERT INTO shopping_cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [userId, product_id, quantity || 1]
            );
            res.json({
                message: 'Item added to cart',
                cart_id: result.insertId
            });
        }
    } catch (err) {
        console.error('Error adding to cart:', err);
        res.status(500).json({ error: 'Failed to add to cart' });
    }
});

// PUT /api/cart/:product_id - Update quantity
app.put('/api/cart/:product_id', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = req.params.product_id;
        const { quantity } = req.body;

        // Validate quantity
        if (!quantity || quantity < 1) {
            return res.status(400).json({ error: 'Quantity must be at least 1' });
        }

        // Update quantity for a specific cart item
        const [result] = await db.query(
            'UPDATE shopping_cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
            [quantity, userId, productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        res.json({ message: 'Quantity updated successfully' });
    } catch (err) {
        console.error('Error updating quantity:', err);
        res.status(500).json({ error: 'Failed to update quantity' });
    }
});

// DELETE /api/cart/:product_id - remove item
app.delete('/api/cart/:product_id', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = req.params.product_id;

        const [result] = await db.query(
            'DELETE FROM shopping_cart WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        res.json({ message: 'Item removed from cart' });
    } catch (err) {
        console.error('Error removing item:', err);
        res.status(500).json({ error: 'Failed to remove item' });
    }
});

// DELETE /api/cart - clear entire cart
app.delete('/api/cart', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        await db.query('DELETE FROM shopping_cart WHERE user_id = ?', [userId]);

        res.json({ message: 'Cart cleared successfully' });
    } catch (err) {
        console.error('Error clearing cart:', err);
        res.status(500).json({ error: 'Failed to clear cart' });
    }
});

// ================= PROFILE (PROTECTED) ============================================================
app.get('/api/profile', auth, (req, res) => {
    res.json({ message: "Access granted", user: req.user });
});

// Start server listening on specified port and all network interfaces
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});