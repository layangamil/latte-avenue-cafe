//load page
document.addEventListener('DOMContentLoaded', function(){
    //Existing customer - login
    const customerLoginBtn = document.querySelector('.customer-exist .btn-login');
    if (customerLoginBtn) {
        customerLoginBtn.addEventListener('click', function(){

            const email = document.getElementById('customer-login-email').value;
            const password = document.getElementById('customer-login-password').value;
            loginUser(email, password);
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

            loginUser(email, password);
        });
    } 
});

async function loginUser(email, password) {
    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password})
        });
        const data = await response.json();

        if (data.token) {
            localStorage.setItem('token', data.token);

            alert('Login Successful!');
            window.location.href = 'index.html';
        } else {
            alert('Login failed: ' + (data.message || 'Invalid credentials'));
        }
    } catch (error) {
        console.log('Error:', error);
        alert('Cannot connect to server');
    }
}

async function registerUser(firstName, lastName, email, password) {
    try {
        // Send registration data to backend
        const response = await fetch('http://localhost:3000/api/register', {
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
            alert('Account created! Please login.');
            // Clear the form fields
            document.getElementById('customer-signup-firstname').value = '';
            document.getElementById('customer-signup-lastname').value = '';
            document.getElementById('customer-signup-email').value = '';
            document.getElementById('customer-signup-password').value = '';
        } else {
            // Show error message from server
            alert('Error: ' + (data.message || 'Registration failed'));
        }
    } catch (error) {
        // Network or connection error
        console.log('Error:', error);
        alert('Cannot connect to server');
    }
}