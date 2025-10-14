
// app.js
const express = require("express");
const cors = require("cors");
const mongoose = require('mongoose');
const morgan = require("morgan");
const crypto = require('crypto');
const logger = require('./utils/logger');
const { apiLimiter, authLimiter, attendanceLimiter } = require('./middleware/rateLimit');

const app = express();

// Normalize accidental double /api/api prefix (defensive safety net for clients
// that already include /api in their base URL while also appending /api/* paths)
app.use((req, res, next) => {
    if (req.url.startsWith('/api/api/')) {
        req.url = req.url.replace(/^\/api\/api\//, '/api/');
    }
    next();
});

// Request ID + start time
app.use((req, res, next) => {
    req.id = crypto.randomUUID();
    req.startHr = process.hrtime.bigint();
    res.setHeader('X-Request-ID', req.id);
    next();
});

// Request logging (minimal; body logged separately below)
app.use((req, res, next) => {
    logger.info('request.start', { id: req.id, method: req.method, url: req.url, ip: req.ip });
    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - req.startHr) / 1e6;
        logger.info('request.complete', { id: req.id, status: res.statusCode, durationMs: +durationMs.toFixed(2) });
    });
    next();
});

// Middleware
// CORS: Comprehensive configuration to handle all dev ports and local variations
// Allow dynamic production origins via env FRONTEND_ORIGINS (comma-separated) or FRONTEND_ORIGIN
const dynamicOrigins = (process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
const allowedOrigins = new Set([
    // Localhost variations
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    // Common frontend dev ports
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://localhost:5179',
    'http://localhost:5180',
    'http://localhost:5181',
    'http://localhost:5182',
    'http://localhost:5183', // <- actual frontend port in package.json
    'http://localhost:5184',
    'http://localhost:5185',
    ...dynamicOrigins,
    // 127.0.0.1 equivalents
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5176',
    'http://127.0.0.1:5177',
    'http://127.0.0.1:5178',
    'http://127.0.0.1:5179',
    'http://127.0.0.1:5180',
    'http://127.0.0.1:5181',
    'http://127.0.0.1:5182',
    'http://127.0.0.1:5183',
    'http://127.0.0.1:5184',
    'http://127.0.0.1:5185'
]);

// Add deployed frontend origin explicitly (Vercel)
allowedOrigins.add('https://spmproject-web.vercel.app');
allowedOrigins.add('https://www.spmproject-web.vercel.app');
// Add your current Vercel deployment domains
allowedOrigins.add('https://spmproject-cyzvi2552-mensahsandras-projects.vercel.app');
allowedOrigins.add('https://spmproject-2lby7r6jk-mensahandras-projects.vercel.app');

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // non-browser or same-origin

        // Accept any localhost or 127.0.0.1 with port in 5000-5999 range
        if (allowedOrigins.has(origin) ||
            /^http:\/\/localhost:[5][0-9]{3}$/.test(origin) ||
            /^http:\/\/127\.0\.0\.1:[5][0-9]{3}$/.test(origin)) {
            return callback(null, true);
        }

        // Accept any Vercel deployment subdomain for your project
        // Matches: spmproject-*.vercel.app, spmproject*.vercel.app, spmproject-*-*.vercel.app
        if (/^https:\/\/spmproject[^.]*\.vercel\.app$/.test(origin)) {
            return callback(null, true);
        }

        console.warn('CORS blocked origin:', origin, { allowedSample: Array.from(allowedOrigins).slice(0, 5) });
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());
// Global rate limiter (light)
app.use(apiLimiter);
app.use(morgan("dev"));

// Body logging (omit for large payloads)
app.use((req, res, next) => {
    if (req.body && Object.keys(req.body).length) {
        logger.debug('request.body', { id: req.id, bodyKeys: Object.keys(req.body) });
    }
    next();
});

// Routes with targeted rate limiting
app.use("/api/auth", require("./routes/auth")); // Temporarily removed authLimiter
app.use("/api/attendance", require("./routes/attendance")); // Temporarily removed attendanceLimiter
// Alias for frontend compatibility (frontend calls /api/attendance-sessions)
app.use("/api/attendance-sessions", require("./routes/attendance-sessions-alias"));
// Main grades routes
app.use("/api/grades", require("./routes/grades"));
app.use("/api/grades", require("./routes/grades_v2"));
// Assessment routes
app.use("/api/assessments", require("./routes/assessments"));
// Students routes for performance tracking
app.use("/api/students", require("./routes/students"));
// Course management routes
app.use("/api/courses", require("./routes/courses"));
// Quiz management routes (lecturer only)
app.use("/api/quizzes", require("./routes/quizzes"));
app.use("/api/cwa", require("./routes/cwa"));
app.use("/api/deadlines", require("./routes/deadlines"));

app.use("/api/results", require("./routes/results"));

// Admin routes (temporary for database seeding)
app.use("/api/admin", require("./routes/admin"));

// Notification routes
app.use("/api/notifications", require("./routes/notifications"));

// Preflight support (explicit for some environments)
app.options('*', cors());

// Basic health check endpoint
app.get("/", (req, res) => {
  res.json({ 
    ok: true, 
    message: "Student Performance Metrics API is running",
    timestamp: new Date().toISOString()
  });
});

// Ping endpoint to keep serverless function warm
app.get("/api/ping", (req, res) => {
  res.json({ 
    ok: true, 
    message: "pong",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Health for clients
app.get('/api/health', (req, res) => {
    res.json({
        ok: true,
        status: "ok",
        service: 'spm-backend',
        time: new Date().toISOString(),
        dbState: mongoose.connection?.readyState
    });
});

// /api root convenience info
app.get('/api', (req, res) => {
    res.json({ ok: true, service: 'spm-backend', message: 'API root', endpoints: ['/api/auth/login', '/api/auth/add-test-users', '/api/status', '/api/version', '/api/health'] });
});

app.get('/api/status', (req, res) => {
    let pkg = {};
    try { pkg = require('./package.json'); } catch { }
    const commit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT || null;
    res.json({
        ok: true,
        service: 'spm-backend',
        status: 'ok',
        time: new Date().toISOString(),
        dbState: mongoose.connection?.readyState,
        version: pkg.version,
        name: pkg.name,
        commit
    });
});

// Version / build metadata (must be BEFORE 404 handler)
app.get(['/api/version', '/version'], (req, res) => {
    let pkg = {};
    try { pkg = require('./package.json'); } catch { }
    const commit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT || null;
    res.json({
        ok: true,
        name: pkg.name,
        version: pkg.version,
        commit,
        node: process.version,
        env: process.env.NODE_ENV,
        time: new Date().toISOString()
    });
});

// 404 handler (after routes, before error handler)
app.use((req, res, next) => {
    if (res.headersSent) return next();
    logger.warn('route.not_found', { id: req.id, method: req.method, url: req.originalUrl });
    res.status(404).json({ ok: false, error: 'not_found', message: 'Route not found' });
});

// Unified error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const code = err.code || 'internal_error';
    logger.error('error.unhandled', { id: req.id, status, code, message: err.message, stack: process.env.NODE_ENV === 'production' ? undefined : err.stack });
    res.status(status).json({ ok: false, error: code, message: err.message || 'Server error' });
});

module.exports = app;
