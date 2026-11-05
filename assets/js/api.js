/**
 * NoteTrack - Centralized API Client (api.js)
 * Robust fetch wrapper handling auth headers, error formatting, and 401 expiration.
 */

const API = {
  /**
   * Main fetch request wrapper
   * @param {string} endpoint - Relative or absolute API endpoint
   * @param {object} options - Fetch options (method, body, headers, etc.)
   * @param {boolean} requireAuth - Whether to include Bearer token (default: true)
   */
  async request(endpoint, options = {}, requireAuth = true) {
    const baseUrl = CONFIG.getBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${cleanEndpoint}`;

    // Default headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {})
    };

    // Attach Authorization Bearer token if required
    if (requireAuth) {
      const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const fetchConfig = {
      ...options,
      headers
    };

    // If body is object and not a FormData/Blob, stringify
    if (fetchConfig.body && typeof fetchConfig.body === 'object' && !(fetchConfig.body instanceof FormData)) {
      fetchConfig.body = JSON.stringify(fetchConfig.body);
    }

    try {
      const response = await fetch(url, fetchConfig);

      // Handle 401 Unauthorized (Expired or Invalid token)
      if (response.status === 401 && requireAuth) {
        this.handleUnauthorized();
        throw new Error('Your session has expired. Please sign in again.');
      }

      // Check for 204 No Content
      if (response.status === 204) {
        return { success: true, message: 'Operation successful' };
      }

      // Parse JSON response
      let responseData = null;
      const text = await response.text();
      try {
        responseData = text ? JSON.parse(text) : {};
      } catch (err) {
        responseData = { raw: text };
      }

      // If HTTP error code
      if (!response.ok) {
        const errorMessage = this.extractErrorMessage(responseData, response.status);
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = responseData;
        throw error;
      }

      return responseData;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('Network Error: Backend may be offline or CORS blocked.', error);
        throw new Error(`Unable to connect to backend at ${baseUrl}. Please ensure Django server is running.`);
      }
      throw error;
    }
  },

  /**
   * Helper methods for standard HTTP verbs
   */
  get(endpoint, requireAuth = true) {
    return this.request(endpoint, { method: 'GET' }, requireAuth);
  },

  post(endpoint, body = {}, requireAuth = true) {
    return this.request(endpoint, { method: 'POST', body }, requireAuth);
  },

  patch(endpoint, body = {}, requireAuth = true) {
    return this.request(endpoint, { method: 'PATCH', body }, requireAuth);
  },

  delete(endpoint, body = null, requireAuth = true) {
    const opts = { method: 'DELETE' };
    if (body) opts.body = body;
    return this.request(endpoint, opts, requireAuth);
  },

  /**
   * Parses various API response and validation error formats
   */
  extractErrorMessage(data, status) {
    if (!data) return `Request failed with status ${status}`;

    // Format: { success: false, message: "..." }
    if (data.message && typeof data.message === 'string') {
      return data.message;
    }

    // Format: { detail: "..." }
    if (data.detail && typeof data.detail === 'string') {
      return data.detail;
    }

    // Format: { error: "..." }
    if (data.error && typeof data.error === 'string') {
      return data.error;
    }

    // DRF Validation error format: { field_name: ["Error message 1", ...] }
    if (typeof data === 'object') {
      const messages = [];
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          messages.push(`${key}: ${value.join(', ')}`);
        } else if (typeof value === 'string') {
          messages.push(`${key}: ${value}`);
        }
      }
      if (messages.length > 0) {
        return messages.join(' | ');
      }
    }

    return `An unexpected error occurred (Code ${status})`;
  },

  /**
   * Handles expired token by clearing credentials and redirecting to login
   */
  handleUnauthorized() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);

    // Save current path to redirect back after login
    const currentPath = window.location.pathname;
    if (!currentPath.includes('login.html') && !currentPath.includes('register.html')) {
      const isNested = currentPath.includes('/user/') || currentPath.includes('/admin/');
      const isAdminPage = currentPath.includes('/admin/');
      const target = isAdminPage ? 'admin-login.html' : 'login.html';
      sessionStorage.setItem('auth_redirect_reason', 'Your session has expired. Please log in again.');
      window.location.href = isNested ? `../${target}` : target;
    }
  }
};
