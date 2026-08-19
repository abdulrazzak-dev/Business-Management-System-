/* ==========================================================================
   Golden - PRODUCT MANAGEMENT CONTROLLER (REST API)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.endsWith('products.html') || window.location.pathname.endsWith('products')) {
    initProductPage();
  }
});

let currentEditingProductId = null;
let cachedProductsList = [];

function initProductPage() {
  enforceProductAdminUIControls();
  renderProductTable();

  const searchInput = document.getElementById('product-search');
  const categoryFilter = document.getElementById('product-category-filter');
  const statusFilter = document.getElementById('product-status-filter');

  if (searchInput) searchInput.addEventListener('input', renderProductTable);
  if (categoryFilter) categoryFilter.addEventListener('change', renderProductTable);
  if (statusFilter) statusFilter.addEventListener('change', renderProductTable);

  const productForm = document.getElementById('product-form');
  if (productForm) {
    productForm.addEventListener('submit', handleProductFormSubmit);
  }
}

function checkIsAdmin() {
  const userJson = localStorage.getItem('user') || localStorage.getItem('currentUser');
  if (!userJson) return false;
  try {
    const user = JSON.parse(userJson);
    return user.role === 'ADMIN';
  } catch (e) {
    return false;
  }
}

function enforceProductAdminUIControls() {
  const isAdmin = checkIsAdmin();
  const addBtns = document.querySelectorAll('button[onclick="openAddProductModal()"]');
  addBtns.forEach(btn => {
    if (!isAdmin) {
      btn.style.display = 'none';
    } else {
      btn.style.display = '';
    }
  });
}

async function renderProductTable() {
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;

  const searchVal = document.getElementById('product-search')?.value.trim();
  const categoryVal = document.getElementById('product-category-filter')?.value;
  const statusVal = document.getElementById('product-status-filter')?.value;
  const isAdmin = checkIsAdmin();

  try {
    let queryParams = new URLSearchParams();
    if (searchVal) queryParams.append('search', searchVal);
    if (categoryVal) queryParams.append('category', categoryVal);
    if (statusVal) queryParams.append('status', statusVal);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const products = await apiRequest(`/api/products${queryString}`);
    cachedProductsList = products || [];

    populateCategoryFilterOptions(cachedProductsList);

    if (cachedProductsList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty-state">
            <i class="fa-solid fa-boxes-stacked"></i>
            <p>No products found matching your filter criteria.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = cachedProductsList.map(p => {
      let badgeClass = 'badge-success';
      if (p.status === 'LOW_STOCK') badgeClass = 'badge-warning';
      else if (p.status === 'OUT_OF_STOCK') badgeClass = 'badge-danger';

      const actionButtons = isAdmin ? `
        <div style="display:flex; gap:0.35rem;">
          <button class="btn btn-sm btn-outline" onclick="openEditProductModal('${p.id}')" title="Edit Product">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn btn-sm btn-outline" style="color:var(--status-danger);" onclick="confirmDeleteProduct('${p.id}')" title="Delete Product">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      ` : `<span style="font-size:0.75rem; color:var(--text-muted);">View Only</span>`;

      return `
        <tr>
          <td><strong>${p.sku || p.id}</strong></td>
          <td><div style="font-weight:700;">${p.name}</div></td>
          <td><span class="badge badge-info">${p.category}</span></td>
          <td><strong>Rs. ${Number(p.price).toFixed(2)}</strong></td>
          <td>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span>${p.stockQuantity} units</span>
              ${p.stockQuantity <= (p.minimumStockLevel || 10) ? '<i class="fa-solid fa-triangle-exclamation" style="color:var(--status-warning)" title="Low Stock"></i>' : ''}
            </div>
          </td>
          <td><span class="badge ${badgeClass}"><span class="badge-dot"></span>${(p.status || '').replace('_', ' ')}</span></td>
          <td>${actionButtons}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    showToast(err.message || 'Error fetching products from backend', 'danger');
  }
}

function populateCategoryFilterOptions(products) {
  const select = document.getElementById('product-category-filter');
  if (!select || select.children.length > 1) return; // already populated

  const categories = [...new Set(products.map(p => p.category))];
  select.innerHTML = `<option value="">All Categories</option>` + 
    categories.map(c => `<option value="${c}">${c}</option>`).join('');
}

function openAddProductModal() {
  if (!checkIsAdmin()) {
    showToast('Access denied. Only Administrators can add new products.', 'danger');
    return;
  }

  currentEditingProductId = null;
  document.getElementById('product-modal-title').textContent = 'Add New Product';
  document.getElementById('product-form').reset();
  document.getElementById('product-id').value = `PROD-${Math.floor(100 + Math.random() * 900)}`;

  enforceProductPricePermissions();
  openModal('product-modal');
}

function openEditProductModal(productId) {
  if (!checkIsAdmin()) {
    showToast('Access denied. Only Administrators can edit products.', 'danger');
    return;
  }

  const p = cachedProductsList.find(item => item.id === productId);
  if (!p) return;

  currentEditingProductId = productId;
  document.getElementById('product-modal-title').textContent = 'Edit Product';
  document.getElementById('product-id').value = p.sku || p.id;
  document.getElementById('product-name').value = p.name;
  document.getElementById('product-category').value = p.category;
  document.getElementById('product-price').value = p.price;
  document.getElementById('product-stock').value = p.stockQuantity;
  document.getElementById('product-min-stock').value = p.minimumStockLevel || 10;
  
  enforceProductPricePermissions();
  openModal('product-modal');
}

function enforceProductPricePermissions() {
  const isAdmin = checkIsAdmin();
  const priceInput = document.getElementById('product-price');
  if (priceInput) {
    if (!isAdmin) {
      priceInput.disabled = true;
      priceInput.title = 'Only Administrators can edit product prices.';
      priceInput.style.background = 'var(--bg-surface-subtle)';
      priceInput.style.cursor = 'not-allowed';
    } else {
      priceInput.disabled = false;
      priceInput.title = '';
      priceInput.style.background = '';
      priceInput.style.cursor = '';
    }
  }
}

async function handleProductFormSubmit(e) {
  e.preventDefault();

  if (!checkIsAdmin()) {
    showToast('Access denied. Only Administrators can modify products.', 'danger');
    return;
  }

  const sku = document.getElementById('product-id').value;
  const name = document.getElementById('product-name').value.trim();
  const category = document.getElementById('product-category').value.trim();
  const price = parseFloat(document.getElementById('product-price').value);
  const stockQuantity = parseInt(document.getElementById('product-stock').value, 10);
  const minimumStockLevel = parseInt(document.getElementById('product-min-stock').value, 10) || 10;

  if (!name || !category || isNaN(price) || isNaN(stockQuantity)) {
    showToast('Please complete required fields', 'warning');
    return;
  }

  const payload = { sku, name, category, price, stockQuantity, minimumStockLevel };

  try {
    if (currentEditingProductId) {
      await apiRequest(`/api/products/${currentEditingProductId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showToast(`Product "${name}" updated successfully`, 'success');
    } else {
      await apiRequest('/api/products', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showToast(`New product "${name}" created`, 'success');
    }

    closeModal('product-modal');
    renderProductTable();
  } catch (err) {
    showToast(err.message || 'Error saving product', 'danger');
  }
}

function confirmDeleteProduct(productId) {
  if (!checkIsAdmin()) {
    showToast('Access denied. Only Administrators can delete products.', 'danger');
    return;
  }

  const p = cachedProductsList.find(item => item.id === productId);
  if (!p) return;

  showConfirmModal({
    title: 'Delete Product',
    message: `Are you sure you want to delete "${p.name}"?`,
    confirmText: 'Delete Product',
    onConfirm: async () => {
      try {
        await apiRequest(`/api/products/${productId}`, { method: 'DELETE' });
        showToast(`Product "${p.name}" deleted`, 'success');
        renderProductTable();
      } catch (err) {
        showToast(err.message || 'Error deleting product', 'danger');
      }
    }
  });
}
