//test_update_password.js -Test PUT /api/profile/password

const BASE = "http://localhost:5000";

async function testUpdatePassword() {
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

        //2.) Test 1: Wrong current password
        console.log("Test 1: Wrong current password...");
        res = await fetch(`${BASE}/api/profile/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                currentPassword: "wrongpassword",
                newPassword: "newpassword123"
            })
        });

        const result1 = await res.json();
        console.log("Response:", result1, "\n");

        //3.) Test 2: Correct password update
        console.log("Test 2: Correct password update...");
        res = await fetch(`${BASE}/api/profile/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                currentPassword: "admin123",
                newPassword: "newpassword123"
            })
        });

        const result2 = await res.json();
        console.log("Response:", result2, "\n");

        //4.) Test login with new password
        console.log("Testing login with new password...");
        res = await fetch(`${BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: "customer@example.com",
                password: "newpassword123",
                loginRole: "customer"
            })
        });

        const newLogin = await res.json();
        if (newLogin.token) {
            console.log("Login successful with new password!:");
        } else {
            console.log("Login failed with new password");
        }

        //5.) Change back to original password (so other tests still work)
        console.log("\n Changing back to original password...");
        res = await fetch(`${BASE}/api/profile/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${newLogin.token}`
            },
            body: JSON.stringify({
                currentPassword: "newpassword123",
                newPassword: "admin123"
            })
        });

        const result3 = await res.json();
        console.log("Response:", result3);

    } catch (err) {
        console.log("Error:", err.message);
    }
}

testUpdatePassword();