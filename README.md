# Student Performance Matrix — Backend (API)

Express + Mongoose API for attendance, grades, CWA, deadlines.

## Endpoints
- GET /api/health — service + DB status
- POST /api/attendance/check-in — student attendance
- POST /api/attendance/generate-session — lecturer QR session
- GET /api/attendance/logs — lecturer logs
- GET /api/attendance/export — CSV export

Auth: Bearer JWT required for protected routes via `Authorization: Bearer <token>`.

## Required environment variables
Set these in Vercel (Project → Settings → Environment Variables):
## Required environment variables
Set these in Vercel (Project → Settings → Environment Variables):
- MONGO_URI or MONGODB_URI — MongoDB connection string (either works; MONGODB_URI comes from Vercel Mongo integration)
- JWT_SECRET — secret for JWT signing/verification
- FRONTEND_ORIGINS (optional) — comma-separated list of additional allowed CORS origins (e.g. https://spm-frontend.vercel.app,https://admin.spm.app)
- FRONTEND_ORIGIN (optional) — single origin alternative to FRONTEND_ORIGINS

Optional: `PORT` (not used on Vercel serverless).
## Notes
- CORS allows common localhost dev origins plus any origins you supply via FRONTEND_ORIGINS / FRONTEND_ORIGIN.
- If DB is unavailable, API runs with in-memory fallbacks for attendance sessions/logs.
- Connection pooling uses a simple cached global Mongoose connection suitable for Vercel serverless.
1) Push this `backend/` folder to your GitHub repo (this project already includes serverless adapter):
   - `api/index.js` wraps Express app for serverless
   - `vercel.json` routes all traffic to the serverless entry
2) In Vercel → Import Project → Select GitHub repo
   - Root Directory: `backend`
   - Framework Preset: `Other`
   - Install Command: `npm ci`
   - Build Command: leave empty
   - Output Directory: leave empty
3) Add environment variables (`MONGO_URI`, `JWT_SECRET`).
4) Deploy.

## Local dev
- npm install
- npm run dev (or `node index.js`)
- Health: http://localhost:3000/api/health

## Payloads
Check-in (student):
```
POST /api/attendance/check-in
Authorization: Bearer <token>
Content-Type: application/json
{
  "studentId": "12345678",
  "qrCode": "{\"sessionCode\":\"ABC-XYZ\",\"courseCode\":\"BIT364\"}",
  "centre": "Kumasi",
  "timestamp": "2025-09-24T10:00:00.000Z",
  "location": "Room 101",
  "sessionCode": "ABC-XYZ" // optional fallback if QR not provided
}
```

## Notes
- CORS is configured to allow common localhost dev origins and won’t block preflight.
- If DB is unavailable, API will run with in-memory fallbacks for attendance sessions/logs.# spm-backend