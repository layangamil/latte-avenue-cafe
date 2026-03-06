document.addEventListener('DOMContentLoaded', function(){
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');  //getting data from localStorage with key 'cart', if not, use empty array
    displayCart(cart);  //call fucntion that shows the 'cart' element we just got

    const checkoutBtn = document.getElementById('checkout-btn');
    if(checkoutBtn) { //if button with id exists
        checkoutBtn.addEventListener('click', async function(){
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            if (cart.length === 0) {
                alert('Your cart is empty!');  //if cart is empty, show error msg and return
                return;
            }

            //we know now cart is not empty, now get customer token (if logged in)
            const token = localStorage.getItem('token');

            //want to check if stock is enough, avoids refunds
            try { //sending fetch request to backend to check stock
                const stockResponse = await fetch('/api/check-stock', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({items: cart})
                });

                const stockResult = await stockResponse.json();
                // if stock is empty AND more than 0 items are sold out:
                if (stockResult.outOfStock && stockResult.outOfStock.length > 0) {
                    //, create a list of the items that are sold out + infrom customer
                    const items = stockResult.outOfStock.map(i => i.name).join(', ');
                    alert(`Sorry, these items are sold out: ${items}`);

                    //now create and save a new cart with only items in stock and display that cart instead
                    const newCart = [];
                    for (const item of cart){
                        let inStock = true;
                        for (const product of stockResult.outOfStock) {
                            if (out.id == item.id){
                                inStock = false;
                                break;
                            }
                        }
                        if (inStock){
                            newCart.push(item);
                        }
                    }
                    // REMOVE //const newCart = cart.filter(item => !stockResult.outOfStock.some(out => out.id == item.id));
                    localStorage.setItem('cart', JSON.stringify(newCart));
                    displayCart(newCart);
                    return;
                }
            } catch (error) {
                console.log('Stock check error:', error);
            }

            //now if so far all is good, check if customer logged in, in order to continue to checkout page
            if (token){  
                window.location.href = 'payment.html';
            }else {   //else, in browser memory save 'after logging in, go to payment.html'
                localStorage.setItem('redirectAfterLogin', 'payment.html');
                window.location.href = 'login.html'; //BUT FIRST redirect to login page
            }
        });
    } else {
        console.log('Checkout button not found');
    }
});

//function: displays cart items
function displayCart(cart) {
    console.log('displayCart function is running! With: ', cart);
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total');

    //if no container found, return
    if (!container) {
        console.error('Cart container not found! Make sure cart.html has id="cart-items-container"');
        return;
    }

    //if cart is empty
    if (cart.length === 0){
        container.innerHTML = 
        '<div class="empty-cart"><p>No items in your cart!</p><a href="index.html#menu" class="btn">Browse Menu</a></div>';
        totalEl.textContent = '0.00';
        return;
    }
    
    let html = ''; //if cart is not -> write the html for each cat item
    let total = 0; //total price
    let totalItems = 0;  //total items for header counter

    //loop through all the cart items to get item, subtotal and so on 
    for (let i = 0; i < cart.length; i++){  
        const item = cart[i];
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        totalItems += item.quantity;

        // the `` allows us to write HTML with variables inside ${} - each cart item gets html below
        html +=`  
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-info">
                    <h3>${item.name}</h3>
                    <p>${item.price} x ${item.quantity}</p>
                </div>

                <div class="cart-item-controls">
                    <div class="quantity-control">
                        <button onclick="decreaseQty(${item.id})" class="qty-btn"><i class="fa-solid fa-minus"></i></button>
                        <span class="quantity">${item.quantity}</span>
                        <button onclick="increaseQty(${item.id})" class="qty-btn"><i class="fa-solid fa-plus"></i></button>
                    </div>

                    <div class="item-subtotal">
                        <span>${itemTotal.toFixed(2)} SEK</span>
                        <button onclick="removeFromCart(${item.id})" class="remove-btn"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;  // HTML code inside cart-items-container now has the new HTML code
    if(totalEl) totalEl.textContent = `${total.toFixed(2)}`;  //updating what total price shows on cart page

    const counter = document.getElementById('cart-count');
    if (counter){
        counter.textContent = totalItems;  //display cart nr in header
    }
}

function decreaseQty(id){
    console.log('decreaseQty function is running! With: ', id);
    let cart = JSON.parse(localStorage.getItem('cart') || '[]'); //load cart from localStorage, if not exist, create empty array

    for (let i = 0; i < cart.length; i++){ //loop through cart to find item.id that matches one you want to decrease
        if (cart[i].id == id){
            if (cart[i].quantity > 1){ //check decrease only if qty > 1, to avoid negative nrs
                cart[i].quantity -= 1; 
            } else{
                removeFromCart(id); //if qty !> 1, then call function to remove item from cart
            }
            break;
        }
    }

    localStorage.setItem('cart', JSON.stringify(cart)); // save updated cart to localStorage
    displayCart(cart); // display the updated cart

    if(typeof window.updateCartCount === 'function'){
        window.updateCartCount(); // update cart counter
    }
}

function increaseQty(id){
    console.log('increaseQty function is running! With: ', id);
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');   //same as above

    for (let i = 0; i < cart.length; i++){
        if (cart[i].id == id){
            cart[i].quantity += 1; //unlimited adding, due to stock check AFTER
            break;
        }
    }

    localStorage.setItem('cart', JSON.stringify(cart));  //save updated cart
    displayCart(cart);  //display updated cart

    if(typeof window.updateCartCount === 'function'){
        window.updateCartCount();  //update cart counter
    }
}

function removeFromCart(id) {  //takes item id for that specific item
    console.log('removeFromeCart function is running! With: ', id);
    let cart = JSON.parse(localStorage.getItem('cart')|| '[]'); //get current cart from storage
    
    const updatedCart = [];
    for (const item of cart){
        if(item.id != id){
            updatedCart.push(item);
        }
    }
    cart = updatedCart;
    // REMOVE // cart = cart.filter(item => item.id != id); // create new array with items whose id != one we're looking for
    localStorage.setItem('cart', JSON.stringify(cart)); //save the new array to localStorage and convert o JSON format
    displayCart(cart); //display the new cart without removed items

    if (typeof window.updateCartCount === 'function') {
        window.updateCartCount();
    }
}
window.decreaseQty = decreaseQty;
window.increaseQty = increaseQty;
window.removeFromCart = removeFromCart; //makes function globally available. Since it's called from onclick in HTML (dynamic). W/o function only in file