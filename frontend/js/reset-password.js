document.addEventListener('DOMContentLoaded', function(){
    const urlParam = new URLSearchParams(window.location.search);
    const email = urlParam.get('email');
    const token = urlParam.get('token');

    if (!email || !token){
        alert('Unauthorized login attempt. Please create new link.');
        window.location.href= 'login.html';
        return;
    }

    localStorage.setItem('resetEmail', email);
    localStorage.setItem('resetToken', token);

    const resetBtn = document.getElementById('resetBtn');
    const passReset = document.getElementById('passReset');
    const confirmPassReset = document.getElementById('confirmPassReset');
    const msgMatch = document.getElementById('matchPasswordMsg');
    const msgMissingInfo = document.getElementById('missingInfoMsg');

    if(resetBtn){
        resetBtn.addEventListener('click', async function(e){
            e.preventDefault();

            const newPass = passReset.value;  //gett in oput values
            const confirmNewPass = confirmPassReset.value;
            const saveToken = localStorage.getItem('resetToken');

            if(!confirmNewPass || !newPass){
                console.log('Missing input infromation');
                msgMissingInfo.style.display = 'block';
                return;
            } else{
                msgMissingInfo.style.display = 'none';
            }

            if (newPass !== confirmNewPass){
                msgMatch.style.display = 'block';
                return;
            }else {
                msgMatch.style.display = 'none';
            }

            await resetPassword(newPass, saveToken);
        });
    }

    const cancelReset = document.getElementById('cancelReset');
    if(cancelReset){
        cancelReset.addEventListener('click', function(){
            localStorage.removeItem('resetEmail');
            localStorage.removeItem('resetToken');
            window.location.href = 'login.html';
            return;
        });
    }
});


async function resetPassword(newPass, token){

    try{
        const response = await fetch('/api/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token,
                newPassword: newPass
            })
        });
        const data = await response.json();

        if(response.ok){
            console.log('Successfully changed user password!');
            alert('New password is set! You will be re-directed to login page.');
            localStorage.removeItem('resetEmail');
            localStorage.removeItem('resetToken');
            window.location.href = 'login.html';
        } else{
            alert('Could not reset password: ', (data.message || 'Unkown error'));
        }

    } catch(error){
        console.log('Error:', error);
        alert('Could not connect to server');
    }
}