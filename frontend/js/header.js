document.addEventListener('DOMContentLoaded', function(){
    
    updateCartCount(); 
    updateUIBasedOnLogin(); 
    setupSignoutButtons();
});

function updateUIBasedOnLogin(){

    const token = localStorage.getItem('token');
    const loginLink = document.getElementById('loginLink');
    const accountDropdown = document.getElementById('accountDropdown');

    if(token){
        if (loginLink) loginLink.style.display = 'none';
        if (accountDropdown) accountDropdown.style.display = 'block';
    } else {
        if (loginLink) loginLink.style.display = 'inline-block';
        if(accountDropdown) accountDropdown.style.display = 'none';
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

        window.location.href = 'index.html';
    }
}