document.addEventListener('DOMContentLoaded', function(){
    loadPublicMenu();
});

async function loadPublicMenu(){
    try {
        const response = await fetch('/api/items');
        const items = await response.json();
        
        console.log('All items:', items); // ADD THIS

        const drinks = items.filter(item => {
            console.log(`Item "${item.name}" category: "${item.category}"`); // ADD THIS
            return item.category?.toLowerCase().includes('drink');
        });
        
        const desserts = items.filter(item => {
            console.log(`Item "${item.name}" category: "${item.category}"`); // ADD THIS
            return item.category?.toLowerCase().includes('dessert');
        });
        
        console.log('Drinks found:', drinks.length); // ADD THIS
        console.log('Desserts found:', desserts.length); // ADD THIS

        displayMenuItems('drinks-menu', drinks);
        displayMenuItems('desserts-menu', desserts);

    } catch(error){
        console.log('Error:', error);
    }
}

function displayMenuItems(containerId, items){
    const container = document.getElementById(containerId);
    if (!container) return;

    if(items.length === 0){
        container.innerHTML = '<p>No items available</p>';
        return;
    }

    let html = '';
    for (let i = 0; i < items.length; i++){
        const item = items[i];
        const isSoldOut = (item.stock || 99) <= 0;
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
                            `<button class="btn-add"
                                    data-id="${item.product_id}"
                                    data-name="${item.name}"
                                    data-price="${item.price}"
                                    data-stock="${item.stock || 99}">
                                <i class="fas fa-plus"></i>Add
                            </button>`
                        }
                    </div>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

window.addEventListener('storage', function(e){
    if (e.key === 'menuUpdated'){
        loadPublicMenu();
    }
});