/* ==========================================================================
   BIZPULSE - LOGIN & AUTHENTICATION SCRIPT (REST API INTEGRATION)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const togglePasswordBtn = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('password');

  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      togglePasswordBtn.classList.toggle('fa-eye');
      togglePasswordBtn.classList.toggle('fa-eye-slash');
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();

      if (!email || !password) {
        showToast('Please enter both email and password', 'warning');
        return;
      }

      try {
        showToast('Authenticating with backend...', 'info');
        
        const data = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        if (data && data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));

          showToast(`Welcome back, ${data.user.name}! Redirecting...`, 'success');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 800);
        }
      } catch (err) {
        showToast(err.message || 'Login failed! Check credentials.', 'danger');
      }
    });
  }
});
