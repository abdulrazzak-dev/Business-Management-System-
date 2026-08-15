/* ==========================================================================
   BIZPULSE - MAIN UI CONTROLLER, MODAL ENGINE & TOAST SYSTEM
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSidebar();
  initToastContainer();
  highlightActiveNavLink();
  checkAuthSession();
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
  const savedTheme = localStorage.getItem('bizpulse_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('bizpulse_theme', newTheme);
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
    sidebarToggleBtn.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
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
