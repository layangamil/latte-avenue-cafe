document.addEventListener('DOMContentLoaded', function(){
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if(!token || role !== 'staff'){  //means they're a customer or not logged in staff
        console.log('Role: ', role);
        window.location.href = "login.html";
        return;
    }
    loadAllOrders();
});

async function loadAllOrders() {
    console.log('loadAllOrders function is running!');
    const token = localStorage.getItem('token');
    console.log('User-ID: ', token?.id);

    try {
        const response = await fetch('/api/orders', {
            headers: {'Authorization': 'Bearer ' + token}
        });

        const orders = await response.json();
        displayOrders(orders);

    } catch (error) {
        console.log('Error: ', error);
    }
}

function displayOrders(orders) {
    console.log('displayOrders function is running! With: ', orders);
    const activeOrders = [];
    for (const order of orders){
        if (order.status !== 'cancelled' && order.status !== 'completed'){
            activeOrders.push(order);
        }
    }
    
    
    const container = document.getElementById('orders-list');
    let html = '';

    for (let i = 0; i < activeOrders.length; i++){
        const order = activeOrders[i];

        // using the correct name from backend
        const orderId = order.order_id;                 // fron backend: order_id
        const orderTotal = order.total_amount;          // from backend: total_amount
        const customerName = order.first_name + ' ' + order.last_name;
        const itemsSummary = `${order.item_count} items`;  // from backend: item_count

        html += `
            <div class="order-card" data-id="${orderId}">
                <div class="order-header">
                    <div class="order-title">
                        <strong>Order #${orderId}</strong> - ${customerName}
                    </div>

                    <div class="order-actions">
                        <button class="btn-tertiary" onclick="viewOrder(${orderId})">View</button>
                        <select onchange="updateStatus(${orderId}, this.value)">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                            <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready</option>
                            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                        </select>
                    </div>
                </div>
                <div class="order-details">
                    <p><strong>Status:</strong> ${order.status}</p>
                    <p><strong>Items:</strong> ${itemsSummary}</p>
                    <p><strong>Total:</strong> ${orderTotal} SEK</p>
                </div>
            </div>
        `;
    }
    if (activeOrders.length === 0){
        container.innerHTML = '<p class="no-orders" style="color:#999; letter-spacing: 3px;>No active orders</p>'
    }else {
        container.innerHTML = html;
    }
}

async function updateStatus(orderId, newStatus) {
    console.log('updateStatus function is running! With: ', orderId, newStatus);
    const token = localStorage.getItem('token');

    const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({status: newStatus})
    });

    if (response.ok) {
        alert('Status Updated!');
        loadAllOrders();
    } else {
        const data = await response.json();
        alert('Error: ' + data.error);
    }
}

async function viewOrder(orderId) { 
    console.log('viewOrder function is running! With: ', orderId);
    const token = localStorage.getItem('token');
    console.log('User-ID: ', token?.id);

    const response = await fetch(`/api/orders/${orderId}`, {
        headers: { 'Authorization': 'Bearer ' + token}
    });

    const order = await response.json();

    alert(`Order #${order.order.order_id}
Customer: ${order.order.first_name} ${order.order.last_name} 
Status: ${order.order.status} 
Items: 
${(formatItems(order.items))}
Total: ${order.order.total_amount} SEK
Can cancel: ${order.can_cancel}`);
}

function formatItems(items){
    console.log('formatItems function is running! With: ', items);
    let result = '';
    for (let i = 0; i < items.length; i++){
        const item = items[i];
        result += `${item.quantity}x ${item.name} - ${item.price_at_time}SEK\n`;
    }
    return result;
}