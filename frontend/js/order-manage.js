document.addEventListener('DOMContentLoaded', function(){
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if(!token || role !== 'staff'){  //means they're a customer or not logged in staff
        window.location.href = "login.html";
        return;
    }

    loadAllOrders();
});

async function loadAllOrders() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('http://localhost:5000/api/orders', {
            headers: {'Authorization': 'Bearer ' + token}
        });

        const orders = await response.json();
        displayOrders(orders);

    } catch (error) {
        console.log('Error: ', error);
    }
}

/*
function displayOrders(orders) {
    const container = document.getElementById('orders-list');
    let html = '';

    for (let i = 0; i < orders.length; i++){
        const order = orders[i];

        let itemsSummary = '';
        for (let j = 0; j < order.items.length; j++) {
            if (j > 0) itemsSummary += ', ';
            itemsSummary += `${order.items[j].quantity}x ${order.items[j].name}`;
        }

        const customerName = order.first_name + ' ' + order.last_name;
        


        html += `
            <div class="order-card" data-id="${order.id}">
                <div>
                    <strong>Order #${order.id}</strong> - ${customerName}
                    <br>Status: ${order.status}
                    <br>Items: ${itemsSummary}
                    <br>Total: ${order.total} SEK
                </div>
                <div>
                    <!-- 2. GET /api/orders/:id -- show details-->
                    <button onclick="viewOrder(${order.id})">View</button>
                    <!-- 3. PUT/api/orders/:id/status -- update status-->
                    <select onchange="updateStatus(${order.id}, this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                        <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}
    */

async function loadAllOrders() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('http://localhost:5000/api/orders', {
            headers: {'Authorization': 'Bearer ' + token}
        });

        const orders = await response.json();
        displayOrders(orders);

    } catch (error) {
        console.log('Error: ', error);
    }
}

function displayOrders(orders) {
    const activeOrders = orders.filter(order => order.status !== 'completed' && order.status !== 'cancelled');
    
    
    const container = document.getElementById('orders-list');
    let html = '';

    for (let i = 0; i < activeOrders.length; i++){
        const order = activeOrders[i];

        // ANVÄND RÄTT FÄLTNAMN FRÅN BACKEND
        const orderId = order.order_id;                 // från backend: order_id
        const orderTotal = order.total_amount;          // från backend: total_amount
        const customerName = order.first_name + ' ' + order.last_name;
        const itemsSummary = `${order.item_count} items`;  // från backend: item_count

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
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
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
        container.innerHTML = '<p class="no-orders">No active orders</p>'
    }else {
        container.innerHTML = html;
    }
}

async function viewOrder(orderId) { 
    const token = localStorage.getItem('token');

    const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        headers: { 'Authorization': 'Bearer ' + token}
    });

    const order = await response.json();

    alert(`Order #${order.order.id}
Customer: ${order.order.first_name} ${order.order.last_name} 
Status: ${order.order.status} 
Items: 
${(formatItems(order.items))}
Total: ${order.order.total} SEK
Can cancel: ${order.can_cancel}`);
}

function formatItems(items){
    let result = '';
    for (let i = 0; i < items.length; i++){
        const item = items[i];
        result += `${item.quantity}x ${item.name} - ${item.price_at_time}SEK\n`;
    }
    return result;
}

async function updateStatus(orderId, newStatus) {
    const token = localStorage.getItem('token');

    const response = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
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