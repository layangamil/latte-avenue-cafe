/*
app.post('/api/orders', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        //STart transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            //1) Get user's cart items
            const [cartItems] = await connection.query(
                `SELECT sc.product_id, sc.quantity, p.price, p.name 
                 FROM shopping_cart sc
                 JOIN product p ON sc.product_id = p.product_id
                 WHERE sc.user_id = ?`,
                [userId]
            );

            if (cartItems.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ error: 'Cart is empty' });
            }

            //2) Calaculate total amount
            let totalAmount = 0;
            cartItems.forEach(item => {
                totalAmount += parseFloat(item.price) * item.quantity;
            });

            //3) Create the order
            const [orderResult] = await connection.query(
                `INSERT INTO \`order\` (user_id, total_amount, status) 
                 VALUES (?, ?, 'pending')`,
                [userId, totalAmount]
            );

            const orderId = orderResult.insertId;

            //4) Add items to the order_item table
            for (const item of cartItems) {
                await connection.query(
                    `INSERT INTO order_item (order_id, product_id, quantity, price_at_time) 
                     VALUES (?, ?, ?, ?)`,
                    [orderId, item.product_id, item.quantity, item.price]
                );
            }

            //5) Clear shopping cart
            await connection.query('DELETE FROM shopping_cart WHERE user_id = ?', [userId]);

            //Commit tracsaction
            await connection.commit();
            connection.release();

            res.status(201).json({
                message: 'Order placed successfully',
                order_id: orderId,
                total_amount: totalAmount,
                status: 'pending'
            });
        } catch (err) {
            //Something went wrong, rollback changes
            await connection.rollback();
            connection.release();
            throw err;
        }

    } catch (err) {
        console.error('Error creating order:', err);
        res.status(500).json({ error: 'Failed to create order' });
    }
});
*/