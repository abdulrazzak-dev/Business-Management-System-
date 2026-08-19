/* ==========================================================================
   BIZPULSE - SETTINGS & PROFILE MANAGEMENT (REST API)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.endsWith('settings.html') || window.location.pathname.endsWith('settings')) {
    initSettingsPage();
  }
});

function initSettingsPage() {
  loadUserProfile();
  loadBusinessSettings();
  enforceSettingsPermissions();

  const profileForm = document.getElementById('user-profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', handleProfileFormSubmit);
  }

  const form = document.getElementById('business-settings-form');
  if (form) {
    form.addEventListener('submit', handleSettingsFormSubmit);
  }

  const createAdminForm = document.getElementById('create-admin-form');
  if (createAdminForm) {
    createAdminForm.addEventListener('submit', handleCreateAdminFormSubmit);
  }
}

function loadUserProfile() {
  const userJson = localStorage.getItem('user');
  if (!userJson) return;

  try {
    const user = JSON.parse(userJson);
    const nameEl = document.getElementById('profile-full-name');
    const emailEl = document.getElementById('profile-email');
    const roleEl = document.getElementById('profile-role');

    if (nameEl) nameEl.value = user.name || '';
    if (emailEl) emailEl.value = user.email || '';
    if (roleEl) roleEl.value = user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()) : 'Staff';
  } catch (err) {
    console.error('Error loading user profile in settings:', err);
  }
}

function enforceSettingsPermissions() {
  const userJson = localStorage.getItem('user') || localStorage.getItem('currentUser');
  let isAdmin = false;
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      isAdmin = user.role === 'ADMIN';
    } catch (e) {}
  }

  const businessCard = document.getElementById('business-settings-card');
  const createAdminCard = document.getElementById('create-admin-card');
  const nameEl = document.getElementById('settings-business-name');
  const emailEl = document.getElementById('settings-business-email');
  const phoneEl = document.getElementById('settings-business-phone');
  const addressEl = document.getElementById('settings-business-address');
  const taxEl = document.getElementById('settings-tax-rate');
  const currencyEl = document.getElementById('settings-currency');
  const saveBtn = document.getElementById('save-business-settings-btn');

  if (!isAdmin) {
    if (businessCard) {
      businessCard.style.display = 'none';
    }
    if (createAdminCard) {
      createAdminCard.style.display = 'none';
    }

    [nameEl, emailEl, phoneEl, addressEl, taxEl, currencyEl].forEach(el => {
      if (el) {
        el.disabled = true;
        el.title = 'Only Administrators can view and edit store settings.';
        el.style.background = 'var(--bg-surface-subtle)';
        el.style.cursor = 'not-allowed';
      }
    });

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.style.opacity = '0.5';
      saveBtn.style.cursor = 'not-allowed';
    }
  } else {
    if (businessCard) {
      businessCard.style.display = 'block';
    }
    if (createAdminCard) {
      createAdminCard.style.display = 'block';
    }
  }
}

async function handleProfileFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('profile-full-name').value.trim();
  const email = document.getElementById('profile-email').value.trim();
  const password = document.getElementById('profile-password').value.trim();

  if (!name || !email) {
    showToast('Name and email are required', 'warning');
    return;
  }

  const payload = { name, email };
  if (password) {
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'warning');
      return;
    }
    payload.password = password;
  }

  try {
    const updatedUser = await apiRequest('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    if (updatedUser) {
      localStorage.setItem('user', JSON.stringify(updatedUser));
      document.getElementById('profile-password').value = '';
      showToast('Profile updated successfully!', 'success');

      if (typeof updateSidebarUserProfile === 'function') {
        updateSidebarUserProfile();
      }
    }
  } catch (err) {
    showToast(err.message || 'Failed to update profile', 'danger');
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

  const userJson = localStorage.getItem('user') || localStorage.getItem('currentUser');
  let isAdmin = false;
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      isAdmin = user.role === 'ADMIN';
    } catch (err) {}
  }

  if (!isAdmin) {
    showToast('Access denied. Only Administrators can update store settings.', 'danger');
    return;
  }

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
    showToast('Business settings updated!', 'success');
  } catch (err) {
    showToast(err.message || 'Error updating settings', 'danger');
  }
}

async function handleCreateAdminFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('admin-full-name').value.trim();
  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value.trim();

  if (!name || !email || !password) {
    showToast('Please fill in all fields to create an administrator', 'warning');
    return;
  }

  if (password.length < 6) {
    showToast('Password must be at least 6 characters long', 'warning');
    return;
  }

  const payload = { name, email, password };

  try {
    const newAdmin = await apiRequest('/api/users/create-admin', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    showToast(`New administrator "${newAdmin.name || name}" created successfully!`, 'success');
    document.getElementById('create-admin-form').reset();
  } catch (err) {
    showToast(err.message || 'Failed to create administrator account', 'danger');
  }
}
