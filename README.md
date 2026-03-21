# SNM Health Monitor

MERN-based health and wellness tracker built with the MERN stack for workouts, nutrition, vitals, and admin insights.

## Quick Start

### Backend
1. `cd backend`
2. Copy `.env.example` to `.env` and set `MONGO_URI` + `JWT_SECRET`.
3. `npm install`
4. `npm run dev`
5. (Optional) For SMS reminders, set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` in `.env`.
6. (Optional) For Google SSO, set `GOOGLE_CLIENT_ID` to your OAuth client ID.
7. (Optional) For the AI assistant, set `OPENAI_API_KEY` (GPT‑4o / GPT‑4.1 capable key).

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

Set `VITE_API_URL` plus optional `VITE_GOOGLE_CLIENT_ID` in `frontend/.env` for Google SSO.
If you enable the AI assistant, no frontend env change is required—the backend key powers it automatically.

## Production Deployments
- Frontend (Vercel): `https://snm-health-monitor.vercel.app/`
- Backend API (Render): `https://snm-health-monitor-4.onrender.com/` (all routes served under `/api`)

To point any client at the hosted API, set `VITE_API_URL=https://snm-health-monitor-4.onrender.com/api` in `frontend/.env` (and mirror the same value inside Vercel -> Project Settings -> Environment Variables). The backend reads `FRONTEND_URL` from its `.env`/Render env vars�set it to `https://snm-health-monitor.vercel.app` so CORS, emails, and redirects use the live site.

