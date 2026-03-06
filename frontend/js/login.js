//Wait till html file loads (elements etc) before JS runs - avoids matching issues
document.addEventListener('DOMContentLoaded', function(){
    //Existing customer - login
    // find customer login btn with classes...
    const customerLoginBtn = document.querySelector('.customer-exist .btn-login');
    if (customerLoginBtn) { //if it exists listen to it being clicked and run this code:
        customerLoginBtn.addEventListener('click', function(){

            //retrieve values user put in input fields by looking for specific ID
            const email = document.getElementById('customer-login-email').value;
            const password = document.getElementById('customer-login-password').value;
            loginUser(email, password, 'customer'); //call login function with said values AND user role!
        });
    }

    //New customer - sign up
    // find customer sign up btn with classes...
    const customerSignupBtn = document.querySelector('.customer-new .btn-create');
    if (customerSignupBtn) { //if it exists listen to it being clicked and run this code:
        customerSignupBtn.addEventListener('click', function(){
            
            //retrieve values user put in input fields by looking for specific ID
            const firstName = document.getElementById('customer-signup-firstname').value;
            const lastName = document.getElementById('customer-signup-lastname').value;
            const email = document.getElementById('customer-signup-email').value;
            const password = document.getElementById('customer-signup-password').value;
        
            registerUser(firstName, lastName, email, password); //call sign up function with said values
        });
    }
    //Admin - login
    // find admin log in btn with ID and class...
    const adminLoginBtn = document.querySelector('#admin-section .btn-login');
    if (adminLoginBtn) {  //if it exists listen to it being clicked and run this code:
        adminLoginBtn.addEventListener('click', function(){

            //retrieve values user put in input fields by looking for specific ID
            const email = document.getElementById('admin-login-email').value;
            const password = document.getElementById('admin-login-password').value;

            loginUser(email, password, 'staff'); //call login function with said values AND user role!
        });
    } 
});

async function loginUser(email, password, role) {  //async function will await for promises, modern way to handle API calls
    console.log('loginUser function is running! With: ', email, role);
    // first check if user already logged, if token exists
    const existingToken = localStorage.getItem('token');
    if (existingToken){
        const confirmLogout = confirm ('You are already logged in. Do you want to logout first?');
        if (confirmLogout) {
            localStorage.removeItem('token'); //if yes, remove token
            localStorage.removeItem('userRole'); //alos remove userRole (now nobody is logged in and no info in localStorage)
        } else { 
            return;
        }
    }
    
    try { 
        const response = await fetch('/api/login', {  // API endpoint - fetch send HTTP request to backend
            method: 'POST',                                                //API method - POST processing data (login attempt)
            headers: {'Content-Type': 'application/json'},                 // Instruction for server - "im sending json"
            body: JSON.stringify({                                         //convert JS to json string (API standard format)
                email: email, 
                password: password,        
                loginRole: role                                            // says which role is logging in, customer / staff 
            })
                                   
        });
        //Response (server -> client)                                      // wait for response from backend
        const data = await response.json();                                // Parse back to JS, now usable data

        if (data.token) { //if success, token exists
            localStorage.setItem('token', data.token);  //save token
            localStorage.setItem('userRole', role);     //save user role

            //check localStorage if redirectAfterLogin exists (from cart page!)
            const redirectTo = localStorage.getItem('redirectAfterLogin');

            if (redirectTo){ //if yes, remove item from memory and redirect to payment page
                localStorage.removeItem('redirectAfterLogin');
                window.location.href = redirectTo;
            } else if(role === 'staff'){ //else, send me (admin) to order-manage page
                window.location.href = 'order-manage.html';
            } else{ //else, send me (customer) to home page
                window.location.href = 'index.html';
            }
        } else { //no token, some mismatch with backend 
            alert('Login failed:' + (data.message));
        }
    } catch (error) { // lastly, catch network issue
        console.log('Error:', error);
        alert('Cannot connect to server');
    }
}

async function registerUser(firstName, lastName, email, password) {
    console.log('registerUser function is running! With: ', firstName, lastName, email);
    try {
        // Send registration data to backend with POST method + values from input field
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                first_name: firstName,  // Backend expects underscore
                last_name: lastName,    // Backend expects underscore
                email: email,
                password: password
            })
        });
        
        // waits for response then convert to JS object
        const data = await response.json();
        
        // Check if account was created
        if (data.message && data.message.includes('created')) {
            alert('Account created! You may login.'); //if yes, send user a message
            // Clear the form fields so user can login
            document.getElementById('customer-signup-firstname').value = '';
            document.getElementById('customer-signup-lastname').value = '';
            document.getElementById('customer-signup-email').value = '';
            document.getElementById('customer-signup-password').value = '';
        } else {
            // If no, show error message from server
            alert('Error: ' + (data.message));
        }
    } catch (error) {
        // Network or connection error
        console.log('Error:', error);
        alert('Cannot connect to server');
    }
}