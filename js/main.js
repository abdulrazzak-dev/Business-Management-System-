/* ==========================================================================
   Golden - MAIN UI CONTROLLER, MODAL ENGINE & TOAST SYSTEM
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSidebar();
  initToastContainer();
  highlightActiveNavLink();
  checkAuthSession();
  initOmniSearch();
});

// Toast Engine
function initToastContainer() {
  if (!document.getElementById('toast-container')) {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
}

function showToast(message, type = 'info', title = '') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const iconMap = {
    success: 'fa-circle-check',
    danger: 'fa-circle-xmark',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
  };

  const defaultTitles = {
    success: 'Success',
    danger: 'Error',
    warning: 'Warning',
    info: 'Information'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${iconMap[type] || 'fa-circle-info'} fa-lg"></i>
    <div class="toast-content">
      <div class="toast-title">${title || defaultTitles[type]}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <i class="fa-solid fa-xmark toast-close" onclick="this.parentElement.remove()"></i>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOutRight 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Theme Engine
function initTheme() {
  const savedTheme = localStorage.getItem('Golden_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('Golden_theme', newTheme);
  updateThemeIcon(newTheme);
  showToast(`Switched to ${newTheme} mode`, 'info');
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;
  btn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
}

// Navigation & Sidebar Controls
function initSidebar() {
  const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.innerWidth <= 992) {
        document.body.classList.toggle('mobile-menu-open');
      } else {
        document.body.classList.toggle('sidebar-collapsed');
      }
    });
  }

  const overlay = document.querySelector('.sidebar-mobile-overlay');
  if (overlay) {
    overlay.addEventListener('click', () => {
      document.body.classList.remove('mobile-menu-open');
    });
  }

  // Close sidebar drawer when clicking navigation items on mobile
  const sidebarLinks = document.querySelectorAll('.sidebar .nav-item');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 992) {
        document.body.classList.remove('mobile-menu-open');
      }
    });
  });
}

function highlightActiveNavLink() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.sidebar .nav-item');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'dashboard.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Authentication Session Check
function checkAuthSession() {
  const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
  const token = localStorage.getItem('token');

  if (!token && !isLoginPage) {
    window.location.href = 'index.html';
  } else if (token && isLoginPage) {
    window.location.href = 'dashboard.html';
  } else if (token) {
    updateSidebarUserProfile();
  }
}

function updateSidebarUserProfile() {
  const userJson = localStorage.getItem('user');
  if (!userJson) return;

  try {
    const user = JSON.parse(userJson);
    const avatarEl = document.querySelector('.sidebar-footer .avatar');
    const nameEl = document.querySelector('.sidebar-footer .user-name');
    const roleEl = document.querySelector('.sidebar-footer .user-role');

    if (nameEl && user.name) {
      nameEl.textContent = user.name;
    }

    if (roleEl && user.role) {
      roleEl.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
    }

    if (avatarEl && user.name) {
      const nameParts = user.name.trim().split(/\s+/);
      let initials = '';
      if (nameParts.length >= 2) {
        initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
      } else if (nameParts.length === 1 && nameParts[0].length > 0) {
        initials = nameParts[0].substring(0, 2).toUpperCase();
      }
      if (initials) {
        avatarEl.textContent = initials;
      }
    }
  } catch (err) {
    console.error('Error updating sidebar user profile:', err);
  }
}

function logoutUser() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showToast('Logged out successfully', 'success');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 600);
}

// Modal Helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
  }
}

// Global Confirmation Modal
function showConfirmModal({ title, message, confirmText = 'Delete', onConfirm }) {
  let confirmModal = document.getElementById('global-confirm-modal');
  if (!confirmModal) {
    confirmModal = document.createElement('div');
    confirmModal.id = 'global-confirm-modal';
    confirmModal.className = 'modal-backdrop';
    confirmModal.innerHTML = `
      <div class="modal-card" style="max-width:400px;">
        <div class="modal-header">
          <h3 class="modal-title" id="confirm-modal-title">Confirm Action</h3>
          <button class="modal-close-btn" onclick="closeModal('global-confirm-modal')"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body" id="confirm-modal-msg">Are you sure?</div>
        <div class="modal-footer">
          <button class="btn btn-secondary btn-sm" onclick="closeModal('global-confirm-modal')">Cancel</button>
          <button class="btn btn-danger btn-sm" id="confirm-modal-btn">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(confirmModal);
  }

  document.getElementById('confirm-modal-title').textContent = title;
  document.getElementById('confirm-modal-msg').textContent = message;
  const actionBtn = document.getElementById('confirm-modal-btn');
  actionBtn.textContent = confirmText;
  
  actionBtn.onclick = () => {
    closeModal('global-confirm-modal');
    if (typeof onConfirm === 'function') onConfirm();
  };

  openModal('global-confirm-modal');
}

// Omni-Search Engine
let omniSearchDebounceTimer = null;

function initOmniSearch() {
  const searchInput = document.querySelector('.header-search input');
  const searchContainer = document.querySelector('.header-search');
  if (!searchInput || !searchContainer) return;

  let dropdown = document.getElementById('omni-search-dropdown');
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.id = 'omni-search-dropdown';
    dropdown.className = 'omni-search-dropdown';
    searchContainer.appendChild(dropdown);
  }

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(omniSearchDebounceTimer);

    if (query.length < 2) {
      dropdown.classList.remove('show');
      dropdown.innerHTML = '';
      return;
    }

    omniSearchDebounceTimer = setTimeout(() => {
      fetchOmniSearchResults(query, dropdown);
    }, 300);
  });

  document.addEventListener('click', (e) => {
    if (!searchContainer.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });

  searchInput.addEventListener('focus', () => {
    if (dropdown.children.length > 0 && searchInput.value.trim().length >= 2) {
      dropdown.classList.add('show');
    }
  });
}

async function fetchOmniSearchResults(query, dropdown) {
  try {
    const data = await apiRequest(`/api/search?q=${encodeURIComponent(query)}`);
    if (!data) {
      dropdown.classList.remove('show');
      return;
    }

    const categories = [
      { key: 'products', title: 'Products', icon: 'fa-boxes-stacked' },
      { key: 'orders', title: 'Orders', icon: 'fa-cart-shopping' },
      { key: 'customers', title: 'Customers', icon: 'fa-users' },
      { key: 'inventory', title: 'Inventory', icon: 'fa-warehouse' },
      { key: 'activity', title: 'Activity', icon: 'fa-clock-rotate-left' }
    ];

    let html = '';
    let totalMatches = 0;

    categories.forEach(cat => {
      const items = data[cat.key] || [];
      if (items.length > 0) {
        totalMatches += items.length;
        html += `
          <div class="omni-search-group">
            <div class="omni-search-group-header">
              <i class="fa-solid ${cat.icon}"></i> ${cat.title}
            </div>
            ${items.map(item => {
              const statusUpper = (item.status || '').toUpperCase();
              let pillClass = 'omni-search-status-default';
              if (statusUpper === 'COMPLETED') pillClass = 'omni-search-status-completed';
              else if (statusUpper === 'PENDING') pillClass = 'omni-search-status-pending';
              else if (statusUpper === 'PROCESSING') pillClass = 'omni-search-status-processing';
              else if (statusUpper === 'LOW STOCK') pillClass = 'omni-search-status-pending';

              return `
                <a href="${item.url}" class="omni-search-item">
                  <div class="omni-search-item-left">
                    <div class="omni-search-item-title">${item.title}</div>
                    <div class="omni-search-item-subtitle">${item.subtitle}</div>
                  </div>
                  <div class="omni-search-item-right">
                    <div class="omni-search-item-price">${item.details || ''}</div>
                    ${item.status ? `<span class="omni-search-status-pill ${pillClass}">${item.status}</span>` : ''}
                  </div>
                </a>
              `;
            }).join('')}
          </div>
        `;
      }
    });

    if (totalMatches === 0) {
      dropdown.innerHTML = `
        <div style="padding:1rem; text-align:center; color:var(--text-muted); font-size:0.85rem;">
          <i class="fa-solid fa-magnifying-glass" style="margin-bottom:0.25rem;"></i>
          <p>No results found for "${query}"</p>
        </div>
      `;
    } else {
      dropdown.innerHTML = html;
    }

    dropdown.classList.add('show');
  } catch (err) {
    console.error('Omni-search error:', err);
    dropdown.classList.remove('show');
  }
}
