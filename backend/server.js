require('dotenv').config();
const express = require('express'); //our framework(builds server/api's)
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path'); //made frontend & backend connect
const app = express();
const PORT = 5000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors()); //also made backend & fronten connect

//make a random coupon
function generateCouponCode() {
    return 'LATTE-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

//for frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

//for emails
async function sendEmail(to, subject, htmlContent) {

    try {
        const transporter = nodeemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false,
            auth: {
                user:process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: to,
            subject: subject,
            html: htmlContent
        });

        console.log(`Email sent to ${to}: ${subject}`);
        return true;
    } catch (err) {
        console.error('Failed to send email:', err);
        return false;
    }
}
//AUTH MIDDLEWARE://

function auth(req, res, next) {
    const header = req.headers.authorization;
    if (!header) {
        res.sendStatus(403); //accsess denied
        return;
    }

    const token = header.split(' ')[1];

    //check if token is valid
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            res.sendStatus(401); //unauthorised
            return;
        }
        req.user = decoded; //attaches user inf to req(so it can be accessde by later routes)
        next(); 
    });
}

//MySQL db connection pool using env
const db = mysql.createPool({
    host: process.env.DB_HOST,     
    user: process.env.DB_USER,     
    password: process.env.DB_PASS, 
    database: process.env.DB_NAME,  
    waitForConnections: true,     
    connectionLimit: 10,
    queueLimit: 0
});


//test endpoint 
app.get('/', (req, res) => {
    res.send('Latte Avenue backend is running');
});

//AUTH ADMIN://
function adminOnly(req, res, next) {
    const role = req.user.role
    if (role !== 'staff') {
        res.status(403).json({ 
            message: "Staff only" 
        });
        return;
    }
    next();
}

//menu & item endpoints://

//get menu from db
app.get('/api/menu', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM product');
        res.json(results);

    } catch (err) {
        console.error('Error fetching menu:', err);
        res.status(500).json({ error: 'Failed to fetch menu' });
    }
});

//get all items
app.get('/api/items', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM product');
        res.json(results);

    } catch (err) {
        console.error('Error fetching items:', err);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

//add new item (staff only)
app.post('/api/items', auth, adminOnly, async (req, res) => {
    try {
        const {name, price, category, ingredients, is_available, stock, image_url} = req.body;

        const sql = `
            INSERT INTO product (name, price, category, ingredients, is_available, stock, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        //use stock ir provided by staff else use 30 as default
        const stockValue = stock || 30;

        const [result] = await db.query(sql, [name, price, category, ingredients, is_available ?? true, stockValue, image_url]);
        
        res.json({message: "Item added", id: result.insertId});

    } catch (err) {
        console.error('Error adding item:', err);
        res.status(400).json({error: err.message});
    }
});

//update items (staff only)
app.put('/api/items/:id', auth, adminOnly, async (req, res) => {
    try {
        const {id} = req.params;
        const {name, price, category, ingredients, is_available, stock, image_url } = req.body;

        const sql = `
            UPDATE product
            SET name=?, price=?, category=?, ingredients=?, is_available=?, stock=?, image_url=?
            WHERE product_id=?
        `;

        await db.query(sql, [name, price, category, ingredients, is_available, stock, image_url, id]);
        res.json({message: "Item updated"});

    } catch (err) {
        console.error('Error updating item:', err);
        res.status(400).json({error: err.message});
    }
});

//delete item (staff only)
app.delete('/api/items/:id', auth, adminOnly, async (req, res) => {
    try {
        const {id} = req.params;
        await db.query('DELETE FROM product WHERE product_id=?', [id]);
        res.json({message: "Item deleted"});

    } catch (err) {
        console.error('Error deleting item:', err);
        res.status(400).json({error: err.message });
    }
});

//register users://

app.post('/api/register', async (req, res) => {
    try {
        const {email, password, first_name, last_name} = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
            [email, hashedPassword, first_name, last_name, 'customer']
        );

        res.json({ message: 'User created successfully'});

    } catch (err) {
        console.error('Registration error: WHYYYYYYYY :(', err);
    }
});

//login route://
app.post('/api/login', async (req, res) => {
    try {
        const {email, password, loginRole} = req.body;
        console.log("Login attempt - email:", email, "as role:", loginRole);

        const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        //if no user is found...
        if (results.length === 0) {
            console.log("User not found in database");
            return res.status(400).json({message: "User not found"});
        }

        const user = results[0];

        //check if user the is trying to log in with the right role
        if (loginRole === 'staff' && user.role !== 'staff') {
            console.log("User is not staff, Log in as user");
            return res.status(403).json({ message: "Access denied: Not a staff account" });
        }

        if (loginRole === 'customer' && user.role !== 'customer') {
            console.log("User is staff. Log in as staff please.");
            return res.status(403).json({ message: "Access denied: Not a customer account" });
        }
        

        //compare the password with hashed password in db
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            console.log("Password mismatch");
            return res.status(401).json({message: "Wrong password"});
        }

        //make a JWT token
        const token = jwt.sign(
            {id: user.user_id, role: user.role},
            process.env.JWT_SECRET,
            {expiresIn: '1h'}
        );

        console.log("Login successful for:", email);
        res.json({token});

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({message: 'Server error'});
    }
});

//forgot password:// Suddenly worked! idk why, just don't touch it!!

const nodemailer = require('nodemailer'); 
const crypto = require('crypto');

//POST /api/forgot-password, send reset link to email
app.post('/api/forgot-password', async (req, res) => {
    try {
        const {email} = req.body;

        if (!email) {
            return res.status(400).json({message: 'EMail is required'});
        }

        //check if user exists
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.json({message: 'A reset lnk has been sent to your email'});
        }

        //generate secure token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); //one hour from now

        //delete all the old tokens
        await db.query('DELETE FROM password_resets WHERE email = ?', [email]);

        //save new token
        await db.query(
            'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
            [email, token, expiresAt]
        );

        //create resset link
        const resetLink = `${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;

        //email transporte
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        //send email
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Latte Avenue: Password Reset Request',
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
        res.status(500).json({message: 'Failed to process request'}); //mm hm, you can go 'F' urself cuz it works!!!! lez go!
    }
});

//POST /api/reset-password
app.post('/api/reset-password', async (req, res) => {
    try {
        const {token, newPassword} = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({message: 'Token and new password are required'});
        }

        //find valid token
        const [tokens] = await db.query(
            'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()',
            [token]
        );

        if (tokens.length === 0){
            return res.status(400).json({message: 'Invalid or expired token'});
        }

        const resetRequest = tokens[0];

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        //pdate user's password
        await db.query(
            'UPDATE users SET password_hash = ? WHERE email = ?',
            [hashedPassword, resetRequest.email]
        );

        //mark token as used
        await db.query('UPDATE password_resets SET used = TRUE WHERE token = ?', [token]);
            
            res.json({message: 'Password updated successfully'});

    } catch (err) {
        console.error('Request password error:', err);
        res.status(500).json({ message: 'Failed to reset password' });
    }
});

//shopping cart endpoints://

//GET /api/cart, get user's cart
app.get('/api/cart', auth, async (req, res) => {

    const userId = req.user.id;

    const sql = `
        SELECT *
        FROM shopping_cart
        JOIN product 
        ON shopping_cart.product_id = product.product_id
            WHERE shopping_cart.user_id = ?
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

});

//POST /api/cart, add items to cart
app.post('/api/cart', auth, async (req, res) => {

    const userId = req.user.id;
    const {product_id, quantity} = req.body;

    if (!product_id) {
        return res.status(400).json({error: 'Product ID is required'});
    }

    //check if product exists & is available
    const [productAvailable] = await db.query(
        'SELECT * FROM product WHERE product_id = ? AND is_available = TRUE',
        [product_id]
    );

    if (productAvailable.length === 0) {
            return res.status(404).json({error: 'Product not found or unavailable'});
        }

        //check stock
        const product = productAvailable[0];
        
        if (product.stock == 0) {
                return res.status(400).json({error: 'Item is out of stock' });
        }

        //check if item is already in cart
        const [inCart] = await db.query(
            'SELECT * FROM shopping_cart WHERE user_id = ? AND product_id = ?',
            [userId, product_id]
        );

        if (inCart.length > 0) {
            //item exists so update the quantity
            const newQuantity = inCart[0].quantity + (quantity || 1);
            await db.query(
                'UPDATE shopping_cart SET quantity = ? WHERE cart_id = ?',
                [newQuantity, inCart[0].cart_id]
            );
            res.json({message: 'Cart updated successfully'});
        } else {
            //item doesnt' exist, add it now
            const [result] = await db.query(
                'INSERT INTO shopping_cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [userId, product_id, quantity || 1]
            );

            res.json({
                message: 'Item added to cart',
                cart_id: result.insertId
            });
        }

});

//PUT /api/cart/:product_id, Update quantity
app.put('/api/cart/:product_id', auth, async (req, res) => {
    const userId = req.user.id;
    const productId = req.params.product_id;
    const {quantity} = req.body;

        //validate quantity
    if (!quantity || quantity < 1) {
         return res.status(400).json({error: 'Quantity must be at least 1'});
    }

    //mow update quantity for a specific cart item
    const [result] = await db.query(
        'UPDATE shopping_cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
        [quantity, userId, productId]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({error: 'Item not found in cart'});
    }

    res.json({message: 'Quantity updated successfully'});
    

});

//DELETE /api/cart/:product_id
app.delete('/api/cart/:product_id', auth, async (req, res) => {

    const userId = req.user.id;

    const productId = req.params.product_id;

    const [removeItem] = await db.query(
        'DELETE FROM shopping_cart WHERE user_id = ? AND product_id = ?',
        [userId, productId]
    );

    if (removeItem.affectedRows === 0) {
        return res.status(404).json({ error: 'Item not found' });
    }

    res.json({message: 'Item removed from cart'});
    
});

//DELETE /api/cart, clear entire cart
app.delete('/api/cart', auth, async (req, res) => {
    const userId = req.user.id;

    await db.query(
        'DELETE FROM shopping_cart WHERE user_id = ?', 
        [userId]
    );

    res.json({message: 'Cart cleared successfully'});
});


// POST /api/cart/check-stock
app.post('/api/cart/check-stock', auth, async (req, res) => {
    try {
        const {items} = req.body;

        //list of product id's to check
        const productIds = items.map(item => item.menuItemId);
        if (productIds.length === 0) {
            return res.json({ok: true, outOfStock: []})
        }


        const outOfStock = [];

        for (let item of items) {
            const [productRows] = await db.query(
            `SELECT product_id, name, stock FROM product WHERE product_id = ?`,
            [item.menuItemId]
        );

        const product = productRows[0];

            if (!product) {
                outOfStock.push({id: item.menuItemId,name: 'Unknown', reason: 'not found'
                });

            } else if (product.stock < item.quantity) {
                outOfStock.push({
                    id: item.menuItemId,
                    name: product.name,
                    requested: item.quantity,
                    available: product.stock,
                    reason: 'Not enough left'

                }); 
            
            }
        }

        if (outOfStock.length > 0) {
            return res.json({ok: false, outOfStock});
        
        } else {
            return res.json({ok: true, outOfStock: [] });
        }
    } catch (err) {
    console.error('Error checking stock:', err);
    res.status(500).json({ error: 'Failed to check stock' });
}
});


//order enpoints
//POST /api/orders -Convert cart to order




//GET /api/orders/myorders, Get current user's orders with items
app.get('/api/orders/myorders', auth, async (req, res) => {

    const userId = req.user.id;

    //get the orders for this user
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


    //get the utems in each order
    for (let order of orders) {
        const [items] = await db.query(
            `SELECT product.name, order_item.quantity, order_item.price_at_time as price
                 FROM order_item
                 JOIN product ON order_item.product_id = product.product_id
                 WHERE order_item.order_id = ?`,
                [order.id]
            );

        order.items = items;
    }

    res.json(orders);

});






//GET /api/orders/:id for order details

app.get('/api/orders/:id', auth, async (req, res) => {
    const userId = req.user.id;
    const orderId = req.params.id;
    const isStaff = req.user.role === 'staff';

    //get the order details
    const [orderDetails] = await db.query(
        `SELECT \`order\`.*, users.email, users.first_name, users.last_name 
             FROM \`order\`
             JOIN users ON \`order\`.user_id = users.user_id
             WHERE \`order\`.order_id = ?`,
            [orderId]
    );

    if (orderDetails.length === 0) {
        return res.status(404).json({error: 'Order not found'});
    }

    const order = orderDetails[0];

    //nly STaff & order owner can view
    if (!isStaff && order.user_id !== userId) {
        return res.status(403).json({error: 'Access denied'});
    }

    //get the items in the order
    const [orderItems] = await db.query(
        `SELECT order_item.*, product.name, product.category 
             FROM order_item
             JOIN product ON order_item.product_id = product.product_id
             WHERE order_item.order_id = ?`,
            [orderId]
    );

    //1 minute cancelling
    const currentTime = new Date();
    const orderTime = new Date(order.created_at);
    const minsSince = (currentTime - orderTime) / (1000 * 60);
    const canCancel = order.status === 'pending' && minsSince < 1;
    
    let timeLeft = 0;
        if (canCancel) {
            const secsPassed = (currentTime - orderTime) / 1000;
            timeLeft = Math.max(0, 60 - secsPassed);
        }

        res.json({
            order: order,
            items: orderItems,
            can_cancel: canCancel,
            time_left: timeLeft
        });
});

//GET /api/orders, get all the orders for thr users

app.get('/api/orders', auth, async (req, res) => {

        const userId = req.user.id;
        const isStaff = req.user.role === 'staff';

        let query;
        let params = [];

        if (isStaff) {
            //staff xan see all orders
            query = `SELECT \`order\`.*, users.email, users.first_name, users.last_name 
                     FROM \`order\` 
                     JOIN users ON order.user_id = users.user_id
                     ORDER BY order.created_at DESC`;
        } else {
            //customers only see their own orders
            query = `SELECT * FROM \`order\` 
                     WHERE user_id = ? 
                     ORDER BY created_at DESC`;
            params = [userId];
        }

        const [orders] =await db.query(query, params)

        //get the item count for each order
        for (let order of orders) {
            const [items] = await db.query(
                'SELECT COUNT(*) as count FROM order_item WHERE order_id = ?',
                [order.order_id]
            );

            order.item_count = items[0].count;
        }

        res.json(orders)
});

//PUT /api/orders/:id/status for stafff

app.put('/api/orders/:id/status', auth, async (req, res) => {
        //only staff can update status
        if (req.user.role !== 'staff') {
            return res.status(403).json({error: 'Onlybstaff allowed'});
        }

        const orderId = req.params.id;
        const {status} = req.body;
        const staffId = req.user.id;
        const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];

        /*if (!validStatuses.includes(status)) {
            return res.status(400).json({error: 'Invalid status'});
        }*/ 

        //does ordwe exist?
        const [orderCheck] = await db.query('SELECT * FROM `order` WHERE order_id = ?', [orderId]);

        if (orderCheck.length === 0) {
            return res.status(400).json({ error: 'no order not found' });
        }


        const order = orderCheck[0];
        const currentStatuses = order.status;


        if (!validTransitions.includes(status)) {
            return res.status(400).json({
                error: 'Not a valid status'
            });
        }

        let estimatedPickup = null;
        if (status === 'ready') {
            const orderedAt = new Date(order.created_at)
            estimatedPickup = new Date(orderedAt.getTime() + 5 * 60000); // 5 mins
        }

        //update order status
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
});

//DELETE /api/orders/:id/cancel order within time limit

app.delete('/api/orders/:id/cancel', auth, async (req, res) => {
        const userId = req.user.id;
        const orderId = req.params.id;
        const isStaff = req.user.role === 'staff';
        const timeNow = new Date();

        
        const [orderCheck] = await db.query('SELECT * FROM `order` WHERE order_id = ?', [orderId]);

        if (orderCheck.length === 0) {
            return res.status(404).json({error: 'Order not found'});
        }

        const order = orderCheck[0];

       
        if (!isStaff && order.user_id !== userId) {
            return res.status(403).json({error: 'Access denied'});
        }

        //check if order can be cancelled by customer
        if(!isStaff) {
            if (order.status !== 'pending') {
                return res.status(400).json({error: 'Only pending orders can be cancelled'});
            }

        //check 1 min window 
        const orderedAt = new Date(order.created_at);
        const minutesSinceOrder = (timeNow - orderedAt) / (1000 * 60);

            if (minutesSinceOrder > 1) {
                return res.status(400).json({
                    error: 'Order can only be cancelled within 1 minute of placing'
                });
            }

     
            const couponCode = generateCouponCode();

            const [userInfo] =await db.query(
                'SELECT email, first_name FROM users WHERE user_id = ?',
                [userId]
            );

            const customerEmail = userInfo[0].email
            const customerName = userInfor[0].first_name;

            const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color:#8b6b61; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1>Order Cancelled</h1>
            </div>
            <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px">
            <p>PHello ${customerName}, </p>
            <p>Your order #${orderId} has been cancelled as requested.</p>
            <p>Here is a disount code with the same price as your cancelled order to use the next time you have a sweet tooth or fancy a drink:</p>
            <div style="background-color: #e8e1d6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h2 style="font-family: monospace; font-size: 24px; letter-spacing: 2px; color: #8b6b61;">${couponCode}</h2>
            <p style="font-size: 14px;">Worth: ${order.total_amount} SEK</p>
            </div>
            <p>Use this code at checkout on your next order. Valid for 30 days.</p>
            <p style="margin-top: 30px;">See you soon!<br>Best wishes,<br>Latte Avenue</p>
            </div>
            </div>
            `;

            await sendEmail(
                customerEmail,
                'Your Latte avenue order has been cancelled',
                emailHtml
            );
            
            await db.query(
                `UPDATE \`order\` 
                 SET status = 'cancelled', 
                     cancelled_at = CURRENT_TIMESTAMP, 
                     estimated_pickup_time = NULL,
                     coupon_code = ?
                 WHERE order_id = ?`,
                 [couponCode, orderId]
            );
            
            return res.json({
                success: true,
                message: 'Order cancelled successfully. A coupon has been emailed to you and added yo your profile page.',
                order_id: orderId,
                coupon_generated: true
            });
        }

        //STaff cancellation
        let couponCode = null;
        let message = 'Order cancelled successfully';

        //if order was paid (not pending when cancelled), generate coupon
        if (order.status !== 'pending' && order.status !== 'cancelled'){
            //generate unique code
            couponCode = generateCouponCode();

            //update order with coupon code
            await db.query(
                `UPDATE \`order\` 
                 SET coupon_code = ? 
                 WHERE order_id = ?`,
                [couponCode, orderId]
            );

            message = 'Order cancelled and coupon generated';
        }

            //update order status to cancledd
        await db.query(
            `UPDATE \`order\` 
             SET status = 'cancelled', 
                 cancelled_at = CURRENT_TIMESTAMP, 
                 estimated_pickup_time = NULL
             WHERE order_id = ?`,
            [orderId]
        );

        res.json({
            success: true,
            message: message,
            order_id: orderId,
            coupon_generated: ! !couponCode
        });

});




//payment order endpoint://
//POST /api/orders place order from the payment page

app.post('/api/orders', auth, async (req, res) => {
    
    const userId = req.user.id;
    const {items, total, paymentMethod, status, couponCode} = req.body;

    //confirm user input
    if (!items || items.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'There are no items in order'
        });
        }

    if (!paymentMethod) {
        return res.status(400).json({
            success: false,
            message: 'Payment method required'
        });
    }

    //start transaction
    const connection = await db.getConnection();
    
    try {
    await connection.beginTransaction();

        
        //coupon check
        let finalTotal = total;
        let appliedCoupon = null;

        if (couponCode) {
            const [coupons] = await connection.query(
                `SELECT * FROM \`order\`
                    WHERE user_id = ? AND coupon_code = ? AND coupon_used = FALSE
                    AND cancelled_at > DATE_SUB(NOW(), INTERVAL 30 DAY)`,
                [userId, couponCode]
            );

            if (coupons.length > 0) {
                const coupon = coupons[0];
                
                finalTotal = Math.max(0, total - coupon.total_amount);
                appliedCoupon = coupon.coupon_code;

                
                await connection.query(
                    `UPDATE \`order\` SET coupon_used = TRUE WHERE order_id = ?`,
                    [coupon.order_id]
                );
            }
        }
        //check stock for the ordered ittem
        const productIds = items.map(item => item.menuItemId);
        const [stockRows] = await connection.query(
            `SELECT product_id, name, stock FROM product WHERE product_id IN (?) FOR UPDATE`,
            [productIds]
        );
        const stockMap = {};
        stockRows.forEach(row => {
            stockMap[row.product_id] = row;
        });

        //is there enough left for each item
        for (let item of items) {
            const product = stockMap[item.menuItemId];
            if (!product) {
                throw new Error(`Product ${item.menuItemId} not found`);
            }
            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, requested: ${item.quantity}`);
            }
        }

            //update stock left
            for (let item of items) {
                await connection.query(
                    `UPDATE product SET stock = stock - ? WHERE product_id = ?`,
                    [item.quantity, item.menuItemId]
                );
            }

            
            const estimatedPickup = new Date(Date.now() + 5 * 60000) // 5 mins

            //create order
            const [orderResult] = await connection.query(
                `INSERT INTO \`order\` (user_id, total_amount, status, payment_method, estimated_pickup_time) 
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, finalTotal, 'pending', paymentMethod, estimatedPickup]
            );

            const orderId = orderResult.insertId;

            //Add items to order_item table
            for (const item of items) {
               /* //check product exists
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

            //now cear the shopping cart
            await connection.query('DELETE FROM shopping_cart WHERE user_id = ?', [userId]);

            //save transaction
            await connection.commit();
            connection.release();


            res.status(201).json({
                success: true,
                orderId: orderId.toString(),
                message: 'Order confirmed',
                coupon_applied: !!appliedCoupon
            });
        } catch (err) {
            await connection.rollback();
            console.error('error in order:', err);
            res.status(400).json({
            success: false,
            message: err.message
        });

    } finally {
        connection.release();
    }
});







// ================= PROFILE (PROTECTED) ============================================================
//GET /api/profile -Get user profile info
app.get('/api/profile', auth, async (req, res) => {

    const userId = req.user.id;

    const [users] = await db.query(
        'SELECT first_name, last_name, email FROM users WHERE user_id = ?',
        [userId]
    );

    if (users.length === 0) {
        return res.status(404).json({message: 'User not found'});
    }

    const user = users[0];
    res.json({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email
    });
});

//PUT /api/profile/password chane password
app.put('/api/profile/password', auth, async (req, res) => {
    const userId = req.user.id;
    const {currentPassword, newPassword} = req.body;

    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            message: 'Current and new password are needed'
        });
    }

    //user's current password hash
    const [users] = await db.query(
        'SELECT password_hash FROM users WHERE user_id = ?',
        [userId] 
    );

    if (users.length === 0) {
        return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    const match = await bcrypt.compare(currentPassword, user.password_hash);

    if(!match) {
        return res.status(401).json({
            message: 'Password is incorrect'
        });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
        'UPDATE users SET password_hash = ? WHERE user_id = ?',
        [hashedNewPassword, userId]
    );

    res.json({
        message: 'Password updated successfully'
    });
});


//delete account://
//DELETE /api/profile 
app.delete('/api/profile', auth, async (req, res) => {
    
    const userId = req.user.id;

    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        
        //users email for response message
        const [users] = await connection.query(
                'SELECT email FROM users WHERE user_id = ?',
                [userId]
            );

        if (users.length === 0) {
            await connection.rollback();
            connection.release();
                return res.status(404).json({message: 'User not found'});
            }

            const userEmail = users[0].email;


            await connection.query(
                'DELETE FROM users WHERE user_id = ?',
                [userId]
            );

        await connection.commit();
        connection.release();

        res.json({
            success: true,
            message: 'Account deleted successfully',
            email: userEmail
        });
    } catch (err) {
        await connection.rollback();
        console.error('Erro deleting account:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to delete account'
        });
    } finally {
        connection.release();
    }
});

//coupon discount:://
//GET /api/profile/coupons 
app.get('/api/profile/coupons', auth, async (req, res) => {
        
const userId = req.user.id;

        const [coupons] = await db.query(
            `SELECT order_id, coupon_code as code, total_amount as value, 
                    DATE_FORMAT(cancelled_at, '%Y-%m-%d') as date,
                    DATEDIFF(DATE_ADD(cancelled_at, INTERVAL 30 DAY), NOW()) as days_left
             FROM \`order\` 
             WHERE user_id = ? AND coupon_code IS NOT NULL AND coupon_used = FALSE
             AND cancelled_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
             ORDER BY cancelled_at DESC`,
            [userId]
        );

        res.json(coupons);
});




// Start server listening on specified port and all network interfaces
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
