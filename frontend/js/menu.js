//Create empty cart list  
let cart = [];  

// 1. save cart in localstorage and convert into Json string
const saved = localStorage.getItem('cart');
if (saved) {
    cart = JSON.parse(saved);
}

//3. Function to add item to cart
function addToCart(itemId, itemName, itemPrice, itemStock) {
    //check if item is out of stock
    if (itemStock <= 0){
        alert('This item is sold out!')
        return;
    }
    
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
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function setAddToCartButtons() {
    let addButtons = document.querySelectorAll('.btn-add');
    console.log('setting up', addButtons.length, 'add buttons');

    for (let i = 0; i < addButtons.length; i++){
        let newButton = addButtons[i].cloneNode(true);
        addButtons[i].parentNode.replaceChild(newButton, addButtons[i]);

        newButton.addEventListener('click', function(event){
            let itemId = this.getAttribute('data-id');
            let itemName = this.getAttribute('data-name');
            let itemPrice = this.getAttribute('data-price');
            let itemStock = parseInt(this.getAttribute('data-stock')) || 99;

            //Add to cart
            addToCart(itemId, itemName, itemPrice, itemStock);
        });
    } 
}

window.updateCartCount = function () {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]'); 
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0); //sum (ackumulator) item(current element in array) 0 (start value)
    const cartCounter = document.getElementById('cart-count'); //element that shows nr in header
    if (cartCounter) {
        cartCounter.textContent = totalItems;  //show total Items nr in cart icon
    }
};

document.addEventListener('DOMContentLoaded', function() {
    //set intial cart count
    updateCartCount();

    setTimeout(setAddToCartButtons, 100);
});

window.addEventListener('storage', function(e){
    if (e.key === 'menuUpdated') {
        setTimeout(setAddToCartButtons, 200);
    }
});

