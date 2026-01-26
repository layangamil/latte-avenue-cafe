//Add to cart

//1. Get cart from browser memory, or start with empty array
let cart = JSON.parse(localStorage.getItem('cart')) || [];

//2. Function to update the cart number in header
function updateCartCount() {
    // Calculate total items in cart
    let totalItems = 0;
    for (let i = 0; i < cart.length; i++) {
        totalItems += cart[i].quantity;
    }
    
    // Find all cart counters on page
    let cartCounters = document.querySelectorAll('.cart-count');
    
    for (let i = 0; i < cartCounters.length; i++) {
        let counter = cartCounters[i];
        let oldCount = parseInt(counter.textContent) || 0;
        
        // Update the number
        counter.textContent = totalItems;
        
        // Only animate if count increased (not on first load)
        if (totalItems > oldCount && oldCount > 0) {
            // Add animation class
            counter.classList.add('bump');
            
            // Remove animation class after animation completes
            setTimeout(function() {
                counter.classList.remove('bump');
            }, 300); // Match CSS animation duration
        }
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
        cart.push({
            id: itemId,
            name: itemName,
            price: parseFloat(itemPrice),
            quantity: 1
        });
    }

    // Save cart to browser memory
    localStorage.setItem('cart', JSON.stringify(cart));

    // Update cart counter
    updateCartCount();

    // Simple button feedback - USE THE BUTTON PARAMETER
    let originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Added';
    button.style.backgroundColor = '#b97982'; // pink color

    // Reset button after 1 second
    setTimeout(function() {
        button.innerHTML = originalText;
        button.style.backgroundColor = '';
    }, 1000);
}


//4. when page loads, set up everything
document.addEventListener('DOMContentLoaded', function() {
    //set intial cart count
    updateCartCount();

    //add click event to all "Add to Cart" buttons
    let addButtons = document.querySelectorAll('.btn-add');
    for (let i = 0; i < addButtons.length; i++) {
        addButtons[i].addEventListener('click', function(event){
            //get item info from button's data attributes
            let itemId = this.getAttribute('data-id');
            let itemName = this.getAttribute('data-name');
            let itemPrice = this.getAttribute('data-price');

            //Add to cart
            addToCart(itemId, itemName, itemPrice, this);
        });
    }
});

