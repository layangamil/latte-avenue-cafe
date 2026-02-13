// Load environment variables from .env file into process.env
require('dotenv').config();
// Import the Express framework for building web servers
const express = require('express');
// Import MySQL2 library for database operations
const mysql = require('mysql2');
// Import bcrypt library for password hashing and comparison
const bcrypt = require('bcrypt');
// Import jsonwebtoken library for creating/verifying JWT tokens
const jwt = require('jsonwebtoken');
// Import CORS middleware to enable Cross-Origin Resource Sharing
const cors = require('cors');
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

// Create MySQL database connection using environment variables
const db = mysql.createConnection({
    host: process.env.DB_HOST,     // Database host from .env
    user: process.env.DB_USER,     // Database username from .env
    password: process.env.DB_PASS, // Database password from .env
    database: process.env.DB_NAME  // Database name from .env
});

// Attempt to connect to the database
db.connect((err) => {
    if (err) {
        // Log error if connection fails
        console.error('Database connection failed:', err);
        return;
    }
    // Log success message when connected
    console.log('Connected to MySQL database!');
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

// Get menu from database - responds to GET requests at /api/menu
app.get('/api/menu', (req, res) => {
    // Query database for all products
    db.query('SELECT * FROM product', (err, results) => {
        // If error occurs, send 500 Internal Server Error
        if (err) return res.status(500).json({ error: err });
        // Send query results as JSON response
        res.json(results);
    });
});

// ================= GET ITEMS ========================================================================
// Get all items - responds to GET requests at /api/items
app.get('/api/items', (req, res) => {
    // Query database for all products (same as menu endpoint)
    db.query('SELECT * FROM product', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// ================= ADD NEW ITEMS(STAFF) ================================================================
// Add new item - protected route requiring auth and adminOnly middleware
app.post('/api/items', auth, adminOnly, (req, res) => {
    // Destructure item data from request body
    const { name, price, category, ingredients, is_available } = req.body;

    // SQL query with placeholders (?) to prevent SQL injection
    const sql = `
    INSERT INTO product (name, price, category, ingredients, is_available)
    VALUES (?, ?, ?, ?, ?)
    `;

    // Execute SQL query with values
    // is_available ?? true uses nullish coalescing: if undefined/null, default to true
    db.query(sql, [name, price, category, ingredients, is_available ?? true],
    (err, result) => {
        if (err) return res.status(400).json({ error: err });
        // Return success message with the auto-generated ID
        res.json({ message: "Item added", id: result.insertId });
    });
});

// ================= UPDATE ITEMS(STAFF) ===============================================================
// Update existing item - protected route requiring auth and adminOnly middleware
app.put('/api/items/:id', auth, adminOnly, (req, res) => {
    // Get item ID from URL parameters
    const { id } = req.params;
    // Destructure updated data from request body
    const { name, price, category, ingredients, is_available } = req.body;

    // SQL UPDATE query with placeholders
    const sql = `
    UPDATE product
    SET name=?, price=?, category=?, ingredients=?, is_available=?
    WHERE product_id=?
    `;

    // Execute update query
    db.query(sql, [name, price, category, ingredients, is_available, id],
    (err) => {
        if (err) return res.status(400).json({ error: err });
        res.json({ message: "Item updated" });
    });
});

// ================= DELETE ITEMS(STAFF) =============================================================
// Delete item - protected route requiring auth and adminOnly middleware
app.delete('/api/items/:id', auth, adminOnly, (req, res) => {
    // Get item ID from URL parameters
    const { id } = req.params;

    // Execute DELETE query
    db.query('DELETE FROM product WHERE product_id=?', [id], (err) => {
        if (err) return res.status(400).json({ error: err });
        res.json({ message: "Item deleted" });
    });
});

// ================= REGISTER USER ===================================================================
// User registration endpoint - uses async/await for asynchronous operations
app.post('/api/register', async (req, res) => {
  try {
    // Destructure user data from request body
    const { email, password, first_name, last_name } = req.body;

    // Hash password with bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into database with 'customer' role
    await db.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, first_name, last_name, 'customer']
    );

    // Send success response
    res.json({ message: 'User created successfully' });

  } catch (err) {
    // Log error and send 500 Internal Server Error response
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ================= LOGIN ROUTE ===============================================================
app.post('/api/login', (req, res) => {
    // Destructure login credentials from request body
    const { email, password } = req.body;

    // Query database for user with matching email
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        // If error or no user found, send 400 Bad Request
        if (err || results.length === 0)
            return res.status(400).json({ message: "User not found" });

        // Get first user from results (should be only one due to unique email)
        const user = results[0];

        // Compare provided password with hashed password in database
        const match = await bcrypt.compare(password, user.password_hash);
        // If passwords don't match, send 401 Unauthorized
        if (!match) return res.status(401).json({ message: "Wrong password" });

        // Create JWT token with user ID and role, expires in 1 hour
        const token = jwt.sign(
            { id: user.user_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Send token in response
        res.json({ token });
    });
});





//=================SHOPPING CART=============================================
//GET /api/cart - get user's cart
app.get('/api/cart', auth, (req, res) => {
    const userId = req.user.id;

    const sql = `
        SELECT sc.cart_id, sc.product_id, sc.quantity, p.name, p.price, p.category, p.ingredients
        FROM shopping_cart sc
        JOIN product p ON sc.product_id = p.product_id
        WHERE sc.user_id = ?
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching cart:', err);
            return res.status(500).json({ error: 'Failed to fetch cart'});
        }

        let total = 0;
        results.forEach(item => {
            total += parseFloat(item.price) * item.quantity;
        });
        //Calculate total
        res.json({
            items: results,
            total: total
        });
    });
});

//POST /api/cart -add items to cart
app.post('/api/cart', auth, (req, res) => {
    const userId = req.user.id;
    const { product_id, quantity } = req.body;

    if (!product_id) {
        return res.status(400).json({ error: 'Product ID is required' });
    }

    //Check if product exists & is available
    db.query('SELECT * FROM product WHERE product_id = ? AND is_available = TRUE', [product_id], (err, productResults) => {
        if (err) {
            console.error('Error checking product:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (productResults.length === 0) {
            return res.status(404).json({ error: 'product not found or unavailable'});
        }

        //Check if item already in cart
        db.query('SELECT * FROM shopping_cart WHERE user_id = ? AND product_id = ?',
            [userId, product_id],
            (err, cartResults) => {
                if (err) {
                    console.error('Error checking cart:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                if (cartResults.length > 0) {
                    //Item exists - update the qunatity
                    const newQuantity = cartResults[0].quantity + (quantity || 1);
                    db.query('UPDATE shopping_cart SET quantity = ? WHERE cart_id = ?',
                        [newQuantity, cartResults[0].cart_id],
                        (err) => {
                            if (err) {
                                console.error('Error updating cart:', err);
                                return res.status(500).json({ error: 'Failed to update cart' });
                            }
                            res.json({ message: 'Cart updated successfully' });
                        }
                    );
                } else {
                    //Item doesn't exist
                    db.query('INSERT INTO shopping_cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
                        [userId, product_id, quantity || 1],
                        (err, result) => {
                            if (err) {
                                console.error('Error adding to cart:', err);
                                return res.status(500).json({ error: 'Failed to add to cart' });
                            }
                            res.json({
                                message: 'Item added to cart',
                                cart_id: result.insertId
                            });
                        }
                    );
                }
            }
        );
    });
});

//PUT /api/cart/:product_id - Update quantity
app.put('/api/cart/:product_id', auth, (req, res) => {
    const userId = req.user.id;
    const productId = req.params.product_id;
    const { quantity } = req.body;

    // Validate quantity
    if (!quantity || quantity < 1) {
        return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    //Update quantity for a specific cart item
    const sql = 'UPDATE shopping_cart SET quantity = ? WHERE user_id = ? AND product_id = ?';

    db.query(sql, [quantity, userId, productId], (err, result) => {
        if (err) {
            console.error('Error updating quantity:', err);
            return res.status(500).json({ error: 'Failed to update quantity' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        res.json({ message: 'Quantity updated successfully' });
    });
});

//DELETE /api/cart/:product_id -remove item
app.delete('/api/cart/:product_id', auth, (req, res) => {
    const userId = req.user.id;
    const productId = req.params.product_id;

    //Remove a specific item from the cart
    const sql = 'DELETE FROM shopping_cart WHERE user_id = ? AND product_id = ?';

    db.query(sql, [userId, productId], (err, result) => {
        if (err) {
            console.error('Error removing item:', err);
            return res.status(500).json({ error: 'Failed to remove item' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        res.json({ message: 'Item removed from cart' });
    });
});

//DELETE /api/cart -clear entire cart
app.delete('/api/cart', auth, (req, res) => {
    const userId = req.user.id;

    //Remove all items from user's cart
    const sql = 'DELETE FROM shopping_cart WHERE user_id = ?';

    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error('Error clearing cart:', err);
            return res.status(500).json({ error: 'Failed to clear cart' });
        }

        res.json({ message: 'cart cleared successfully' });
    });
});




// ================= PROFILE (PROTECTED) ================================================================
// Protected profile endpoint - requires auth middleware
app.get('/api/profile', auth, (req, res) => {
    // Send user data attached by auth middleware
    res.json({ message: "Access granted", user: req.user });
});

// Start server listening on specified port and all network interfaces
app.listen(PORT, '0.0.0.0', () => {
    // Log server start message
    console.log(`Server running on http://localhost:${PORT}`);
});
