document.addEventListener('DOMContentLoaded', function(){
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    const loginLink = document.getElementById('loginLink');
    const accountDropdown = document.getElementById('accountDropdown');
    const adminNav = document.getElementById('adminNav');

    if(token){
        loginLink.style.display = 'none';
        
        if (role === 'staff'){
            accountDropdown.style.display = 'none';
            adminNav.style.display = 'block';
        } else{
            accountDropdown.style.display = 'block';
            adminNav.style.display = 'none';
        }
    } else {
        loginLink.style.display = 'block';
        accountDropdown.style.display = 'none';
        adminNav.style.display = 'none';
    }

    const customerSignoutBtn = document.getElementById('logoutBtn');
    if(customerSignoutBtn){
        customerSignoutBtn.addEventListener('click', function(event){
            event.preventDefault(); //stops what the button standard behaviour, go to '#' and instead does below
            signout();
        });
    }

    const adminSignoutBtn = document.getElementById('adminLogoutBtn');
    if (adminSignoutBtn){
        adminSignoutBtn.addEventListener('click', function(event){
            event.preventDefault();
            signout();
        });
    }

    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }
});

function signout(){
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');

    window.location.href = 'index.html';
}