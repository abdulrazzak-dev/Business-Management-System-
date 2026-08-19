/* ==========================================================================
   Golden - INVENTORY CONTROL & STOCK MANAGEMENT (REST API)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.endsWith('inventory.html') || window.location.pathname.endsWith('inventory')) {
    initInventoryPage();
  }
});

let currentAdjustingProductId = null;
let cachedInventoryList = [];

function initInventoryPage() {
  renderInventoryOverviewCards();
  renderInventoryTable();

  const searchInput = document.getElementById('inventory-search');
  const filterSelect = document.getElementById('inventory-filter');

  if (searchInput) searchInput.addEventListener('input', renderInventoryTable);
  if (filterSelect) filterSelect.addEventListener('change', renderInventoryTable);

  const stockForm = document.getElementById('stock-adjust-form');
  if (stockForm) stockForm.addEventListener('submit', handleStockAdjustmentSubmit);
}

async function renderInventoryOverviewCards() {
  try {
    const products = await apiRequest('api/inventory') || [];
    cachedInventoryList = products;

    const inStock = products.filter(p => p.status === 'IN_STOCK').length;
    const lowStock = products.filter(p => p.status === 'LOW_STOCK').length;
    const outOfStock = products.filter(p => p.status === 'OUT_OF_STOCK').length;

    const inStockEl = document.getElementById('inv-count-instock');
    const lowStockEl = document.getElementById('inv-count-lowstock');
    const outOfStockEl = document.getElementById('inv-count-outofstock');

    if (inStockEl) inStockEl.textContent = inStock;
    if (lowStockEl) lowStockEl.textContent = lowStock;
    if (outOfStockEl) outOfStockEl.textContent = outOfStock;
  } catch (err) {}
}

async function renderInventoryTable() {
  const tbody = document.getElementById('inventory-tbody');
  if (!tbody) return;

  const searchVal = (document.getElementById('inventory-search')?.value || '').toLowerCase().trim();
  const filterVal = document.getElementById('inventory-filter')?.value || 'all';

  try {
    let endpoint = '/inventory';
    if (filterVal === 'low') endpoint = '/api/inventory/low-stock';
    else if (filterVal === 'out') endpoint = '/api/inventory/out-of-stock';

    let products = await apiRequest(endpoint) || [];

    if (searchVal) {
      products = products.filter(p => p.name.toLowerCase().includes(searchVal) || (p.sku && p.sku.toLowerCase().includes(searchVal)));
    }

    if (products.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="table-empty-state">
            <i class="fa-solid fa-boxes-packing"></i>
            <p>No inventory items match your current filter.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = products.map(p => {
      const maxStockBenchmark = Math.max(p.stockQuantity * 1.5, 50);
      const fillPercent = Math.min(100, Math.round((p.stockQuantity / maxStockBenchmark) * 100));
      
      let badgeClass = 'badge-success';
      let progressColor = 'var(--status-success)';
      if (p.status === 'OUT_OF_STOCK') {
        badgeClass = 'badge-danger';
        progressColor = 'var(--status-danger)';
      } else if (p.status === 'LOW_STOCK') {
        badgeClass = 'badge-warning';
        progressColor = 'var(--status-warning)';
      }

      return `
        <tr>
          <td><strong>${p.sku || p.id}</strong></td>
          <td>
            <div style="font-weight:700;">${p.name}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${p.category}</div>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
              <strong>${p.stockQuantity} units</strong>
              <span style="font-size:0.75rem; color:var(--text-muted);">(Min: ${p.minimumStockLevel || 10})</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width:${fillPercent}%; background-color:${progressColor}"></div>
            </div>
          </td>
          <td><span class="badge ${badgeClass}"><span class="badge-dot"></span>${(p.status || '').replace('_', ' ')}</span></td>
          <td>
            <div style="display:flex; gap:0.25rem;">
              <button class="btn btn-sm btn-outline" onclick="quickRestock('${p.id}', 10)" title="Quick +10 Restock">
                <i class="fa-solid fa-plus"></i> +10
              </button>
              <button class="btn btn-sm btn-outline" onclick="openStockAdjustModal('${p.id}')" title="Adjust Quantity">
                <i class="fa-solid fa-sliders"></i> Adjust
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    showToast(err.message || 'Error loading inventory', 'danger');
  }
}

async function quickRestock(productId, amount) {
  try {
    await apiRequest(`/inventory/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ stockChange: amount, actionType: 'add' })
    });
    showToast(`Added ${amount} units to product stock`, 'success');
    renderInventoryOverviewCards();
    renderInventoryTable();
  } catch (err) {
    showToast(err.message || 'Failed to update stock', 'danger');
  }
}

function openStockAdjustModal(productId) {
  const p = cachedInventoryList.find(item => item.id === productId);
  if (!p) return;

  currentAdjustingProductId = productId;
  document.getElementById('adjust-product-name').textContent = p.name;
  document.getElementById('adjust-current-stock').value = p.stockQuantity;
  document.getElementById('adjust-qty-change').value = '0';
  document.getElementById('adjust-action-type').value = 'add';
  
  openModal('stock-adjust-modal');
}

async function handleStockAdjustmentSubmit(e) {
  e.preventDefault();

  const actionType = document.getElementById('adjust-action-type').value;
  const stockChange = parseInt(document.getElementById('adjust-qty-change').value, 10);

  if (isNaN(stockChange) || stockChange < 0) {
    showToast('Please enter a valid stock quantity adjustment', 'warning');
    return;
  }

  try {
    await apiRequest(`/inventory/${currentAdjustingProductId}`, {
      method: 'PATCH',
      body: JSON.stringify({ stockChange, actionType })
    });

    showToast('Stock level updated successfully', 'success');
    closeModal('stock-adjust-modal');
    renderInventoryOverviewCards();
    renderInventoryTable();
  } catch (err) {
    showToast(err.message || 'Error updating stock level', 'danger');
  }
}
