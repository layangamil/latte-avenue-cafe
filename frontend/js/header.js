document.addEventListener('DOMContentLoaded', function(){
    
    updateCartCount(); 
    updateUIBasedOnLogin(); 
    setupSignoutButtons();
});

function updateUIBasedOnLogin(){

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    const loginLink = document.getElementById('loginLink');
    const accountDropdown = document.getElementById('accountDropdown');
    const adminNav = document.getElementById('adminNav');

    if(token){
        if (loginLink) loginLink.style.display = 'none';
        
        if (role === 'staff'){
            if (accountDropdown) accountDropdown.style.display = 'none';
            if (adminNav) adminNav.style.display = 'flex';
        } else{
            if (accountDropdown) accountDropdown.style.display = 'block';
            if (adminNav) adminNav.style.display = 'none';
        }

    } else {
        if (loginLink) loginLink.style.display = 'inline-block';
        if(accountDropdown) accountDropdown.style.display = 'none';
        if (adminNav) adminNav.style.display = 'none';
    }
}

function setupSignoutButtons(){

    const customerSignoutBtn = document.getElementById('customerSignoutBtn');
    if(customerSignoutBtn){
        customerSignoutBtn.addEventListener('click', function(event){
            event.preventDefault(); //stops what the button standard behaviour, go to '#' and instead does below
            signout();
        });
    }

    const adminSignoutBtn = document.getElementById('adminSignoutBtn');
    if (adminSignoutBtn){
        adminSignoutBtn.addEventListener('click', function(event){
            event.preventDefault();
            signout();
        });
    }
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCounter = document.getElementById('cart-count');
    if (cartCounter) {
        cartCounter.textContent = totalItems;
    }
}

function signout(){
    if (confirm('Are you sure you want to sign out?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');

        window.location.reload(); 

        window.location.href = 'index.html';
    }
}