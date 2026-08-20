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

  const financialForm = document.getElementById('financial-settings-form');
  if (financialForm) {
    financialForm.addEventListener('submit', handleFinancialFormSubmit);
  }

  const createAdminForm = document.getElementById('create-admin-form');
  if (createAdminForm) {
    createAdminForm.addEventListener('submit', handleCreateAdminFormSubmit);
  }

  const usersTableBody = document.getElementById('users-table-body');
  if (usersTableBody) {
    usersTableBody.addEventListener('click', async (e) => {
      const deleteBtn = e.target.closest('.btn-delete-user');
      if (!deleteBtn) return;

      const userId = deleteBtn.getAttribute('data-user-id');
      const userName = deleteBtn.getAttribute('data-user-name') || 'User';

      if (confirm(`Are you sure you want to delete user account "${userName}"? This action cannot be undone.`)) {
        await deleteUserProfile(userId, userName);
      }
    });
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
  const financialCard = document.getElementById('financial-settings-card');
  const createAdminCard = document.getElementById('create-admin-card');
  const managedUsersCard = document.getElementById('managed-users-card');
  const nameEl = document.getElementById('settings-business-name');
  const emailEl = document.getElementById('settings-business-email');
  const phoneEl = document.getElementById('settings-business-phone');
  const addressEl = document.getElementById('settings-business-address');
  const taxEl = document.getElementById('settings-tax-rate');
  const currencyEl = document.getElementById('settings-currency');
  const saveBtn = document.getElementById('save-business-settings-btn');
  const saveFinancialBtn = document.getElementById('save-financial-settings-btn');

  if (!isAdmin) {
    if (businessCard) businessCard.style.display = 'none';
    if (financialCard) financialCard.style.display = 'none';
    if (createAdminCard) createAdminCard.style.display = 'none';
    if (managedUsersCard) managedUsersCard.style.display = 'none';

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

    if (saveFinancialBtn) {
      saveFinancialBtn.disabled = true;
      saveFinancialBtn.style.opacity = '0.5';
      saveFinancialBtn.style.cursor = 'not-allowed';
    }
  } else {
    if (businessCard) businessCard.style.display = 'block';
    if (financialCard) financialCard.style.display = 'block';
    if (createAdminCard) createAdminCard.style.display = 'block';
    if (managedUsersCard) managedUsersCard.style.display = 'block';
    loadManagedUsers();
  }
}

async function loadManagedUsers() {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;

  const currentUserJson = localStorage.getItem('user') || localStorage.getItem('currentUser');
  let currentUserId = null;
  if (currentUserJson) {
    try {
      currentUserId = JSON.parse(currentUserJson).id;
    } catch (e) {}
  }

  try {
    const users = await apiRequest('/api/users');
    if (!users || !Array.isArray(users) || users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No user profiles found.</td></tr>`;
      return;
    }

    tbody.innerHTML = users.map(user => {
      const isSelf = currentUserId && (user.id === currentUserId || String(user.id) === String(currentUserId));
      const roleClass = user.role === 'ADMIN' ? 'badge-primary' : 'badge-info';
      const roleLabel = user.role === 'ADMIN' ? 'ADMIN' : 'STAFF';

      return `
        <tr>
          <td><strong>${escapeHtml(user.name || 'User')}</strong>${isSelf ? ' <span style="font-size:0.75rem; color:var(--primary);">(You)</span>' : ''}</td>
          <td>${escapeHtml(user.email || 'N/A')}</td>
          <td><span class="badge ${roleClass}">${roleLabel}</span></td>
          <td style="text-align:right;">
            ${isSelf ? `
              <button class="btn btn-sm btn-outline" disabled title="You cannot delete your active admin profile" style="opacity:0.4; cursor:not-allowed;">
                <i class="fa-solid fa-trash"></i>
              </button>
            ` : `
              <button class="btn btn-sm btn-outline btn-delete-user" style="color:var(--status-danger); border-color:rgba(239, 68, 68, 0.3);" data-user-id="${escapeHtml(String(user.id))}" data-user-name="${escapeHtml(user.name || 'User')}" title="Delete User">
                <i class="fa-solid fa-trash"></i>
              </button>
            `}
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.warn('Unable to load managed users from /api/users:', err.message || err);
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:1.5rem;"><i class="fa-solid fa-triangle-exclamation" style="color:var(--status-warning); margin-right:0.375rem;"></i> Unable to fetch user profiles from server.</td></tr>`;
  }
}

async function deleteUserProfile(userId, userName) {
  try {
    await apiRequest(`/api/users/${userId}`, { method: 'DELETE' });
    showToast(`User account "${userName}" deleted successfully!`, 'success');
    loadManagedUsers();
  } catch (err) {
    showToast(err.message || 'Failed to delete user profile', 'danger');
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m]);
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
    if (phoneEl) phoneEl.value = typeof formatSriLankanPhone === 'function' ? formatSriLankanPhone(settings.phone || '') : (settings.phone || '');
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

async function handleFinancialFormSubmit(e) {
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
    showToast('Access denied. Only Administrators can update financial settings.', 'danger');
    return;
  }

  const payload = {
    businessName: document.getElementById('settings-business-name')?.value.trim() || '',
    businessEmail: document.getElementById('settings-business-email')?.value.trim() || '',
    phone: document.getElementById('settings-business-phone')?.value.trim() || '',
    address: document.getElementById('settings-business-address')?.value.trim() || '',
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
    showToast('Financial & tax defaults saved!', 'success');
  } catch (err) {
    showToast(err.message || 'Error updating financial settings', 'danger');
  }
}

async function handleCreateAdminFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('admin-full-name').value.trim();
  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value.trim();
  const roleSelect = document.getElementById('newUserRole') || document.getElementById('admin-role-select');
  const role = roleSelect ? roleSelect.value : 'STAFF';

  if (!name || !email || !password) {
    showToast('Please fill in all fields to create a user profile', 'warning');
    return;
  }

  if (password.length < 6) {
    showToast('Password must be at least 6 characters long', 'warning');
    return;
  }

  const payload = { name, email, password, role };

  try {
    const newUser = await apiRequest('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    showToast(`User profile "${newUser.name || name}" (${role}) created successfully!`, 'success');
    document.getElementById('create-admin-form').reset();
    loadManagedUsers();
  } catch (err) {
    showToast(err.message || 'Failed to create user account', 'danger');
  }
}
