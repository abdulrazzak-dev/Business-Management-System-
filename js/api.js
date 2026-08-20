/* ==========================================================================
   Golden - CENTRAL API FETCH ENGINE & JWT INTERCEPTOR
   ========================================================================== */

const API_BASE_URL = "https://business-management-system-edeg.onrender.com";

// Helper function to safely extract the JWT token from multiple storage keys
function getAuthToken() {
  const directToken = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (directToken) return directToken;

  const rawUser = localStorage.getItem("currentUser") || localStorage.getItem("user") || sessionStorage.getItem("currentUser") || sessionStorage.getItem("user");
  if (rawUser) {
    try {
      const parsedUser = JSON.parse(rawUser);
      return parsedUser.token || parsedUser.jwt || parsedUser.accessToken || null;
    } catch (e) {
      return null;
    }
  }

  return null;
}

async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();

  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
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

    // Handle 401 Unauthorized or 403 Forbidden
    if (response.status === 401 || response.status === 403) {
      const isLoginPage =
        window.location.pathname.endsWith("index.html") ||
        window.location.pathname.endsWith("login.html") ||
        window.location.pathname === "/" ||
        window.location.pathname.endsWith("/");

      if (!isLoginPage) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("currentUser");
        sessionStorage.clear();
        window.location.href = "index.html";
        throw new Error("Session expired or unauthorized. Please log in again.");
      }
    }

    // Handle HTTP error statuses
    if (!response.ok) {
      let errorMsg = `Server error (${response.status})`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorData.error || errorData.detail || errorMsg;
      } catch (e) {
        try {
          const textError = await response.text();
          if (textError) errorMsg = textError;
        } catch (_) {}
      }
      throw new Error(errorMsg);
    }

    // Handle 204 No Content (e.g. DELETE requests)
    if (response.status === 204) {
      return null;
    }

    // Safely parse JSON or handle empty response bodies
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
}