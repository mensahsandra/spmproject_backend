# Student Performance Matrix — Backend (API)

Express + Mongoose API for attendance, grades, CWA, deadlines.

## Endpoints
- GET /api/health — service + DB status
- GET /api/version — build/version metadata (name, version, commit, time)
- POST /api/attendance/check-in — student attendance
- POST /api/attendance/generate-session — lecturer QR session
- GET /api/attendance/logs — lecturer logs
- GET /api/attendance/export — CSV export

Auth: Bearer JWT required for protected routes via `Authorization: Bearer <token>`.

## Required environment variables
Set these in Vercel (Project → Settings → Environment Variables):
- MONGO_URI or MONGODB_URI — MongoDB connection string (either works; MONGODB_URI comes from Vercel Mongo integration)
- JWT_SECRET — secret for JWT signing/verification
- FRONTEND_ORIGINS (optional) — comma-separated list of additional allowed CORS origins (e.g. https://spm-frontend.vercel.app,https://admin.spm.app)
- FRONTEND_ORIGIN (optional) — single origin alternative to FRONTEND_ORIGINS

Optional: `PORT` (not used on Vercel serverless).

## Rate limiting
Implemented via `express-rate-limit`:
- Global: 1500 requests / 15 min per IP
- Auth routes: 30 requests / 10 min per IP (protect brute force)
- Attendance check-in: 15 requests / 1 min per IP (reduce rapid duplicate scans)
Responses beyond limits return 429 with JSON `{ ok: false, message: "..." }`.

## Notes
- CORS allows common localhost dev origins plus any origins you supply via FRONTEND_ORIGINS / FRONTEND_ORIGIN.
- If DB is unavailable, API runs with in-memory fallbacks for attendance sessions/logs.
- Connection pooling uses a cached global Mongoose connection (suitable for Vercel serverless cold starts).
- Version metadata: GET /api/version → use for frontend build diagnostics.

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

---
# spm-backend