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

function initCustomersPage() {
  renderCustomersTable();

  const searchInput = document.getElementById('customer-search');
  if (searchInput) searchInput.addEventListener('input', renderCustomersTable);

  const customerForm = document.getElementById('customer-form');
  if (customerForm) customerForm.addEventListener('submit', handleCustomerFormSubmit);
}

async function renderCustomersTable() {
  const tbody = document.getElementById('customers-tbody');
  if (!tbody) return;

  const searchVal = document.getElementById('customer-search')?.value.trim();

  try {
    const queryString = searchVal ? `?search=${encodeURIComponent(searchVal)}` : '';
    const customers = await apiRequest(`/customers${queryString}`);
    cachedCustomersList = customers || [];

    if (cachedCustomersList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="table-empty-state">
            <i class="fa-solid fa-users"></i>
            <p>No customer profiles found.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = cachedCustomersList.map(c => {
      return `
        <tr>
          <td><strong>${c.customerCode || c.id}</strong></td>
          <td>
            <div style="font-weight:700;">${c.name}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${c.address || 'No address provided'}</div>
          </td>
          <td>
            <div>${c.email}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${c.phone}</div>
          </td>
          <td><span class="badge badge-info">${c.ordersCount || 0} Orders</span></td>
          <td><strong>$${Number(c.totalPurchases || 0).toFixed(2)}</strong></td>
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
  document.getElementById('customer-id').value = `CUST-${Math.floor(200 + Math.random() * 800)}`;
  openModal('customer-modal');
}

function openEditCustomerModal(customerId) {
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

  const name = document.getElementById('customer-name').value.trim();
  const email = document.getElementById('customer-email').value.trim();
  const phone = document.getElementById('customer-phone').value.trim();
  const address = document.getElementById('customer-address').value.trim();

  if (!name || !email || !phone) {
    showToast('Please fill in Name, Email, and Phone', 'warning');
    return;
  }

  const payload = { name, email, phone, address };

  try {
    if (currentEditingCustomerId) {
      await apiRequest(`/customers/${currentEditingCustomerId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showToast(`Customer "${name}" profile updated`, 'success');
    } else {
      await apiRequest('/customers', {
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
  const c = cachedCustomersList.find(item => item.id === customerId);
  if (!c) return;

  showConfirmModal({
    title: 'Delete Customer Profile',
    message: `Are you sure you want to remove customer record "${c.name}"?`,
    confirmText: 'Delete Record',
    onConfirm: async () => {
      try {
        await apiRequest(`/customers/${customerId}`, { method: 'DELETE' });
        showToast(`Customer "${c.name}" deleted`, 'danger');
        renderCustomersTable();
      } catch (err) {
        showToast(err.message || 'Error deleting customer', 'danger');
      }
    }
  });
}
