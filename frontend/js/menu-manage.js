document.addEventListener('DOMContentLoaded', function(){
    /*const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (!token || role != 'staff'){
        window.location.href = 'login.html';
        return;
    }*/

    loadMenuItems();

    document.getElementById('menuItemForm').addEventListener('submit', function(e){
        e.preventDefault();
        saveMenuItem();
    });
});

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

        displayItems('drinks-list', drinks);
        displayItems('desserts-list', desserts);
    
    } catch(error) {
        console.log('Error:', error);
    }
}

function displayItems(containerId, items) {
    const container = document.getElementById(containerId);

    if (items.length === 0){
        container.innerHTML = '<p>No items found.</p>';
        return;
    }

    let html = '';
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        html += `
            <div class="menu-item-row">
                <span class="item-name">${item.name} - ${item.price} SEK</span>

                <div class="item-actions">
                    <button class="btn-update" onclick="openEditForm(${item.product_id})">Update</button>
                    <button class="btn-delete" onclick="deleteItem(${item.product_id})">Delete</button>
                </div>
            </div>
        `;
    }   
    container.innerHTML = html;    
}

function openAddForm(category) {
    document.getElementById('popupTitle').textContent = 'Add New Item';
    document.getElementById('itemId').value = '';
    document.getElementById('itemCategory').value = category;
    document.getElementById('itemName').value = '';
    document.getElementById('itemPrice').value = '';
    document.getElementById('itemDescription').value = '';
    document.getElementById('popupForm').style.display = 'flex';
}

async function openEditForm(id) {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`http://localhost:5000/api/items/${id}`, {
            headers: {'Authorization': 'Bearer ' + token}
        });

        const item = await response.json();

        document.getElementById('popupTitle').textContent = 'Edit Item';
        document.getElementById('itemId').value = item.product_id;
        document.getElementById('itemCategory').value = item.category;
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemPrice').value = item.price;
        document.getElementById('itemDescription').value = item.ingredients || '';
        document.getElementById('popupForm').style.display = 'flex';

    } catch(error) {
        console.log('Error:', error);
        alert('Could not load item details')
    }
}

function closePopup() {
    document.getElementById('popupForm').style.display = 'none';
}

async function saveMenuItem() {
    const token = localStorage.getItem('token');
    const id = document.getElementById('itemId').value;

    const itemData = {
        name: document.getElementById('itemName').value,
        price: parseFloat(document.getElementById('itemPrice').value),
        category: document.getElementById('itemCategory').value,
        ingredients: document.getElementById('itemDescription').value,
        is_available: true
    };

    const url = id ?
        `http://localhost:5000/api/items/${id}` : `http://localhost:5000/api/items`;

    try {
        const response = await fetch(url, {
            method: id ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(itemData)
        });

        if (response.ok) {
            alert(id ? 'Item updated!' : 'Item added!');
            closePopup();
            loadMenuItems();
        } else {
            const data = await response.json();
            alert('Error: ' + data.error);
        }
    } catch (error){
        console.log('Error:', error);
        alert('Cannot connect to server');
    }
}

async function deleteItem(id) {
    if (!confirm('Delete this item?')) return;

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`http://localhost:5000/api/items/${id}`, {
            method: 'DELETE',
            headers: {'Authorization': 'Bearer ' + token}
        });

        if (response.ok) {
            alert('Item deleted!');
            loadMenuItems();
        } else {
            const data = await response.json();
            alert('Error: ' + data.error);
        }
    } catch(error){
        console.log('Error:', error);
        alert('Cannot connect to server');
    }
}

function saveAllChanges(){
    alert('All changes saved!');
    loadMenuItems();
}

function cancelAllChanges(){
    if (confirm('Discard all changes?')) {
        loadMenuItems();
    }
}

window.openAddForm = openAddForm;
window.openEditForm = openEditForm;
window.closePopup = closePopup;
window.deleteItem = deleteItem;
window.saveAllChanges = saveAllChanges;
window.cancelAllChanges = cancelAllChanges;