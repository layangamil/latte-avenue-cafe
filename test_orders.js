const fetch = require('node-fetch');

const BASE = "http://localhost:5000";

async function testOrders() {
    try {
        console.log("Logging in as customer...");
        //Logging as customer
        let res = await fetch(`${BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: "customer@example.com",
                password: "admin123"
            })
        });

        const loginData = await res.json();
        const customerToken = loginData.token;
        console.log("Customer logged in\n");

        //First add items to cart
        console.log("Adding items to cart...");
        await fetch(`${BASE}/api/cart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${customerToken}`
            },
            body: JSON.stringify({
                product_id: 1,
                quantity: 2
            })
        });

        await fetch(`${BASE}/api/cart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${customerToken}`
            },
            body: JSON.stringify({
                product_id: 3,
                quantity: 1
            })
        });

        console.log("Items added to cart\n");

        //View cart
        res = await fetch(`${BASE}/api/cart`, {
            headers: { 'Authorization': `Bearer ${customerToken}` }
        });

        const cart = await res.json();
        console.log("Current cart:", JSON.stringify(cart, null, 2), "\n");

        //Place order
        console.log("Placing order...");
        res = await fetch(`${BASE}/api/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${customerToken}`
            }
        });

        const orderResult = await res.json();
        console.log("Order placed:", orderResult, "\n");

        const orderId = orderResult.order_id;

        //View order details
        console.log(`Getting order ${orderId} details...`);
        res = await fetch(`${BASE}/api/orders/${orderId}`, {
            headers: { 'Authorization': `Bearer ${customerToken}` }
        });

        const orderDetails = await res.json();
        console.log("Order details:", JSON.stringify(orderDetails, null, 2), "\n");

        //Get all orders for customer
        console.log("Getting all customer orders...");
        res = await fetch(`${BASE}/api/orders`, {
            headers: { 'Authorization': `Bearer ${customerToken}` }
        });

        const customerOrders = await res.json();
        console.log("Customer orders:", JSON.stringify(customerOrders, null, 2), "\n");

        //Login as staff to update status
        console.log("Logging in as staff...");
         res = await fetch(`${BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: "staff@latteavenue.com",
                password: "admin123"
            })
        });

        const staffLoginData = await res.json();
        const staffToken = staffLoginData.token;
        console.log("Staff logged in\n");

        // Staff updates order status to preparing
        console.log("Staff updating order to preparing...");
        res = await fetch(`${BASE}/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${staffToken}`
            },
            body: JSON.stringify({
                status: 'preparing'
            })
        });
        const updateResult = await res.json();
        console.log("Status update:", updateResult, "\n");


        // Staff updates to ready
        console.log("Staff updating order to ready...");
        res = await fetch(`${BASE}/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${staffToken}`
            },
            body: JSON.stringify({
                status: 'ready'
            })
        });
        const readyResult = await res.json();
        console.log("Status update:", readyResult, "\n");

        // Staff views all orders
        console.log("Staff viewing all orders...");
        res = await fetch(`${BASE}/api/orders`, {
            headers: { 'Authorization': `Bearer ${staffToken}` }
        });
        const allOrders = await res.json();
        console.log("All orders:", JSON.stringify(allOrders, null, 2), "\n");

        console.log("Order test complete!");

    } catch (err) {
        console.error("Error:", err.message);
    }
}

testOrders();