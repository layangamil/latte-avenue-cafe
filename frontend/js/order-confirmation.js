document.addEventListener('DOMContentLoaded', function(){
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    //show orderId on page
    const orderDisplay = document.getElementById('order-id-display');
    if(orderDisplay && orderId){
        orderDisplay.textContent = orderId;
    }

    loadOrderDetails(orderId);
});

async function loadOrderDetails(orderId){
    console.log('loadOrderDetails function is running! With: ', orderId);
    const token = localStorage.getItem('token');
    console.log('User-ID: ', token?.id);
    try{
        const response = await fetch(`/api/orders/${orderId}`, {
            headers: {'Authorization': 'Bearer ' + token}
        });
        if (!response.ok){
            console.log('Could not load order details');
            return;
        }

        const data = await response.json();

        if(data.can_cancel){
            startCountdown(data.time_left, orderId);
        } else {
            document.getElementById('cancel-section').style.display = 'none';
        }
    } catch (error) {
        console.log('Error:', error);
    }
}

function startCountdown(secondsLeft, orderId){
    console.log('startCountdown function is running! With: ', secondsLeft, orderId);
    const timerElement = document.getElementById('countdown-timer');
    const cancelSection = document.getElementById('cancel-section');
    const cancelMessage = document.getElementById('cancel-message');

    //update countdown every second
    const timer = setInterval(function(){
        secondsLeft = Math.max(0, secondsLeft - 1);

        if (timerElement){
            timerElement.textContent = Math.floor(secondsLeft);
        }

        if(secondsLeft <= 0){
            clearInterval(timer);
            if (cancelSection){
                cancelSection.style.display = 'none';
            }
        }
    }, 1000);

    //cancel order button
    const cancelBtn = document.getElementById('cancel-order-btn')
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function(){
            cancelOrder(orderId, timer, cancelSection, cancelMessage);
        });
    }
}

async function cancelOrder(orderId, timer, cancelSection, cancelMessage){
    console.log('cancelOrder function is running! With: ', orderId, timer, cancelSection, cancelMessage);
    const token = localStorage.getItem('token');
    console.log('User-ID: ', token?.id);

    //stop the countdown
    clearInterval(timer);

    try {
        const response = await fetch(`/api/orders/${orderId}/cancel`, {
            method: 'DELETE',
            headers: {'Authorization': 'Bearer ' + token}
        });

        const data = await response.json();

        if(response.ok){
            //show confirmation order has been cancelled
            if(cancelSection) cancelSection.style.display = 'none';
            if (cancelMessage) {
                cancelMessage.style.display = 'block';
                cancelMessage.innerHTML = '<p>Order has been cancelled!</p>';
            }

            if (typeof updateCartCount === 'function') {
                updateCartCount();
            } 
        } else {
            alert('Could not cancel order: ' + (data.error || 'Unkown error' ));
        }
    } catch (error){
        console.log('Error:', error);
        alert('Cannot connect to server');
    }
}

            
            
            
            
            
        