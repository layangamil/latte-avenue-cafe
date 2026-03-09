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
        const { name, price, category, ingredients, is_available, stock, image_url } = req.body;

        const sql = `
            INSERT INTO product (name, price, category, ingredients, is_available, stock, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        //Use stock ir provided by staff else use 30 as default
        const stockValue = stock !== undefined ? stock : 30;

        const [result] = await db.query(sql, [name, price, category, ingredients, is_available ?? true, stockValue, image_url]);
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
        const { name, price, category, ingredients, is_available, stock, image_url } = req.body;

        const sql = `
            UPDATE product
            SET name=?, price=?, category=?, ingredients=?, is_available=?, stock=?, image_url=?
            WHERE product_id=?
        `;

        await db.query(sql, [name, price, category, ingredients, is_available, stock, image_url, id]);
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
        const { email, password, loginRole } = req.body;
        console.log("Login attempt - email:", email, "as role:", loginRole);

        // Query database for user with matching email
        const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        // If no user found, send 400 Bad Request
        if (results.length === 0) {
            console.log("User not found in database");
            return res.status(400).json({ message: "User not found" });
        }

        const user = results[0];

        //Check if user is trying to log in with correct role
        if (loginRole === 'staff' && user.role !== 'staff') {
            console.log("User tried to log in as staff but is not staff");
            return res.status(403).json({ message: "Access denied: Not a staff account" });
        }

        if (loginRole === 'customer' && user.role !== 'customer') {
            console.log("User tried to log in as a customer but is not a customer");
            return res.status(403).json({ message: "Access denied: Not a customer account" });
        }
        

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

// ================ FORGOT PASSWORD =======================================================================
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// POST /api/forgot-password - send reset link to email
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'EMail is required' });
        }

        // check if user exists
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            // return success anyway (it's a security best practice not to reveal if the email exists)
            return res.json({ message: 'If your email exists, you will receive a reset link' });
        }

        // Generate secure token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // in an hour from now

        // Delete any existing tokens for this email
        await db.query('DELETE FROM password_resets WHERE email = ?', [email]);

        // Save new token
        await db.query(
            'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
            [email, token, expiresAt]
        );

        // Create reset link

        const resetLink = `${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;

        // Configure email transporter
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false, // true for 465 but false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Send email

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Latte Avenue - Password Reset Request',
            html: `
                <h2>Password Reset Request</h2>
                <p>You requested to reset your password for Latte Avenue.</p>
                <p>Click the link below to reset your password. This link expires in 1 hour.</p>
                <a href="${resetLink}" style="display: inline-block; 
                padding: 10px 20px; 
                background-color: #8b6b61; 
                color: white; 
                text-decoration: none; 
                border-radius: 5px;">Reset Password</a>
                <p>If you didn't request this, please ignore this email.</p>
                <p>Link: ${resetLink}</p>
            `
        });

        res.json({ message: 'If your email exists, you will receive a reset link' });
        
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ message: 'Failed to process request' });
    }
});


// POST /api/reset-password - reset password using token
app.post('/api/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }

        // Find valid token
        const [tokens] = await db.query(
            'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()',
            [token]
        );

        if (tokens.length === 0){
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const resetRequest = tokens[0];

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        //Update user's password
        await db.query(
            'UPDATE users SET password_hash = ? WHERE email = ?',
            [hashedPassword, resetRequest.email]
        );

        //Mark token as used
        await db.query('UPDATE password_resets SET used = TRUE WHERE token = ?', [token]);

        res.json({ message: 'Password updated successfully' });

    } catch (err) {
        console.error('Request password error:', err);
        res.status(500).json({ message: 'Failed to reset password' });
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

        // Check stock
        const product = productResults[0];
        if (product.stock <= 0) {
            return res.status(400).json({ error: 'Item is out of stock' });
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


// POST /api/cart/check-stock - verify stock for items
app.post('/api/cart/check-stock', auth, async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Invalid items array' });
        }

        //array of product id's to check
        const productIds = items.map(item => item.menuItemId);
        if (productIds.length === 0) {
            return res.json({ ok: true, outOfStock: [] })
        }

        const [rows] = await db.query(
            `SELECT product_id, name, stock FROM product WHERE product_id IN (?)`,
            [productIds]
        );

        const stockMap = {};
        rows.forEach(row => {
            stockMap[row.product_id] = row;
        });

        const outOfStock = [];
        for (let item of items) {
            const product = stockMap[item.menuItemId];
            if (!product) {
                outOfStock.push({ id: item.menuItemId, name: 'Unknown', reason: 'not_found' });
            
            } else if (product.stock < item.quantity) {
                outOfStock.push({
                    id: item.menuItemId,
                    name: product.name,
                    requested: item.quantity,
                    available: product.stock,
                    reason: 'insufficient'
                });
            }
        }

        if (outOfStock.length > 0) {
            return res.json({ ok: false, outOfStock });
        
        } else {
            return res.json({ ok: true, outOfStock: [] });
        }
    } catch (err) {
        console.error('Error checking stock:', err);
        res.status(500).json({ error: 'Failed to check stock' });
    }
});

// ================= ORDER ENDPOINTS ==================================
//POST /api/orders -Convert cart to order




//GET /api/orders/myorders -Get current user's orders with items
app.get('/api/orders/myorders', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log("Fetching orders fro user ID:", userId);

        //Get all orders for this user
        const [orders] = await db.query(
            `SELECT order_id as id, 
                    status, 
                    total_amount as total,
                    DATE_FORMAT(order_date, '%Y-%m-%d') as date,
                    DATE_FORMAT(estimated_pickup_time, '%H:%i') as pickupTime
             FROM \`order\` 
             WHERE user_id = ? 
             ORDER BY order_date DESC`,
            [userId]
        );

        console.log("Found orders:", orders.length);

        //For each order, get its items
        for (let order of orders) {
            const [items] = await db.query(
                `SELECT p.name, oi.quantity, oi.price_at_time as price
                 FROM order_item oi
                 JOIN product p ON oi.product_id = p.product_id
                 WHERE oi.order_id = ?`,
                [order.id]
            );

            order.items = items;
        }

        //Always return the array even if empty
        res.json(orders);

    } catch (err) {
        console.error('Error fetching user orders:', err);
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
});






//GET /api/orders/:id -get order details

app.get('/api/orders/:id', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const orderId = req.params.id;
        const isStaff = req.user.role === 'staff';

        //Get order details
        const [orderDetails] = await db.query(
            `SELECT o.*, u.email, u.first_name, u.last_name 
             FROM \`order\` o
             JOIN users u ON o.user_id = u.user_id
             WHERE o.order_id = ?`,
            [orderId]
        );

        if (orderDetails.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orderDetails[0];

        //Check persmissions. Only STaff & order owner can view
        if (!isStaff && order.user_id !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        //Get order items
        const [orderItems] = await db.query(
            `SELECT oi.*, p.name, p.category 
             FROM order_item oi
             JOIN product p ON oi.product_id = p.product_id
             WHERE oi.order_id = ?`,
            [orderId]
        );

        //Calculate if order can be cancelled (within 1 minute)
        const now = new Date();
        const orderTime = new Date(order.created_at);
        const minutesSinceOrder = (now - orderTime) / (1000 * 60);
        const canCancel = order.status === 'pending' && minutesSinceOrder < 1;
        
        res.json({
            order: order,
            items: orderItems,
            can_cancel: canCancel,
            time_remaining: canCancel ? Math.max(0, 60 - (now - orderTime) / 1000) : 0
        });
        
    } catch (err) {
        console.error('Error fetching order:', err);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

//GET /api/orders -get all orders for user (or staff)

app.get('/api/orders', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const isStaff = req.user.role === 'staff';

        let query;
        let params = [];

        if (isStaff) {
            //Can see all orders
            query = `SELECT o.*, u.email, u.first_name, u.last_name 
                     FROM \`order\` o
                     JOIN users u ON o.user_id = u.user_id
                     ORDER BY o.created_at DESC`;
        } else {
            //Customers only see their own orders
            query = `SELECT * FROM \`order\` 
                     WHERE user_id = ? 
                     ORDER BY created_at DESC`;
            params = [userId];
        }

        const [orders] =await db.query(query, params);

        //Get item count for each order
        for (let order of orders) {
            const [items] = await db.query(
                'SELECT COUNT(*) as count FROM order_item WHERE order_id = ?',
                [order.order_id]
            );

            order.item_count = items[0].count;
        }

        res.json(orders);

    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

//PUT /api/orders/:id/status -staff updates status

app.put('/api/orders/:id/status', auth, async (req, res) => {
    try {
        //Only staff can update status
        if (req.user.role !== 'staff') {
            return res.status(403).json({ error: 'Staff only' });
        }

        const orderId = req.params.id;
        const { status } = req.body;
        const staffId = req.user.id;

        //Validate status
        const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        //Check if order exists
        const [orderCheck] = await db.query('SELECT * FROM `order` WHERE order_id = ?', [orderId]);

        if (orderCheck.length === 0) {
            return res.status(400).json({ error: 'Order not found' });
        }

        const currentStatus = orderCheck[0].status;

        //Define valid status transition
        const validTransitions = {
            'pending': ['preparing', 'cancelled'],
            'preparing': ['ready', 'cancelled'], //Hmm, only staff can cancel here? Not customer
            'ready': ['completed'],
            'completed': [],
            'cancelled': []
        };

        if (!validTransitions[currentStatus].includes(status)) {
            return res.status(400).json({
                error: `Cannot change status from ${currentStatus} to ${status}`
            });
        }

        //If settring to ready, set estimated pick up time (5 mins from now)
        let estimatedPickup = null;
        if (status === 'ready') {
            estimatedPickup = new Date(Date.now() + 5 * 60000); // 5 mins
        }

        //Update order status
        await db.query(
            `UPDATE \`order\` 
             SET status = ?, 
                 estimated_pickup_time = COALESCE(?, estimated_pickup_time),
                 updated_at = CURRENT_TIMESTAMP
             WHERE order_id = ?`,
            [status, estimatedPickup, orderId]
        );

        res.json({
            message: `Order status updated to ${status}`,
            order_id: orderId,
            status: status,
            estimated_pickup: estimatedPickup
        });

    } catch (err) {
        console.error('Error updating order status:', err);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

//DELETE /api/orders/:id/cancel -cancel order within time limit

app.delete('/api/orders/:id/cancel', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const orderId = req.params.id;
        const isStaff = req.user.role === 'staff';

        //Grt order details
        const [orderCheck] = await db.query('SELECT * FROM `order` WHERE order_id = ?', [orderId]);

        if (orderCheck.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orderCheck[0];

        //Check permissions
        if (!isStaff && order.user_id !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        //Check if order can be cancelled
        if (order.status !== 'pending') {
            return res.status(400).json({ error: 'Only pending orders can be cancelled'});
        }

        //Check 1 min window (unless staff)
        if (!isStaff) {
            const now = new Date();
            const orderTime = new Date(order.created_at);
            const minutesSinceOrder = (now - orderTime) / (1000 * 60);

            if (minutesSinceOrder > 1) {
                return res.status(400).json({
                    error: 'Order can only be cancelled within 1 minute of placing'
                });
            }
        }

        await db.query(
            `UPDATE \`order\` 
             SET status = 'cancelled', 
                 cancelled_at = CURRENT_TIMESTAMP, 
                 estimated_pickup_time = NULL
             WHERE order_id = ?`,
            [orderId]
        );

        res.json({
            message: 'Order cancelled successfully',
            order_id: orderId
        });

    } catch (err) {
        console.error('Error cancelling order', err);
        res.status(500).json({ error: 'Failed to cancel order' });
    }
});



// ================= PAYMENT ORDER ENDPOINT ===========================
//POST /api/orders -Place order directly from payment page

app.post('/api/orders', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { items, total, paymentMethod, status } = req.body;

        //Vaidate input
        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items in order'
            });
        }

        if (!paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Payment method required'
            });
        }

        //Start transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            //Stock check - get the current stock for all ordered items
            const productIds = items.map(item => item.menuItemId);
            const [stockRows] = await connection.query(
                `SELECT product_id, name, stock FROM product WHERE product_id IN (?) FOR UPDATE`,
                [productIds]
            );
            const stockMap = {};
            stockRows.forEach(row => {
                stockMap[row.product_id] = row;
            });

            //Verify there's enough stock for each item
            for (let item of items) {
                const product = stockMap[item.menuItemId];
                if (!product) {
                    throw new Error(`Product ${item.menuItemId} not found`);
                }
                if (product.stock < item.quantity) {
                    throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, requested: ${item.quantity}`);
                }
            }

            //Deduct stock quantity
            for (let item of items) {
                await connection.query(
                    `UPDATE product SET stock = stock - ? WHERE product_id = ?`,
                    [item.quantity, item.menuItemId]
                );
            }

            //Create the order
            const estimatedPickup = new Date(Date.now() + 5 * 60000) // 5 mins

            //create order with pickup time
            const [orderResult] = await connection.query(
                `INSERT INTO \`order\` (user_id, total_amount, status, payment_method, estimated_pickup_time) 
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, total, 'pending', paymentMethod, estimatedPickup]
            );

            const orderId = orderResult.insertId;

            //Add items to order_item table
            for (const item of items) {
               /* //Verify product exists
                const [productCheck] = await connection.query(
                    'SELECT price FROM product WHERE product_id = ?',
                    [item.menuItemId]
                );

                if (productCheck.length === 0) {
                    throw new Error(`Product ${item.menuItemId} not found`);
                } */

                await connection.query(
                    `INSERT INTO order_item (order_id, product_id, quantity, price_at_time) 
                     VALUES (?, ?, ?, ?)`,
                    [orderId, item.menuItemId, item.quantity, item.price]
                );
            }

            //Clear the shopping cart
            await connection.query('DELETE FROM shopping_cart WHERE user_id = ?', [userId]);

            //Commit transaction
            await connection.commit();
            connection.release();

            //Send success response
            res.status(201).json({
                success: true,
                orderId: orderId.toString(),
                message: 'Order confirmed'
            });

        } catch (err) {
            await connection.rollback();
            connection.release();
            //throw err;
            res.status(400).json({
                success: false,
                message: err.message
            });
        }

    } catch (err) {
        console.error('Error creating order from payment:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to create order'
        });
    }
});







// ================= PROFILE (PROTECTED) ============================================================
//GET /api/profile -Get user profile info
app.get('/api/profile', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        const [users] = await db.query(
            'SELECT first_name, last_name, email FROM users WHERE user_id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];
        res.json({
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email
        });

    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

//PUT /api/profile/password -Update user password
app.put('/api/profile/password', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        //Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: 'Current password and new password are required'
            });
        }

        //Get user's current password hash
        const [users] = await db.query(
            'SELECT password_hash FROM users WHERE user_id = ?',
            [userId] 
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];

        //Verify current password
        const match = await bcrypt.compare(currentPassword, user.password_hash);

        if(!match) {
            return res.status(401).json({
                message: 'Current password is incorrect'
            });
        }

        //Hash new password 
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        //Update password in database
        await db.query(
            'UPDATE users SET password_hash = ? WHERE user_id = ?',
            [hashedNewPassword, userId]
        );

        res.json({
            message: 'Password updated successfully'
        });

    } catch (err) {
        console.error('Error updating password:', err);
        res.status(500).json({
            message: 'Failed to update password'
        });
    }
});








// Start server listening on specified port and all network interfaces
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
