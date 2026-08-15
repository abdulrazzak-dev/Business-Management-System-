/* ==========================================================================
   BIZPULSE - CENTRAL API FETCH ENGINE & JWT INTERCEPTOR
   ========================================================================== */

const API_BASE_URL = "https://business-management-system-edeg.onrender.com";

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401 || response.status === 403) {
      // Unauthorized or Expired Token
      const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
      if (!isLoginPage) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "index.html";
        throw new Error("Session expired. Please log in again.");
      }
    }

    if (!response.ok) {
      let errorMsg = "Something went wrong";
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorData.error || errorMsg;
      } catch (e) {}
      throw new Error(errorMsg);
    }

    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
}
