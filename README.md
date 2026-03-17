# Fitness Tracking MERN App

## Quick Start

### Backend
1. `cd backend`
2. Copy `.env.example` to `.env` and set `MONGO_URI` + `JWT_SECRET`.
3. `npm install`
4. `npm run dev`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Production Deployments
- Frontend (Vercel): `https://snm-health-monitor.vercel.app/`
- Backend API (Render): `https://snm-health-monitor-3.onrender.com/` (all routes served under `/api`)

To point any client at the hosted API, set `VITE_API_URL=https://snm-health-monitor-3.onrender.com/api` in `frontend/.env` (and mirror the same value inside Vercel → Project Settings → Environment Variables). The backend reads `FRONTEND_URL` from its `.env`/Render env vars—set it to `https://snm-health-monitor.vercel.app` so CORS, emails, and redirects use the live site.
