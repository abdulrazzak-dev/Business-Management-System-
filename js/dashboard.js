/* ==========================================================================
   Golden - DASHBOARD ANALYTICS & RECENT ACTIVITY (REST API)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.endsWith('dashboard.html') || window.location.pathname.endsWith('dashboard')) {
    loadDashboardData();

    const customerForm = document.getElementById('customer-form');
    if (customerForm) {
      customerForm.addEventListener('submit', handleDashboardCustomerFormSubmit);
    }
  }
});

let salesChartInstance = null;

function openAddCustomerModal() {
  const form = document.getElementById('customer-form');
  if (form) form.reset();

  const modalTitle = document.getElementById('customer-modal-title');
  if (modalTitle) modalTitle.textContent = 'Add New Customer';

  const custIdInput = document.getElementById('customer-id');
  if (custIdInput) custIdInput.value = `CUST-${Math.floor(200 + Math.random() * 800)}`;

  openModal('customer-modal');
}

async function handleDashboardCustomerFormSubmit(e) {
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
    await apiRequest('/api/customers', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    showToast(`New customer "${name}" added successfully!`, 'success');
    closeModal('customer-modal');
    loadDashboardData();
  } catch (err) {
    showToast(err.message || 'Error creating customer', 'danger');
  }
}

async function loadDashboardData() {
  try {
    const data = await apiRequest('/api/dashboard');
    if (!data) return;

    // Render Metric KPIs
    const kpiSales = document.getElementById('kpi-total-sales');
    const kpiOrders = document.getElementById('kpi-total-orders');
    const kpiProducts = document.getElementById('kpi-total-products');
    const kpiCustomers = document.getElementById('kpi-total-customers');
    const kpiLowStock = document.getElementById('kpi-low-stock');

    if (kpiSales) kpiSales.textContent = formatCurrency(data.totalSales);
    if (kpiOrders) kpiOrders.textContent = data.totalOrders;
    if (kpiProducts) kpiProducts.textContent = data.totalProducts;
    if (kpiCustomers) kpiCustomers.textContent = data.totalCustomers;
    if (kpiLowStock) kpiLowStock.textContent = data.lowStockProducts;

    renderRecentTransactions(data.recentTransactions || []);
    renderRecentOrders(data.recentOrders || []);
    renderSalesOverviewChart(data.salesOverview);

  } catch (err) {
    showToast(err.message || 'Failed to load dashboard data', 'danger');
  }
}

function formatCurrency(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function renderRecentTransactions(orders) {
  const container = document.getElementById('recent-transactions-list');
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = `<div class="table-empty-state"><i class="fa-solid fa-receipt"></i><p>No recent transactions</p></div>`;
    return;
  }

  container.innerHTML = orders.map(ord => {
    const formattedDate = ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent';
    const badgeClass = ord.status === 'COMPLETED' ? 'badge-success' : ord.status === 'PROCESSING' ? 'badge-info' : 'badge-warning';
    
    return `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:0.875rem 0; border-bottom:1px solid var(--border-color);">
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <div style="width:36px; height:36px; border-radius:var(--radius-md); background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center;">
            <i class="fa-solid fa-credit-card"></i>
          </div>
          <div>
            <div style="font-weight:700; font-size:0.875rem;">${ord.customerName || 'Walk-in Customer'}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${formattedDate} • ${ord.paymentMethod || 'Card'}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:800; font-size:0.875rem; color:var(--text-main);">${formatCurrency(ord.totalAmount)}</div>
          <span class="badge ${badgeClass}" style="font-size:0.7rem;">${ord.status}</span>
        </div>
      </div>
    `;
  }).join('');
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

function renderRecentOrders(orders) {
  const recentOrdersCard = document.getElementById('recent-orders-card');
  const isAdmin = checkIsAdmin();

  if (!isAdmin) {
    if (recentOrdersCard) recentOrdersCard.style.display = 'none';
    return;
  } else {
    if (recentOrdersCard) recentOrdersCard.style.display = 'block';
  }

  const tbody = document.getElementById('dashboard-recent-orders-tbody');
  if (!tbody) return;

  if (!orders || orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty-state"><i class="fa-solid fa-box-open"></i><p>No recent orders found</p></td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(ord => {
    const badgeClass = ord.status === 'COMPLETED' ? 'badge-success' : ord.status === 'PROCESSING' ? 'badge-info' : 'badge-warning';
    const itemsCount = ord.items ? ord.items.reduce((sum, i) => sum + (i.quantity || 1), 0) : 1;
    const staffDisplay = ord.staffName || (ord.staffId ? `Staff #${ord.staffId}` : 'Admin / System');

    return `
      <tr>
        <td><strong>${ord.orderNumber || ord.id}</strong></td>
        <td>${ord.customerName || 'Customer'}</td>
        <td><span class="badge badge-info"><i class="fa-solid fa-user-tie" style="margin-right:0.25rem;"></i>${staffDisplay}</span></td>
        <td>${itemsCount} item(s)</td>
        <td><strong>${formatCurrency(ord.totalAmount)}</strong></td>
        <td><span class="badge ${badgeClass}"><span class="badge-dot"></span>${ord.status}</span></td>
      </tr>
    `;
  }).join('');
}

function renderSalesOverviewChart(salesOverview) {
  const canvas = document.getElementById('salesOverviewChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (salesChartInstance) salesChartInstance.destroy();

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#334155' : '#e2e8f0';

  const labels = salesOverview?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const revenueData = salesOverview?.revenueData || [1200, 1900, 1500, 2400, 2800, 3200, 2900];
  const ordersData = salesOverview?.ordersData || [15, 22, 18, 29, 35, 40, 38];

  salesChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Revenue (Rs.)',
          data: revenueData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: '#3b82f6',
          pointRadius: 4
        },
        {
          label: 'Orders',
          data: ordersData,
          borderColor: '#8b5cf6',
          backgroundColor: 'transparent',
          tension: 0.4,
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { color: textColor, font: { family: 'Plus Jakarta Sans', weight: '600' } } }
      },
      scales: {
        x: { grid: { color: gridColor, drawBorder: false }, ticks: { color: textColor } },
        y: { grid: { color: gridColor, drawBorder: false }, ticks: { color: textColor } }
      }
    }
  });
}
