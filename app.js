
// app.js
const express = require("express");
const cors = require("cors");
const mongoose = require('mongoose');
const morgan = require("morgan");
const { apiLimiter, authLimiter, attendanceLimiter } = require('./middleware/rateLimit');

const app = express();

// Debug middleware for incoming requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
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

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true); // non-browser or same-origin
        // Accept any localhost or 127.0.0.1 with port in 5000-5999 range
        if (allowedOrigins.has(origin) || 
            /^http:\/\/localhost:[5][0-9]{3}$/.test(origin) || 
            /^http:\/\/127\.0\.0\.1:[5][0-9]{3}$/.test(origin)) {
            return callback(null, true);
        }
        console.warn('CORS blocked origin:', origin);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());
// Global rate limiter (light)
app.use(apiLimiter);
app.use(morgan("dev"));

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - Body:`, req.body);
    next();
});

// Routes with targeted rate limiting
app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/attendance", attendanceLimiter, require("./routes/attendance"));
app.use("/api/grades", require("./routes/grades"));
app.use("/api/cwa", require("./routes/cwa"));
app.use("/api/deadlines", require("./routes/deadlines"));

// Preflight support (explicit for some environments)
app.options('*', cors());

// Basic health check route
app.get("/", (req, res) => {
    res.json({ message: "Student Performance Matrix API is running!" });
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

// Version / build metadata
app.get('/api/version', (req, res) => {
    let pkg = {};
    try { pkg = require('./package.json'); } catch {}
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

// Error handler to prevent generic 500 without details
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: String(err?.message || err) });
});

module.exports = app;
