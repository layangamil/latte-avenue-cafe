document.addEventListener('DOMContentLoaded', function(){
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (!token || role != 'staff'){
        console.log('Role: ', role);
        window.location.href = 'login.html';
        return;
    }
    loadMenuItems();
});

let newRows = {
    drinks: [],
    desserts: []
};

// Get all the items
async function loadMenuItems(){
    console.log('LoadMenuItems function is running!');
    const token = localStorage.getItem('token');
    
    try{
        const response = await fetch('/api/items', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
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

        // REMOVE //const drinks = items.filter(item => item.category?.toLowerCase().includes('drink'));
        // REMOVE //const desserts = items.filter(item => item.category?.toLowerCase().includes('dessert'));

        displayItems('drinks-list', drinks, 'drinks');
        displayItems('desserts-list', desserts, 'desserts');
    
    } catch(error) {
        console.log('Error:', error);
    }
}

function displayItems(containerId, items, category) {
    console.log('displayItems function is running! With: ', containerId, items, category);
    const container = document.getElementById(containerId);  //'drinks-list' or 'desserts-list'

    if (items.length === 0 && (!newRows[category] || newRows[category].length === 0)){
        container.innerHTML = '<p>No items found.</p>';
        return;
    }

    let html = '';
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        html += `
            <div class="menu-item-row" data-id="${item.product_id}" data-category="${category}">
                <div class="fields-row">
                    <input type="text" class="field-name" value="${item.name}" placeholder=" Name">

                    <input type="number" class="field-price" value="${item.price}" step="0.1" placeholder=" Price">

                    <textarea class="field-description" placeholder=" Description" rows="1">${item.ingredients || ''}</textarea>

                    <input type="text" class="field-image" value="${item.image_url || ''}" placeholder=" Image URL">

                    <input type="number" class="field-stock" value="${item.stock || 30}" min="0" placeholder="stock">
                </div>
                
                <div class="item-actions">
                    <button class="btn-tertiary update-btn"  onclick="updateItem(${item.product_id}, this)">Update</button>
                    <button class="btn-tertiary" onclick="deleteItem(${item.product_id})">Delete</button>
                </div>
            </div>
        `;
    } 
    //safety check to make sure newRows[category] exists before looping
    if(newRows[category] && newRows[category].length > 0) {
        for (let i = 0; i < newRows[category].length; i++){
            html += getNewItemRow(category, i);
        }
    }
    container.innerHTML = html;
}

function getNewItemRow(category, index){
    console.log('getNewItemRow function is running! With: ', category, index);
    return `
        <div class="menu-item-row new-item-row" data-new-index="${index}" data-category="${category}">
            <div class="fields-row">
                <input type="text" class="field-name" id="new-${category}-${index}-name" placeholder="Name">

                <input type="number" class="field-price" id="new-${category}-${index}-price" step="0.1" placeholder="Price">

                <textarea class="field-description" id="new-${category}-${index}-description" placeholder="Description" rows="1"></textarea>

                <input type="text" class="field-image" id="new-${category}-${index}-image" placeholder="Image URL">

                <input type="number" class="field-stock" id="new-${category}-${index}-stock"value="30" min="0" placeholder="stock">
            </div>

            <div class="item-actions">
                <button class="btn-tertiary update-btn" onclick="saveNewItem('${category}', ${index})">Save</button>
                <button class="btn-tertiary" onclick="cancelNewItem('${category}', ${index})">Cancel</button>
            </div>
        </div>
    `;
}

function addNewRow(category){
    console.log('addNewRow function is running! With: ', category);
    //Lägg till ny tom rad till arrayen
    newRows[category].push({});
    //refrehs displayen
    loadMenuItems();
}

async function saveNewItem(category, index){
    console.log('saveNewItem function is running! With: ', category, index);
    const token = localStorage.getItem('token');
    //get value från input fält
    const name = document.getElementById(`new-${category}-${index}-name`).value;
    const price = parseFloat(document.getElementById(`new-${category}-${index}-price`).value);
    const description = document.getElementById(`new-${category}-${index}-description`).value;
    const imageUrl = document.getElementById(`new-${category}-${index}-image`).value;
    const stock = parseInt(document.getElementById(`new-${category}-${index}-stock`).value) || 0; 

    console.log('Image URL: ', imageUrl);

    if (!name || !price){
        alert('Name and price are required!');
        return;
    }

    const itemData = {
        name: name,
        price: price,
        category: category === 'drinks' ? 'drink' : 'dessert',
        ingredients: description,
        image_url: imageUrl,
        stock: stock,
        is_available: true
    };
    
    console.log('Item data being sent:', itemData);

    try {
        const response = await fetch('/api/items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(itemData)
        });

        if (response.ok) {
            alert('Item added successfully! Please refresh the homepage to see changes.');
            //ta bort nya raden från array
            newRows[category].splice(index, 1);
            //reloada alla items (kmr också uppdatera index.html)
            await loadMenuItems();
            // uppdatera också public meny på index.html
            updatePublicMenu();
        } else {
            const data = await response.json();
            alert('Error: ' + data.error);
        }
    } catch(error){
        console.log('Error:', error);
        alert('Cannot connect to server');
    }
}

function cancelNewItem(category, index){
    console.log('cancelNewItem function is running! With: ', category, index);
    //ta bort raden från araryen
    newRows[category].splice(index, 1);
    //refrehsa displayen
    loadMenuItems();
}

async function deleteItem(id) {
    console.log('deleteItem function is running! With: ', id);
    if (!confirm('Delete this item?')) return;

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`/api/items/${id}`, {
            method: 'DELETE',
            headers: {'Authorization': 'Bearer ' + token}
        });

        if (response.ok) {
            alert('Item deleted!');
            await loadMenuItems();
            updatePublicMenu();

        } else {
            const data = await response.json();
            alert('Error: ' + data.error);
        }
    } catch(error){
        console.log('Error:', error);
        alert('Cannot connect to server');
    }
}

async function updateItem(id, buttonElement, silent=false){
    console.log('updateItem function is running! With: ', id, buttonElement);
    const token = localStorage.getItem('token');
    const row = buttonElement.closest('.menu-item-row');

    const name = row.querySelector('.field-name').value;
    const price = parseFloat(row.querySelector('.field-price').value);
    const description = row.querySelector('.field-description').value;
    const imageUrl = row.querySelector('.field-image').value;
    const stock = parseInt(row.querySelector('.field-stock').value) || 30;
    const category = row.dataset.category;

    console.log('Image URL: ', imageUrl);

    if (!name || !price) {
        alert('Name and price are required!');
        return;
    }

    const itemData = {
        name: name,
        price: price,
        category: category,
        ingredients: description,
        image_url: imageUrl,
        stock: stock,
        is_available: true
    };

    try {
        const response = await fetch(`/api/items/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(itemData)
        });

        if (response.ok) {
            alert('Item updated! Please refresh the homepage to see changes.');
            //reloada items för att visa updaterad data
            await loadMenuItems();
            //updatera public meny
            updatePublicMenu();
        } else {
            const data = await response.json();
            alert('Error: ' + data.error);
        }
    } catch(error){
        console.log('Error:', error);
        alert('Cannot connect to server');
    }
}


function updatePublicMenu() {
    console.log('updatePublicMenu function is running!');
    localStorage.setItem('menuUpdated', Date.now());
}

window.addNewRow = addNewRow;
window.updateItem = updateItem;
window.deleteItem = deleteItem;
window.saveNewItem = saveNewItem;
window.cancelNewItem = cancelNewItem;
// window.saveAllChanges = saveAllChanges;
// window.cancelAllChanges = cancelAllChanges;