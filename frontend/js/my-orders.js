document.addEventListener('DOMContentLoaded', function(){
    const token = localStorage.getItem('token');
    if (!token){
        window.location.href = 'login.html';
        return;
    }
    console.log('User-ID: ', token?.id);
    loadOrders();
});

function showError(message){
    console.log('showError function is running! With: ', message);
    document.getElementById('current-order-box').innerHTML = `<p class="error-message">${message}</p>`;
    document.getElementById('order-history-box').innerHTML = '';
}

async function loadOrders() {
    console.log('loadOrders function is running!');
    const token = localStorage.getItem('token');
    console.log('User-ID: ', token?.id);

    try {
        const response = await fetch('/api/orders/myorders', {
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
    console.log('displayOrders function is running! With: ', orders);
    let currentOrders = [];
    let history = [];

    for (let i = 0; i < orders.length; i++){
        if (orders[i].status !== 'completed' && orders[i].status !== 'cancelled') {
            currentOrders.push(orders[i]);
        } else {
            history.push(orders[i]);
        }
    }
    // Show current order
    const currentBox = document.getElementById('current-order-box');
    if (currentOrders.length > 0) {
        let html = '';
        for (let i = 0; i < currentOrders.length; i++){
            html += renderCurrentOrder(currentOrders[i]);
        }
        currentBox.innerHTML = html;
    } else {
        currentBox.innerHTML = '<p class="no-orders" style="color:#999; letter-spacing: 3px;>No active orders</p>';
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
        historyBox.innerHTML = '<p class="no-orders" style="color:#999; letter-spacing: 3px;>No previous orders</p>';
    }

    if (typeof window.updateCartCount === 'function') {
        window.updateCartCount();
    }
}

function renderCurrentOrder(order){
    console.log('renderCurrentOrder function is running! With: ', order);
    let itemsHtml = '';
    if (order.items && order.items.length > 0){
        for (let i = 0; i < order.items.length; i++){
            const item = order.items[i];
            itemsHtml += `<li>${item.quantity}x ${item.name} - ${item.price * item.quantity} SEK</li>`;
        }
    } else {
        itemsHtml = '<li>No items</li>'; // fallback if no items exist
    }

    return `
        <div class="order-card">
            <div class="order-header">
                <span>Order #${order.id} - </span>
                <span class="status-${order.status}"><em>${order.status}</em></span>
            </div>
            <div class="order-body">
                <p><strong>Estimated Pickup Time:</strong> ${order.pickupTime || 'Not set'}</p>
                <ul>${itemsHtml}</ul>
                <p class="order-total">
                <span><strong>Total:</strong></span>
                <span>${order.total} SEK</span>
                </p>
            </div>
        </div>
    `;
}

function renderHistoryOrder(order){
    console.log('renderHistoryOrder function is running! With: ', order);
    let summaryHtml = '';
    if (order.items && order.items.length > 0){
        for (let i = 0; i < order.items.length; i++){
            const item = order.items[i];
            summaryHtml += `<li>${item.quantity}x ${item.name} - ${item.price * item.quantity} SEK</li>`;
        }
    } else {
        summaryHtml = '<li>No items</li>'; // fallback if no items exist
    }
    
    return `
        <div class="order-card">
            <div class="order-header">
                <span>Order #${order.id}</span>
                <span><em>${order.date || ''}</em></span>
            </div>
            <div class="order-body">
                <ul>${summaryHtml}</ul>
                <p class="order-total">
                <span><strong>Total:</strong></span>
                <span>${order.total} SEK</span>
                </p>
            </div>
        </div>
    `;
}

