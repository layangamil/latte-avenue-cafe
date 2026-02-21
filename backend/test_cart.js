const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE = "http://localhost:5000";

async function testCart() {
    try {
        console.log("Logging in as a customer...");

        //Login as customer
        let res = await fetch(`${BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: "customer@example.com",
                password: "admin123" //hmmm?
            })
        });

        const loginData = await res.json();
        const token = loginData.token;
        console.log("Login successful! Token received\n");

        if(!token) {
            console.log("Login failed: check password in db");
            return;
        }

        //clear cart
        console.log("Clearing cart...");
        await fetch(`${BASE}/api/cart`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log("Cart cleared\n");

        //Add items to cart
        console.log("Adding chocolate Latte (ID: 1) to cart...");
        res = await fetch(`${BASE}/api/cart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                product_id: 1,
                quantity: 2
            })
        });

        console.log("Response:", await res.json(), "\n");

        console.log("Adding Brown Sugar Latte (ID: 2) to cart...");
        res = await fetch(`${BASE}/api/cart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/Json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                product_id: 2,
                qunatity: 1
            })
        });

        console.log("Response:", await res.json(), "\n");

        //View cart¨
        console.log("Viewing cart...");
        res = await fetch(`${BASE}/api/cart`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const cartData = await res.json();
        console.log("Cart contents:");
        console.log(JSON.stringify(cartData, null, 2));
        console.log("");

        //Update quantity
        console.log("Updating Chocolate Latte quantity to 3...");
        res = await fetch(`${BASE}/api/cart/1`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                quantity: 3
            })
        });

        console.log("Response:", await res.json(), "\n");

        //View updated cart
        console.log("Viewing updated cart...");
        res = await fetch(`${BASE}/api/cart`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const updatedCart = await res.json();
        console.log("Updated cart:");
        console.log(JSON.stringify(updatedCart, null, 2));
        console.log("");

        //Remove one item
        console.log("Removing Brown Sugar Latte from cart...");
        res = await fetch(`${BASE}/api/cart/2`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log("Response:", await res.json(), "\n");

        //Final cart view
        console.log("Final cart view...");
        res = await fetch(`${BASE}/api/cart`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const finalCart = await res.json();
        console.log(JSON.stringify(finalCart, null, 2));

        console.log("\n TEST COMPLETE!");

    } catch (err) {
        console.error("Error:", err);
    }
}

testCart();