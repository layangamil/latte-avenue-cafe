document.addEventListener('DOMContentLoaded', function(){ //w/o we might not find place order button
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cart.length === 0) {
        alert('Your cart is empty!');
        window.location.href = 'cart.html';
        return;
    }

    showOrder(cart);

    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => { //looking for button with type 'radio' and name 'paymentMethod'. for each button run the following:
        radio.addEventListener('change', function() {
            const cardForm = document.getElementById('card-details-container');
            if (cardForm) {
                cardForm.style.display = this.value === 'visa' ? 'block' : 'none'; //if the method is visa, then show block (visa form) otherwise let display hide form
            }
        });
    });

    document.getElementById('place-order-btn').addEventListener('click', function(){
        placeOrder(cart);
    });
});

function showOrder(cart){  //takes cart array as argument
    let subtotal = 0;  
    let itemsHtml = '';  //HTML for all items

    for (let item of cart){  //like ' for item in' loop
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        itemsHtml += `
            <div class = "payment-order-item">
                <div class="payment-item-info">
                    <span class="payment-item-name">${item.name}</span>
                    <span class="payment-item-qty">${item.quantity}x</span>
                </div>
                <span class=payment-item-price">${itemTotal.toFixed(2)} SEK</span>
            </div>
        `;
    }

    document.getElementById('payment-order-items').innerHTML = itemsHtml;
    document.getElementById('payment-subtotal').textContent = subtotal.toFixed(2) + ' SEK';
    document.getElementById('payment-tax').textContent = (subtotal * 0.06).toFixed(2) + ' SEK';
    document.getElementById('payment-total').textContent = subtotal.toFixed(2) + ' SEK'; 

}

async function placeOrder(cart) {
    const method = document.querySelector('input[name="paymentMethod"]:checked').value;  // checks which button that is 'checked' and gets its value '.value' (visa, applepay or klarna)

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

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const orderData = {  //gets all the info that will be sent to backend
        items: cart.map(item => ({  // map() creates an array where every item get reformated to macth backend
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        total: total,
        paymentMethod: method,
    };

    try { //will try to run code inside this try and if smth wrong happens, catch will catch the error
        const btn = document.getElementById('place-order-btn');
        btn.textContent = 'processing' //once button is clicked, change display text to 'Processing' instead of 'place order'
        btn.disabled = true; // make button unclickable so customer doesnt press multiple times
        
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/orders', {
            method: 'POST',
            headers: { //tells backend: we're sending JSON-string and customer is logged in ('token')
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json(); //changes

        if (response.ok) { //if success
            localStorage.removeItem('cart');//cart element no longer in localStorage since order placed
            if (typeof updateCartCount == 'function') updateCartCount(); //looks for function updateCartCount() to change to 0

            // ADD THIS LINE:
            console.log('Order data from backend:', data);
            window.location.href = `order-confirmation.html?id=${data.orderId}`; // finally takes to order-confirmation page
        } else{
            alert ('Order failed: ' + (data.message || 'Unknown error'));
            btn.textContent = 'Place Order';
            btn.disabled = false;
        }
    } catch (error) {
        console.log('Error:', error);
        alert('Cannot connect to server');

        const btn = document.getElementById('place-order-btn');
        btn.textContent = 'Place Order';
        btn.disabled = false;
    }
}