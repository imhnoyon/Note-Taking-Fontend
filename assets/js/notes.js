/**
 * NoteTrack - Note Management Module (notes.js)
 * Note CRUD operations, filtering, sorting, and UI card generation.
 */

const Notes = {
  /**
   * Fetch all notes for the authenticated user
   * Calls GET /api/note-list/
   */
  async getAllNotes() {
    const res = await API.get(CONFIG.ENDPOINTS.NOTE_LIST);
    // DRF Response format: { success: true, message: "...", count: 3, next: null, previous: null, data: [...] }
    return {
      notes: res.data || [],
      count: res.count || (res.data ? res.data.length : 0),
      raw: res
    };
  },

  /**
   * Fetch single note by ID
   * Calls GET /api/notes/{id}/
   */
  async getNoteById(id) {
    if (!id) throw new Error('Note ID is required.');
    const res = await API.get(CONFIG.ENDPOINTS.NOTE_BY_ID(id));
    return res.data || res;
  },

  /**
   * Create new note
   * Calls POST /api/create/note/
   */
  async createNote(title, description) {
    if (!title || !title.trim()) {
      throw new Error('Please enter a note title.');
    }
    if (!description || !description.trim()) {
      throw new Error('Please enter a note description.');
    }

    const payload = {
      title: title.trim(),
      description: description.trim()
    };

    const res = await API.post(CONFIG.ENDPOINTS.CREATE_NOTE, payload);
    return res.data || res;
  },

  /**
   * Update existing note
   * Calls PATCH /api/update/note/{id}/
   */
  async updateNote(id, title, description) {
    if (!id) throw new Error('Note ID is required.');
    if (!title || !title.trim()) throw new Error('Title cannot be empty.');
    if (!description || !description.trim()) throw new Error('Description cannot be empty.');

    const payload = {
      title: title.trim(),
      description: description.trim()
    };

    const res = await API.patch(CONFIG.ENDPOINTS.UPDATE_NOTE(id), payload);
    return res.data || res;
  },

  /**
   * Delete note by ID
   * Calls DELETE /api/notes/{id}/
   */
  async deleteNote(id) {
    if (!id) throw new Error('Note ID is required.');
    const res = await API.delete(CONFIG.ENDPOINTS.DELETE_NOTE(id));
    return res;
  },

  /**
   * Confirms and deletes a note with smooth modal
   */
  confirmDelete(id, noteTitle = '', onSuccess = null) {
    UI.showModal({
      title: 'Delete Note',
      content: `
        <p style="margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 600;">
          Are you sure you want to delete this note?
        </p>
        <p style="color: var(--text-secondary); font-size: 0.875rem;">
          ${noteTitle ? `"${UI.escapeHTML(noteTitle)}"` : 'This action'} will be permanently removed.
        </p>
      `,
      confirmText: 'Delete Note',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        await this.deleteNote(id);
        UI.showToast('Note deleted successfully', 'success');
        if (onSuccess) onSuccess();
      }
    });
  },

  /**
   * Search, filter and sort in-memory notes list
   */
  filterAndSortNotes(notes, { query = '', sort = 'newest' } = {}) {
    let filtered = [...notes];

    // Search query filter (matches title or description)
    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      filtered = filtered.filter(n => 
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.description && n.description.toLowerCase().includes(q))
      );
    }

    // Sort order
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || a.updated_at || 0).getTime();
      const dateB = new Date(b.created_at || b.updated_at || 0).getTime();

      switch (sort) {
        case 'oldest':
          return dateA - dateB;
        case 'title-asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'title-desc':
          return (b.title || '').localeCompare(a.title || '');
        case 'newest':
        default:
          return dateB - dateA;
      }
    });

    return filtered;
  },

  /**
   * Renders note card HTML component
   */
  createNoteCardElement(note, isUserContext = true) {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.id = `note-${note.id}`;

    const updatedDate = note.updated_at ? UI.timeAgo(note.updated_at) : UI.timeAgo(note.created_at);
    const detailLink = isUserContext 
      ? `note-details.html?id=${note.id}`
      : `#`;

    card.innerHTML = `
      <div class="note-card-header">
        <a href="${detailLink}" class="note-card-title">${UI.escapeHTML(note.title)}</a>
        <div class="note-actions">
          ${isUserContext ? `
            <a href="note-details.html?id=${note.id}" class="action-btn" title="View Note">
              <i class="fa-regular fa-eye"></i>
            </a>
            <button class="action-btn btn-edit-note" data-id="${note.id}" title="Edit Note">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="action-btn delete btn-delete-note" data-id="${note.id}" data-title="${UI.escapeHTML(note.title)}" title="Delete Note">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          ` : `
            <button class="action-btn btn-admin-edit-note" data-id="${note.id}" title="Admin Edit Note">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="action-btn delete btn-admin-delete-note" data-id="${note.id}" data-title="${UI.escapeHTML(note.title)}" title="Admin Delete Note">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          `}
        </div>
      </div>
      <div class="note-card-body">
        <p class="note-card-desc">${UI.escapeHTML(note.description)}</p>
      </div>
      <div class="note-card-footer">
        <span><i class="fa-regular fa-clock"></i> ${updatedDate}</span>
        ${note.username ? `<span class="badge badge-secondary"><i class="fa-regular fa-user"></i> ${UI.escapeHTML(note.username)}</span>` : `<span>${(note.description || '').length} chars</span>`}
      </div>
    `;

    return card;
  },

  /**
   * Generates Quick Edit Modal for instant editing
   */
  openEditModal(note, onSaveCallback) {
    const formContent = `
      <div class="form-group">
        <label class="form-label" for="modal-note-title">Note Title <span class="optional">(Required)</span></label>
        <input type="text" id="modal-note-title" class="form-control" value="${UI.escapeHTML(note.title)}" placeholder="Enter note title">
      </div>
      <div class="form-group">
        <label class="form-label" for="modal-note-desc">Note Description <span class="optional">(Required)</span></label>
        <textarea id="modal-note-desc" class="form-control" rows="5" placeholder="Enter note details...">${UI.escapeHTML(note.description)}</textarea>
      </div>
    `;

    UI.showModal({
      title: 'Edit Note',
      content: formContent,
      confirmText: 'Save Changes',
      onConfirm: async () => {
        const titleInput = document.getElementById('modal-note-title');
        const descInput = document.getElementById('modal-note-desc');

        const newTitle = titleInput.value.trim();
        const newDesc = descInput.value.trim();

        if (!newTitle) throw new Error('Title cannot be empty.');
        if (!newDesc) throw new Error('Description cannot be empty.');

        await Notes.updateNote(note.id, newTitle, newDesc);
        UI.showToast('Note updated successfully', 'success');
        if (onSaveCallback) onSaveCallback();
      }
    });
  }
};

