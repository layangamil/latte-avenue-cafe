//Wait till html file loads (elements etc) before JS runs - avoids matching issues
document.addEventListener('DOMContentLoaded', function(){ //w/o we might not find place order button
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cart.length === 0) {  // check if cart is empty
        alert('Your cart is empty!'); //alert msg
        window.location.href = 'cart.html'; //take back to cart page - cannot proceed
        return;
    }
    // if cart NOT empty, show cart
    showOrder(cart);

    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => { //looking for button with type 'radio' and name 'paymentMethod'. create a list w/ all elements that macth. For each button run the following:
        radio.addEventListener('change', function() { //for every radio btn listen to a 'change' ie, changes payment option
            const cardForm = document.getElementById('card-details-container'); //find card form
            if (cardForm) { 
                cardForm.style.display = this.value === 'visa' ? 'block' : 'none'; //if the method is visa, then show block (visa form) otherwise let display hide form
            }
        });
    });

    document.getElementById('place-order-btn').addEventListener('click', function(){ //combined two in one (getting item & eventListener)
        placeOrder(cart);
    });
});

function showOrder(cart){  //takes cart array as argument
    console.log('showOrder function is running! With: ', cart);
    let subtotal = 0;  
    let itemsHtml = '';  //HTML for all items

    for (let item of cart){  //loop through cart items, use each items atributes to get total and so on
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        //write html for layout of each cart item in order summary (will be styled in css)
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
    //update the dom with the html code with wrote above
    document.getElementById('payment-order-items').innerHTML = itemsHtml;
    //update the displayed subtotal, tx and total price
    document.getElementById('payment-subtotal').textContent = subtotal.toFixed(2) + ' SEK';
    document.getElementById('payment-tax').textContent = (subtotal * 0.06).toFixed(2) + ' SEK';
    document.getElementById('payment-total').textContent = subtotal.toFixed(2) + ' SEK'; 

}

async function placeOrder(cart) {
    console.log('placeOrder function is running! With: ', cart);
    const method = document.querySelector('input[name="paymentMethod"]:checked').value;  // checks which button that is 'checked' and gets its value '.value' (visa, applepay or klarna)
    const token = localStorage.getItem('token'); //checks if logged in
    console.log('User-ID: ', token?.id);

    //check stock by sending fetch request to backend with items in cart
    try {
        const stockResponse = await fetch('/api/cart/check-stock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                items: cart.map(item => ({
                    menuItemId: item.id,
                    quantity: item.quantity
                }))
            })
        });

        //wait for response from backend then convert to JS object
        const stockResult = await stockResponse.json();

        //if some of the items are not in stock, do the following
        if (stockResult.outOfStock && stockResult.outOfStock.length > 0) {
            const names = [];
            for (const item of stockResult.outOfStock){
                names.push(item.name);
            }
            const items = names.join(', ');
            // REMOVE //const items = stockResult.outOfStock.map(i => i.name).join(', '); //create a string of the item names that are not in stock
            alert(`Unfortunately, these items are now sold-out: ${items}`); //show them here in alert msg to user

            //create new cart without out of stock items, save that and take user back to cart page
            const newCart = [];
            for (const itemCart of cart){
                let inStock = true;

                for (const soldProduct of stockResult.outOfStock) {
                    if (soldProduct.id == itemCart.id){
                        inStock = false;
                        break;
                    }
                }
                if (inStock){
                    newCart.push(itemCart);
                }
            }
            // REMOVE //const newCart = cart.filter(item => !stockResult.outOfStock.some(out => out.id == item.id));
            localStorage.setItem('cart', JSON.stringify(newCart));
            window.location.href = 'cart.html';
            return; // does not order
        }
    } catch (error) {
        console.log('Stock check error:', error);
    }

    if (method === 'visa') { //if chosen method is visa, get all the values put in input fields
        const cardNumber = document.getElementById('card-number')?.value;
        const cardExpiry = document.getElementById('card-expiry')?.value;
        const cardCvc = document.getElementById('card-cvc')?.value;
        const cardName = document.getElementById('card-name')?.value;

        if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
            alert('Missing card details'); //all info required!
            return;
        }
    }

    //get totl of all cart items
    let total = 0;
    for (const item of cart){
        total += item.price * item.quantity;
    }
    // REMOVE //const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    console.log('Total price: ', total);
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
    console.log('Order data: ', orderData);

    try { //will try to run code inside this try and if smth wrong happens, catch will catch the error
        const btn = document.getElementById('place-order-btn');
        btn.textContent = 'processing' //once button is clicked, change display text to 'Processing' instead of 'place order'
        btn.disabled = true; // make button unclickable so customer doesnt press multiple times
        
        const token = localStorage.getItem('token');
        console.log('User-ID: ', token?.id);

        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { //tells backend: we're sending JSON-string and customer is logged in ('token')
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json();
        console.log('Response: ', data);

        if (response.ok) { //if success
            localStorage.removeItem('cart');//cart element no longer in localStorage since order is placed
            if (typeof updateCartCount == 'function') updateCartCount(); //looks for function updateCartCount() to change to 0

            window.location.href = `order-confirmation.html?id=${data.orderId}`; // finally takes to order-confirmation page + sends orderID
        } else{
            alert ('Order failed: ' + (data.message || 'Unknown error'));
            btn.textContent = 'Place Order'; //btn goes back to original, is clickable
            btn.disabled = false;
            window.location.href = 'cart.html'; //goes back to cart
        }
    } catch (error) {  //network error
        console.log('Error:', error);
        alert('Cannot connect to server'); 

        const btn = document.getElementById('place-order-btn');
        btn.textContent = 'Place Order'; //btn goes back to original, is clickable
        btn.disabled = false;
    }
}