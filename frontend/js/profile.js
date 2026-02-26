document.addEventListener('DOMContentLoaded', function(){
    /*const token = localStorage.getItem('token');
    if(!token){
        window.location.href = 'login.html';
        return;
    }*/
    loadUserProfile();

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
                const response = await fetch('http://localhost:5000/api/profile/password', {
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
});

async function loadUserProfile() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('http://localhost:5000/api/profile', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });

        const user = await response.json();

        document.getElementById('display-firstname-header').textContent = user.first_name;
        document.getElementById('display-firstname').textContent = user.first_name;
        document.getElementById('display-lastname').textContent = user.last_name;
        document.getElementById('display-email').textContent = user.email;
    } catch(error) {
        console.log('Error loading profile');
    }
}

