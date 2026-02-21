//test_myorders.js -Test GET /api/orders/myorders

const BASE = "http://localhost:5000";

async function testMyOrders() {
    try {
        //1.) Login first to get token
        console.log("Logging in as customer...");
        let res = await fetch(`${BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: "customer@example.com",
                password: "admin123",
                loginRole: "customer"
            })
        });

        const loginData = await res.json();
        const token = loginData.token;
        console.log("Logged in successfully\n");

        //2.) Get user's orders
        console.log("Fetching user orders...");
        res = await fetch(`${BASE}/api/orders/myorders`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const orders = await res.json();
        console.log("Orders:", JSON.stringify(orders, null, 2));

    } catch (err) {
        console.error("Error:", err.message);
    }
}

testMyOrders();