document.addEventListener('DOMContentLoaded', function(){
    //const token = localStorage.getItem('token');
    //if (!token){
    //    window.location.href = 'login.html';
    //    return;
    //}
    loadOrders();

});

async function loadOrders() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('http://localhost:5000/api/orders/myorders', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        if(!response.ok){
            showError('Failed to load orders');
            return;
        }

        const orders = await response.json();
        displayOrders(orders);
    
    } catch(error){
        console.log('Error:', error);
        showError('Cannot connect to server');
    }
}

//displaying orders function
function displayOrders(orders){
    let currentOrder = null;
    let history = [];

    for (let i = 0; i < orders.length; i++){
        if (orders[i].status !== 'completed') {
            currentOrder = orders[i];
        } else {
            history.push(orders[i]);
        }
    }
    // Show current order
    const currentBox = document.getElementById('current-order-box');
    if (currentOrder) {
        currentBox.innerHTML = renderCurrentOrder(currentOrder);
    } else {
        currentBox.innerHTML = '<p class="no-order">No active order</p>';
    }

    //show order history
    const historyBox = document.getElementById('order-history-box');
    if(history.length > 0){
        let html = '';
        for (let i = 0; i < history.length; i++){
            html += renderHistoryOrder(history[i]);
        }
        historyBox.innerHTML = html;
    } else {
        historyBox.innerHTML = '<p class="no-order">No previous orders</p>';
    }
}

function renderCurrentOrder(order){
    let itemsHtml = '';
    for (let i = 0; i < order.items.length; i++){
        const item = order.items[i];
        itemsHtml += `<li>${item.quantity}x ${item.name} - ${item.price * item.quantity} SEK</li>`;
    }
    
    return `
        <div class="order-card current">
            <div class="order-header">
                <span>Order #${order.id}</span>
                <span class="status-${order.status}">${order.status}</span>
            </div>
            <div class="order-body">
                <p><strong>Estimated Pickup Time:</strong> ${order.pickupTime || 'Not set'}</p>
                <ul>${itemsHtml}</ul>
                <p class="order-total"><strong>Total:</strong> ${order.total} SEK</p>
            </div>
        </div>
    `;
}

function renderHistoryOrder(order){
    let summary = '';
    for (let i = 0; i < order.items.length; i++){
        if (i > 0) summary += ', ';
        summary += `${order.items[i].quantity}x ${order.items[i].name}`;
    }
    return `
        <div class="order-card history">
            <div class="order-header">
                <span>Order #${order.id}</span>
                <span>${order.date || ''}</span>
            </div>
            <div class="order-body">
                <p>${summary}</p>
                <p class="order-total">Total: ${order.total} SEK</p>
            </div>
        </div>
    `;
}

function showError(message){
    document.getElementById('current-order-box').innerHTML = `<p class="error-message">${message}</p>`;
    document.getElementById('order-history-box').innerHTML = '';
}
