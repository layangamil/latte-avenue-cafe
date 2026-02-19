document.addEventListener('DomContentLoaded', function(){
    const token = localStorage.getItem('token');
    const loginLink = document.getElementById('loginLink');
    const accountDropdown = document.getElementById('accountDropdown');

    if(token){
        if(loginLink) loginLink.style.display = 'none';
        if(accountDropdown) accountDropdown.style.display = 'inline-block';
    } else {
        if(loginLink) loginLink.style.display = 'inline-block';
        if(accountDropdown) accountDropdown.style.display = 'none';
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn){
        logoutBtn.addEventListener('click', function(event){
            event.preventDefault(); //stops what the button standard behaviour, go to '#' and instead does below

            localStorage.removeItme('token'); //preventDefault() makes so that localStorage has time to removeItem osv, then navigates (best practice for logout btns, gives control)
            localStorage.removeItem('userRole');
            //leaving cart so items are still in cart despite not being logged in

            window.location.href = 'index.html'; 
        });
    }

    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }
});