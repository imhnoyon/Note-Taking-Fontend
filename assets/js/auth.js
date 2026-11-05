/**
 * NoteTrack - Authentication & Authorization Engine (auth.js)
 * Token lifecycle, login/register, admin verification, and route guards.
 */

const Auth = {
  /**
   * User Registration
   * Calls POST /api/register/
   */
  async register(username, password) {
    if (!username || !password) {
      throw new Error('Username and password are required.');
    }

    const payload = {
      username: username.trim(),
      password: password
    };

    const res = await API.post(CONFIG.ENDPOINTS.REGISTER, payload, false);
    return res;
  },

  /**
   * Standard User Login
   * Calls POST /api/login/, stores tokens, then calls GET /api/getme/ to verify role
   */
  async login(username, password) {
    if (!username || !password) {
      throw new Error('Please enter both username and password.');
    }

    const payload = {
      username: username.trim(),
      password: password
    };

    // 1. Authenticate with backend
    const loginRes = await API.post(CONFIG.ENDPOINTS.LOGIN, payload, false);

    if (!loginRes || !loginRes.data || !loginRes.data.access) {
      throw new Error(loginRes.message || 'Login failed. Invalid response from server.');
    }

    const { access, refresh } = loginRes.data;

    // Save tokens temporarily to enable authorized request
    localStorage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, access);
    if (refresh) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, refresh);
    }

    // 2. Fetch authoritative profile from /api/getme/ to get exact role & interests
    try {
      const profileRes = await API.get(CONFIG.ENDPOINTS.GET_ME, true);
      const user = profileRes.data || profileRes;
      
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      return { success: true, user, access };
    } catch (profileErr) {
      // Fallback: If getme fails, construct user object from login data
      const fallbackUser = {
        id: loginRes.data.id,
        username: loginRes.data.username,
        email: loginRes.data.email || '',
        role: 'user'
      };
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(fallbackUser));
      return { success: true, user: fallbackUser, access };
    }
  },

  /**
   * Dedicated Admin Login
   * Enforces that the authenticated user possesses role === 'admin'
   */
  async adminLogin(username, password) {
    const result = await this.login(username, password);
    const user = result.user;

    // Strict role check
    if (user.role !== 'admin') {
      // Clear token immediately to prevent unauthorized privilege
      this.clearSession();
      throw new Error('Access denied. Administrator privileges required.');
    }

    return result;
  },

  /**
   * Clears tokens and session storage
   */
  clearSession() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
  },

  /**
   * Logs out the user with optional redirection
   */
  logout(redirectTarget = null) {
    const user = this.getCurrentUser();
    const isAdmin = user && user.role === 'admin';
    
    this.clearSession();
    sessionStorage.setItem('flash_success_message', 'You have been successfully logged out.');

    let target = redirectTarget;
    if (!target) {
      // Determine root relative destination
      const isNested = window.location.pathname.includes('/user/') || window.location.pathname.includes('/admin/');
      target = isNested ? (isAdmin ? '../admin-login.html' : '../login.html') : (isAdmin ? 'admin-login.html' : 'login.html');
    }

    window.location.href = target;
  },

  /**
   * Returns current user object
   */
  getCurrentUser() {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    const user = this.getCurrentUser();
    return !!(token && user);
  },

  /**
   * Route Guard: Protects routes against unauthenticated or unauthorized users
   * @param {'admin'|'user'|null} requiredRole
   */
  requireAuth(requiredRole = null) {
    if (!this.isAuthenticated()) {
      const isNested = window.location.pathname.includes('/user/') || window.location.pathname.includes('/admin/');
      const loginPage = isNested ? '../login.html' : 'login.html';
      sessionStorage.setItem('auth_redirect_reason', 'Please log in to access this page.');
      window.location.href = loginPage;
      return false;
    }

    const user = this.getCurrentUser();

    // Enforce Admin-only pages
    if (requiredRole === 'admin' && user.role !== 'admin') {
      const isNested = window.location.pathname.includes('/user/') || window.location.pathname.includes('/admin/');
      const userDashboard = isNested ? '../user/dashboard.html' : 'user/dashboard.html';
      sessionStorage.setItem('auth_redirect_reason', 'Access denied. You do not have administrator permissions.');
      window.location.href = userDashboard;
      return false;
    }

    // Auto update user widget in UI
    this.updateUserInterface(user);
    return true;
  },

  /**
   * Redirects authenticated users away from Login/Register pages
   */
  redirectIfAuthenticated() {
    if (this.isAuthenticated()) {
      const user = this.getCurrentUser();
      if (user && user.role === 'admin') {
        window.location.href = 'admin/dashboard.html';
      } else {
        window.location.href = 'user/dashboard.html';
      }
    }
  },

  /**
   * Populates user details into Sidebar and Topbar DOM elements
   */
  updateUserInterface(user) {
    if (!user) return;

    // Display Name
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'User';
    const initials = UI.getInitials(fullName);

    // Update avatar elements
    document.querySelectorAll('.user-avatar').forEach(el => {
      el.textContent = initials;
    });

    // Update name labels
    document.querySelectorAll('.user-name-label').forEach(el => {
      el.textContent = fullName;
    });

    // Update email labels
    document.querySelectorAll('.user-email-label').forEach(el => {
      el.textContent = user.email || `@${user.username}`;
    });

    // Update role badges
    document.querySelectorAll('.user-role-badge').forEach(el => {
      el.textContent = user.role === 'admin' ? 'Administrator' : 'User';
      if (user.role === 'admin') {
        el.className = 'badge badge-danger user-role-badge';
      } else {
        el.className = 'badge badge-primary user-role-badge';
      }
    });

    // Hook logout buttons
    document.querySelectorAll('.btn-logout-trigger').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        UI.showModal({
          title: 'Confirm Logout',
          content: '<p>Are you sure you want to end your current session?</p>',
          confirmText: 'Sign Out',
          confirmClass: 'btn-danger',
          onConfirm: () => {
            Auth.logout();
          }
        });
      };
    });
  },

  /**
   * Refreshes user profile data from /api/getme/
   */
  async refreshProfile() {
    try {
      const res = await API.get(CONFIG.ENDPOINTS.GET_ME);
      if (res && res.data) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(res.data));
        this.updateUserInterface(res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('Could not refresh profile:', e);
    }
  },

  /**
   * Updates user profile (username, email, first_name, last_name, interests)
   */
  async updateProfile(profileData) {
    const res = await API.patch(CONFIG.ENDPOINTS.UPDATE_PROFILE, profileData);
    if (res && (res.data || res.success)) {
      const updated = res.data || res;
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(updated));
      this.updateUserInterface(updated);
      return updated;
    }
    return res;
  }
};

