document.addEventListener('DOMContentLoaded', function(){
    if (typeof window.updateCartCount === 'function') {
        window.updateCartCount(); //uses same function as menu.js CHANGED
    }
    updateUIBasedOnLogin(); 
    setupSignoutButtons();
});

function setupSignoutButtons(){
    console.log('setupSignoutButtons function is running!');

    const customerSignoutBtn = document.getElementById('customerSignoutBtn');
    if(customerSignoutBtn){
        customerSignoutBtn.addEventListener('click', function(event){
            event.preventDefault(); //stops what the button standard behaviour, go to '#' and instead does below
            signout();
        });
    }
}

function updateUIBasedOnLogin(){
    console.log('updateUIBasedOnLogin function is running!');

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
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

function signout(){
    console.log('signout function is running!');
    if (confirm('Are you sure you want to sign out?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole'); 

        window.location.href = 'index.html';
    }
}