//load page
document.addEventListener('DOMContentLoaded', function(){
    //Existing customer - login
    const customerLoginBtn = document.querySelector('.customer-exist .btn-login');
    if (customerLoginBtn) {
        customerLoginBtn.addEventListener('click', function(){

            const email = document.getElementById('customer-login-email').value;
            const password = document.getElementById('customer-login-password').value;
            loginUser(email, password, 'customer');
        });
    }

    //New customer - sign up
    const customerSignupBtn = document.querySelector('.customer-new .btn-create');
    if (customerSignupBtn) {
        customerSignupBtn.addEventListener('click', function(){
            
            const firstName = document.getElementById('customer-signup-firstname').value;
            const lastName = document.getElementById('customer-signup-lastname').value;
            const email = document.getElementById('customer-signup-email').value;
            const password = document.getElementById('customer-signup-password').value;
        
            registerUser(firstName, lastName, email, password); //send to backend with correct field names
        });
    }
    //Admin - login
    const adminLoginBtn = document.querySelector('#admin-section .btn-login');
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', function(){

            const email = document.getElementById('admin-login-email').value;
            const password = document.getElementById('admin-login-password').value;

            loginUser(email, password, 'staff');
        });
    } 
});

async function loginUser(email, password, role) {  //async function will await for promises, modern way to handle API calls
    //change made here until 'try' 
    const existingToken = localStorage.getItem('token');
    if (existingToken){
        const confirmLogout = confirm ('You are already logged in. Do you want to logout first?');
        if (confirmLogout) {
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
        } else {
            return;
        }
    }
    
    try { //Request (client -> server)

        const response = await fetch('/api/login', {  // API endpoint - fetch send HTTP request to backend
            method: 'POST',                                                //API method - POST processing data (login attempt)
            headers: {'Content-Type': 'application/json'},                 // Instruction for server - "im sending JSON"
            body: JSON.stringify({
                email: email, 
                password: password,
                loginRole: role
            })
                                    //API data format - convert JS object to JSON string (standard format for APIs)
        });
          //Response (server -> client)
        const data = await response.json();                                // Parse back to JS, now usable data

        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userRole', role);

            if(role === 'staff'){
                window.location.href = 'order-manage.html';
            } else{
                window.location.href = 'index.html';
            }
        } else {
            alert('Login failed:' + (data.message));
        }
    } catch (error) {
        console.log('Error:', error);
        alert('Cannot connect to server');
    }
}

async function registerUser(firstName, lastName, email, password) {
    try {
        // Send registration data to backend
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
        
        // Convert response
        const data = await response.json();
        
        // Check if account was created
        if (data.message && data.message.includes('created')) {
            alert('Account created! You may login.');
            // Clear the form fields so user can login
            document.getElementById('customer-signup-firstname').value = '';
            document.getElementById('customer-signup-lastname').value = '';
            document.getElementById('customer-signup-email').value = '';
            document.getElementById('customer-signup-password').value = '';
        } else {
            // Show error message from server
            alert('Error: ' + (data.message));
        }
    } catch (error) {
        // Network or connection error
        console.log('Error:', error);
        alert('Cannot connect to server');
    }
}