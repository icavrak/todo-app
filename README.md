# Todo App

A multi-page todo application with authentication and user profile management, built with **Node.js + Express** on the backend and plain HTML/CSS/JS on the frontend.

## Screenshots

| Login | Todo | Profile |
|-------|------|---------|
| ![Login page](https://github.com/user-attachments/assets/f1150cf3-c906-4e76-93ad-e8cf3b575623) | ![Todo page](https://github.com/user-attachments/assets/cd2da0f1-39dc-42ea-a523-52cbb684036f) | ![Profile page](https://github.com/user-attachments/assets/f5b93da7-22ec-4155-a987-292e4e5fa62a) |

## Features

- **Authentication** – session-based login/logout with HTTP-only cookies
- **Todo management** – add, complete, and delete todos (existing UX preserved)
- **Profile editing** – update display name and email
- **Password change** – requires current password verification, enforces minimum 8-character rule
- **Brute-force mitigation** – account locked for 15 minutes after 5 failed login attempts
- **Dark mode** – persisted in `localStorage`, works across all pages
- **Security headers** – Helmet, CORS, SameSite cookies

## Getting Started

### Prerequisites

- Node.js 18 LTS or later
- npm 9+

### Installation

```bash
git clone https://github.com/icavrak/todo-app.git
cd todo-app
npm install
```

### Environment setup

Copy the example environment file and edit as needed:

```bash
cp .env.example .env
```

| Variable         | Default                            | Description                                  |
|------------------|------------------------------------|----------------------------------------------|
| `SESSION_SECRET` | `change-me-to-a-long-random-string`| Secret used to sign the session cookie        |
| `PORT`           | `3000`                             | HTTP port the server listens on              |
| `NODE_ENV`       | `development`                      | Set to `production` for secure cookies       |

> **Important:** Change `SESSION_SECRET` to a long random string before deploying.

### Running locally

```bash
# Development (auto-reload on file changes)
npm run dev

# Production
npm start
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

**Default credentials:**

| Email              | Password   |
|--------------------|------------|
| demo@example.com   | password1  |

The app redirects unauthenticated users to `/login.html`. After logging in, you can access the todo page (`/`) and profile page (`/profile.html`).

## Running Tests

```bash
npm test
```

Tests cover all backend auth and profile endpoints using [Jest](https://jestjs.io/) and [Supertest](https://github.com/ladjs/supertest).

## API Endpoints

| Method | Path                           | Auth required | Description                          |
|--------|--------------------------------|---------------|--------------------------------------|
| `POST` | `/api/login`                   | No            | Log in with email + password         |
| `POST` | `/api/logout`                  | No            | Destroy session                      |
| `GET`  | `/api/session`                 | No            | Check current session status         |
| `GET`  | `/api/profile`                 | Yes           | Get the logged-in user's profile     |
| `PATCH`| `/api/profile`                 | Yes           | Update display name and/or email     |
| `POST` | `/api/profile/change-password` | Yes           | Change password (requires current)   |

### Request/response shapes

**POST /api/login**
```json
// Request
{ "email": "user@example.com", "password": "password1" }

// 200 OK
{ "user": { "id": "1", "displayName": "Demo User", "email": "demo@example.com" } }

// 401 Unauthorized
{ "error": "Invalid email or password" }
```

**PATCH /api/profile**
```json
// Request (fields optional individually)
{ "displayName": "New Name", "email": "new@example.com" }

// 200 OK
{ "user": { "id": "1", "displayName": "New Name", "email": "new@example.com" } }
```

**POST /api/profile/change-password**
```json
// Request
{ "currentPassword": "old-password", "newPassword": "new-password" }

// 200 OK
{ "message": "Password updated successfully" }

// 401 Unauthorized (wrong current password)
{ "error": "Current password is incorrect" }
```

## Project Structure

```
todo-app/
├── server.js               # Express entry point and middleware stack
├── routes/
│   ├── auth.js             # Login / logout / session endpoints
│   └── profile.js          # Profile read/update + password change
├── middleware/
│   ├── auth-guard.js       # Session authentication middleware
│   └── error-handler.js    # Centralized error handling
├── store/
│   └── users.js            # In-memory user store with bcryptjs hashing
├── tests/
│   └── auth.test.js        # Backend route tests (Jest + Supertest)
├── public/
│   └── js/
│       ├── api.js          # Fetch wrapper / API client helper
│       ├── auth-guard.js   # Client-side auth guard & redirect
│       ├── theme.js        # Shared dark/light theme logic
│       ├── login.js        # Login page script
│       ├── todo.js         # Todo page script
│       └── profile.js      # Profile page script
├── index.html              # Todo page (auth-protected)
├── login.html              # Login page (public)
├── profile.html            # Profile page (auth-protected)
├── style.css               # Design system + auth/profile styles
├── script.js               # (legacy, preserved for reference)
├── .env.example            # Environment variable template
└── package.json
```
