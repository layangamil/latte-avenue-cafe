//Create empty cart list  
let cart = [];  

// 1. save cart in localstorage and convert into Json string
const saved = localStorage.getItem('cart');
if (saved) {
    cart = JSON.parse(saved);
}


//3. Function to add item to cart
function addToCart(itemId, itemName, itemPrice) {
    // Check if item already in cart
    let foundItem = null;
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].id == itemId) {
            foundItem = cart[i];
            break;   //stop looking
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
            price: parseFloat(itemPrice),  // convert ot number for calculations
            quantity: 1
        });
    }
    // Calls first function to update display cart counter
    updateCartCount();

    localStorage.setItem('cart', JSON.stringify(cart));
}
//4. waits till HTML loads then tuns remaining code to avoid errors.
document.addEventListener('DOMContentLoaded', function() {
    //set intial cart count
    updateCartCount();

    //add click event to all "Add to Cart" buttons
    let addButtons = document.querySelectorAll('.btn-add'); //list of refrences for all menu-item buttons with diff data-ID
    for (let i = 0; i < addButtons.length; i++) {
        addButtons[i].addEventListener('click', function(event){ // 'event object' created when button is clicked, has click info like target, clientX, ..
            //get item info from button's data attributes
            let itemId = this.getAttribute('data-id');
            let itemName = this.getAttribute('data-name');
            let itemPrice = this.getAttribute('data-price');

            //Add to cart
            addToCart(itemId, itemName, itemPrice);  //this = the add button
        });
    }
});

window.updateCartCount = function () {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]'); 
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0); //sum (ackumulator) item(current element in array) 0 (start value)
    const cartCounter = document.getElementById('cart-count'); //element that shows nr in header
    if (cartCounter) {
        cartCounter.textContent = totalItems;  //show total Items nr in cart icon
    }
};
