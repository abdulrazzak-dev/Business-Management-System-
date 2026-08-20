/* ==========================================================================
   Golden - CUSTOMER MANAGEMENT CONTROLLER (REST API)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.endsWith('customers.html') || window.location.pathname.endsWith('customers')) {
    initCustomersPage();
  }
});

let currentEditingCustomerId = null;
let cachedCustomersList = [];

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

function initCustomersPage() {
  renderCustomersTable();

  const searchInput = document.getElementById('customer-search');
  if (searchInput) searchInput.addEventListener('input', renderCustomersTable);

  const customerForm = document.getElementById('customer-form');
  if (customerForm) customerForm.addEventListener('submit', handleCustomerFormSubmit);

  const phoneInput = document.getElementById('customer-phone');
  if (phoneInput) {
    phoneInput.addEventListener('blur', () => {
      if (phoneInput.value.trim() && typeof formatSriLankanPhone === 'function') {
        phoneInput.value = formatSriLankanPhone(phoneInput.value.trim());
      }
    });
  }
}

async function renderCustomersTable() {
  const tbody = document.getElementById('customers-tbody');
  const actionsTh = document.getElementById('customer-actions-th');
  if (!tbody) return;

  const isAdmin = checkIsAdmin();

  if (actionsTh) {
    actionsTh.style.display = isAdmin ? '' : 'none';
  }

  const searchVal = document.getElementById('customer-search')?.value.trim();

  try {
    const queryString = searchVal ? `?search=${encodeURIComponent(searchVal)}` : '';
    const customers = await apiRequest(`/api/customers${queryString}`);
    cachedCustomersList = customers || [];

    if (cachedCustomersList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="${isAdmin ? '6' : '5'}" class="table-empty-state">
            <i class="fa-solid fa-users"></i>
            <p>No customer profiles found.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = cachedCustomersList.map(c => {
      const actionsTd = isAdmin ? `
        <td>
          <div style="display:flex; gap:0.35rem;">
            <button class="btn btn-sm btn-outline" onclick="openEditCustomerModal('${c.id}')" title="Edit Customer">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn btn-sm btn-outline" style="color:var(--status-danger);" onclick="confirmDeleteCustomer('${c.id}')" title="Delete Customer">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      ` : '';

      return `
        <tr>
          <td><strong>${c.customerCode || c.id}</strong></td>
          <td>
            <div style="font-weight:700;">${c.name}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${c.address || 'No address provided'}</div>
          </td>
          <td>
            <div>${c.email}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${typeof formatSriLankanPhone === 'function' ? formatSriLankanPhone(c.phone) : c.phone}</div>
          </td>
          <td><span class="badge badge-info">${c.ordersCount || 0} Orders</span></td>
          <td><strong>Rs. ${Number(c.totalPurchases || 0).toFixed(2)}</strong></td>
          ${actionsTd}
        </tr>
      `;
    }).join('');
  } catch (err) {
    showToast(err.message || 'Error loading customer profiles', 'danger');
  }
}

function openAddCustomerModal() {
  currentEditingCustomerId = null;
  document.getElementById('customer-modal-title').textContent = 'Add New Customer';
  document.getElementById('customer-form').reset();
  const phoneInput = document.getElementById('customer-phone');
  if (phoneInput) {
    phoneInput.placeholder = '+94 77 554 4332';
  }
  document.getElementById('customer-id').value = `CUST-${Math.floor(200 + Math.random() * 800)}`;
  openModal('customer-modal');
}

function openEditCustomerModal(customerId) {
  if (!checkIsAdmin()) {
    showToast('Access denied. Only Administrators can edit customer details.', 'danger');
    return;
  }

  const c = cachedCustomersList.find(item => item.id === customerId);
  if (!c) return;

  currentEditingCustomerId = customerId;
  document.getElementById('customer-modal-title').textContent = 'Edit Customer Details';
  document.getElementById('customer-id').value = c.customerCode || c.id;
  document.getElementById('customer-name').value = c.name;
  document.getElementById('customer-email').value = c.email;
  document.getElementById('customer-phone').value = c.phone;
  document.getElementById('customer-address').value = c.address || '';
  
  openModal('customer-modal');
}

async function handleCustomerFormSubmit(e) {
  e.preventDefault();

  if (currentEditingCustomerId && !checkIsAdmin()) {
    showToast('Access denied. Only Administrators can update customer profiles.', 'danger');
    return;
  }

  const name = document.getElementById('customer-name').value.trim();
  const email = document.getElementById('customer-email').value.trim();
  let rawPhone = document.getElementById('customer-phone').value.trim();
  const address = document.getElementById('customer-address').value.trim();

  if (!name || !email || !rawPhone) {
    showToast('Please fill in Name, Email, and Phone', 'warning');
    return;
  }

  const isSlValid = typeof SL_PHONE_REGEX !== 'undefined' ? SL_PHONE_REGEX.test(rawPhone) : true;
  if (!isSlValid) {
    showToast('Invalid Sri Lankan telephone number format. Example: +94 77 554 4332 or 0775544332', 'danger');
    return;
  }

  const phone = typeof formatSriLankanPhone === 'function' ? formatSriLankanPhone(rawPhone) : rawPhone;
  document.getElementById('customer-phone').value = phone;

  const payload = { name, email, phone, address };

  try {
    if (currentEditingCustomerId) {
      await apiRequest(`/api/customers/${currentEditingCustomerId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showToast(`Customer "${name}" profile updated`, 'success');
    } else {
      await apiRequest('/api/customers', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showToast(`New customer "${name}" added`, 'success');
    }

    closeModal('customer-modal');
    renderCustomersTable();
  } catch (err) {
    showToast(err.message || 'Error saving customer details', 'danger');
  }
}

function confirmDeleteCustomer(customerId) {
  if (!checkIsAdmin()) {
    showToast('Access denied. Only Administrators can delete customer records.', 'danger');
    return;
  }

  const c = cachedCustomersList.find(item => item.id === customerId);
  if (!c) return;

  showConfirmModal({
    title: 'Delete Customer Profile',
    message: `Are you sure you want to remove customer record "${c.name}"?`,
    confirmText: 'Delete Record',
    onConfirm: async () => {
      try {
        await apiRequest(`/api/customers/${customerId}`, { method: 'DELETE' });
        showToast(`Customer "${c.name}" deleted`, 'success');
        renderCustomersTable();
      } catch (err) {
        showToast(err.message || 'Error deleting customer', 'danger');
      }
    }
  });
}
