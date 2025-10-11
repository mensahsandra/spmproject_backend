# Student Performance Matrix — Backend (API)

Express + Mongoose API for attendance, grades, CWA, deadlines.

## Repository & Deployment
- **GitHub Repository:** https://github.com/mensahsandra/spmproject_backend.git
- **Vercel Deployment:** https://spmproject-backend-34xnz1owc-mensahsandras-projects.vercel.app

## Endpoints

### Core System
- GET /api/health — service + DB status
- GET /api/version — build/version metadata (name, version, commit, time)
- GET /api/status — combined health + version metadata

### Attendance
- POST /api/attendance/check-in — student attendance (sends notification to lecturer)
- POST /api/attendance/generate-session — lecturer QR session
- GET /api/attendance/logs — lecturer logs
- GET /api/attendance/export — CSV export
- DELETE /api/attendance/reset — reset attendance data (lecturer only, requires confirmReset: true)

### Quizzes
- POST /api/quizzes/create — create quiz (sends notifications to students + lecturer)
- POST /api/quizzes/:quizId/submit — submit quiz (sends notifications to student + lecturer)
- POST /api/quizzes/:quizId/submissions/:submissionId/grade — grade submission (sends notifications to student + lecturer)
- GET /api/quizzes/student/available — get available quizzes for student
- GET /api/quizzes/student/submissions — get student's submissions
- GET /api/quizzes/:quizId/submissions — get submissions for grading (lecturer)
- GET /api/quizzes/lecturer/dashboard — lecturer quiz dashboard
- GET /api/quizzes/lecturer/courses — get lecturer's courses

### Notifications
- GET /api/notifications — get all notifications (paginated, filtered by user)
- GET /api/notifications/unread-count — get unread notification count for bell icon
- PATCH /api/notifications/:id/read — mark notification as read
- POST /api/notifications/mark-all-read — mark all notifications as read
- DELETE /api/notifications/:id — delete notification
- GET /api/notifications/stats — get notification statistics

Auth: Bearer JWT required for protected routes via `Authorization: Bearer <token>`.

## Required environment variables
Set these in Vercel (Project → Settings → Environment Variables):
- MONGO_URI or MONGODB_URI — MongoDB connection string (either works; MONGODB_URI comes from Vercel Mongo integration)
- JWT_SECRET — secret for JWT signing/verification
- FRONTEND_ORIGINS (optional) — comma-separated list of additional allowed CORS origins (e.g. https://spm-frontend.vercel.app,https://admin.spm.app)
- FRONTEND_ORIGIN (optional) — single origin alternative to FRONTEND_ORIGINS

Optional: `PORT` (not used on Vercel serverless).

## Notification System
Comprehensive notification system for quiz and attendance workflows:

### Notification Types
- **quiz_created** — Sent to students when lecturer creates quiz; confirmation sent to lecturer
- **quiz_submitted** — Sent to student (confirmation) and lecturer (new submission alert)
- **quiz_graded** — Sent to student (results available) and lecturer (grading confirmation)
- **attendance_scan** — Sent to lecturer when student scans QR code

### Features
- Role-based segregation (students only see student notifications, lecturers only see lecturer notifications)
- Unread count for bell icon via `/api/notifications/unread-count`
- Action URLs for navigation (e.g., `/student/assessment`, `/lecturer/notifications`)
- Priority levels (low, normal, high, urgent)
- Metadata for rich context (quiz titles, scores, student names, etc.)
- Auto-expiration support via TTL indexes

### Notification Flow
1. **Quiz Creation**: Lecturer creates quiz → Students + lecturer receive notifications
2. **QR Scan**: Student scans QR → Lecturer receives notification
3. **Quiz Submission**: Student submits → Student + lecturer receive notifications
4. **Quiz Grading**: Lecturer grades → Student + lecturer receive notifications

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

## Logging
Structured JSON logs via `utils/logger.js` with fields: level, msg, time, and contextual metadata (request id, durationMs, etc.). Each request gets an `X-Request-ID` header.

Events:
- request.start
- request.body (debug keys only)
- request.complete
- route.not_found
- error.unhandled

## Unified errors
All errors follow shape:
```
{
  ok: false,
  error: "error_code",
  message: "Human readable message"
}
```
404 returns `{ ok:false, error:'not_found', message:'Route not found' }`.

## Framework preset (Vercel)
Use "Other" as Framework Preset. (This is a plain Express API served via serverless function.)