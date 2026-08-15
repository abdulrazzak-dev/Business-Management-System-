/* ==========================================================================
   BIZPULSE - SALES & ORDERS MANAGEMENT ENGINE (REST API)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.endsWith('orders.html') || window.location.pathname.endsWith('orders')) {
    initOrdersPage();
  }
});

let cartItems = [];
let availableProductsList = [];
let availableCustomersList = [];

function initOrdersPage() {
  renderOrdersTable();
  loadOrderFormDropdowns();

  const searchInput = document.getElementById('order-search');
  const statusFilter = document.getElementById('order-status-filter');

  if (searchInput) searchInput.addEventListener('input', renderOrdersTable);
  if (statusFilter) statusFilter.addEventListener('change', renderOrdersTable);
}

async function renderOrdersTable() {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;

  const searchVal = document.getElementById('order-search')?.value.trim();
  const statusVal = document.getElementById('order-status-filter')?.value;

  try {
    let queryParams = new URLSearchParams();
    if (searchVal) queryParams.append('search', searchVal);
    if (statusVal) queryParams.append('status', statusVal);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const orders = await apiRequest(`/orders${queryString}`);

    if (!orders || orders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty-state">
            <i class="fa-solid fa-receipt"></i>
            <p>No orders found.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = orders.map(ord => {
      const formattedDate = ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
      let badgeClass = 'badge-success';
      if (ord.status === 'PROCESSING') badgeClass = 'badge-info';
      else if (ord.status === 'PENDING') badgeClass = 'badge-warning';

      const totalQty = ord.items ? ord.items.reduce((s, i) => s + (i.quantity || 1), 0) : 1;

      return `
        <tr>
          <td><strong>${ord.orderNumber || ord.id}</strong></td>
          <td>${ord.customerName || 'Walk-in Customer'}</td>
          <td>${formattedDate}</td>
          <td>${totalQty} items</td>
          <td><strong>$${Number(ord.totalAmount).toFixed(2)}</strong></td>
          <td><span class="badge ${badgeClass}"><span class="badge-dot"></span>${ord.status}</span></td>
          <td>
            <button class="btn btn-sm btn-outline" onclick="viewOrderDetails('${ord.id}')" title="View Order">
              <i class="fa-solid fa-eye"></i> Details
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    showToast(err.message || 'Error loading orders', 'danger');
  }
}

async function loadOrderFormDropdowns() {
  try {
    availableCustomersList = await apiRequest('/customers') || [];
    availableProductsList = await apiRequest('/products') || [];

    const custSelect = document.getElementById('order-customer-select');
    if (custSelect) {
      custSelect.innerHTML = `<option value="">Select Customer...</option>` + 
        availableCustomersList.map(c => `<option value="${c.id}">${c.name} (${c.email})</option>`).join('');
    }

    const prodSelect = document.getElementById('order-product-picker');
    if (prodSelect) {
      const inStockProducts = availableProductsList.filter(p => p.stockQuantity > 0);
      prodSelect.innerHTML = `<option value="">Choose item to add...</option>` +
        inStockProducts.map(p => `<option value="${p.id}">${p.name} - $${Number(p.price).toFixed(2)} (Stock: ${p.stockQuantity})</option>`).join('');
    }
  } catch (err) {}
}

function openCreateOrderModal() {
  cartItems = [];
  document.getElementById('create-order-form').reset();
  renderCartTable();
  openModal('create-order-modal');
}

function addProductToCart() {
  const productSelect = document.getElementById('order-product-picker');
  const qtyInput = document.getElementById('order-product-qty');
  
  const productId = productSelect.value;
  const qty = parseInt(qtyInput.value, 10);

  if (!productId || isNaN(qty) || qty <= 0) {
    showToast('Please select a valid product and quantity', 'warning');
    return;
  }

  const product = availableProductsList.find(p => p.id === productId);
  if (!product) return;

  if (qty > product.stockQuantity) {
    showToast(`Only ${product.stockQuantity} units available in stock`, 'warning');
    return;
  }

  const existing = cartItems.find(item => item.productId === productId);
  if (existing) {
    if (existing.quantity + qty > product.stockQuantity) {
      showToast(`Cannot exceed total stock of ${product.stockQuantity}`, 'warning');
      return;
    }
    existing.quantity += qty;
  } else {
    cartItems.push({
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity: qty
    });
  }

  productSelect.value = '';
  qtyInput.value = '1';
  renderCartTable();
}

function removeCartItem(productId) {
  cartItems = cartItems.filter(item => item.productId !== productId);
  renderCartTable();
}

function renderCartTable() {
  const container = document.getElementById('order-cart-tbody');
  const subtotalEl = document.getElementById('cart-subtotal');
  const taxEl = document.getElementById('cart-tax');
  const totalEl = document.getElementById('cart-total');
  
  if (!container) return;

  if (cartItems.length === 0) {
    container.innerHTML = `<tr><td colspan="5" class="table-empty-state" style="padding:1.5rem;"><p>No items added to order yet.</p></td></tr>`;
    if (subtotalEl) subtotalEl.textContent = "$0.00";
    if (taxEl) taxEl.textContent = "$0.00";
    if (totalEl) totalEl.textContent = "$0.00";
    return;
  }

  let subtotal = 0;
  container.innerHTML = cartItems.map(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    return `
      <tr>
        <td><strong>${item.productName}</strong></td>
        <td>$${Number(item.price).toFixed(2)}</td>
        <td>${item.quantity}</td>
        <td><strong>$${Number(itemTotal).toFixed(2)}</strong></td>
        <td>
          <button class="btn btn-sm" style="color:var(--status-danger);" onclick="removeCartItem('${item.productId}')">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  const tax = subtotal * 0.085;
  const total = subtotal + tax;

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

async function submitNewOrder(e) {
  e.preventDefault();

  const customerId = document.getElementById('order-customer-select').value;
  const paymentMethod = document.getElementById('order-payment-method').value;
  const status = document.getElementById('order-status-select').value;

  if (!customerId) {
    showToast('Please select a customer', 'warning');
    return;
  }

  if (cartItems.length === 0) {
    showToast('Please add at least one product to the order', 'warning');
    return;
  }

  const payload = {
    customerId: customerId,
    paymentMethod: paymentMethod,
    status: status,
    items: cartItems.map(i => ({ productId: i.productId, quantity: i.quantity }))
  };

  try {
    const createdOrder = await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    showToast(`Order ${createdOrder.orderNumber || createdOrder.id} created successfully!`, 'success');
    closeModal('create-order-modal');
    renderOrdersTable();
    loadOrderFormDropdowns();
  } catch (err) {
    showToast(err.message || 'Failed to create order', 'danger');
  }
}

async function viewOrderDetails(orderId) {
  try {
    const ord = await apiRequest(`/orders/${orderId}`);
    if (!ord) return;

    const modalBody = document.getElementById('view-order-details-body');
    if (!modalBody) return;

    const formattedDate = ord.createdAt ? new Date(ord.createdAt).toLocaleString() : 'N/A';

    modalBody.innerHTML = `
      <div style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h4 style="font-weight:800; font-size:1.1rem;">Order #${ord.orderNumber || ord.id}</h4>
          <p style="font-size:0.8125rem; color:var(--text-muted);">${formattedDate}</p>
        </div>
        <span class="badge badge-success">${ord.status}</span>
      </div>

      <div style="background:var(--bg-surface-subtle); padding:1rem; border-radius:var(--radius-md); margin-bottom:1.25rem;">
        <div style="font-size:0.875rem; font-weight:700;">Customer Details</div>
        <div style="font-size:0.8125rem; color:var(--text-muted);">${ord.customerName || 'Walk-in Customer'}</div>
        <div style="font-size:0.8125rem; color:var(--text-muted);">Payment: ${ord.paymentMethod || 'Credit Card'}</div>
      </div>

      <table class="custom-table" style="margin-bottom:1rem;">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${(ord.items || []).map(i => `
            <tr>
              <td>${i.productName}</td>
              <td>${i.quantity}</td>
              <td>$${Number(i.price).toFixed(2)}</td>
              <td>$${Number(i.subtotal || i.price * i.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.25rem; font-size:0.875rem;">
        <div>Subtotal: <strong>$${Number(ord.subtotal).toFixed(2)}</strong></div>
        <div>Estimated Tax: <strong>$${Number(ord.tax).toFixed(2)}</strong></div>
        <div style="font-size:1.1rem; font-weight:800; color:var(--primary); margin-top:0.25rem;">Total Paid: $${Number(ord.totalAmount).toFixed(2)}</div>
      </div>
    `;

    openModal('view-order-modal');
  } catch (err) {
    showToast(err.message || 'Error loading order details', 'danger');
  }
}
