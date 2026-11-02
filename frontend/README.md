# CodeAlly Frontend

React client for the CodeAlly coding practice and online judging platform. See the [root README](../README.md) for the product overview and [backend README](../backend/README.md) for API and execution setup.

## Features

- Home page, problem list, and problem details.
- Monaco Editor-based coding workspace.
- Custom input and Run output.
- Submit solutions and poll verdicts.
- Submission history and details.
- Registration, email/password login, and JWT-based route protection.
- User profiles and leaderboard.
- Admin problem management UI.
- Forgot-password and reset-password pages.
- Gemini AI code feedback through the backend.

## Stack

React 19, Vite 8, React Router 7, Axios, `@monaco-editor/react`, Tailwind CSS 4, and Lucide React. Exact versions are in `package.json` and `package-lock.json`.

## Structure

```text
frontend/
├── public/
├── src/
│   ├── apis/auth.js       # Axios instance and API functions
│   ├── components/        # Navbar, route guard, compiler, problem details
│   ├── context/           # Authentication context
│   ├── pages/             # Home, problems, compiler, profile, auth, etc.
│   ├── App.jsx            # Route declarations
│   ├── App.css
│   ├── index.css
│   └── main.jsx           # React entry point and providers
├── package.json
└── vite.config.js
```

## Prerequisites

- Node.js and npm.
- A running CodeAlly backend for API-backed functionality.

## Install and configure

From repository root:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_BACKEND_URL=http://127.0.0.1:8000
```

The Axios instance uses this value as its base URL and appends `/api/...` paths. Do not place secrets in `VITE_` variables: Vite bundles them into browser-accessible code.

## Development commands

```bash
npm run dev
npm run lint
npm run build
npm run preview
```

Vite prints the development URL (usually `http://localhost:5173`). `build` creates `dist/`; `preview` serves that build locally.

## Routes

Defined in `src/App.jsx`:

| Route | Page | Access |
|---|---|---|
| `/` | Home | Public |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/compiler` | Online compiler | Public |
| `/forgot-password` | Forgot password | Public |
| `/reset-password/:token` | Reset password | Public |
| `/problems` | Problem list | Protected |
| `/problems/:problemNumber` | Problem details | Protected |
| `/submissions` | Submission history | Protected |
| `/profile` | Current user's profile | Protected |
| `/profile/:id` | User profile | Protected |
| `/leaderboard` | Leaderboard | Protected |
| `/admin/problems` | Problem administration | Protected by client route guard |

Client-side route protection is a navigation/UX feature, not a security boundary. The backend must independently authorize every protected operation.

## Authentication and API integration

`src/main.jsx` mounts `BrowserRouter` and `AuthProvider`. `src/context/AuthContext.jsx` exposes `user`, `loginUser()`, and `logoutUser()`.

The current auth context initializes its authenticated state by checking for an `access` token in `localStorage`. Login stores access and refresh tokens; logout removes them.

`src/apis/auth.js` creates a shared Axios client using `VITE_BACKEND_URL`. Its request interceptor reads the access token and adds:

```http
Authorization: Bearer <access_token>
```

The API module centralizes requests for authentication, problems, profiles, submissions, leaderboard, Run/Submit, admin problem operations, and AI feedback.

### Token-storage note

The current implementation stores JWTs in `localStorage`, which is accessible to JavaScript. Review XSS defenses, token expiry/refresh behavior, and whether a secure HttpOnly-cookie design is more appropriate before production use.

## Coding workflow

### Run code

The editor sends code, selected language, and custom input to the backend Run endpoint. The backend implementation queues execution through Celery and exposes a Run-status endpoint for task polling.

**Integration note:** the compiler component in this repository currently consumes the Run response directly, while the backend task path stores results asynchronously and exposes a status endpoint. Verify and align this contract before relying on the UI for asynchronous Run status.

### Submit solution

The problem compiler sends code, language, and problem number to the Submit endpoint. It receives a submission ID and polls the submission status endpoint until a final verdict is returned.

### Editor persistence

The problem compiler saves selected language, code, and input in `localStorage` using keys scoped to problem and language. This allows the editor state to persist across page reloads in the same browser.

### AI feedback

The UI sends code and problem context to the backend Gemini feedback endpoint. Provider credentials must remain on the backend and must never be embedded in the frontend bundle.

## Backend dependency

Set `VITE_BACKEND_URL` to the backend origin. For execution features, the backend API, PostgreSQL, Redis, Celery worker, Docker daemon, and configured runner image must all be available.

If API requests fail, check:

1. `VITE_BACKEND_URL` is correct.
2. Django is running and the endpoint path is reachable.
3. CORS permits the frontend origin.
4. Access token is valid for protected APIs.
5. PostgreSQL, Redis, Celery, and Docker are running for judge features.

## Implementation considerations

- The UI includes C++, Python, and JavaScript choices in some editor components. The active backend execution path inspected for this README is C++-oriented; verify language support end-to-end before advertising multi-language judging.
- `localStorage` token storage requires careful XSS mitigation and a review of token refresh/expiry behavior.
- Password-reset delivery depends on backend email configuration.
- Frontend route guards do not replace server-side authorization.

## Before contributing

Keep API calls centralized in `src/apis/`, auth state in `AuthContext`, and backend authorization on the server. Run:

```bash
npm run lint
npm run build
```

before submitting frontend changes.

## License

Check the repository root for a license file. If none exists, reuse and redistribution terms have not been specified.
