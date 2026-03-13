document.addEventListener('DOMContentLoaded', function(){
    loadPublicMenu();
});

async function loadPublicMenu(){
    console.log('LoadPublicMenu function is running!');
    try {
        const response = await fetch('/api/items');
        const items = await response.json();

        const drinks = [];
        for (const item of items){
            if (item.category.toLowerCase().includes('drink')){
                drinks.push(item);
            }
        }

        const desserts = [];
        for (const item of items){
            if (item.category.toLowerCase().includes('dessert')){
                desserts.push(item);
            }
        }

        displayMenuItems('drinks-menu', drinks);
        displayMenuItems('desserts-menu', desserts);

    } catch(error){
        console.log('Error:', error);
    }
}

function displayMenuItems(containerId, items){
    console.log('Displaying menu items: ', items);
    const container = document.getElementById(containerId);
    if (!container) return;

    if(items.length === 0){
        container.innerHTML = '<p>No items available</p>';
        return;
    }

    let html = '';
    for (let i = 0; i < items.length; i++){
        const item = items[i];
        const isSoldOut = (item.stock || 0) <= 0;
        html += `
            <div class="menu-item ${isSoldOut ? 'sold-out' : ''}">
                <img src="${item.image_url || 'https://placehold.co/600x400/000000/FFF'}" alt="${item.name}">
                <div class="item-content">
                    <h4>${item.name}</h4>
                    <p>Includes: ${item.ingredients || 'Nothing to specify :)'}</p>

                    <div class="item-footer">
                        <span class="price">${item.price} kr</span>
                        ${isSoldOut ?
                            `<span class="sold-out-label">SOLD OUT</span>`:
                            `<button class="btn btn-primary btn-small btn-add-to-cart"
                                    data-id="${item.product_id}"
                                    data-name="${item.name}"
                                    data-price="${item.price}"
                                    data-stock="${item.stock || 0}">
                                <i class="fas fa-plus"></i>Add
                            </button>`
                        }
                    </div>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;

    if (typeof setAddToCartButtons === 'function'){
        setAddToCartButtons();
    }
}

window.addEventListener('storage', function(e){
    if (e.key === 'menuUpdated'){
        loadPublicMenu();
    }
});