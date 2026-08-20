/* ==========================================================================
   Golden - LOGIN & AUTHENTICATION SCRIPT (REST API INTEGRATION)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const togglePasswordBtn = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('password');
  const toggleRegPasswordBtn = document.getElementById('toggle-reg-password');
  const regPasswordInput = document.getElementById('reg-password');

  const showRegisterLink = document.getElementById('show-register-link');
  const showLoginLink = document.getElementById('show-login-link');

  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      togglePasswordBtn.classList.toggle('fa-eye');
      togglePasswordBtn.classList.toggle('fa-eye-slash');
    });
  }

  if (toggleRegPasswordBtn && regPasswordInput) {
    toggleRegPasswordBtn.addEventListener('click', () => {
      const type = regPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      regPasswordInput.setAttribute('type', type);
      toggleRegPasswordBtn.classList.toggle('fa-eye');
      toggleRegPasswordBtn.classList.toggle('fa-eye-slash');
    });
  }

  if (showRegisterLink && showLoginLink) {
    showRegisterLink.addEventListener('click', (e) => {
      e.preventDefault();
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
    });

    showLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      registerForm.style.display = 'none';
      loginForm.style.display = 'block';
    });
  }

  // Demo / Quick Login Card Selection Logic
  const demoCards = document.querySelectorAll('.demo-card');
  const emailInput = document.getElementById('email');

  if (demoCards.length && emailInput && passwordInput) {
    demoCards.forEach((card) => {
      card.addEventListener('click', () => {
        const email = card.getAttribute('data-email');
        const password = card.getAttribute('data-password');

        if (email) emailInput.value = email;
        if (password) passwordInput.value = password;

        demoCards.forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
      });
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
        
        const data = await apiRequest('/api/auth/login', {
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

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value.trim();

      if (!name || !email || !password) {
        showToast('Please fill in all fields', 'warning');
        return;
      }

      if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'warning');
        return;
      }

      try {
        showToast('Creating account...', 'info');

        const data = await apiRequest('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password })
        });

        if (data && data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));

          showToast(`Account created! Welcome, ${data.user.name}! Redirecting...`, 'success');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 800);
        }
      } catch (err) {
        showToast(err.message || 'Registration failed! Email might already be in use.', 'danger');
      }
    });
  }
});
