# Repository Overview

## Project Summary
- **Name**: Student Performance Matrix — Backend API
- **Purpose**: Express + Mongoose backend for attendance, quizzes/assessments, grades, notifications, and results management.
- **Primary Entry Point**: `index.js`

## Core Technologies
- **Runtime**: Node.js (CommonJS modules)
- **Framework**: Express.js
- **Database**: MongoDB via Mongoose
- **Authentication**: JWT with role-based authorization
- **File Uploads**: Handled via `multer`
- **Utilities**: `moment`, `exceljs`, `json2csv`, `qrcode`

## Directory Structure
- **app.js**: Legacy/alternate server bootstrap (delegates to `index.js`).
- **index.js**: Main server bootstrap registering middleware and routes.
- **routes/**: Express routers grouped by domain (attendance, courses, grades, notifications, quizzes, results, etc.).
- **controllers/**: Route handlers for complex domains (e.g., grades).
- **models/**: Mongoose schemas (User, Course, Grade, Attendance, Quiz, QuizSubmission, Notification).
- **middleware/**: Auth (`auth.js`), rate limiting, shared request utilities.
- **services/**: Business logic layers (attendanceRecordService, gradeService, notificationService, etc.).
- **config/**: Database connection, course mapping constants, environment configuration.
- **utils/**: Logger, default seed helpers, shared utilities.
- **uploads/**: File storage for assessment documents.
- **scripts/**: Seeder and diagnostic scripts for local data setup.
- **api/**: Vercel serverless handler wrapper (`api/index.js`).

## Database Overview
- **User**: `role` field distinguishes `student`, `lecturer`, `admin`; stores profile data, linked IDs.
- **Course**: Stores course code, name, lecturer assignments.
- **Grade**: Captures per-student course grades (class, mid-semester, final exam) and audit history.
- **Attendance / Quiz / QuizSubmission / Notification**: Support respective modules.

## Authentication & Authorization
- JWT-based via `Authorization: Bearer <token>` header.
- Middleware attaches `req.user` with `role`, `studentId`, `lecturerId`, etc.
- Separate routes for lecturer vs student dashboards.

## Existing Endpoints (Highlights)
- `/api/attendance/*`: Attendance session lifecycle, logs, exports.
- `/api/quizzes/*`: Quiz creation, submission, grading workflows with notifications.
- `/api/notifications/*`: User-specific notification CRUD.
- `/api/grades/*` and `/api/grades_v2/*`: Grade retrieval and updates.
- `/api/results/*`: Student results retrieval endpoints.
- `/api/courses/*`: Course listing and mapping utilities.

## Configuration & Environment
- `.env` (local) and Vercel env vars: `MONGO_URI`/`MONGODB_URI`, `JWT_SECRET`, optional `FRONTEND_ORIGIN(S)`.
- Server runs on `PORT` (default 3000) when developing locally.
- CORS configured for localhost + configured origins.

## Scripts & Tooling
- `npm run dev`: Start server.
- Seeder scripts (`scripts/seedUsers.js`, `seedCourses.js`, etc.) populate demo data.
- Diagnostic scripts (`diagnose-issue.js`, `test-grade-endpoints.js`, etc.) simulate frontend expectations.

## Testing & Debugging
- No automated test suite yet (`npm test` placeholder).
- Several `test-*.js` scripts for manual verification via Node or REST clients.
- Logging handled via `utils/logger.js` with structured JSON output.

## Deployment Notes
- Deployed on Vercel; uses `api/index.js` handler for serverless deployment.
- Repository: `mensahsandra/spmproject_backend` (GitHub).
- Ensure cold-start friendly patterns (cached Mongoose connection) remain intact.

## Pending Improvements (from project docs)
- Align course mapping with real catalog via backend endpoint.
- Expand quizzes module into full assessments workflow (creation, listing, grading).
- Synchronize lecturer/student dashboards with live backend data.
- Remove temporary console logs once frontend integrates with APIs.