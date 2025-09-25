const rateLimit = require('express-rate-limit');

// General API limiter (applied globally if desired)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1500,
  standardHeaders: true,
  legacyHeaders: false
});

// Auth specific limiter (login, register)
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: { ok: false, message: 'Too many auth requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Attendance check-in limiter (protect from rapid duplicate scans)
const attendanceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  message: { ok: false, message: 'Too many check-in attempts, slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { apiLimiter, authLimiter, attendanceLimiter };
