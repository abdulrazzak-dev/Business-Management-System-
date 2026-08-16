/* ==========================================================================
   BIZPULSE - SETTINGS & PROFILE MANAGEMENT (REST API)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.endsWith('settings.html') || window.location.pathname.endsWith('settings')) {
    initSettingsPage();
  }
});

function initSettingsPage() {
  loadBusinessSettings();

  const form = document.getElementById('business-settings-form');
  if (form) {
    form.addEventListener('submit', handleSettingsFormSubmit);
  }
}

async function loadBusinessSettings() {
  try {
    const settings = await apiRequest('/api/settings');
    if (!settings) return;

    const nameEl = document.getElementById('settings-business-name');
    const emailEl = document.getElementById('settings-business-email');
    const phoneEl = document.getElementById('settings-business-phone');
    const addressEl = document.getElementById('settings-business-address');
    const currencyEl = document.getElementById('settings-currency');
    const taxEl = document.getElementById('settings-tax-rate');

    if (nameEl) nameEl.value = settings.businessName || '';
    if (emailEl) emailEl.value = settings.businessEmail || '';
    if (phoneEl) phoneEl.value = settings.phone || '';
    if (addressEl) addressEl.value = settings.address || '';
    if (currencyEl) currencyEl.value = settings.currency || 'USD';
    if (taxEl) taxEl.value = settings.taxRate || 8.5;
  } catch (err) {
    showToast(err.message || 'Error loading settings', 'danger');
  }
}

async function handleSettingsFormSubmit(e) {
  e.preventDefault();

  const payload = {
    businessName: document.getElementById('settings-business-name').value.trim(),
    businessEmail: document.getElementById('settings-business-email').value.trim(),
    phone: document.getElementById('settings-business-phone').value.trim(),
    address: document.getElementById('settings-business-address').value.trim(),
    currency: document.getElementById('settings-currency').value,
    taxRate: parseFloat(document.getElementById('settings-tax-rate').value) || 0,
    theme: document.documentElement.getAttribute('data-theme') || 'light',
    notificationsEnabled: true
  };

  try {
    await apiRequest('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    showToast('Business settings updated in MongoDB!', 'success');
  } catch (err) {
    showToast(err.message || 'Error updating settings', 'danger');
  }
}
