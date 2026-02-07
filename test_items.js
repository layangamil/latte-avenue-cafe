const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE = "http://localhost:3000";

async function run() {
    try {
        console.log("Logging in as staff...");

        //Login
        let res = await fetch(`${BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: "staff@latteavenue.com",
                password: "admin123" 
            })
        });

        const loginData = await res.json();
        const token = loginData.token;
        console.log("TOKEN OK\n");

        //ADD ITEM
        console.log("Adding new item...");
        res = await fetch(`${BASE}/api/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: "Node Test Coffee",
                price: 99,
                category: "drink",
                ingredients: "Beans, code, caffeine",
                is_available: true
            })
        });

        const addData = await res.json();
        const newId = addData.id;
        console.log("Item added with ID:", newId, "\n");

        //UPDATE ITEM
        console.log("Updating item...");
        await fetch(`${BASE}/api/items/${newId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: "UPDATED Node Coffee",
                price: 120,
                category: "drink",
                ingredients: "More beans",
                is_available: true
            })
        });
        console.log("Item updated\n");

        //DELETE ITEMS

        console.log("Deleting item...");
        await fetch(`${BASE}/api/items/${newId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log("Item deleted\n");
        console.log("TEST COMPLETE");
    
    } catch (err) {
        console.error("ERROR:", err);
    }
}

run();
































