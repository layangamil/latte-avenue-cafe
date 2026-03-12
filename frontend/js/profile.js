document.addEventListener('DOMContentLoaded', function(){
    const token = localStorage.getItem('token');
    if(!token){
        window.location.href = 'login.html';
        return;
    }
    console.log('User-ID: ', token?.id);
    loadUserProfile();
    loadDiscounts();

    document.getElementById('passwordForm').addEventListener('submit', async function(e){
            e.preventDefault();

            const currentPw = document.getElementById('currentPassword').value;
            const newPw = document.getElementById('newPassword').value;
            const confirmPw = document.getElementById('confirmPassword').value;

            if(newPw !== confirmPw) {
                alert('New Password does not match');
                return;
            }

            try {
                const response = await fetch('/api/profile/password', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({
                        currentPassword: currentPw,
                        newPassword: newPw
                    })
                });

                if (response.ok){
                    alert('Password successfully updated!')
                    document.getElementById('passwordForm').reset();
                } else {
                    const data = await response.json();
                    alert('Error: ' + data.message);
                }
            } catch (error) {
                alert ('Cannot connect to server');
            }
    });

    const deleteAccBtn = document.getElementById('delete-acc-btn');
    if(deleteAccBtn){
        deleteAccBtn.addEventListener('click', deleteAccount);
    }
});

async function loadUserProfile() {
    console.log('loadUserProfile function is running!');
    const token = localStorage.getItem('token');
    console.log('User-ID: ', token?.id);

    try {
        const response = await fetch('/api/profile', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        const user = await response.json(); 

        document.getElementById('display-firstname-header').textContent = user.first_name;
        document.getElementById('display-firstname').textContent = user.first_name;
        document.getElementById('display-lastname').textContent = user.last_name;
        document.getElementById('display-email').textContent = user.email;

        if (typeof window.updateCartCount === 'function') {
            window.updateCartCount();
        }
    } catch(error) {
        console.log('Error loading profile');
    }
}

async function loadDiscounts(){
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/profile/coupons', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        const discounts = await response.json();
        displayDiscounts(discounts);
    } catch(error){
        console.log('Error:', error);
    }
}

function displayDiscounts(discounts){
    const container = document.getElementById('discounts-container');

    if(!discounts || discounts.length === 0){
        container.innerHTML = '<p>You have no coupons</p>';
        return;
    }

    let html = '';
    for (let j = 0; j < discounts.length; j++){
        const discount = discounts[j];

        html += `
            <div class="discount-card">
                <div class="discount-code">${discount.code}</div>
                <div class="discount-value">Worth: ${discount.value} SEK</div>
                <div class="discount-expiry">Expires in: ${discount.days_left} days</div>
                <button class="btn btn-secondary btn-small" onclick="copyDiscount('${discount.code}')">Copy Code</button>
            </div>
        `;
    }
    container.innerHTML= html;
}

window.copyDiscount = function(code){
    navigator.clipboard.writeText(code);
    alert('Copied coupon code to clipboard!');
};


async function deleteAccount(){
    const token = localStorage.getItem('token')
    const confirmDelete = confirm ('Are you sure you want to delete account?');
    if (!confirmDelete){
        return;
    }

    try {
        const response = await fetch('/api/profile', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        });

        if(response.ok){
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            alert('Account deleted');
            window.location.href = 'index.html';
        }else{
            const data = await response.json();
            console.log('Error' + data.message);
            alert('Deleting account failed!');
        }

    } catch(error){
        console.log('Error:', error);
        alert('Could not connect to server');
    }
}
