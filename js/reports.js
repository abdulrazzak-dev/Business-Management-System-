/* ==========================================================================
   Golden - REPORTS & ANALYTICS CHARTS ENGINE (REST API)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.endsWith('reports.html') || window.location.pathname.endsWith('reports')) {
    initReportsPage();
  }
});

let revenueChartInstance = null;
let topProductsChartInstance = null;

function initReportsPage() {
  renderReportSummaryCards();
  renderRevenueTrendChart('weekly');
  renderTopSellingProductsChart();
  renderTopProductsTable();

  const periodButtons = document.querySelectorAll('.report-period-btn');
  periodButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      periodButtons.forEach(b => b.classList.remove('btn-primary'));
      periodButtons.forEach(b => b.classList.add('btn-outline'));
      e.target.classList.remove('btn-outline');
      e.target.classList.add('btn-primary');

      const period = e.target.getAttribute('data-period') || 'weekly';
      renderRevenueTrendChart(period);
    });
  });
}

async function renderReportSummaryCards() {
  try {
    const summary = await apiRequest('/api/reports/revenue-summary');
    if (!summary) return;

    const dailyEl = document.getElementById('report-daily-revenue');
    const totalEl = document.getElementById('report-total-revenue');
    const avgEl = document.getElementById('report-avg-order-value');

    if (dailyEl) dailyEl.textContent = `Rs. ${Number(summary.dailyRevenue || 0).toFixed(2)}`;
    if (totalEl) totalEl.textContent = `Rs. ${Number(summary.totalRevenue || 0).toFixed(2)}`;
    if (avgEl) avgEl.textContent = `Rs. ${Number(summary.averageOrderValue || 0).toFixed(2)}`;
  } catch (err) {
    console.error("Error loading report summary cards:", err);
  }
}

async function renderRevenueTrendChart(period = 'weekly') {
  const canvas = document.getElementById('reportRevenueChart');
  if (!canvas) return;

  try {
    const reportData = await apiRequest(`/api/reports/${period}`);
    const ctx = canvas.getContext('2d');
    
    if (revenueChartInstance) {
      revenueChartInstance.destroy();
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    const labels = reportData?.labels || [];
    const data = reportData?.data || [];

    revenueChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Revenue Growth ($)',
          data: data,
          backgroundColor: '#3b82f6',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            labels: { 
              color: textColor, 
              font: { family: 'Plus Jakarta Sans', weight: '600' } 
            } 
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor } },
          y: { grid: { color: gridColor }, ticks: { color: textColor } }
        }
      }
    });
  } catch (err) {
    console.error("Error rendering revenue trend chart:", err);
  }
}

async function renderTopSellingProductsChart() {
  const canvas = document.getElementById('topProductsDoughnutChart');
  if (!canvas) return;

  try {
    const topList = await apiRequest('/api/reports/top-products') || [];
    console.log("Top Products Chart Data:", topList);

    if (!topList || topList.length === 0) {
      console.warn("No top products data found for chart.");
      return;
    }

    const ctx = canvas.getContext('2d');
    if (topProductsChartInstance) {
      topProductsChartInstance.destroy();
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    const labels = topList.map(item => item.name || item.productName || 'Unknown');
    const data = topList.map(item => item.sold ?? item.unitsSold ?? item.quantity ?? 0);

    topProductsChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            position: 'bottom', 
            labels: { 
              color: textColor, 
              font: { family: 'Plus Jakarta Sans', weight: '600' } 
            } 
          }
        }
      }
    });
  } catch (err) {
    console.error("Top Selling Products Chart Error:", err);
  }
}

async function renderTopProductsTable() {
  const tbody = document.getElementById('top-products-tbody');
  if (!tbody) return;

  try {
    const topProducts = await apiRequest('/api/reports/top-products') || [];

    if (topProducts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
            No top selling products available.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = topProducts.map((tp, idx) => {
      const name = tp.name || tp.productName || 'N/A';
      const category = tp.category || 'General';
      const sold = tp.sold ?? tp.unitsSold ?? 0;
      const revenue = Number(tp.revenue ?? tp.totalRevenue ?? 0).toFixed(2);

      return `
        <tr>
          <td><strong>#${idx + 1}</strong></td>
          <td><strong>${name}</strong></td>
          <td><span class="badge badge-info">${category}</span></td>
          <td>${sold} units</td>
          <td><strong>$${revenue}</strong></td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error("Top Products Table Error:", err);
  }
}