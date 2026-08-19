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

      const period = e.target.getAttribute('data-period');
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

    if (dailyEl) dailyEl.textContent = `$${Number(summary.dailyRevenue || 0).toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${Number(summary.totalRevenue || 0).toFixed(2)}`;
    if (avgEl) avgEl.textContent = `$${Number(summary.averageOrderValue || 0).toFixed(2)}`;
  } catch (err) {}
}

async function renderRevenueTrendChart(period = 'weekly') {
  const canvas = document.getElementById('reportRevenueChart');
  if (!canvas) return;

  try {
    const reportData = await apiRequest(`/api/reports/${period}`);
    const ctx = canvas.getContext('2d');
    if (revenueChartInstance) revenueChartInstance.destroy();

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
          legend: { labels: { color: textColor, font: { family: 'Plus Jakarta Sans', weight: '600' } } }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor } },
          y: { grid: { color: gridColor }, ticks: { color: textColor } }
        }
      }
    });
  } catch (err) {}
}

let topProductsChartInstance = null; // -> கோப்பின் மேலே global ஆக இருக்க வேண்டும்

async function renderTopSellingProductsChart() {
  const canvas = document.getElementById('topProductsDoughnutChart');
  if (!canvas) return;

  try {
    const topList = await apiRequest('/api/reports/top-products') || [];
    console.log("Top Products Data:", topList); // -> Backend அனுப்பும் data-வை Console-ல் பார்க்க

    if (!topList || topList.length === 0) {
      console.warn("No top products data found.");
      return;
    }

    const ctx = canvas.getContext('2d');
    if (topProductsChartInstance) {
      topProductsChartInstance.destroy();
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';

    // Backend அனுப்பும் key பெயர்களை மாற்று வழிகளுடன் (fallback) எடுப்பது:
    const labels = topList.map(item => item.name || item.productName || 'Unknown');
    const data = topList.map(item => item.sold || item.unitsSold || item.quantity || item.soldCount || 0);

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
    console.error("Top Selling Products Chart Error:", err); // -> பிழையை Console-ல் காட்டும்
  }
}

async function renderTopProductsTable() {
  const tbody = document.getElementById('top-products-tbody');
  if (!tbody) return;

  try {
    const topProducts = await apiRequest('/api/reports/top-products') || [];

    tbody.innerHTML = topProducts.map((tp, idx) => `
      <tr>
        <td><strong>#${idx + 1}</strong></td>
        <td><strong>${tp.name}</strong></td>
        <td><span class="badge badge-info">${tp.category}</span></td>
        <td>${tp.sold} units</td>
        <td><strong>$${Number(tp.revenue).toFixed(2)}</strong></td>
      </tr>
    `).join('');
  } catch (err) {}
}
