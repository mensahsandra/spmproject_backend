/**
 * Attendance Sessions Alias Routes
 * 
 * This file provides compatibility routes for the frontend which calls:
 * - POST /api/attendance-sessions (should be /api/attendance/generate-session)
 * - GET /api/attendance-sessions (should be /api/attendance/lecturer/:id)
 * 
 * These routes redirect to the correct attendance endpoints
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const attendanceRouter = require('./attendance');

// POST /api/attendance-sessions -> POST /api/attendance/generate-session
router.post('/', auth(['lecturer', 'admin']), (req, res, next) => {
    console.log('🔀 Redirecting POST /api/attendance-sessions -> /api/attendance/generate-session');
    req.url = '/generate-session';
    attendanceRouter(req, res, next);
});

// GET /api/attendance-sessions -> GET /api/attendance/lecturer/:id
router.get('/', auth(['lecturer', 'admin']), (req, res, next) => {
    console.log('🔀 Redirecting GET /api/attendance-sessions -> /api/attendance/lecturer/:id');
    // Get lecturer ID from authenticated user
    const lecturerId = req.user?.id || req.user?._id;
    req.url = `/lecturer/${lecturerId}`;
    attendanceRouter(req, res, next);
});

// DELETE /api/attendance-sessions/reset -> DELETE /api/attendance/reset
router.delete('/reset', auth(['lecturer', 'admin']), (req, res, next) => {
    console.log('🔀 Redirecting DELETE /api/attendance-sessions/reset -> /api/attendance/reset');
    req.url = '/reset';
    attendanceRouter(req, res, next);
});

// DELETE /api/attendance-sessions/reset/:lecturerId -> DELETE /api/attendance/reset/:lecturerId
router.delete('/reset/:lecturerId', auth(['lecturer', 'admin']), (req, res, next) => {
    console.log(`🔀 Redirecting DELETE /api/attendance-sessions/reset/${req.params.lecturerId} -> /api/attendance/reset/${req.params.lecturerId}`);
    req.url = `/reset/${req.params.lecturerId}`;
    attendanceRouter(req, res, next);
});

module.exports = router;
