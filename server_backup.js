const express = require('express');
const app = express();

const menu = [
  {
        id: 1,
        name: "Chocolate Latte",
        price: 35,
        category: "drink",
        ingredients: ["Whole milk", "Dark chocolate"]
    },
    {
        id: 2,
        name: "Brown Sugar Latte",
        price: 30,
        category: "drink",
        ingredients: ["Whole milk", "Egg whites"]
    },
    {
        id: 3,
        name: "Classic Espresso",
        price: 25,
        category: "drink",
        ingredients: ["Double espresso shots"]
    },
    {
        id: 4,
        name: "Lemon Curd Macaron",
        price: 15,
        category: "dessert",
        ingredients: ["Flour", "Egg", "Whole milk"]
    },
    {
        id: 5,
        name: "Strawberry Short Cake",
        price: 30,
        category: "dessert",
        ingredients: ["Flour", "Whole milk"]
    },
    {
        id: 6,
        name: "Berry Cheese Cake",
        price: 25,
        category: "dessert",
        ingredients: ["Flour", "Egg"]
    }
    ];

const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Latte Avenue backend is running');
});

app.get('/api/menu', (req, res) => {
    res.json(menu);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
