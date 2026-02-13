document.addEventListener('DOMContentLoaded', function(){
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    displayCart(cart);

    const checkoutBtn = document.getElementById('checkout-btn');
    if(checkoutBtn) {
        checkoutBtn.addEventListener('click', function(){
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            if (cart.length === 0) {
                alert('Your cart is empty!');
                return;
            }

            if (localStorage.getItem('token')){
                window.location.href = 'payment.html';
            }else {
                localStorage.setItem('redirectAfterLogin', 'payment.html');
                window.location.href = 'login.html';
            }
        });
    }
});

function displayCart(cart) {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total');

    if (cart.length === 0){
        container.innerHTML = 
        '<div class="empty-cart"><p>Your cart is empty!</p><a href="index.html#menu" class="btn">Browse Menu</a></div>';
        totalEl.textContent = '0.00';
        return;
    }

    let html = '';
    let total = 0;
    let totalItems = 0;

    for (let i = 0; i < cart.length; i++){
        const item = cart[i];
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        totalItems += item.quantity;

        html +=`
            <div class="cart-item">
                <div>
                    <h3>${item.name}</h3>
                    <p>${item.price} x ${item.quantity}</p>
                </div>
                <div class="item-subtotal">
                    <p>${itemTotal.toFixed(2)}  SEK</p>
                    <button onclick="removeFromCart(${item.id})" class="remove-btn"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
    totalEl.textContent = `${total.toFixed(2)}`;

    const counter = document.getElementById('cart-count');
    if (counter){
        counter.textContent = totalItems;
    }
}

function removeFromCart(id) {
    let cart = JSON.parse(localStorage.getItem('cart')|| '[]');
    cart = cart.filter(item => item.id != id);
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCart(cart);
}
window.removeFromCart = removeFromCart;
