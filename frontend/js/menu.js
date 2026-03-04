//Create empty cart list - will include all items customer adds 
let cart = [];  

// 1. get cart from localstorage (browsers memory that remains even after page refresh)
const saved = localStorage.getItem('cart');
if (saved) {
    cart = JSON.parse(saved);  //if there is cart saved, then convert JSON-string back to array
}

//adds item to cart - requires 4 parameters
function addToCart(itemId, itemName, itemPrice, itemStock) {
    //1st controll: check if item is sold out, if yes, show alert to customer
    if (itemStock <= 0){
        alert('This item is sold out!')
        return;
    }
    
    //2nd controll: loop through cart to check if item being added is ALREADY in cart
    let foundItem = null;
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].id == itemId) {
            foundItem = cart[i];
            break;   //stop looking
        }
    }

    // If item exists: increase quantity
    if (foundItem) {
        foundItem.quantity += 1;
    } else {
        // Else item not in cart: add it togther with its' attributes
        cart.push({   //custom properties
            id: itemId,
            name: itemName,
            price: parseFloat(itemPrice),  // convert ot number for calculations
            quantity: 1
        });
    }
    // Now save the new and updated cart to browsers memory THEN call function to update cart count
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

//Function: makes the 'add' to cart btns to function like we said above
function setAddToCartButtons() {
    //find all btns that have class 'btn-add'
    let addButtons = document.querySelectorAll('.btn-add');
    console.log('Found', addButtons.length, 'add buttons to set up');

    //loop through all the btns to add eventListener for each
    for (let i = 0; i < addButtons.length; i++){
        //creating a clone of the btn to 
        let newButton = addButtons[i].cloneNode(true);
        addButtons[i].parentNode.replaceChild(newButton, addButtons[i]);

        newButton.addEventListener('click', function(event){
            let itemId = this.getAttribute('data-id');
            let itemName = this.getAttribute('data-name');
            let itemPrice = this.getAttribute('data-price');
            let itemStock = parseInt(this.getAttribute('data-stock')) || 30;

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

