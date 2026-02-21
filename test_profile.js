//test_profile.js -Test GET /api/profile

const BASE = "http://localhost:5000";

async function testProfile() {
    try {
        //1.) Login first to get token
        console.log("Logging in...");
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

        //2.) Get profile
        console.log("Fetching profile...");
        res = await fetch(`${BASE}/api/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const profile = await res.json();
        console.log("Profile:", profile);

    } catch (err) {
        console.log("Error:", err.message);
    }
}

testProfile();