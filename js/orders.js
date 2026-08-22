/* ==========================================================================
   Golden - SALES & ORDERS MANAGEMENT ENGINE (REST API & RBAC ENHANCED)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.endsWith('orders.html') || window.location.pathname.endsWith('orders')) {
    initOrdersPage();
  }
});

let cartItems = [];
let availableProductsList = [];
let availableCustomersList = [];
let cachedOrdersList = [];
let currentEditingOrder = null;

function getCurrentUser() {
  const userJson = localStorage.getItem('user') || localStorage.getItem('currentUser') || sessionStorage.getItem('user') || sessionStorage.getItem('currentUser');
  if (!userJson) return { role: 'admin' };
  try {
    return JSON.parse(userJson);
  } catch (e) {
    return { role: 'admin' };
  }
}

function isUserAdmin() {
  const user = getCurrentUser();
  const role = (user && user.role) ? String(user.role).toLowerCase() : '';
  return role === 'admin';
}

function initOrdersPage() {
  renderOrdersTable();
  loadOrderFormDropdowns();

  const searchInput = document.getElementById('order-search');
  const statusFilter = document.getElementById('order-status-filter');

  if (searchInput) searchInput.addEventListener('input', renderOrdersTable);
  if (statusFilter) statusFilter.addEventListener('change', renderOrdersTable);

  window.addEventListener('currencyChange', () => {
    renderOrdersTable();
    loadOrderFormDropdowns();
    renderCartTable();
    if (currentEditingOrder && document.getElementById('view-order-modal')?.classList.contains('show')) {
      renderEditingOrderModal();
    }
  });
}

async function renderOrdersTable() {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;

  const searchVal = document.getElementById('order-search')?.value.trim();
  const statusVal = document.getElementById('order-status-filter')?.value;
  const isAdmin = isUserAdmin();

  try {
    let orders = [];
    try {
      let queryParams = new URLSearchParams();
      if (searchVal) queryParams.append('search', searchVal);
      if (statusVal) queryParams.append('status', statusVal);

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      orders = await apiRequest(`/api/orders${queryString}`);
    } catch (apiErr) {
      if (typeof storage !== 'undefined' && storage.getOrders) {
        orders = storage.getOrders() || [];
        if (searchVal) {
          const s = searchVal.toLowerCase();
          orders = orders.filter(o => (o.orderNumber || o.id || '').toLowerCase().includes(s) || (o.customerName || '').toLowerCase().includes(s));
        }
        if (statusVal) {
          orders = orders.filter(o => (o.status || '').toUpperCase() === statusVal.toUpperCase());
        }
      } else {
        throw apiErr;
      }
    }

    cachedOrdersList = orders || [];

    if (!cachedOrdersList || cachedOrdersList.length === 0) {
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

    tbody.innerHTML = cachedOrdersList.map(ord => {
      const formattedDate = ord.createdAt || ord.date ? new Date(ord.createdAt || ord.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
      
      const statusUpper = (ord.status || 'COMPLETED').toUpperCase();
      let badgeClass = 'badge-success';
      if (statusUpper === 'PROCESSING') badgeClass = 'badge-info';
      else if (statusUpper === 'PENDING') badgeClass = 'badge-warning';
      else if (statusUpper === 'CANCELLED') badgeClass = 'badge-danger';

      const totalQty = ord.items ? ord.items.reduce((s, i) => s + (parseInt(i.quantity || i.qty, 10) || 1), 0) : 1;
      const totalAmt = ord.totalAmount !== undefined ? ord.totalAmount : (ord.total !== undefined ? ord.total : 0);

      const deleteBtn = isAdmin ? `
        <button class="btn btn-sm btn-outline" style="color:var(--status-danger);" onclick="confirmDeleteOrder('${ord.id}')" title="Delete Order (Admin Only)">
          <i class="fa-solid fa-trash"></i>
        </button>
      ` : '';

      return `
        <tr>
          <td><strong>${ord.orderNumber || ord.id}</strong></td>
          <td>${ord.customerName || 'Walk-in Customer'}</td>
          <td>${formattedDate}</td>
          <td>${totalQty} items</td>
          <td><strong>${formatCurrency(totalAmt)}</strong></td>
          <td><span class="badge ${badgeClass}"><span class="badge-dot"></span>${statusUpper}</span></td>
          <td>
            <div style="display:flex; gap:0.35rem;">
              <button class="btn btn-sm btn-outline" onclick="viewOrderDetails('${ord.id}')" title="View / Edit Details">
                <i class="fa-solid fa-pen-to-square"></i> Details & Edit
              </button>
              ${deleteBtn}
            </div>
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
    if (typeof apiRequest === 'function') {
      try {
        availableCustomersList = await apiRequest('/api/customers') || [];
      } catch(e) {
        if (typeof storage !== 'undefined' && storage.getCustomers) availableCustomersList = storage.getCustomers() || [];
      }
      try {
        availableProductsList = await apiRequest('/api/products') || [];
      } catch(e) {
        if (typeof storage !== 'undefined' && storage.getProducts) availableProductsList = storage.getProducts() || [];
      }
    }

    const custSelect = document.getElementById('order-customer-select');
    if (custSelect) {
      custSelect.innerHTML = `<option value="">Select Customer...</option>` + 
        availableCustomersList.map(c => `<option value="${c.id}">${c.name} (${c.email || 'No email'})</option>`).join('');
    }

    const prodSelect = document.getElementById('order-product-picker');
    if (prodSelect) {
      const inStockProducts = availableProductsList.filter(p => (p.stockQuantity !== undefined ? p.stockQuantity : p.stock) > 0);
      prodSelect.innerHTML = `<option value="">Choose item to add...</option>` +
        inStockProducts.map(p => {
          const stk = p.stockQuantity !== undefined ? p.stockQuantity : p.stock;
          return `<option value="${p.id}">${p.name} - ${formatCurrency(p.price)} (Stock: ${stk})</option>`;
        }).join('');
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

  const stockAvailable = product.stockQuantity !== undefined ? product.stockQuantity : product.stock;

  if (qty > stockAvailable) {
    showToast(`Only ${stockAvailable} units available in stock`, 'warning');
    return;
  }

  const existing = cartItems.find(item => item.productId === productId);
  if (existing) {
    if (existing.quantity + qty > stockAvailable) {
      showToast(`Cannot exceed total stock of ${stockAvailable}`, 'warning');
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
    if (subtotalEl) subtotalEl.textContent = formatCurrency(0);
    if (taxEl) taxEl.textContent = formatCurrency(0);
    if (totalEl) totalEl.textContent = formatCurrency(0);
    return;
  }

  let subtotal = 0;
  container.innerHTML = cartItems.map(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;

    return `
      <tr>
        <td><strong>${item.productName}</strong></td>
        <td>${formatCurrency(item.price)}</td>
        <td>${item.quantity}</td>
        <td><strong>${formatCurrency(itemTotal)}</strong></td>
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

  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
  if (taxEl) taxEl.textContent = formatCurrency(tax);
  if (totalEl) totalEl.textContent = formatCurrency(total);
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

  const user = getCurrentUser();
  const staffId = user ? user.id : null;
  const staffName = user ? user.name : null;

  const selectedCustomer = availableCustomersList.find(c => c.id === customerId);
  const customerName = selectedCustomer ? selectedCustomer.name : 'Walk-in Customer';

  const subtotal = cartItems.reduce((s, i) => s + (i.price * i.quantity), 0);
  const tax = subtotal * 0.085;
  const totalAmount = subtotal + tax;

  const payload = {
    customerId: customerId,
    customerName: customerName,
    paymentMethod: paymentMethod,
    status: status,
    staffId: staffId,
    staffName: staffName,
    items: cartItems.map(i => ({ productId: i.productId, productName: i.productName, price: i.price, quantity: i.quantity, subtotal: i.price * i.quantity }))
  };

  try {
    let createdOrder = null;
    try {
      createdOrder = await apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch(apiErr) {
      if (typeof storage !== 'undefined' && storage.getOrders) {
        const localOrders = storage.getOrders() || [];
        createdOrder = {
          id: `ORD-${Math.floor(5000 + Math.random() * 5000)}`,
          orderNumber: `ORD-${Math.floor(5000 + Math.random() * 5000)}`,
          customerId,
          customerName,
          paymentMethod,
          status,
          staffId,
          staffName,
          items: payload.items,
          subtotal,
          tax,
          totalAmount,
          total: totalAmount,
          createdAt: new Date().toISOString()
        };
        localOrders.unshift(createdOrder);
        storage.saveOrders(localOrders);
      } else {
        throw apiErr;
      }
    }

    showToast(`Order ${createdOrder.orderNumber || createdOrder.id} created successfully!`, 'success');
    closeModal('create-order-modal');
    renderOrdersTable();
    loadOrderFormDropdowns();
  } catch (err) {
    showToast(err.message || 'Failed to create order', 'danger');
  }
}

/* ==========================================================================
   ORDER DETAILS VIEW & LINE-ITEM EDITING ENGINE
   ========================================================================== */

async function viewOrderDetails(orderId) {
  try {
    let ord = null;
    try {
      ord = await apiRequest(`/api/orders/${orderId}`);
    } catch(apiErr) {
      if (cachedOrdersList.length) {
        ord = cachedOrdersList.find(o => o.id === orderId);
      }
      if (!ord && typeof storage !== 'undefined' && storage.getOrders) {
        ord = (storage.getOrders() || []).find(o => o.id === orderId);
      }
      if (!ord) throw apiErr;
    }

    if (!ord) return;

    // Prepare deep editable clone
    currentEditingOrder = {
      id: ord.id,
      orderNumber: ord.orderNumber || ord.id,
      customerId: ord.customerId || '',
      customerName: ord.customerName || 'Walk-in Customer',
      paymentMethod: ord.paymentMethod || 'Credit Card',
      status: (ord.status || 'COMPLETED').toUpperCase(),
      createdAt: ord.createdAt || ord.date || new Date().toISOString(),
      items: (ord.items || []).map(i => ({
        productId: i.productId || '',
        productName: i.productName || i.name || 'Item',
        quantity: parseInt(i.quantity || i.qty || 1, 10),
        price: typeof i.price === 'number' ? i.price : parseFloat(i.price || 0)
      }))
    };

    renderEditingOrderModal();
    openModal('view-order-modal');
  } catch (err) {
    showToast(err.message || 'Error loading order details', 'danger');
  }
}

function renderEditingOrderModal() {
  const modalBody = document.getElementById('view-order-details-body');
  const modalFooter = document.getElementById('view-order-modal-footer');
  if (!modalBody || !currentEditingOrder) return;

  const ord = currentEditingOrder;
  const formattedDate = ord.createdAt ? new Date(ord.createdAt).toLocaleString() : 'N/A';
  const isAdmin = isUserAdmin();

  // Compute live subtotal, tax, total
  const subtotal = ord.items.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 0)), 0);
  const tax = subtotal * 0.085;
  const grandTotal = subtotal + tax;

  modalBody.innerHTML = `
    <div style="margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; background:var(--bg-surface-subtle); padding:0.85rem 1rem; border-radius:var(--radius-md);">
      <div>
        <h4 style="font-weight:800; font-size:1.15rem; margin:0;">Order #${ord.orderNumber}</h4>
        <p style="font-size:0.8rem; color:var(--text-muted); margin:2px 0 0 0;"><i class="fa-regular fa-clock"></i> ${formattedDate}</p>
      </div>
      <div style="display:flex; align-items:center; gap:0.5rem;">
        <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted);">Status:</span>
        <select id="edit-order-status" class="form-control form-control-sm" style="width:130px; font-weight:700;" onchange="updateEditingMetadata('status', this.value)">
          <option value="COMPLETED" ${ord.status === 'COMPLETED' ? 'selected' : ''}>COMPLETED</option>
          <option value="PROCESSING" ${ord.status === 'PROCESSING' ? 'selected' : ''}>PROCESSING</option>
          <option value="PENDING" ${ord.status === 'PENDING' ? 'selected' : ''}>PENDING</option>
          <option value="CANCELLED" ${ord.status === 'CANCELLED' ? 'selected' : ''}>CANCELLED</option>
        </select>
      </div>
    </div>

    <!-- Metadata Editing Card -->
    <div style="background:var(--bg-surface); border:1px solid var(--border-color); padding:1rem; border-radius:var(--radius-md); margin-bottom:1.25rem; display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
      <div>
        <label style="font-size:0.75rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.25rem;">Customer Name</label>
        <input type="text" id="edit-order-customer" class="form-control form-control-sm" value="${ord.customerName}" placeholder="Customer Name..." oninput="updateEditingMetadata('customerName', this.value)">
      </div>
      <div>
        <label style="font-size:0.75rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:0.25rem;">Payment Method</label>
        <select id="edit-order-payment" class="form-control form-control-sm" onchange="updateEditingMetadata('paymentMethod', this.value)">
          <option value="Credit Card" ${ord.paymentMethod === 'Credit Card' ? 'selected' : ''}>Credit Card</option>
          <option value="PayPal" ${ord.paymentMethod === 'PayPal' ? 'selected' : ''}>PayPal</option>
          <option value="Bank Transfer" ${ord.paymentMethod === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
          <option value="Cash" ${ord.paymentMethod === 'Cash' ? 'selected' : ''}>Cash</option>
        </select>
      </div>
    </div>

    <!-- Editable Line Items Table -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
      <h5 style="font-weight:700; font-size:0.95rem; margin:0;"><i class="fa-solid fa-list-check" style="color:var(--primary); margin-right:0.35rem;"></i> Line Items (Editable)</h5>
      <button type="button" class="btn btn-sm btn-outline-primary" onclick="addEditingLineItemRow()">
        <i class="fa-solid fa-plus"></i> Add Item Row
      </button>
    </div>

    <div style="border:1px solid var(--border-color); border-radius:var(--radius-md); overflow:hidden; margin-bottom:1.25rem;">
      <table class="custom-table" style="margin:0;">
        <thead>
          <tr>
            <th style="width:40%;">Item Name</th>
            <th style="width:18%;">Qty</th>
            <th style="width:22%;">Unit Price</th>
            <th style="width:20%;">Row Total</th>
            <th style="width:40px;"></th>
          </tr>
        </thead>
        <tbody id="edit-order-items-tbody">
          ${renderEditingItemRowsHTML()}
        </tbody>
      </table>
    </div>

    <!-- Totals Calculation Summary Box -->
    <div style="background:var(--bg-surface-subtle); padding:1rem; border-radius:var(--radius-md); display:flex; flex-direction:column; align-items:flex-end; gap:0.35rem; font-size:0.875rem;">
      <div>Subtotal: <span id="edit-order-subtotal" style="font-weight:700; font-size:0.95rem;">${formatCurrency(subtotal)}</span></div>
      <div>Est. Tax (8.5%): <span id="edit-order-tax" style="font-weight:700; font-size:0.95rem;">${formatCurrency(tax)}</span></div>
      <div style="font-size:1.2rem; font-weight:800; color:var(--primary); margin-top:0.25rem; border-top:1px dashed var(--border-color); padding-top:0.35rem; width:100%; text-align:right;">
        Overall Balance: <span id="edit-order-total">${formatCurrency(grandTotal)}</span>
      </div>
    </div>
  `;

  if (modalFooter) {
    const deleteBtnHTML = isAdmin ? `
      <button class="btn btn-sm btn-outline" style="color:var(--status-danger); border-color:var(--status-danger);" onclick="confirmDeleteOrder('${ord.id}')">
        <i class="fa-solid fa-trash"></i> Delete Order
      </button>
    ` : `<div></div>`;

    modalFooter.innerHTML = `
      <div style="flex:1;">
        ${deleteBtnHTML}
      </div>
      <div style="display:flex; gap:0.5rem; flex-wrap:wrap; justify-content:flex-end;">
        <button type="button" class="btn btn-sm btn-outline" onclick="printOrderInvoice('${ord.id}')">
          <i class="fa-solid fa-print"></i> Print Invoice
        </button>
        <button type="button" class="btn btn-sm btn-primary" onclick="saveEditingOrder()">
          <i class="fa-solid fa-floppy-disk"></i> Save Changes
        </button>
        <button type="button" class="btn btn-sm btn-secondary" onclick="closeModal('view-order-modal')">Close</button>
      </div>
    `;
  }
}

function renderEditingItemRowsHTML() {
  if (!currentEditingOrder || !currentEditingOrder.items || currentEditingOrder.items.length === 0) {
    return `<tr><td colspan="5" class="table-empty-state" style="padding:1rem;"><p>No line items in this order.</p></td></tr>`;
  }

  return currentEditingOrder.items.map((item, idx) => {
    const rowTotal = (parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 0);

    return `
      <tr>
        <td>
          <input type="text" class="form-control form-control-sm" value="${item.productName || ''}" placeholder="Product / Item Name..." oninput="updateEditingLineItem(${idx}, 'productName', this.value)">
        </td>
        <td>
          <input type="number" class="form-control form-control-sm" style="width:75px;" min="1" value="${item.quantity || 1}" oninput="updateEditingLineItem(${idx}, 'quantity', this.value)">
        </td>
        <td>
          <input type="number" class="form-control form-control-sm" style="width:95px;" step="0.01" min="0" value="${item.price || 0}" oninput="updateEditingLineItem(${idx}, 'price', this.value)">
        </td>
        <td>
          <strong id="edit-row-total-${idx}">${formatCurrency(rowTotal)}</strong>
        </td>
        <td>
          <button type="button" class="btn btn-sm" style="color:var(--status-danger); padding:0.2rem 0.4rem;" onclick="removeEditingLineItemRow(${idx})" title="Remove Line Item">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function updateEditingMetadata(field, value) {
  if (!currentEditingOrder) return;
  currentEditingOrder[field] = value;
}

function updateEditingLineItem(idx, field, val) {
  if (!currentEditingOrder || !currentEditingOrder.items || !currentEditingOrder.items[idx]) return;

  if (field === 'quantity') {
    currentEditingOrder.items[idx].quantity = Math.max(1, parseInt(val, 10) || 1);
  } else if (field === 'price') {
    currentEditingOrder.items[idx].price = Math.max(0, parseFloat(val) || 0);
  } else if (field === 'productName') {
    currentEditingOrder.items[idx].productName = val;
  }

  // Update row total display dynamically
  const item = currentEditingOrder.items[idx];
  const rowTotal = (parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 0);
  const rowTotalEl = document.getElementById(`edit-row-total-${idx}`);
  if (rowTotalEl) {
    rowTotalEl.textContent = formatCurrency(rowTotal);
  }

  recalculateEditingTotals();
}

function addEditingLineItemRow() {
  if (!currentEditingOrder) return;
  if (!currentEditingOrder.items) currentEditingOrder.items = [];

  currentEditingOrder.items.push({
    productId: '',
    productName: 'New Item',
    quantity: 1,
    price: 10.00
  });

  const tbody = document.getElementById('edit-order-items-tbody');
  if (tbody) {
    tbody.innerHTML = renderEditingItemRowsHTML();
  }
  recalculateEditingTotals();
}

function removeEditingLineItemRow(idx) {
  if (!currentEditingOrder || !currentEditingOrder.items) return;
  currentEditingOrder.items.splice(idx, 1);

  const tbody = document.getElementById('edit-order-items-tbody');
  if (tbody) {
    tbody.innerHTML = renderEditingItemRowsHTML();
  }
  recalculateEditingTotals();
}

function recalculateEditingTotals() {
  if (!currentEditingOrder || !currentEditingOrder.items) return;

  const subtotal = currentEditingOrder.items.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 0)), 0);
  const tax = subtotal * 0.085;
  const grandTotal = subtotal + tax;

  const subtotalEl = document.getElementById('edit-order-subtotal');
  const taxEl = document.getElementById('edit-order-tax');
  const totalEl = document.getElementById('edit-order-total');

  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
  if (taxEl) taxEl.textContent = formatCurrency(tax);
  if (totalEl) totalEl.textContent = formatCurrency(grandTotal);
}

async function saveEditingOrder() {
  if (!currentEditingOrder) return;

  if (!currentEditingOrder.items || currentEditingOrder.items.length === 0) {
    showToast('Order must contain at least one line item.', 'warning');
    return;
  }

  // Validate items
  for (let i = 0; i < currentEditingOrder.items.length; i++) {
    const item = currentEditingOrder.items[i];
    if (!item.productName || item.productName.trim() === '') {
      showToast(`Item #${i + 1} must have a name`, 'warning');
      return;
    }
  }

  const subtotal = currentEditingOrder.items.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 0)), 0);
  const tax = subtotal * 0.085;
  const totalAmount = subtotal + tax;

  const payload = {
    customerId: currentEditingOrder.customerId,
    customerName: currentEditingOrder.customerName,
    paymentMethod: currentEditingOrder.paymentMethod,
    status: currentEditingOrder.status,
    items: currentEditingOrder.items.map(i => ({
      productId: i.productId || null,
      productName: i.productName,
      quantity: parseInt(i.quantity, 10),
      price: parseFloat(i.price),
      subtotal: parseFloat(i.price) * parseInt(i.quantity, 10)
    })),
    subtotal: subtotal,
    tax: tax,
    totalAmount: totalAmount
  };

  try {
    let updatedOrder = null;
    try {
      updatedOrder = await apiRequest(`/api/orders/${currentEditingOrder.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    } catch(apiErr) {
      if (typeof storage !== 'undefined' && storage.getOrders) {
        const localOrders = storage.getOrders() || [];
        const targetIdx = localOrders.findIndex(o => o.id === currentEditingOrder.id);
        const mergedOrder = {
          ...currentEditingOrder,
          ...payload,
          subtotal,
          tax,
          totalAmount,
          total: totalAmount,
          updatedAt: new Date().toISOString()
        };
        if (targetIdx !== -1) {
          localOrders[targetIdx] = mergedOrder;
        } else {
          localOrders.unshift(mergedOrder);
        }
        storage.saveOrders(localOrders);
        updatedOrder = mergedOrder;
      } else {
        throw apiErr;
      }
    }

    if (typeof storage !== 'undefined' && storage.getOrders && updatedOrder) {
      const localOrders = storage.getOrders() || [];
      const idx = localOrders.findIndex(o => o.id === currentEditingOrder.id);
      if (idx !== -1) {
        localOrders[idx] = { ...localOrders[idx], ...updatedOrder };
        storage.saveOrders(localOrders);
      }
    }

    showToast(`Order #${currentEditingOrder.orderNumber || currentEditingOrder.id} changes saved successfully!`, 'success');
    closeModal('view-order-modal');
    renderOrdersTable();
  } catch (err) {
    showToast(err.message || 'Failed to save order changes', 'danger');
  }
}

/* ==========================================================================
   ROLE-BASED DELETE ORDER ACTION (ADMIN STRICT)
   ========================================================================== */

function confirmDeleteOrder(orderId) {
  if (!isUserAdmin()) {
    showToast('Access denied. Strictly Administrators can delete orders.', 'danger');
    return;
  }

  const ord = cachedOrdersList.find(o => o.id === orderId) || (typeof storage !== 'undefined' && storage.getOrders ? storage.getOrders().find(o => o.id === orderId) : null);
  const orderLabel = ord ? (ord.orderNumber || ord.id) : orderId;

  showConfirmModal({
    title: 'Delete Order',
    message: `Are you sure you want to permanently delete order #${orderLabel}? This action cannot be undone.`,
    confirmText: 'Delete Order',
    onConfirm: async () => {
      try {
        try {
          await apiRequest(`/api/orders/${orderId}`, { method: 'DELETE' });
        } catch(apiErr) {
          if (typeof storage !== 'undefined' && storage.getOrders) {
            let localOrders = storage.getOrders() || [];
            localOrders = localOrders.filter(o => o.id !== orderId);
            storage.saveOrders(localOrders);
          } else {
            throw apiErr;
          }
        }

        if (typeof storage !== 'undefined' && storage.getOrders) {
          let localOrders = storage.getOrders() || [];
          localOrders = localOrders.filter(o => o.id !== orderId);
          storage.saveOrders(localOrders);
        }

        showToast(`Order #${orderLabel} deleted successfully`, 'success');
        closeModal('view-order-modal');
        renderOrdersTable();
      } catch (err) {
        showToast(err.message || 'Error deleting order', 'danger');
      }
    }
  });
}

/* ==========================================================================
   PRINTABLE CUSTOMER INVOICE GENERATOR
   ========================================================================== */

function printOrderInvoice(orderId) {
  let ord = (currentEditingOrder && currentEditingOrder.id === orderId) 
    ? currentEditingOrder 
    : cachedOrdersList.find(o => o.id === orderId);

  if (!ord && typeof storage !== 'undefined' && storage.getOrders) {
    ord = storage.getOrders().find(o => o.id === orderId);
  }

  if (!ord) {
    showToast('Order details not found for invoice generation', 'warning');
    return;
  }

  const settings = (typeof storage !== 'undefined' && storage.getSettings) ? storage.getSettings() : {};
  const businessName = settings.businessName || 'Golden BMS';
  const businessAddress = settings.address || '742 Evergreen Terrace, Suite 400, San Francisco, CA';
  const businessPhone = settings.phone || '+1 (555) 234-5678';
  const businessEmail = settings.businessEmail || 'contact@goldenbms.com';

  const formattedDate = ord.createdAt || ord.date ? new Date(ord.createdAt || ord.date).toLocaleString() : new Date().toLocaleString();

  const subtotal = ord.subtotal !== undefined ? ord.subtotal : ord.items.reduce((s, i) => s + ((parseFloat(i.price) || 0) * (parseInt(i.quantity || i.qty, 10) || 1)), 0);
  const tax = ord.tax !== undefined ? ord.tax : subtotal * 0.085;
  const totalAmount = ord.totalAmount !== undefined ? ord.totalAmount : (ord.total !== undefined ? ord.total : subtotal + tax);

  const printWindow = window.open('', '_blank', 'width=850,height=950');
  if (!printWindow) {
    showToast('Pop-up blocked. Please allow pop-ups to print invoice.', 'warning');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Customer Invoice - #${ord.orderNumber || ord.id}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif; margin: 0; padding: 30px; color: #0f172a; background: #fff; line-height: 1.5; }
        .invoice-card { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 36px; border-radius: 12px; }
        .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #f1f5f9; }
        .brand-title { font-size: 26px; font-weight: 800; color: #3b82f6; margin: 0 0 6px 0; }
        .company-info { font-size: 13px; color: #64748b; }
        .invoice-meta { text-align: right; }
        .invoice-meta h2 { font-size: 28px; font-weight: 900; color: #0f172a; margin: 0 0 6px 0; letter-spacing: 1px; }
        .meta-line { font-size: 13px; color: #475569; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-top: 8px; background: #d1fae5; color: #059669; }
        .billing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #f8fafc; padding: 18px 20px; border-radius: 8px; }
        .billing-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 4px; }
        .billing-val { font-size: 15px; font-weight: 700; color: #0f172a; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .items-table th { background: #3b82f6; color: #ffffff; text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .items-table th:first-child { border-radius: 6px 0 0 6px; }
        .items-table th:last-child { border-radius: 0 6px 6px 0; }
        .items-table td { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #334155; }
        .items-table tr:nth-child(even) td { background: #f8fafc; }
        .totals-section { display: flex; justify-content: flex-end; margin-bottom: 30px; }
        .totals-box { width: 280px; }
        .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #475569; }
        .totals-row.grand-total { border-top: 2px solid #3b82f6; margin-top: 6px; padding-top: 10px; font-size: 18px; font-weight: 800; color: #3b82f6; }
        .invoice-footer { text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 40px; font-size: 13px; color: #94a3b8; }
        @media print {
          body { padding: 0; }
          .invoice-card { border: none; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <div class="invoice-header">
          <div>
            <h1 class="brand-title">${businessName}</h1>
            <div class="company-info">${businessAddress}</div>
            <div class="company-info">Phone: ${businessPhone} | Email: ${businessEmail}</div>
          </div>
          <div class="invoice-meta">
            <h2>INVOICE</h2>
            <div class="meta-line"><strong>Order #:</strong> ${ord.orderNumber || ord.id}</div>
            <div class="meta-line"><strong>Date:</strong> ${formattedDate}</div>
            <div class="status-badge">${ord.status || 'COMPLETED'}</div>
          </div>
        </div>

        <div class="billing-grid">
          <div>
            <div class="billing-title">Billed To</div>
            <div class="billing-val">${ord.customerName || 'Walk-in Customer'}</div>
          </div>
          <div style="text-align:right;">
            <div class="billing-title">Payment Method</div>
            <div class="billing-val">${ord.paymentMethod || 'Credit Card'}</div>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width:50px;">#</th>
              <th>Item Description</th>
              <th style="text-align:center; width:80px;">Qty</th>
              <th style="text-align:right; width:120px;">Unit Price</th>
              <th style="text-align:right; width:130px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(ord.items || []).map((item, idx) => {
              const q = parseInt(item.quantity || item.qty || 1, 10);
              const p = parseFloat(item.price || 0);
              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${item.productName || item.name || 'Item'}</strong></td>
                  <td style="text-align:center;">${q}</td>
                  <td style="text-align:right;">${formatCurrency(p)}</td>
                  <td style="text-align:right;"><strong>${formatCurrency(p * q)}</strong></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="totals-box">
            <div class="totals-row">
              <span>Subtotal:</span>
              <strong>${formatCurrency(subtotal)}</strong>
            </div>
            <div class="totals-row">
              <span>Estimated Tax (8.5%):</span>
              <strong>${formatCurrency(tax)}</strong>
            </div>
            <div class="totals-row grand-total">
              <span>Grand Total:</span>
              <strong>${formatCurrency(totalAmount)}</strong>
            </div>
          </div>
        </div>

        <div class="invoice-footer">
          <p>Thank you for doing business with ${businessName}!</p>
          <p style="font-size:11px; margin-top:4px;">This is a computer-generated invoice and requires no signature.</p>
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
