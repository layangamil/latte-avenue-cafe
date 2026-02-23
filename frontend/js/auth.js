//auth -Handles all authentication UI
//Run on every page to check Login status

document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();

    //Setup Logout buttons if they exist
    const customerLogoutBtn = document.getElementById('customerSignoutBtn');
    const adminLogoutBtn = document.getElementById('adminSignoutBtn');

    if (customerLogoutBtn) {
        customerLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }

    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
});

function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    const accountDropdown = document.getElementById('accountDropdown');
    const adminNav = document.getElementById('adminNav'); //The admin nav section

    const loginLink = document.getElementById('loginLink');

    if (token) {
        //User IS logged in
        console.log('User logged in as:', userRole);

        //Hide login link
        if (loginLink) loginLink.style.display = 'none';

        //Show appropriate dropdown based on role
        if  (userRole === 'staff') {
            //Show admin navigation
            if (adminNav) adminNav.style.display = 'flex';
            if (accountDropdown) accountDropdown.style.display = 'none'; //Hide customer dropdown for staff
        
        } else {
            //Show customer dropdown
            if (accountDropdown) accountDropdown.style.display = 'block';
            if (adminNav) adminNav.style.display = 'none';
        }

        //Update header to show user is logged in
        updateHeaderForLoggedIn();

    } else {
        //User is NOT logged in
        console.log('User not logged in');

        //Show login link
        if (loginLink) loginLink.style.display = 'inline-block';

        //Hide all logged-in only elements
        if (accountDropdown) accountDropdown.style.display = 'none';
        if (adminNav) adminNav.style.display = 'none';

        //Update header for logged out state
        updateHeaderForLoggedOut();
    }
}

function updateHeaderForLoggedIn() {
    //Optional: Add a small indicator user is logged in
    //Like a green dot or change the icon colour
    const userIcon = document.querySelector('.fa-circle-user');
    if (userIcon) {
        userIcon.style.color = '#4CAF50'; //Green colour
    }
}

function updateHeaderForLoggedOut() {
    const userIcon = document.querySelector('.fa-circle-user');
    if (userIcon) {
        userIcon.style.color = ''; //Reset to default
    }
}

function logout() {
    if (confirm('Are you sure you want to sign out?')) {
        //Clear ALL user data
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorgae.removeItem('cart'); //Optional: Clear cart on logout

        //Redirect to home page
        window.location.href = 'index.html';
    }
}