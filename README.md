# latte-avenue-cafe
Café ordering system - University project for distributed systems





# Latte Avenue Cafe Backend API

## GET /api/menu

**Description:** This returns the menu of Latte Avenue Cafe in JSON format.

**URL:**
`http://localhost:3000/api/menu`

**Method:** GET

**Response Example:**
```json
[
  {"id":1,"name":"Latte","price":35,"ingredients":["Espresso","Milk"]},
  {"id":2,"name":"Cappuccino","price":40,"ingredients":["Espresso","Milk","Foam"]},
  {"id":3,"name":"Mocha","price":45,"ingredients":["Espresso","Milk","Chocolate"]}
]

