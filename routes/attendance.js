const express = require('express');
const QRCode = require('qrcode');
const { Parser } = require('json2csv');
const router = express.Router();
const mongoose = require('mongoose');
const { AttendanceSession, AttendanceLog } = require('../models/Attendance');
const auth = require('../middleware/auth');

// In-memory stores fallback if DB not connected
const sessionsMem = [];
const attendanceLogsMem = [];

function randomCode(len = 8) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}

router.get('/checkin', (req, res) => {
    res.json({ 
        status: 'Checked in successfully', 
        timestamp: new Date(),
        message: 'Your attendance has been recorded for today\'s class.'
    });
});

// QR-based check-in (preferred)
router.post('/check-in', auth(['student','lecturer','admin']), async (req, res) => {
    const { studentId, qrCode, sessionCode: bodySessionCode, timestamp, centre, location } = req.body || {};
    if (!studentId || (!qrCode && !bodySessionCode)) {
        return res.status(400).json({ ok: false, message: 'studentId and qrCode or sessionCode are required' });
    }
    let parsed = null;
    try { parsed = qrCode ? JSON.parse(qrCode) : null; } catch {}
    const sessionCode = bodySessionCode || parsed?.sessionCode || parsed?.qrCode || qrCode;
    const nowIso = timestamp || new Date().toISOString();
    const baseEntry = {
        studentId,
        sessionCode,
        qrRaw: qrCode || null,
        courseCode: parsed?.courseCode || null,
        courseName: parsed?.course || parsed?.courseName || null,
        lecturer: parsed?.lecturer || parsed?.lecturerName || null,
        centre: centre || null,
        location: location || null,
        timestamp: nowIso,
    };
    const usingDb = mongoose.connection?.readyState === 1;
    try {
        if (usingDb) {
            const created = await AttendanceLog.findOneAndUpdate(
                { sessionCode, studentId },
                baseEntry,
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            return res.json({ ok: true, message: 'Attendance marked', persisted: true, log: created });
        } else {
            const exists = attendanceLogsMem.find(l => l.sessionCode === sessionCode && l.studentId === studentId);
            if (!exists) attendanceLogsMem.push({ id: Date.now().toString(36), ...baseEntry });
            return res.json({ ok: true, message: 'Attendance marked (memory)', persisted: false, log: exists || baseEntry });
        }
    } catch (e) {
        console.error('check-in error:', e);
        return res.status(500).json({ ok: false, message: 'Failed to record attendance', error: String(e?.message || e) });
    }
});

// Lecturer: generate a session code and QR image
router.post('/generate-session', auth(['lecturer','admin']), async (req, res) => {
    try {
        const { courseCode = 'BIT364', courseName = 'Entrepreneurship', lecturer = 'Prof. Anyimadu', durationMinutes = 30 } = req.body || {};
        const sessionCode = randomCode(6) + '-' + randomCode(6);
        const issuedAt = new Date();
        const expiresAt = new Date(issuedAt.getTime() + durationMinutes * 60000);
        const payload = { sessionCode, courseCode, courseName, lecturer, issuedAt, expiresAt };
        const qrDataUrl = await QRCode.toDataURL(JSON.stringify({ ...payload, issuedAt: issuedAt.toISOString(), expiresAt: expiresAt.toISOString() }), { errorCorrectionLevel: 'M' });
        const usingDb = mongoose.connection?.readyState === 1;
        if (usingDb) {
            await AttendanceSession.create(payload);
        } else {
            sessionsMem.push(payload);
        }
        res.json({ ok: true, sessionCode, qrDataUrl, issuedAt: issuedAt.toISOString(), expiresAt: expiresAt.toISOString(), persisted: usingDb });
    } catch (e) {
        console.error('generate-session error:', e);
        res.status(500).json({ ok: false, message: 'Failed to generate session', error: String(e?.message || e) });
    }
});

// Lecturer: list attendance logs (optionally filter)
router.get('/logs', auth(['lecturer','admin']), async (req, res) => {
    const { courseCode, sessionCode, page = 1, limit = 25 } = req.query || {};
    const usingDb = mongoose.connection?.readyState === 1;
    try {
        if (usingDb) {
            const filter = {};
            if (courseCode) filter.courseCode = String(courseCode);
            if (sessionCode) filter.sessionCode = String(sessionCode);
            const pageNum = Math.max(1, parseInt(page));
            const lim = Math.min(100, Math.max(1, parseInt(limit)));
            const skip = (pageNum - 1) * lim;
            const [logs, total] = await Promise.all([
                AttendanceLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(lim).lean(),
                AttendanceLog.countDocuments(filter)
            ]);
            const totalPages = Math.ceil(total / lim) || 1;
            return res.json({ ok: true, count: logs.length, total, page: pageNum, totalPages, limit: lim, logs, persisted: true });
        } else {
            let result = attendanceLogsMem;
            if (courseCode) result = result.filter(r => (r.courseCode || '') === String(courseCode));
            if (sessionCode) result = result.filter(r => (r.sessionCode || '') === String(sessionCode));
            // Simple memory pagination
            const pageNum = Math.max(1, parseInt(page));
            const lim = Math.min(100, Math.max(1, parseInt(limit)));
            const start = (pageNum - 1) * lim;
            const sliced = result.slice(start, start + lim);
            const total = result.length;
            const totalPages = Math.ceil(total / lim) || 1;
            return res.json({ ok: true, count: sliced.length, total, page: pageNum, totalPages, limit: lim, logs: sliced, persisted: false });
        }
    } catch (e) {
        console.error('logs error:', e);
        res.status(500).json({ ok: false, message: 'Failed to fetch logs', error: String(e?.message || e) });
    }
});

// Lecturer: export CSV of attendance logs
router.get('/export', auth(['lecturer','admin']), async (req, res) => {
    const { courseCode, sessionCode } = req.query || {};
    const usingDb = mongoose.connection?.readyState === 1;
    try {
        let result;
        if (usingDb) {
            const filter = {};
            if (courseCode) filter.courseCode = String(courseCode);
            if (sessionCode) filter.sessionCode = String(sessionCode);
            result = await AttendanceLog.find(filter).lean();
        } else {
            result = attendanceLogsMem;
            if (courseCode) result = result.filter(r => (r.courseCode || '') === String(courseCode));
            if (sessionCode) result = result.filter(r => (r.sessionCode || '') === String(sessionCode));
        }
        const fields = ['timestamp','studentId','centre','courseCode','courseName','lecturer','sessionCode'];
        const parser = new Parser({ fields });
        const csv = parser.parse(result);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="attendance_export_${Date.now()}.csv"`);
        res.send(csv);
    } catch (e) {
        console.error('export error:', e);
        res.status(500).json({ ok: false, message: 'Failed to export', error: String(e?.message || e) });
    }
});

module.exports = router;