/**
 * NoteTrack - User Dashboard Analytics & Interactions (dashboard.js)
 * Calculates real-time stats from backend notes and renders recent activity.
 */

const Dashboard = {
  /**
   * Initializes User Dashboard
   */
  async init() {
    if (!Auth.requireAuth()) return;
    
    // Load notes data to compute real-time metrics
    await this.loadDashboardData();
    this.setupEventListeners();
  },

  /**
   * Fetches notes and populates stats + recent activity
   */
  async loadDashboardData() {
    const statTotal = document.getElementById('stat-total-notes');
    const statToday = document.getElementById('stat-notes-today');
    const statChars = document.getElementById('stat-total-chars');
    const recentContainer = document.getElementById('recent-notes-container');
    const emptyState = document.getElementById('recent-empty-state');

    try {
      const { notes } = await Notes.getAllNotes();

      // 1. Calculate Total Notes
      if (statTotal) statTotal.textContent = notes.length;

      // 2. Calculate Notes created today
      const todayDateStr = new Date().toISOString().slice(0, 10);
      const notesCreatedToday = notes.filter(n => {
        if (!n.created_at) return false;
        return n.created_at.slice(0, 10) === todayDateStr;
      });

      if (statToday) statToday.textContent = notesCreatedToday.length;

      // 3. Compute Total Content Characters across all notes
      if (statChars) {
        const totalChars = notes.reduce((acc, curr) => acc + (curr.description ? curr.description.length : 0), 0);
        statChars.textContent = totalChars.toLocaleString();
      }

      // 4. Populate Recent Notes (Latest 3-4 notes)
      if (recentContainer) {
        recentContainer.innerHTML = '';

        if (!notes || notes.length === 0) {
          if (emptyState) emptyState.style.display = 'flex';
          recentContainer.style.display = 'none';
        } else {
          if (emptyState) emptyState.style.display = 'none';
          recentContainer.style.display = 'grid';

          // Sort by newest
          const recent = Notes.filterAndSortNotes(notes, { sort: 'newest' }).slice(0, 4);

          recent.forEach(note => {
            const card = Notes.createNoteCardElement(note, true);
            recentContainer.appendChild(card);
          });

          // Bind edit and delete triggers
          this.bindCardActions(recentContainer);
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard metrics:', error);
      UI.showToast(error.message, 'error', 'Failed to load stats');
    }
  },

  /**
   * Binds click handlers for note card edit/delete buttons
   */
  bindCardActions(container) {
    // Delete buttons
    container.querySelectorAll('.btn-delete-note').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        const title = btn.getAttribute('data-title');
        Notes.confirmDelete(id, title, () => {
          this.loadDashboardData();
        });
      };
    });

    // Edit buttons
    container.querySelectorAll('.btn-edit-note').forEach(btn => {
      btn.onclick = async (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        try {
          const note = await Notes.getNoteById(id);
          Notes.openEditModal(note, () => {
            this.loadDashboardData();
          });
        } catch (err) {
          UI.showToast(err.message, 'error');
        }
      };
    });
  },

  /**
   * Setup Quick Create Modal from Dashboard
   */
  setupEventListeners() {
    const quickCreateBtn = document.getElementById('btn-quick-create');
    if (quickCreateBtn) {
      quickCreateBtn.onclick = (e) => {
        e.preventDefault();
        this.openQuickCreateModal();
      };
    }

    const refreshBtn = document.getElementById('btn-refresh-dashboard');
    if (refreshBtn) {
      refreshBtn.onclick = () => {
        UI.showToast('Refreshing dashboard...', 'info', '', 1500);
        this.loadDashboardData();
      };
    }
  },

  /**
   * Quick Create Note Modal Dialog
   */
  openQuickCreateModal() {
    const content = `
      <div class="form-group">
        <label class="form-label" for="quick-note-title">Note Title <span class="optional">(Required)</span></label>
        <input type="text" id="quick-note-title" class="form-control" placeholder="e.g., Sprint Planning Takeaways" autofocus>
      </div>
      <div class="form-group">
        <label class="form-label" for="quick-note-desc">Description <span class="optional">(Required)</span></label>
        <textarea id="quick-note-desc" class="form-control" rows="5" placeholder="Write your note content here..."></textarea>
      </div>
    `;

    UI.showModal({
      title: 'Quick Create Note',
      content,
      confirmText: 'Create Note',
      onConfirm: async () => {
        const titleInput = document.getElementById('quick-note-title');
        const descInput = document.getElementById('quick-note-desc');

        const title = titleInput.value.trim();
        const description = descInput.value.trim();

        if (!title) throw new Error('Please enter a note title.');
        if (!description) throw new Error('Please enter note content.');

        await Notes.createNote(title, description);
        UI.showToast('Note created successfully!', 'success');
        this.loadDashboardData();
      }
    });
  }
};

