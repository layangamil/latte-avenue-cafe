//Create empty cart array
let cart = [];
//2. Function to update the cart number in header
function updateCartCount() {
    // Get the single cart counter by ID
    let cartCounter = document.getElementById('cart-count'); //ref to the DOM element (walkie talkie, communication)
    
    if (!cartCounter) { //"If cartCounter is NOT found (is null/undefined)..."
        console.log("Cart count not found!");  //Safety check
        return;   //Stop the function here, don't continue
    }
    
    // Calculate total items
    let totalItems = 0;
    for (let i = 0; i < cart.length; i++) {   // Keep going while i is less than number of items in cart
        if (cart[i] && cart[i].quantity) {    //If this item exists AND has a quantity...
            totalItems += cart[i].quantity;   // Add the quantity to total
        }
    }
    
    cartCounter.textContent = totalItems;   //Updates displayed number 
    
    // Animate
    if (totalItems > 0) {
        cartCounter.classList.add('bump');
        setTimeout(function() {
            cartCounter.classList.remove('bump');
        }, 300);
    }
}

//3. Function to add item to cart
function addToCart(itemId, itemName, itemPrice, button) {
    console.log("Button received:", button);
    // Check if item already in cart
    let foundItem = null;
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].id == itemId) {
            foundItem = cart[i];
            break;
        }
    }

    // If item exists, increase quantity
    if (foundItem) {
        foundItem.quantity += 1;
    } else {
        // Else item not in cart, add it
        cart.push({   //custom properties
            id: itemId,
            name: itemName,
            price: parseFloat(itemPrice),
            quantity: 1
        });
    }
    // Calls first function to update display cart counter
    updateCartCount();
}

//4. waits till HTML loads then tuns remaining code to avoid errors.
document.addEventListener('DOMContentLoaded', function() {
    //set intial cart count
    updateCartCount();

    //add click event to all "Add to Cart" buttons
    let addButtons = document.querySelectorAll('.btn-add'); //list of refrences for all menu-item buttons with diff ID
    for (let i = 0; i < addButtons.length; i++) {
        addButtons[i].addEventListener('click', function(event){ // 'event object' created when button is clicked, has click info like target, clientX, ..
            //get item info from button's data attributes
            let itemId = this.getAttribute('data-id');
            let itemName = this.getAttribute('data-name');
            let itemPrice = this.getAttribute('data-price');

            //Add to cart
            addToCart(itemId, itemName, itemPrice, this);  //this = the add button
        });
    }
});

