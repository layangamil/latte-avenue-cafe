document.addEventListener('DOMContentLoaded', function(){
    // const token = localStorage.getItem('token');
    // const role = localStorage.getItem('userRole');

    // if (!token || role != 'staff'){
    //     window.location.href = 'login.html';
    //     return;
    // }

    loadMenuItems();

    // document.getElementById('menuItemForm').addEventListener('submit', function(e){
    //     e.preventDefault();
    //     saveMenuItem();
    //});
});

let newRows = {
    drinks: [],
    desserts: []
};

// 1. Get all the items
async function loadMenuItems(){
    const token = localStorage.getItem('token');
    
    try{
        const response = await fetch('http://localhost:5000/api/items', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        const items = await response.json();

        const drinks = items.filter(item => item.category?.toLowerCase().includes('drink'));
        const desserts = items.filter(item => item.category?.toLowerCase().includes('dessert'));

        displayItems('drinks-list', drinks, 'drinks');
        displayItems('desserts-list', desserts, 'desserts');
    
    } catch(error) {
        console.log('Error:', error);
    }
}

function displayItems(containerId, items, category) {
    const container = document.getElementById(containerId);  //'drinks-list' or 'desserts-list'

    if (items.length === 0){
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
                </div>
                
                <div class="item-actions">
                    <button class="btn-tertiary update-btn"  onclick="updateItem(${item.product_id})">Update</button>
                    <button class="btn-tertiary" onclick="deleteItem(${item.product_id}, this)">Delete</button>
                </div>
            </div>
        `;
    } 
    
    for (let i = 0; i < newRows[category].length; i++){
        html += getNewItemRow(category, i);
    }
    
    container.innerHTML = html;    
}

// // function openAddForm(category) {
// //     document.getElementById('popupTitle').textContent = 'Add New Item';
// //     document.getElementById('itemId').value = '';
// //     document.getElementById('itemCategory').value = category;
// //     document.getElementById('itemName').value = '';
// //     document.getElementById('itemPrice').value = '';
// //     document.getElementById('itemDescription').value = '';
// //     document.getElementById('popupForm').style.display = 'flex';
// // }



// async function openEditForm(id) {
//     const token = localStorage.getItem('token');

//     try {
//         const response = await fetch(`http://localhost:5000/api/items/${id}`, {
//             headers: {'Authorization': 'Bearer ' + token}
//         });

//         const item = await response.json();

//         document.getElementById('popupTitle').textContent = 'Edit Item';
//         document.getElementById('itemId').value = item.product_id;
//         document.getElementById('itemCategory').value = item.category;
//         document.getElementById('itemName').value = item.name;
//         document.getElementById('itemPrice').value = item.price;
//         document.getElementById('itemDescription').value = item.ingredients || '';
//         document.getElementById('popupForm').style.display = 'flex';

//     } catch(error) {
//         console.log('Error:', error);
//         alert('Could not load item details')
//     }
// }

function getNewItemRow(category, index){
    return `
        <div class="menu-item-row new-item-row" data-new-index="${index}" data-category="${category}">
            <div class="fields-row">
                <input type="text" class="field-name" id="new-${category}-${index}-name" placeholder="Name">

                <input type="number" class="field-price" id="new-${category}-${index}-price" step="0.1" placeholder="Price">

                <textarea class="field-description" id="new-${category}-${index}-description" placeholder="Description" rows="1"></textarea>

                <input type="text" class="field-image" id="new-${category}-${index}-image" placeholder="Image URL">
            </div>

            <div class="item-actions">
                <button class="btn-tertiary update-btn" onclick="saveNewItem('${category}', ${index})">Save</button>
                <button class="btn-tertiary" onclick="cancelNewItem('${category}', ${index})">Cancel</button>
            </div>
        </div>
    `;
}

// function closePopup() {
//     document.getElementById('popupForm').style.display = 'none';
// }

// async function saveMenuItem() {
//     const token = localStorage.getItem('token');
//     const id = document.getElementById('itemId').value;

//     const itemData = {
//         name: document.getElementById('itemName').value,
//         price: parseFloat(document.getElementById('itemPrice').value),
//         category: document.getElementById('itemCategory').value,
//         ingredients: document.getElementById('itemDescription').value,
//         is_available: true
//     };

//     const url = id ?
//         `http://localhost:5000/api/items/${id}` : `http://localhost:5000/api/items`;

//     try {
//         const response = await fetch(url, {
//             method: id ? 'PUT' : 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': 'Bearer ' + token
//             },
//             body: JSON.stringify(itemData)
//         });

//         if (response.ok) {
//             alert(id ? 'Item updated!' : 'Item added!');
//             closePopup();
//             loadMenuItems();
//         } else {
//             const data = await response.json();
//             alert('Error: ' + data.error);
//         }
//     } catch (error){
//         console.log('Error:', error);
//         alert('Cannot connect to server');
//     }
// }

function addNewRow(category){
    //Lägg till ny tom rad till arrayen
    newRows[category].push({});
    //refrehs displayen
    loadMenuItems();
}

function cancelNewItem(category, index){
    //ta bort raden från araryen
    newRows[category].splice(index, 1);
    //refrehsa displayen
    loadMenuItems();
}

async function saveNewItem(category, index){
    const token = localStorage.getItem('token');
    //get value från input fält
    const name = document.getElementById(`new-${category}-${index}-name`).value;
    const price = parseFloat(document.getElementById(`new-${category}-${index}-price`).value);
    const description = document.getElementById(`new-${category}-${index}-description`).value;
    const imageUrl = document.getElementById(`new-${category}-${index}-image`).value;

    if (!name || !price){
        alert('Name and price are required!');
        return;
    }

    const itemData = {
        name: name,
        price: price,
        category: category,
        ingredients: description,
        image_url: imageUrl,
        is_available: true
    };
    
    try {
        const response = await fetch('http://localhost:5000/api/items', {
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

async function updateItem(id, buttonElement){
    const token = localStorage.getItem('token');

    const row = buttonElement.closest('.menu-item-row');

    const name = row.querySelector('.field-name').value;
    const price = parseFloat(row.querySelector('.field-price').value);
    const description = row.querySelector('.field-description').value;
    const imageUrl = row.querySelector('.field-image').value;
    const category = row.dataset.category;

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
        is_available: true
    };

    try {
        const response = await fetch(`http://localhost:5000/api/items/${id}`, {
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

async function deleteItem(id, buttonElement) {
    if (!confirm('Delete this item?')) return;

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`http://localhost:5000/api/items/${id}`, {
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

function updatePublicMenu() {
    localStorage.setItem('menuUpdated', Date.now());
}

function saveAllChanges(){
    alert('All changes saved!');
    loadMenuItems();
}

function cancelAllChanges(){
    if (confirm('Discard all changes?')) {
        //clear alla  nya rader
        newRows = {
            drinks: [],
            desserts: []
        };
        loadMenuItems();
    }
}

window.addNewRow = addNewRow;
window.updateItem = updateItem;
window.deleteItem = deleteItem;
window.saveNewItem = saveNewItem;
window.cancelNewItem = cancelNewItem;
window.saveAllChanges = saveAllChanges;
window.cancelAllChanges = cancelAllChanges;