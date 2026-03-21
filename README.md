# SNM Health Monitor
**Build healthy habits in English + Tamil** -- SNM Health Monitor is a bilingual MERN application that unifies workout tracking, macro logging, hydration, vitals, reminders, and admin oversight. The frontend keeps the UI copy in sync across English/Tamil via `frontend/src/context/LanguageContext.jsx`, while the backend enforces security, notifications, and analytics.

## Product Goals (Bilingual Positioning)
- **Whole-health cockpit** -- Workouts, foods, water, heart-rate, and weight trends live on the dashboard (`frontend/src/pages/Dashboard.jsx`).
- **Personal guidance** -- Profile planning, BMI goals, and reminders (`frontend/src/pages/Profile.jsx` + `backend/utils/reminderScheduler.js`) keep members consistent.
- **Bilingual trust** -- Language toggle + Tamil copy strings in `LanguageContext.jsx` ensure localization parity without maintaining duplicate pages.
- **Ops and compliance ready** -- Admin stats/logs (`frontend/src/pages/Admin.jsx`, `backend/routes/admin.js`) plus SMTP + PDF/CSV exports cover auditing needs.

## Platform & Architecture

### Backend (Express + MongoDB)
- `backend/server.js` wires middleware (`express.json`, `cors`) and mounts every REST resource under `/api/*`, keeping dev vs production origins aligned with `FRONTEND_URL`.
- `backend/package.json` exposes `npm run dev` / `npm start` for local vs hosted runs with `"type": "module"` for ES imports.

#### API routes
| File | Base Path | Highlights |
| --- | --- | --- |
| `backend/routes/auth.js` | `/api/auth` | Registration/login, OTP reset emails, strong password rules, Google SSO via `google-auth-library`. |
| `backend/routes/users.js` | `/api/users` | Profile CRUD, weight history, reminder preferences, and password updates (protected by `authMiddleware`). |
| `backend/routes/workouts.js` | `/api/workouts` | CRUD for workout entries with type/category metadata. |
| `backend/routes/foods.js` | `/api/foods` | Meal logging and calorie totals. |
| `backend/routes/water.js` | `/api/water` | Water intake logging per day. |
| `backend/routes/heartRate.js` | `/api/heart-rate` | Resting heart-rate captures for recovery tracking. |
| `backend/routes/summary.js` | `/api/summary` | 30-day aggregates, streaks, and weekly reports that power dashboard charts. |
| `backend/routes/admin.js` | `/api/admin` | Admin-only stats, audit log pruning, SMTP secrets management, CSV/PDF analytics exports. |

#### Data models (Mongoose)
- `backend/models/User.js` -- Profile core, reminder schema (channels, quiet hours), verification + reset tokens, weight history, and per-user goals.
- `backend/models/Workout.js` -- Workout session metadata including category enums for filtering.
- `backend/models/Food.js` -- Food entries with kcal + timestamps.
- `backend/models/WaterIntake.js` -- Water intake in milliliters per day.
- `backend/models/HeartRate.js` -- Resting BPM entries.
- `backend/models/Settings.js` -- Encrypted SMTP payload for multi-tenant email settings (consumed by the mailer).

#### Utility layers
- `backend/utils/mailer.js` -- Fetches SMTP credentials either from `.env` or the encrypted `Settings` document, normalizes the "from" identity, and sends email via Nodemailer.
- `backend/utils/reminderScheduler.js` -- Minute-level scheduler that looks at each user's reminder window, quiet hours, SMS eligibility, and enqueues jobs to email/SMS senders. Uses `Intl.DateTimeFormat` to honor local time zones.

### Frontend (Vite + React 18)
- `frontend/package.json` defines Vite scripts plus Tailwind plugins; `npm run dev` opens Chrome automatically for rapid iteration.
- `frontend/src/main.jsx` bootstraps React Router, providers, and optional Google OAuth wrapper (only when `VITE_GOOGLE_CLIENT_ID` is defined).
- `frontend/src/App.jsx` centralizes routing, attaches `Navbar`, enforces auth via `ProtectedRoute`, and mounts the `AssistantChat` floating helper.

#### Global contexts & styling
- `frontend/src/context/AuthContext.jsx` -- Persists JWT, bootstraps `/users/me`, and exposes login/register/logout helpers to the UI.
- `frontend/src/context/LanguageContext.jsx` -- Dual-language dictionary (en/ta) plus interpolation helper so UI copy is centralized.
- `frontend/src/context/ThemeContext.jsx` -- System/light/dark theme persistence, toggled from the navbar.
- `frontend/src/index.css` -- Tailwind base plus custom gradients/glassmorphism + `.theme-light/.theme-dark` helpers for consistent visuals.

#### Core pages
| Page | Purpose |
| --- | --- |
| `Dashboard.jsx` | Fetches summary/workouts/foods/heart-rate to populate stat tiles + charts. |
| `Profile.jsx` | Rich profile editor, BMI calculator, goal planner, reminder form (days, quiet hours, SMS validation). |
| `Workouts.jsx` | Workout + heart-rate CRUD with `WorkoutForm` / `HeartRateForm`. |
| `Diet.jsx` | Food and water log with calorie balance tiles. |
| `Admin.jsx` | Admin-only stats, SMTP form, analytics exports, audit log list. |
| `Library.jsx` | Static exercise explorer with Tamil translations per filter. |
| `Login.jsx`, `Register.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`, `VerifyEmail.jsx` | Auth flows + OTP UX. |

#### Shared components & forms
- `frontend/src/components/StatCard.jsx` -- Glass stat tiles with tone variants.
- `frontend/src/components/ProgressCharts.jsx` -- Recharts dashboards (energy balance, hydration vs recovery, weight trend) plus CSV download.
- `frontend/src/components/Navbar.jsx` -- Auth-aware nav links, bilingual + theme toggles, logout CTA.
- `frontend/src/components/FoodForm.jsx`, `WaterForm.jsx`, `WorkoutForm.jsx` -- Controlled forms with Tamil-friendly suggestions, date pickers, and validation.

#### API client
- `frontend/src/api/axios.js` centralizes the base URL (from `VITE_API_URL`) and automatically attaches the JWT from `localStorage` before hitting `/api/*`.

#### Assets
- `frontend/src/assets/logo.png` -- App avatar used across auth/dash.
- `frontend/public/favicon.jpg` -- Public favicon for the Vite build. Keep replacements optimized (square, <=256x256).

## Environment Configuration
Use the new example files as canonical references and copy them when bootstrapping local `.env` files.

### `backend/.env.example`
| Variable | Description |
| --- | --- |
| `PORT` | Express port (defaults to 5000). |
| `MONGO_URI` | MongoDB connection string for the `fitnessdb` cluster. |
| `JWT_SECRET` | 32+ char random string for signing tokens. |
| `FRONTEND_URL` | URL allowed by CORS + auth emails (e.g., `http://localhost:5173`). |
| `SMTP_*` | Host/port/user/pass/from pair for OTP + notification emails. |
| `SETTINGS_ENC_KEY` | Master key used to encrypt SMTP secrets stored in MongoDB. |
| `ADMIN_*` | Seed admin profile for first-run bootstrap (optional). |
| `TWILIO_*` | Required when enabling SMS reminders in the profile reminder form. |
| `GOOGLE_CLIENT_ID` | OAuth Client ID for Google login (must match GCP console). |
| `OPENAI_API_KEY` | Optional key that powers the AI coach (`/api/assistant`). |

### `frontend/.env.example`
| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Points to the backend base (e.g., `http://localhost:5000/api` or Render URL). |
| `VITE_GOOGLE_CLIENT_ID` | Mirrors backend Google OAuth ID so the web client can render Google Login. Leave blank to hide the button. |

## Local Development Workflow
1. **Backend**
   ```bash
   cd backend
   cp .env.example .env   # fill in secrets
   npm install
   npm run dev
   ```
   MongoDB must be reachable, and optional services (SMTP/Twilio/OpenAI) can remain blank while testing.

2. **Frontend**
   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```
   Vite serves on port 5173 by default; ensure `VITE_API_URL` matches the backend (`http://localhost:5000/api`).

## Deployment (Render + Vercel)
Use both `.env.example` files as checklists when configuring each platform's environment variables.

1. **Backend API on Render**
   - Create a Web Service pointing to `backend/`, set `Build Command` = `npm install` and `Start Command` = `npm start`.
   - Add env vars from `backend/.env.example`. At minimum: `PORT` (Render supplies), `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL` (use the Vercel domain), and any optional integrations (`SMTP_*`, `TWILIO_*`, `GOOGLE_CLIENT_ID`, `OPENAI_API_KEY`).
   - Enable Background Workers only if you run `startReminderScheduler` out of band; otherwise the scheduler inside `server.js` runs within the web dyno.

2. **Frontend on Vercel**
   - Import the repo with root `frontend/`, `Build Command` = `npm run build`, `Output` = `dist`.
   - Mirror variables from `frontend/.env.example`; set `VITE_API_URL` to the Render URL plus `/api` (for example `https://snm-health-monitor-4.onrender.com/api`) and copy `VITE_GOOGLE_CLIENT_ID` if Google Login is enabled.
   - After deploy, update Render's `FRONTEND_URL` to the Vercel domain (for CORS + email links) and confirm the favicon/logo assets load from `dist`.

3. **Smoke test**
   - Hit `<render-url>/api/test` for a quick health check.
   - Log in at the Vercel site, toggle the language/theme via the navbar, and visit `/admin` with an admin account to verify SMTP + exports.

By keeping this README and the `.env.example` files in sync, you have a single source of truth for developers, operators, and stakeholders who need to understand how every file in this repo maps to a feature.
