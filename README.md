# NoteTrack - Professional Note Tracking Application

A modern, high-performance, and fully responsive **Note Tracking SaaS Frontend** built with pure **HTML5, CSS3, and Vanilla JavaScript (ES6+)**. 

This application connects directly with your Django REST Framework (DRF) + MongoDB backend API collection with **zero frontend frameworks** (No React, Vue, Angular, Bootstrap, or Tailwind CSS).

---

## 🌟 Key Features

### 1. Robust Authentication & Role-Based Authorization
- **User Authentication:** User Registration (`/api/register/`) and Login (`/api/login/`).
- **Admin Authentication:** Dedicated Admin Portal (`admin-login.html`) enforcing server-authoritative role verification (`role === "admin"`).
- **JWT Lifecycle Management:** Automatic injection of `Authorization: Bearer <token>` in requests, handling 401 token expirations gracefully with session redirect notifications.
- **Route Guards:** Client-side route protection preventing unauthenticated users from accessing dashboards and preventing regular users from accessing administrator routes.

### 2. User Workspace (`/user/`)
- **Dashboard (`dashboard.html`):**
  - Real-time stat metrics: Total Notes, Notes Created Today, Total Character Count.
  - Recent Notes stream with relative timestamps (`2 hours ago`, `Just now`).
  - Quick Note Creation modal.
- **Note Management (`notes.html`):**
  - Full CRUD operations with backend persistence.
  - Live real-time search filtering across title and description content.
  - Multi-criteria sorting: Newest first, Oldest first, Title (A-Z), Title (Z-A).
  - Quick edit modal & delete confirmation dialog.
- **Dedicated Note Creation (`create-note.html`):**
  - Form validation with live word and character counters.
  - Discard confirmation protection.
- **Note Details (`note-details.html`):**
  - Dynamic ID resolution via query parameters (`?id=<note_id>`).
  - Comprehensive view with created and updated timestamps, MongoDB document ID, and one-click clipboard copy.
- **User Profile & Interests (`profile.html`):**
  - View and update profile via `/api/getme/` (`GET` and `PATCH`).
  - Interactive chip-tag manager for user interests (e.g., Technology, Artificial Intelligence).

### 3. Administrator Portal (`/admin/`)
- **Admin Dashboard (`dashboard.html`):**
  - Platform-wide statistics: Registered Users count, System-Wide Notes count, and Active Interest Groups.
  - **Interest Analytics:** Real-time visualization of users grouped by topic interests utilizing `/api/admin/users/grouped-by-interests/`.
  - Recent system notes stream with author attribution.
- **User Management (`users.html`):**
  - Inspect all registered accounts (`/api/user-list/`).
  - Search by username, email, full name, or interest.
  - Filter by role (`User` vs `Administrator`).
  - Edit user profile details and interests modal (`PATCH /api/user/{id}/`).
  - Permanent account deletion with confirmation (`DELETE /api/user/{id}/`).
- **User Drilldown & Author Posts (`user-details.html`):**
  - Specific user inspection displaying all notes created by that user using `/api/users/{user_id}/posts/`.
  - Admin note moderation directly from the user drilldown view.
- **System Notes Moderation (`notes.html`):**
  - System-wide note moderation utilizing `/api/note-lists/`.
  - Search across notes by author username, title, or body content.
  - Admin update (`PATCH /api/admin/updates/note/{id}/`) and delete (`DELETE /api/admin/delete/note/{id}/`).

### 4. Premium UI/UX Design System
- **Modern SaaS Palette:** Indigo & Slate primary colors, crisp neutral surfaces, clean borders, and multi-tier shadows.
- **Dark Mode Support:** Built-in light/dark theme switcher with CSS custom properties, persistent via `localStorage`.
- **Feedback & States:**
  - Non-blocking floating toast notifications (Success, Error, Warning, Info).
  - Accessible modal dialogs with backdrop blur.
  - Shimmering skeleton loaders during network roundtrips.
  - Friendly empty states with clear calls-to-action.
- **Fully Responsive:** Tested and optimized for mobile devices (375px, 390px, 430px), tablets (768px), laptops (1366px), and desktop displays (1440px, 1920px). Features a slide-out mobile drawer with backdrop.

---

## 📡 Backend API Integration Mapping

All frontend actions map to your existing Django REST Framework endpoints:

| Feature / UI View | HTTP Method | Endpoint | Description |
| :--- | :---: | :--- | :--- |
| **User Registration** | `POST` | `/api/register/` | Register new user account with username and password |
| **User / Admin Login** | `POST` | `/api/login/` | Obtain access and refresh JWT tokens |
| **Current User Profile** | `GET` | `/api/getme/` | Fetch authenticated profile & verify user role |
| **Update Current Profile** | `PATCH` | `/api/getme/` | Update profile fields and interest list |
| **Fetch User Notes** | `GET` | `/api/note-list/` | Retrieve all notes created by logged-in user |
| **Create New Note** | `POST` | `/api/create/note/` | Create a note with `title` and `description` |
| **Get Single Note Details** | `GET` | `/api/notes/{id}/` | Retrieve note by MongoDB document ID |
| **Update Note** | `PATCH` | `/api/update/note/{id}/` | Update note title and description |
| **Delete Note** | `DELETE` | `/api/notes/{id}/` | Delete note by ID |
| **Admin List All Users** | `GET` | `/api/user-list/` | Retrieve all platform users |
| **Admin Get User By ID** | `GET` | `/api/user/{id}/` | Retrieve specific user details |
| **Admin Update User** | `PATCH` | `/api/user/{id}/` | Update user interests or role |
| **Admin Delete User** | `DELETE` | `/api/user/{id}/` | Remove user from MongoDB |
| **Admin All Notes** | `GET` | `/api/note-lists/` | Retrieve all notes across all users with author usernames |
| **Admin Update Note** | `PATCH` | `/api/admin/updates/note/{id}/` | Moderate/update any note |
| **Admin Delete Note** | `DELETE` | `/api/admin/delete/note/{id}/` | Delete note across the platform |
| **Admin Interest Analytics** | `GET` | `/api/admin/users/grouped-by-interests/` | Aggregate users grouped by interest tags |
| **Admin User's Posts** | `GET` | `/api/users/{user_id}/posts/` | Fetch notes authored by specific user ID |

---

## 📁 Project Directory Structure

```
f:\Interview\Fontend\
│
├── index.html                   # Landing page with product preview & smart redirects
├── login.html                   # User login with password visibility & feedback
├── register.html                # User registration with validation
├── admin-login.html             # Dedicated administrator portal login
│
├── user/
│   ├── dashboard.html           # User overview with live stats & recent notes
│   ├── notes.html               # All notes list (search, filter, sort, modals)
│   ├── create-note.html         # Note editor form with live character counters
│   ├── note-details.html        # Single note view with metadata & copy tools
│   └── profile.html             # Profile editor and interactive interests manager
│
├── admin/
│   ├── dashboard.html           # Admin overview, metrics & interest groups analytics
│   ├── users.html               # User directory, role filters, edit/delete actions
│   ├── user-details.html        # Specific user drilldown & authored posts list
│   └── notes.html               # System-wide note moderation table
│
├── assets/
│   ├── css/
│   │   ├── style.css            # CSS variables, typography, reset, buttons, modals, toasts
│   │   ├── auth.css             # Authentication layouts and input styling
│   │   ├── dashboard.css        # Sidebar, topbar, cards, stat grids, tables
│   │   └── responsive.css       # Mobile drawer, breakpoints (375px to 1920px)
│   │
│   ├── js/
│   │   ├── config.js            # Base URL, endpoints dictionary, storage keys
│   │   ├── api.js               # Centralized fetch wrapper, token injector, error handling
│   │   ├── ui.js                # Toasts, modals, theme toggler, date formatters, skeletons
│   │   ├── auth.js              # Token lifecycle, guards, role verifier, login/logout
│   │   ├── notes.js             # User note CRUD operations and card renderer
│   │   ├── dashboard.js         # User dashboard metric calculations
│   │   └── admin.js             # Admin management & moderation handlers
│   │
│   └── images/
│       └── logo.svg             # NoteTrack SVG brand logo
│
└── README.md                    # Setup and documentation
```

---

## 🚀 How to Run the Application

You can serve this frontend using any lightweight local static HTTP server.

### Option 1: Using Python (Recommended)
Open a terminal in `f:\Interview\Fontend` and run:

```bash
# Python 3
python -m http.server 3000
```
Then visit: **`http://localhost:3000`** in your browser.

### Option 2: Using Node.js `serve` / `npx`
```bash
npx serve -l 3000 .
```

### Option 3: Using VS Code Live Server
Right-click on `index.html` inside VS Code and choose **"Open with Live Server"**.

---

## ⚙️ Backend API Configuration

By default, the application connects to:
```
http://127.0.0.1:8000/
```

### Changing the Backend URL Dynamically
You don't need to touch the code to change your backend URL:
1. Click the **"API Base URL"** pill at the bottom right corner of any page (or click the gear icon in the dashboard topbar).
2. Enter your custom backend address (e.g. `http://localhost:8000/` or `https://your-api.com/`).
3. Click **"Save & Reconnect"**. The application will instantly persist it in `localStorage` and reconnect.

Alternatively, you can edit `assets/js/config.js`:
```javascript
DEFAULT_BASE_URL: 'http://127.0.0.1:8000/'
```

---

## 🛡️ Security & Token Handling Details

1. **Authoritative Role Check:** When logging in through `admin-login.html` or `login.html`, the application requests `/api/getme/` with the received JWT token. Only if `user.role === 'admin'` will admin pages be unlocked.
2. **Expired Token Invalidation:** When the Django backend returns HTTP `401 Unauthorized`, the client clears stored tokens and notifies the user with an automatic redirect back to login.
3. **XSS Protection:** All dynamic text rendered from backend data (titles, descriptions, usernames, interest tags) passes through `UI.escapeHTML()` before insertion into the DOM.

