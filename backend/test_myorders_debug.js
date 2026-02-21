// test_myorders_debug.js - Debug version
const BASE = "http://localhost:5000";

async function testMyOrdersDebug() {
    try {
        // 1. Login
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

        // 2. First, let's check what user ID we are
        console.log("Checking profile to see user ID...");
        res = await fetch(`${BASE}/api/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const profile = await res.json();
        console.log("Profile:", profile);

        // 3. Now try myorders
        console.log("\nFetching user orders...");
        res = await fetch(`${BASE}/api/orders/myorders`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const orders = await res.json();
        console.log("Orders response:", orders);

    } catch (err) {
        console.error("Error:", err.message);
    }
}

testMyOrdersDebug();