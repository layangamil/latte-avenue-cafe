const express = require('express');
const app = express();

const menu = [
    { id: 1, name: "Latte", price: 35, ingredients: ["Espresso", "Milk"] },
    { id: 2, name: "Cappucino", price: 40, ingredients: ["Espresso", "Milk", "Foam"] },
    { id: 3, name: "Mocha", price: 45, ingredients: ["Espresso", "Milk", "Chocolate"] }
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
