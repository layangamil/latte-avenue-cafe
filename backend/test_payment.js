//test_payment.js

//const fetch = require('node_fecth');

const BASE = "http://localhost:5000";

async function testPaymentOrder() {
    try {
        //1.login as customer
        console.log("Logging in...");
        let res = await fetch(`${BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: "customer@example.com",
                password: "admin123"
            })
        });

        const loginData = await res.json();
        const token = loginData.token;
        console.log("Logged in sucessfully\n");

        //2. Test data
        const orderData = {
            items: [
                {
                    menuItemId: 1,
                    name: "Chocolate Latte",
                    price: 35.00,
                    quantity: 2
                },
                {
                    menuItemId: 3,
                    name: "Classic Espresso",
                    price: 25.00,
                    quantity: 1
                }
            ],
            total: 95.00,
            paymentMethod: "visa",
            status: "confirmed"
        };

        console.log("Sending order:", JSON.stringify(orderData, null, 2));

        // 3. Place order
        console.log("\n Placing order...");
        res = await fetch(`${BASE}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });

        const result = await res.json();
        console.log("Response:", result);

        if (result.success) {
            console.log(`\n Order placed successfully! Order ID: ${result.orderId}`);
        }

    } catch (err) {
        console.log("Error:", err.message);
    }
}

testPaymentOrder();