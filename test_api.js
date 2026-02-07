const fetch = require('node-fetch'); // load fetch library

// ---- REGISTER USER ----
fetch('http://localhost:3000/api/register', {
  method: 'POST', // we are sending data
  headers: { 'Content-Type': 'application/json' }, // tells server it is JSON
  body: JSON.stringify({
    email: "node@test.com",
    password: "123456",
    first_name: "Node",
    last_name: "User"
  })
})
.then(res => res.json()) // parse response
.then(data => console.log(data)) // print result
.catch(err => console.error(err)); // print errors
