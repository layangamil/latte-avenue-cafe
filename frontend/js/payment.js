document.addEventListener('DOMContentLoaded', function(){
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cart.length === 0) {
        alert('Your cart is empty!');
        window.location.href = 'cart.html';
        return;
    }

    showOrder(cart);

    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const cardForm = document.getElementById('card-details-container');
            if (cardForm) {
                cardForm.style.display = this.value === 'visa' ? 'block' : 'none';
            }
        });
    });

    document.getElementById('place-order-btn').addEventListener('click', function(){
        placeOrder(cart);
    });
});

function showOrder(cart){
    let subtotal = 0;
    let itemsHtml = '';

    for (let item of cart){
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        itemsHtml += `
            <div class = "payment-order-item">
                <div class="payment-item-info">
                    <span class="payment-item-name">${item.name}</span>
                    <span class="payment-item-qty">${item.quantity}</span>
                </div>
                <span class=payment-item-price">${itemTotal.toFixed(2)} SEK</span>
            </div>
        `;
    }

    document.getElementById('payment-order-items').innerHTML = itemsHtml;
    document.getElementById('payment-subtotal').textContent = subtotal.toFixed(2) + 'SEK';
    document.getElementById('payment-tax').textContent = (subtotal * 0.06).toFixed(2) + 'SEK';
    document.getElementById('payment-total').textContent = subtotal.toFixed(2) + 'SEK'; 

}

async function placeOrder(cart) {
    const method = document.querySelector('input[name="paymentMethod"]:checked').value;

    if (method === 'visa') {
        const cardNumber = document.getElementById('card-number')?.value;
        const cardExpiry = document.getElementById('card-expiry')?.value;
        const cardCvc = document.getElementById('card-cvc')?.value;
        const cardName = document.getElementById('card-name')?.value;

        if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
            alert('Missing card details');
            return;
        }
    }

    const total = cart.reduce((sum, item) => sum (item.price * item.quantity), 0);

    const orderData = {
        items: cart.map(item => ({
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        total: total,
        paymentMethod: method,
        status: 'confirmed'
    };

    try {
        const btn = document.getElementById('place-order-btn');
        btn.textContent = 'processing'
        btn.disabled = true;
        
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/orders', {

            method: 'POST',
            header: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer' + token
            },
            body: JSON.stringify(orderData)
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.removeItem('cart');
            if (typeof updateCartCount == 'fucnction') updateCartCount();
            window.location.href = 'order_confirmation.html';
        } else{
            alert ('Order failed: ' + (data.message || 'Unknown error'));
            btn.textContent = 'Place Order';
            btn.disabled = false;
        }
    } catch (error) {
        console.log('Error:', error);
        alert('Cannot connect to server');

        const btn = document.getElementById('Place-order-btn');
        btn.textContent = 'Place Order';
        btn.disabled = false;
    }
}