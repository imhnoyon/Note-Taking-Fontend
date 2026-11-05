/**
 * NoteTrack - Admin Management Module (admin.js)
 * User administration, system-wide note moderation, interest group analytics, and user posts.
 */

const Admin = {
  /**
   * Fetch all users
   * Calls GET /api/user-list/
   */
  async getAllUsers() {
    const res = await API.get(CONFIG.ENDPOINTS.ADMIN_USER_LIST);
    return {
      users: res.data || [],
      count: res.count || (res.data ? res.data.length : 0),
      raw: res
    };
  },

  /**
   * Fetch single user details
   * Calls GET /api/user/{id}/
   */
  async getUserById(id) {
    if (!id) throw new Error('User ID is required.');
    const res = await API.get(CONFIG.ENDPOINTS.ADMIN_USER_BY_ID(id));
    return res.data || res;
  },

  /**
   * Update user details (e.g. interests or role)
   * Calls PATCH /api/user/{id}/
   */
  async updateUser(id, payload) {
    if (!id) throw new Error('User ID is required.');
    const res = await API.patch(CONFIG.ENDPOINTS.ADMIN_USER_BY_ID(id), payload);
    return res.data || res;
  },

  /**
   * Delete user by ID
   * Calls DELETE /api/user/{id}/
   */
  async deleteUser(id) {
    if (!id) throw new Error('User ID is required.');
    const res = await API.delete(CONFIG.ENDPOINTS.ADMIN_USER_BY_ID(id));
    return res;
  },

  /**
   * Fetch all system notes across all users
   * Calls GET /api/note-lists/
   */
  async getAllNotes() {
    const res = await API.get(CONFIG.ENDPOINTS.ADMIN_ALL_NOTES);
    return {
      notes: res.data || [],
      count: res.count || (res.data ? res.data.length : 0),
      raw: res
    };
  },

  /**
   * Admin Update any note
   * Calls PATCH /api/admin/updates/note/{id}/
   */
  async updateNoteAdmin(id, title, description) {
    if (!id) throw new Error('Note ID is required.');
    const payload = {
      title: title.trim(),
      description: description.trim()
    };
    const res = await API.patch(CONFIG.ENDPOINTS.ADMIN_UPDATE_NOTE(id), payload);
    return res.data || res;
  },

  /**
   * Admin Delete any note
   * Calls DELETE /api/admin/delete/note/{id}/
   */
  async deleteNoteAdmin(id) {
    if (!id) throw new Error('Note ID is required.');
    const res = await API.delete(CONFIG.ENDPOINTS.ADMIN_DELETE_NOTE(id));
    return res;
  },

  /**
   * Fetch users grouped by interests
   * Calls GET /api/admin/users/grouped-by-interests/
   */
  async getInterestsGrouped() {
    const res = await API.get(CONFIG.ENDPOINTS.ADMIN_INTEREST_GROUPS);
    return res.data || [];
  },

  /**
   * Fetch notes/posts created by a specific user ID
   * Calls GET /api/users/{user_id}/posts/
   */
  async getUserPosts(userId) {
    if (!userId) throw new Error('User ID is required.');
    const res = await API.get(CONFIG.ENDPOINTS.ADMIN_USER_POSTS(userId));
    return res.data || [];
  },

  /**
   * Confirm Delete User
   */
  confirmDeleteUser(id, username = '', onSuccess = null) {
    UI.showModal({
      title: 'Delete User Account',
      content: `
        <p style="margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 600;">
          Are you sure you want to permanently delete user "${UI.escapeHTML(username)}"?
        </p>
        <p style="color: var(--danger); font-size: 0.875rem;">
          <i class="fa-solid fa-triangle-exclamation"></i> This action is permanent and cannot be undone.
        </p>
      `,
      confirmText: 'Delete User',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        await this.deleteUser(id);
        UI.showToast(`User ${username} deleted successfully.`, 'success');
        if (onSuccess) onSuccess();
      }
    });
  },

  /**
   * Confirm Delete Note (Admin Mode)
   */
  confirmDeleteNote(id, title = '', onSuccess = null) {
    UI.showModal({
      title: 'Admin Delete Note',
      content: `
        <p style="margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 600;">
          Permanently remove note "${UI.escapeHTML(title)}"?
        </p>
        <p style="color: var(--text-secondary); font-size: 0.875rem;">
          This will delete the note across the entire system.
        </p>
      `,
      confirmText: 'Delete Note',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        await this.deleteNoteAdmin(id);
        UI.showToast('Note deleted successfully.', 'success');
        if (onSuccess) onSuccess();
      }
    });
  },

  /**
   * Admin Edit Note Modal
   */
  openEditNoteModal(note, onSaveCallback) {
    const formContent = `
      <div class="form-group">
        <label class="form-label" for="admin-edit-title">Title</label>
        <input type="text" id="admin-edit-title" class="form-control" value="${UI.escapeHTML(note.title)}">
      </div>
      <div class="form-group">
        <label class="form-label" for="admin-edit-desc">Description</label>
        <textarea id="admin-edit-desc" class="form-control" rows="5">${UI.escapeHTML(note.description)}</textarea>
      </div>
    `;

    UI.showModal({
      title: 'Moderate Note (Admin)',
      content: formContent,
      confirmText: 'Save Changes',
      onConfirm: async () => {
        const title = document.getElementById('admin-edit-title').value.trim();
        const desc = document.getElementById('admin-edit-desc').value.trim();
        if (!title || !desc) throw new Error('Title and Description are required.');

        await Admin.updateNoteAdmin(note.id, title, desc);
        UI.showToast('Note updated by admin.', 'success');
        if (onSaveCallback) onSaveCallback();
      }
    });
  }
};

