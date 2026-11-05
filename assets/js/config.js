/**
 * NoteTrack - Centralized Configuration (config.js)
 * Manages API endpoints, storage keys, and environment settings.
 */

const CONFIG = {
  // Default Backend Base URL (trailing slash included)
  DEFAULT_BASE_URL: 'http://127.0.0.1:8000/',

  // LocalStorage Keys
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'notetrack_access_token',
    REFRESH_TOKEN: 'notetrack_refresh_token',
    USER_DATA: 'notetrack_user_data',
    THEME: 'notetrack_theme',
    CUSTOM_BASE_URL: 'notetrack_api_base_url'
  },

  // Exact API Endpoints from Postman DRF collection
  ENDPOINTS: {
    // Auth
    REGISTER: 'api/register/',
    LOGIN: 'api/login/',

    // User Panel
    GET_ME: 'api/getme/',
    UPDATE_PROFILE: 'api/getme/',
    CREATE_NOTE: 'api/create/note/',
    NOTE_LIST: 'api/note-list/',
    NOTE_BY_ID: (id) => `api/notes/${id}/`,
    UPDATE_NOTE: (id) => `api/update/note/${id}/`,
    DELETE_NOTE: (id) => `api/notes/${id}/`,

    // Admin Panel
    ADMIN_USER_LIST: 'api/user-list/',
    ADMIN_USER_BY_ID: (id) => `api/user/${id}/`,
    ADMIN_ALL_NOTES: 'api/note-lists/',
    ADMIN_UPDATE_NOTE: (id) => `api/admin/updates/note/${id}/`,
    ADMIN_DELETE_NOTE: (id) => `api/admin/delete/note/${id}/`,
    ADMIN_INTEREST_GROUPS: 'api/admin/users/grouped-by-interests/',
    ADMIN_USER_POSTS: (userId) => `api/users/${userId}/posts/`
  },

  /**
   * Retrieves the current base URL (checks localStorage override first)
   */
  getBaseUrl() {
    const saved = localStorage.getItem(this.STORAGE_KEYS.CUSTOM_BASE_URL);
    let base = saved ? saved.trim() : this.DEFAULT_BASE_URL;
    if (!base.endsWith('/')) {
      base += '/';
    }
    return base;
  },

  /**
   * Updates base URL in localStorage
   */
  setBaseUrl(url) {
    if (!url) {
      localStorage.removeItem(this.STORAGE_KEYS.CUSTOM_BASE_URL);
      return;
    }
    let base = url.trim();
    if (!base.endsWith('/')) {
      base += '/';
    }
    localStorage.setItem(this.STORAGE_KEYS.CUSTOM_BASE_URL, base);
  }
};

// Freeze to prevent accidental overwrites
Object.freeze(CONFIG.STORAGE_KEYS);

