const express = require('express');
const QRCode = require('qrcode');
const { Parser } = require('json2csv');
const router = express.Router();
const mongoose = require('mongoose');
const { AttendanceSession, AttendanceLog } = require('../models/Attendance');
const AttendanceRecordService = require('../services/attendanceRecordService');
const auth = require('../middleware/auth');
const NotificationService = require('../services/notificationService');

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
    
    // Validate required fields
    if (!studentId || (!qrCode && !bodySessionCode)) {
        return res.status(400).json({ ok: false, message: 'studentId and qrCode or sessionCode are required' });
    }
    
    // Only allow students to check in (security measure)
    if (req.user.role !== 'student' && req.user.role !== 'admin') {
        return res.status(403).json({ ok: false, message: 'Only students can check in to attendance' });
    }
    
    let parsed = null;
    try { parsed = qrCode ? JSON.parse(qrCode) : null; } catch {}
    const sessionCode = bodySessionCode || parsed?.sessionCode || parsed?.qrCode || qrCode;
    
    // Verify session exists and is still active
    const usingDb = mongoose.connection?.readyState === 1;
    let session = null;
    
    if (usingDb) {
        session = await AttendanceSession.findOne({ sessionCode }).lean();
    } else {
        session = sessionsMem.find(s => s.sessionCode === sessionCode);
    }
    
    if (!session) {
        return res.status(404).json({ ok: false, message: 'Invalid session code' });
    }
    
    // Check if session has expired
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    if (now > expiresAt) {
        return res.status(400).json({ ok: false, message: 'Session has expired' });
    }
    
    const nowIso = timestamp || new Date().toISOString();
    
    // Get full student information from database
    const User = require('../models/User');
    let studentInfo = null;
    
    try {
        studentInfo = await User.findById(req.user.id).select('name studentId course centre').lean();
    } catch (error) {
        console.log('Could not fetch student info:', error.message);
    }
    
    // Get lecturer ID - either from session or by looking up lecturer by name
    let lecturerId = session.lecturerId;
    console.log('🔍 [CHECK-IN] Session lecturerId:', lecturerId);
    console.log('🔍 [CHECK-IN] Session lecturer name:', session.lecturer);
    console.log('🔍 [CHECK-IN] Full session:', JSON.stringify(session, null, 2));
    
    // FALLBACK: If session doesn't have lecturerId (old session), look it up by name
    if (!lecturerId && session.lecturer) {
        console.log('⚠️ [CHECK-IN] No lecturerId in session, attempting name lookup...');
        try {
            const User = require('../models/User');
            const lecturer = await User.findOne({ name: session.lecturer }).select('_id');
            if (lecturer) {
                lecturerId = lecturer._id;
                console.log('✅ [CHECK-IN] Found lecturerId by name lookup:', lecturerId);
            } else {
                console.warn('⚠️ [CHECK-IN] Could not find lecturer by name:', session.lecturer);
            }
        } catch (err) {
            console.error('❌ [CHECK-IN] Error looking up lecturer:', err);
        }
    } else if (lecturerId) {
        console.log('✅ [CHECK-IN] Using lecturerId from session:', lecturerId);
    }
    
    // Enhanced entry with complete student information
    const baseEntry = {
        studentId: studentId || req.user.studentId || studentInfo?.studentId,
        studentName: studentInfo?.name || req.user.name || 'Unknown Student',
        sessionCode,
        qrRaw: qrCode || null,
        courseCode: parsed?.courseCode || session.courseCode,
        courseName: parsed?.course || parsed?.courseName || session.courseName,
        lecturer: parsed?.lecturer || parsed?.lecturerName || session.lecturer,
        lecturerId: lecturerId,  // CRITICAL: Get lecturer ID from session or lookup
        centre: centre || req.user.centre || studentInfo?.centre || 'Not specified',
        location: location || null,
        timestamp: nowIso,
        checkInMethod: qrCode ? 'QR_SCAN' : 'MANUAL_CODE'
    };
    
    console.log('📝 Creating attendance with lecturerId:', lecturerId ? '✅ Present' : '❌ Missing');
    
    try {
        if (usingDb) {
            // Check if student already checked in for this session
            const existing = await AttendanceLog.findOne({ sessionCode, studentId: baseEntry.studentId });
            if (existing) {
                return res.json({ 
                    ok: true, 
                    message: 'Already checked in for this session', 
                    alreadyCheckedIn: true,
                    checkInTime: existing.timestamp,
                    log: existing 
                });
            }
            
            const created = await AttendanceLog.create(baseEntry);
            
            // Send notification to lecturer about the check-in
            if (lecturerId) {
                try {
                    await NotificationService.notifyAttendanceScan(created, lecturerId);
                } catch (notifyError) {
                    console.error('Failed to send attendance notification:', notifyError.message);
                    // Don't fail the check-in if notification fails
                }
            }
            
            return res.json({ 
                ok: true, 
                message: 'Attendance marked successfully', 
                persisted: true, 
                log: created,
                session: {
                    courseCode: session.courseCode,
                    courseName: session.courseName,
                    lecturer: session.lecturer
                }
            });
        } else {
            const exists = attendanceLogsMem.find(l => l.sessionCode === sessionCode && l.studentId === baseEntry.studentId);
            if (exists) {
                return res.json({ 
                    ok: true, 
                    message: 'Already checked in for this session', 
                    alreadyCheckedIn: true,
                    checkInTime: exists.timestamp,
                    log: exists 
                });
            }
            
            const newEntry = { id: Date.now().toString(36), ...baseEntry };
            attendanceLogsMem.push(newEntry);
            return res.json({ 
                ok: true, 
                message: 'Attendance marked successfully (memory)', 
                persisted: false, 
                log: newEntry,
                session: {
                    courseCode: session.courseCode,
                    courseName: session.courseName,
                    lecturer: session.lecturer
                }
            });
        }
    } catch (e) {
        console.error('check-in error:', e);
        return res.status(500).json({ ok: false, message: 'Failed to record attendance', error: String(e?.message || e) });
    }
});

// Check if lecturer has active session (prevent multiple generations)
router.get('/active-session', auth(['lecturer','admin']), async (req, res) => {
    try {
        const lecturerId = req.user.id;
        const now = new Date();
        const usingDb = mongoose.connection?.readyState === 1;
        
        let activeSession = null;
        if (usingDb) {
            activeSession = await AttendanceSession.findOne({
                $or: [
                    { lecturerId: lecturerId },
                    { lecturer: req.user.name }
                ],
                expiresAt: { $gt: now }
            }).lean();
        } else {
            activeSession = sessionsMem.find(s => 
                s.lecturer === req.user.name && new Date(s.expiresAt) > now
            );
        }
        
        if (activeSession) {
            const remainingSeconds = Math.max(0, Math.floor((new Date(activeSession.expiresAt).getTime() - now.getTime()) / 1000));
            return res.json({
                ok: true,
                hasActiveSession: true,
                session: {
                    ...activeSession,
                    remainingSeconds,
                    issuedAt: activeSession.issuedAt.toISOString ? activeSession.issuedAt.toISOString() : activeSession.issuedAt,
                    expiresAt: activeSession.expiresAt.toISOString ? activeSession.expiresAt.toISOString() : activeSession.expiresAt
                }
            });
        }
        
        res.json({ ok: true, hasActiveSession: false });
    } catch (e) {
        console.error('active-session check error:', e);
        res.status(500).json({ ok: false, message: 'Failed to check active session', error: String(e?.message || e) });
    }
});

// Lecturer: generate a session code and QR image
router.post('/generate-session', auth(['lecturer','admin']), async (req, res) => {
    try {
        const { courseCode = 'BIT364', courseName = 'Entrepreneurship', lecturer, durationMinutes = 30 } = req.body || {};
        
        // Check if lecturer already has an active session
        const lecturerName = lecturer || req.user?.name || 'Prof. Anyimadu';
        const now = new Date();
        const usingDb = mongoose.connection?.readyState === 1;
        
        // FORCE-CLOSE STALE SESSIONS: Clean up expired sessions before checking for active ones
        if (usingDb) {
            try {
                const expiredSessions = await AttendanceSession.deleteMany({
                    $or: [
                        { lecturerId: req.user.id },
                        { lecturer: lecturerName }
                    ],
                    expiresAt: { $lte: now }
                });
                
                if (expiredSessions.deletedCount > 0) {
                    console.log(`🧹 [CLEANUP] Removed ${expiredSessions.deletedCount} expired session(s) for lecturer ${req.user.id}`);
                }
            } catch (cleanupError) {
                console.error('⚠️ [CLEANUP] Failed to clean expired sessions:', cleanupError.message);
                // Continue anyway - don't block session generation
            }
        } else {
            // Clean up expired sessions from memory
            const beforeCount = sessionsMem.length;
            const filtered = sessionsMem.filter(s => 
                !(s.lecturer === lecturerName && new Date(s.expiresAt) <= now)
            );
            sessionsMem.length = 0;
            sessionsMem.push(...filtered);
            
            if (beforeCount > filtered.length) {
                console.log(`🧹 [CLEANUP] Removed ${beforeCount - filtered.length} expired session(s) from memory`);
            }
        }
        
        let existingSession = null;
        if (usingDb) {
            existingSession = await AttendanceSession.findOne({
                $or: [
                    { lecturerId: req.user.id },
                    { lecturer: lecturerName }
                ],
                expiresAt: { $gt: now }
            }).lean();
        } else {
            existingSession = sessionsMem.find(s => 
                s.lecturer === lecturerName && new Date(s.expiresAt) > now
            );
        }
        
        if (existingSession) {
            const remainingSeconds = Math.max(0, Math.floor((new Date(existingSession.expiresAt).getTime() - now.getTime()) / 1000));
            return res.status(400).json({
                ok: false,
                message: 'You already have an active session. Please wait for it to expire.',
                activeSession: {
                    sessionCode: existingSession.sessionCode,
                    remainingSeconds,
                    expiresAt: existingSession.expiresAt
                }
            });
        }
        
        const sessionCode = randomCode(6) + '-' + randomCode(6);
        const issuedAt = new Date();
        const expiresAt = new Date(issuedAt.getTime() + durationMinutes * 60000);
        
        // Create payload for QR code
        const qrPayload = { 
            sessionCode, 
            courseCode, 
            courseName, 
            lecturer: lecturerName, 
            issuedAt: issuedAt.toISOString(), 
            expiresAt: expiresAt.toISOString() 
        };
        
        // Generate QR code with higher quality for better scanning
        const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload), { 
            errorCorrectionLevel: 'M',
            width: 300,
            margin: 2
        });
        
        // Database payload with lecturer ID
        const dbPayload = { 
            sessionCode, 
            courseCode, 
            courseName, 
            lecturer: lecturerName, 
            lecturerId: req.user.id,  // Store lecturer's MongoDB ObjectId
            issuedAt, 
            expiresAt 
        };
        
        console.log('📝 [GENERATE-SESSION] Creating session with lecturerId:', req.user.id);
        console.log('📝 [GENERATE-SESSION] Full payload:', JSON.stringify(dbPayload, null, 2));
        
        if (usingDb) {
            const createdSession = await AttendanceSession.create(dbPayload);
            console.log('✅ [GENERATE-SESSION] Session saved to DB:', createdSession._id);
            console.log('✅ [GENERATE-SESSION] Saved lecturerId:', createdSession.lecturerId);
        } else {
            sessionsMem.push(dbPayload);
            console.log('✅ [GENERATE-SESSION] Session saved to memory');
        }
        
        // Enhanced response for in-place QR display
        res.json({ 
            ok: true, 
            success: true,
            message: 'Session generated successfully',
            session: {
                sessionCode,
                courseCode,
                courseName,
                lecturer: lecturerName,
                durationMinutes: parseInt(durationMinutes),
                issuedAt: issuedAt.toISOString(),
                expiresAt: expiresAt.toISOString(),
                remainingSeconds: Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
            },
            qrCode: {
                dataUrl: qrDataUrl,
                size: 300,
                format: 'PNG'
            },
            persisted: usingDb 
        });
    } catch (e) {
        console.error('generate-session error:', e);
        res.status(500).json({ ok: false, message: 'Failed to generate session', error: String(e?.message || e) });
    }
});

// Alternative endpoint for marking attendance (simpler interface)
router.post('/mark', auth(['student','lecturer','admin']), async (req, res) => {
    const { sessionCode, studentId, timestamp } = req.body || {};
    
    // Validate required fields
    if (!sessionCode) {
        return res.status(400).json({ ok: false, message: 'sessionCode is required' });
    }
    
    // Only allow students to mark attendance (security measure)
    if (req.user.role !== 'student' && req.user.role !== 'admin') {
        return res.status(403).json({ ok: false, message: 'Only students can mark attendance' });
    }
    
    // Use authenticated student's ID if not provided
    const actualStudentId = studentId || req.user.studentId;
    if (!actualStudentId) {
        return res.status(400).json({ ok: false, message: 'Student ID not found' });
    }
    
    // Verify session exists and is still active
    const usingDb = mongoose.connection?.readyState === 1;
    let session = null;
    
    if (usingDb) {
        session = await AttendanceSession.findOne({ sessionCode }).lean();
    } else {
        session = sessionsMem.find(s => s.sessionCode === sessionCode);
    }
    
    if (!session) {
        return res.status(404).json({ ok: false, message: 'Invalid session code' });
    }
    
    // Check if session has expired
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    if (now > expiresAt) {
        return res.status(400).json({ 
            ok: false, 
            message: 'Session has expired',
            expiredAt: session.expiresAt
        });
    }
    
    const nowIso = timestamp || new Date().toISOString();
    
    // Get full student information from database
    const User = require('../models/User');
    let studentInfo = null;
    
    try {
        studentInfo = await User.findById(req.user.id).select('name studentId course centre').lean();
    } catch (error) {
        console.log('Could not fetch student info:', error.message);
    }
    
    // Get lecturer ID - either from session or by looking up lecturer by name
    let lecturerId = session.lecturerId;
    
    // FALLBACK: If session doesn't have lecturerId (old session), look it up by name
    if (!lecturerId && session.lecturer) {
        try {
            const lecturer = await User.findOne({ name: session.lecturer }).select('_id');
            if (lecturer) {
                lecturerId = lecturer._id;
                console.log('✅ Found lecturerId by name lookup (mark endpoint):', lecturerId);
            }
        } catch (err) {
            console.error('❌ Error looking up lecturer:', err);
        }
    }
    
    // Create attendance entry with complete student information
    const attendanceEntry = {
        studentId: actualStudentId,
        studentName: studentInfo?.name || req.user.name || 'Unknown Student',
        sessionCode,
        courseCode: session.courseCode,
        courseName: session.courseName,
        lecturer: session.lecturer,
        lecturerId: lecturerId,  // CRITICAL: Get lecturer ID from session or lookup
        centre: req.user.centre || studentInfo?.centre || 'Not specified',
        timestamp: nowIso,
        checkInMethod: 'MANUAL_CODE'
    };
    
    console.log('📝 Creating attendance (mark) with lecturerId:', lecturerId ? '✅ Present' : '❌ Missing');
    
    try {
        if (usingDb) {
            // Check if student already checked in for this session
            const existing = await AttendanceLog.findOne({ 
                sessionCode, 
                studentId: actualStudentId 
            });
            
            if (existing) {
                return res.json({ 
                    ok: true, 
                    message: 'Already marked attendance for this session', 
                    alreadyMarked: true,
                    checkInTime: existing.timestamp,
                    attendance: existing 
                });
            }
            
            const created = await AttendanceLog.create(attendanceEntry);
            return res.json({ 
                ok: true, 
                message: 'Attendance marked successfully', 
                persisted: true, 
                attendance: created,
                session: {
                    courseCode: session.courseCode,
                    courseName: session.courseName,
                    lecturer: session.lecturer
                }
            });
        } else {
            const exists = attendanceLogsMem.find(l => 
                l.sessionCode === sessionCode && l.studentId === actualStudentId
            );
            
            if (exists) {
                return res.json({ 
                    ok: true, 
                    message: 'Already marked attendance for this session', 
                    alreadyMarked: true,
                    checkInTime: exists.timestamp,
                    attendance: exists 
                });
            }
            
            const newEntry = { id: Date.now().toString(36), ...attendanceEntry };
            attendanceLogsMem.push(newEntry);
            return res.json({ 
                ok: true, 
                message: 'Attendance marked successfully (memory)', 
                persisted: false, 
                attendance: newEntry,
                session: {
                    courseCode: session.courseCode,
                    courseName: session.courseName,
                    lecturer: session.lecturer
                }
            });
        }
    } catch (e) {
        console.error('mark attendance error:', e);
        return res.status(500).json({ 
            ok: false, 
            message: 'Failed to mark attendance', 
            error: String(e?.message || e) 
        });
    }
});

// Validate session code (for students to check if session is valid)
router.get('/session/:sessionCode', async (req, res) => {
    try {
        const { sessionCode } = req.params;
        const usingDb = mongoose.connection?.readyState === 1;
        
        let session = null;
        if (usingDb) {
            session = await AttendanceSession.findOne({ sessionCode }).lean();
        } else {
            session = sessionsMem.find(s => s.sessionCode === sessionCode);
        }
        
        if (!session) {
            return res.status(404).json({ 
                ok: false, 
                message: 'Session not found',
                valid: false
            });
        }
        
        const now = new Date();
        const expiresAt = new Date(session.expiresAt);
        const isExpired = now >= expiresAt;
        const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
        
        res.json({
            ok: true,
            valid: !isExpired,
            session: {
                sessionCode: session.sessionCode,
                courseCode: session.courseCode,
                courseName: session.courseName,
                lecturer: session.lecturer,
                issuedAt: session.issuedAt,
                expiresAt: session.expiresAt,
                isExpired,
                remainingSeconds
            }
        });
    } catch (e) {
        console.error('session validation error:', e);
        res.status(500).json({ 
            ok: false, 
            message: 'Failed to validate session', 
            error: String(e?.message || e) 
        });
    }
});

// REMOVED: Duplicate route definition - using enhanced version below

// Get session status (for real-time timer updates)
router.get('/session/:sessionCode/status', auth(['lecturer','admin']), async (req, res) => {
    try {
        const { sessionCode } = req.params;
        const usingDb = mongoose.connection?.readyState === 1;
        
        let session = null;
        if (usingDb) {
            session = await AttendanceSession.findOne({ sessionCode }).lean();
        } else {
            session = sessionsMem.find(s => s.sessionCode === sessionCode);
        }
        
        if (!session) {
            return res.status(404).json({ ok: false, message: 'Session not found' });
        }
        
        const now = new Date();
        const expiresAt = new Date(session.expiresAt);
        const isExpired = now >= expiresAt;
        const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
        const remainingMinutes = Math.floor(remainingSeconds / 60);
        const remainingSecondsDisplay = remainingSeconds % 60;
        
        res.json({
            ok: true,
            session: {
                sessionCode: session.sessionCode,
                courseCode: session.courseCode,
                courseName: session.courseName,
                lecturer: session.lecturer,
                issuedAt: session.issuedAt,
                expiresAt: session.expiresAt,
                isExpired,
                remainingSeconds,
                remainingTime: {
                    minutes: remainingMinutes,
                    seconds: remainingSecondsDisplay,
                    display: `${remainingMinutes}:${remainingSecondsDisplay.toString().padStart(2, '0')}`
                }
            }
        });
    } catch (e) {
        console.error('session status error:', e);
        res.status(500).json({ ok: false, message: 'Failed to get session status', error: String(e?.message || e) });
    }
});

// Enhanced lecturer attendance API for frontend (matches frontend requirements)
router.get('/lecturer/:lecturerId', auth(['lecturer','admin']), async (req, res) => {
    try {
        const { lecturerId } = req.params;
        const authenticatedUserId = req.user?.id;
        
        // Security check: lecturers can only access their own data (unless admin)
        // Allow access if lecturerId matches user ID, user name, or if user is admin
        const isAuthorized = req.user.role === 'admin' || 
                           lecturerId === authenticatedUserId || 
                           lecturerId === req.user?.name ||
                           lecturerId === req.user?.id;
        
        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Can only access your own attendance data.'
            });
        }
        
        // Get lecturer information
        const User = require('../models/User');
        const lecturer = await User.findById(authenticatedUserId).select('-password');
        
        // Debug logging removed - API working correctly
        
        if (!lecturer) {
            return res.status(404).json({
                success: false,
                message: 'Lecturer not found'
            });
        }
        
        const usingDb = mongoose.connection?.readyState === 1;
        let sessions = [];
        let attendanceLogs = [];
        
        if (usingDb) {
            // DEBUG: Log what we're searching for
            console.log('🔍 Searching for sessions:', {
                authenticatedUserId,
                lecturerName: lecturer.name,
                userIdType: typeof authenticatedUserId
            });
            
            // Get sessions created by this lecturer (query by both lecturerId and name for robustness)
            // Convert to ObjectId if it's a string
            const lecturerObjectId = mongoose.Types.ObjectId.isValid(authenticatedUserId) 
                ? new mongoose.Types.ObjectId(authenticatedUserId)
                : authenticatedUserId;
            
            sessions = await AttendanceSession.find({ 
                $or: [
                    { lecturerId: lecturerObjectId },
                    { lecturerId: authenticatedUserId }, // Try as string too
                    { lecturer: lecturer.name }
                ]
            }).sort({ issuedAt: -1 }).limit(10).lean();
            
            console.log('📋 Found sessions:', sessions.length);
            
            // Get attendance logs for these sessions
            if (sessions.length > 0) {
                const sessionCodes = sessions.map(s => s.sessionCode);
                console.log('🔍 Searching for attendance logs in sessions:', sessionCodes);
                
                attendanceLogs = await AttendanceLog.find({
                    sessionCode: { $in: sessionCodes }
                }).sort({ timestamp: -1 }).lean();
                
                console.log('📝 Found attendance logs:', attendanceLogs.length);
                if (attendanceLogs.length > 0) {
                    console.log('📝 Sample log:', {
                        studentId: attendanceLogs[0].studentId,
                        sessionCode: attendanceLogs[0].sessionCode,
                        hasLecturerId: !!attendanceLogs[0].lecturerId,
                        lecturerId: attendanceLogs[0].lecturerId
                    });
                }
            }
        } else {
            // Use in-memory data (fallback)
            sessions = sessionsMem.filter(s => s.lecturer === lecturer.name)
                .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))
                .slice(0, 10);
            
            if (sessions.length > 0) {
                const sessionCodes = sessions.map(s => s.sessionCode);
                attendanceLogs = attendanceLogsMem.filter(l => sessionCodes.includes(l.sessionCode))
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            }
        }
        
        // Get current active session
        const now = new Date();
        const activeSession = sessions.find(s => new Date(s.expiresAt) > now);
        
        // Get course mapping for full names
        const { mapCoursesToFullDetails, getDepartmentFullName } = require('../config/courseMapping');
        const lecturerCourses = lecturer?.courses || [];
        const coursesWithDetails = mapCoursesToFullDetails(lecturerCourses);

        // Format response to match frontend expectations
        const response = {
            success: true,
            lecturer: {
                name: lecturer?.name || 'Unknown Lecturer',
                id: lecturer?._id || 'unknown',
                lecturerId: lecturer?._id || 'unknown', // Explicit lecturerId for frontend
                email: lecturer?.email || 'N/A',
                staffId: lecturer?.staffId || 'N/A',
                courses: lecturerCourses,
                coursesWithDetails: coursesWithDetails,
                courseNames: coursesWithDetails.map(c => c.fullName),
                honorific: lecturer?.honorific || 'Mr.',
                fullName: lecturer?.fullName || `${lecturer?.honorific || 'Mr.'} ${lecturer?.name || 'Unknown Lecturer'}`,
                department: getDepartmentFullName(lecturer?.department || 'Information Technology'),
                title: lecturer?.title || 'Lecturer',
                // Additional fields for frontend display
                course: coursesWithDetails.length > 0 ? coursesWithDetails[0].fullName : 'No Course Assigned',
                classRep: 'Not Assigned', // This would come from course enrollment data
                totalAttendees: attendanceLogs.length
            },
            currentSession: activeSession ? {
                courseCode: activeSession.courseCode,
                courseName: activeSession.courseName,
                sessionCode: activeSession.sessionCode,
                issuedAt: activeSession.issuedAt,
                expiresAt: activeSession.expiresAt,
                attendees: attendanceLogs.filter(log => log.sessionCode === activeSession.sessionCode).map(log => ({
                    studentId: log.studentId,
                    studentName: log.studentName || 'Unknown Student',
                    centre: log.centre || 'Not specified',
                    timestamp: log.timestamp,
                    checkInTime: new Date(log.timestamp).toLocaleTimeString()
                }))
            } : null,
            records: attendanceLogs.slice(0, 50).map(log => ({
                studentId: log.studentId,
                studentName: log.studentName || 'Unknown Student',
                courseCode: log.courseCode,
                courseName: log.courseName,
                sessionCode: log.sessionCode,
                centre: log.centre || 'Not specified',
                timestamp: log.timestamp,
                checkInTime: new Date(log.timestamp).toLocaleTimeString(),
                date: new Date(log.timestamp).toLocaleDateString()
            })),
            recentSessions: sessions.slice(0, 5).map(session => ({
                sessionCode: session.sessionCode,
                courseCode: session.courseCode,
                courseName: session.courseName,
                issuedAt: session.issuedAt,
                expiresAt: session.expiresAt,
                attendeeCount: attendanceLogs.filter(log => log.sessionCode === session.sessionCode).length
            })),
            totalAttendanceToday: attendanceLogs.filter(log => {
                const logDate = new Date(log.timestamp).toDateString();
                const today = new Date().toDateString();
                return logDate === today;
            }).length,
            stats: {
                totalSessions: sessions.length,
                totalAttendance: attendanceLogs.length,
                activeSessions: sessions.filter(s => new Date(s.expiresAt) > now).length
            }
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('Enhanced lecturer attendance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch lecturer attendance data',
            error: error.message
        });
    }
});

// Real-time attendance notifications for lecturers
router.get('/notifications/:lecturerId', auth(['lecturer','admin']), async (req, res) => {
    try {
        const { lecturerId } = req.params;
        
        // Security check
        if (req.user.role !== 'admin' && req.user.id !== lecturerId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }
        
        // Get recent attendance (last 5 minutes) for notifications
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const usingDb = mongoose.connection?.readyState === 1;
        
        let recentAttendance = [];
        
        if (usingDb) {
            // Get lecturer's sessions
            const User = require('../models/User');
            const lecturer = await User.findById(lecturerId).select('name');
            
            if (lecturer) {
                const sessions = await AttendanceSession.find({ 
                    $or: [
                        { lecturerId: lecturerId },
                        { lecturer: lecturer.name }
                    ]
                }).lean();
                
                const sessionCodes = sessions.map(s => s.sessionCode);
                
                recentAttendance = await AttendanceLog.find({
                    sessionCode: { $in: sessionCodes },
                    timestamp: { $gte: fiveMinutesAgo.toISOString() }
                }).sort({ timestamp: -1 }).lean();
            }
        }
        
        res.json({
            success: true,
            notifications: recentAttendance.map(log => ({
                id: log._id,
                message: `${log.studentName || 'Student'} (${log.studentId}) checked in to ${log.courseName}`,
                studentName: log.studentName,
                studentId: log.studentId,
                courseCode: log.courseCode,
                courseName: log.courseName,
                timestamp: log.timestamp,
                timeAgo: Math.floor((Date.now() - new Date(log.timestamp).getTime()) / 1000 / 60) + ' minutes ago'
            })),
            count: recentAttendance.length,
            lastCheck: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get notifications'
        });
    }
});

// Debug endpoint to check user authentication
router.get('/debug-user', auth(['lecturer','admin']), async (req, res) => {
    try {
        res.json({
            debug: true,
            authenticatedUser: {
                id: req.user?.id,
                name: req.user?.name,
                email: req.user?.email,
                role: req.user?.role,
                staffId: req.user?.staffId
            },
            timestamp: new Date().toISOString(),
            message: 'This shows the actual authenticated user data'
        });
    } catch (error) {
        res.status(500).json({
            debug: true,
            error: error.message,
            message: 'Error getting user data'
        });
    }
});

// Lecturer: get structured attendance data for attendance page
router.get('/lecturer-dashboard', auth(['lecturer','admin']), async (req, res) => {
    try {
        const lecturerName = req.user?.name || 'Unknown Lecturer';
        
        // Debug logging
        console.log('🔍 Lecturer Dashboard Request:', {
            userId: req.user?.id,
            userName: req.user?.name,
            userEmail: req.user?.email,
            userRole: req.user?.role
        });
        const { courseCode, sessionCode, date = '', limit = 50 } = req.query || {};
        const usingDb = mongoose.connection?.readyState === 1;
        
        // Get lecturer's recent sessions
        let sessions = [];
        let attendanceLogs = [];
        
        if (usingDb) {
            // Get recent sessions by this lecturer (query by both lecturerId and name)
            sessions = await AttendanceSession.find({ 
                $or: [
                    { lecturerId: req.user.id },
                    { lecturer: req.user.name }
                ]
            }).sort({ issuedAt: -1 }).limit(10).lean();
            
            // Get attendance logs for these sessions
            const sessionCodes = sessions.map(s => s.sessionCode);
            attendanceLogs = await AttendanceLog.find({
                sessionCode: { $in: sessionCodes }
            }).sort({ timestamp: -1 }).limit(parseInt(limit)).lean();
        } else {
            sessions = sessionsMem.filter(s => s.lecturer === lecturerName)
                .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))
                .slice(0, 10);
            
            const sessionCodes = sessions.map(s => s.sessionCode);
            attendanceLogs = attendanceLogsMem.filter(l => sessionCodes.includes(l.sessionCode))
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, parseInt(limit));
        }
        
        // Get current active session
        const now = new Date();
        const activeSession = sessions.find(s => new Date(s.expiresAt) > now);
        
        // Structure the response for the attendance page
        const courseInfo = sessions.length > 0 ? {
            courseCode: sessions[0].courseCode || 'N/A',
            courseName: sessions[0].courseName || 'N/A',
            lecturer: lecturerName,
            classRepresentative: 'To be assigned' // This could be enhanced later
        } : null;
        
        // Group attendance by session for better display
        const attendanceBySession = {};
        attendanceLogs.forEach(log => {
            if (!attendanceBySession[log.sessionCode]) {
                const session = sessions.find(s => s.sessionCode === log.sessionCode);
                attendanceBySession[log.sessionCode] = {
                    sessionInfo: session || { sessionCode: log.sessionCode, courseCode: log.courseCode, courseName: log.courseName },
                    attendees: []
                };
            }
            attendanceBySession[log.sessionCode].attendees.push({
                studentId: log.studentId,
                studentName: log.studentName || 'Unknown Student',
                centre: log.centre || 'Not specified',
                timestamp: log.timestamp,
                checkInTime: new Date(log.timestamp).toLocaleTimeString()
            });
        });
        
        res.json({
            ok: true,
            lecturer: {
                name: lecturerName,
                email: req.user?.email || 'N/A',
                staffId: req.user?.staffId || 'N/A',
                id: req.user?.id || 'N/A'
            },
            courseInfo: courseInfo || {
                courseCode: 'No sessions yet',
                courseName: 'Create a session to see course info',
                lecturer: lecturerName,
                classRepresentative: 'To be assigned'
            },
            activeSession: activeSession ? {
                sessionCode: activeSession.sessionCode,
                courseCode: activeSession.courseCode,
                courseName: activeSession.courseName,
                issuedAt: activeSession.issuedAt,
                expiresAt: activeSession.expiresAt,
                remainingSeconds: Math.max(0, Math.floor((new Date(activeSession.expiresAt).getTime() - now.getTime()) / 1000))
            } : null,
            recentSessions: sessions.slice(0, 5),
            attendanceBySession,
            totalAttendanceToday: attendanceLogs.filter(log => {
                const logDate = new Date(log.timestamp).toDateString();
                const today = new Date().toDateString();
                return logDate === today;
            }).length,
            persisted: usingDb,
            debug: {
                authenticatedUser: req.user?.name,
                sessionsFound: sessions.length,
                attendanceLogsFound: attendanceLogs.length,
                usingDatabase: usingDb,
                timestamp: new Date().toISOString()
            }
        });
    } catch (e) {
        console.error('lecturer dashboard error:', e);
        res.status(500).json({ ok: false, message: 'Failed to fetch lecturer dashboard data', error: String(e?.message || e) });
    }
});

// Lecturer: list attendance logs (optionally filter) - Legacy endpoint
router.get('/logs', auth(['lecturer','admin']), async (req, res) => {
    const { courseCode, sessionCode, page = 1, limit = 25, date = '', filterType = 'day' } = req.query || {};
    const usingDb = mongoose.connection?.readyState === 1;
    try {
        // Optional date window
        let start = null, end = null;
        if (date) {
            const base = new Date(String(date));
            if (!isNaN(base.getTime())) {
                const s = new Date(base);
                const e = new Date(base);
                if (String(filterType) === 'week') {
                    const d = s.getDay();
                    const diffToMonday = (d + 6) % 7;
                    s.setDate(s.getDate() - diffToMonday);
                    e.setDate(s.getDate() + 7);
                } else if (String(filterType) === 'month') {
                    s.setDate(1);
                    e.setMonth(s.getMonth() + 1);
                    e.setDate(1);
                } else {
                    // day (default)
                    e.setDate(e.getDate() + 1);
                }
                start = s; end = e;
            }
        }
        if (usingDb) {
            const { records, total } = await AttendanceRecordService.getLogs({ courseCode, sessionCode, date, filterType, page, limit });
            const pageNum = Math.max(1, parseInt(page));
            const lim = Math.min(100, Math.max(1, parseInt(limit)));
            const totalPages = Math.ceil(total / lim) || 1;
            return res.json({ ok: true, count: records.length, total, page: pageNum, totalPages, limit: lim, logs: records, persisted: true });
        } else {
            let result = attendanceLogsMem;
            if (courseCode) result = result.filter(r => (r.courseCode || '') === String(courseCode));
            if (sessionCode) result = result.filter(r => (r.sessionCode || '') === String(sessionCode));
            if (start && end) result = result.filter(r => {
                const t = new Date(r.timestamp);
                return !isNaN(t.getTime()) && t >= start && t < end;
            });
            // Simple memory pagination
            const pageNum = Math.max(1, parseInt(page));
            const lim = Math.min(100, Math.max(1, parseInt(limit)));
            const startIdx = (pageNum - 1) * lim;
            const sliced = result.slice(startIdx, startIdx + lim);
            const total = result.length;
            const totalPages = Math.ceil(total / lim) || 1;
            return res.json({ ok: true, count: sliced.length, total, page: pageNum, totalPages, limit: lim, logs: sliced, persisted: false });
        }
    } catch (e) {
        console.error('logs error:', e);
        res.status(500).json({ ok: false, message: 'Failed to fetch logs', error: String(e?.message || e) });
    }
});

// Real-time attendance updates for lecturer (WebSocket alternative)
router.get('/live-attendance/:sessionCode', auth(['lecturer','admin']), async (req, res) => {
    try {
        const { sessionCode } = req.params;
        const usingDb = mongoose.connection?.readyState === 1;
        
        // Verify session belongs to this lecturer
        let session = null;
        if (usingDb) {
            session = await AttendanceSession.findOne({ sessionCode }).lean();
        } else {
            session = sessionsMem.find(s => s.sessionCode === sessionCode);
        }
        
        if (!session) {
            return res.status(404).json({ ok: false, message: 'Session not found' });
        }
        
        // Security check - ensure lecturer owns this session
        if (req.user.role !== 'admin' && session.lecturer !== req.user.name) {
            return res.status(403).json({ ok: false, message: 'Access denied' });
        }
        
        // Get live attendance data
        let attendanceRecords = [];
        if (usingDb) {
            attendanceRecords = await AttendanceLog.find({ sessionCode })
                .sort({ timestamp: -1 })
                .lean();
        } else {
            attendanceRecords = attendanceLogsMem.filter(l => l.sessionCode === sessionCode)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
        
        // Check session status
        const now = new Date();
        const expiresAt = new Date(session.expiresAt);
        const isExpired = now >= expiresAt;
        const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
        
        res.json({
            ok: true,
            sessionCode,
            session: {
                courseCode: session.courseCode,
                courseName: session.courseName,
                lecturer: session.lecturer,
                isExpired,
                remainingSeconds,
                expiresAt: session.expiresAt
            },
            attendance: {
                totalCount: attendanceRecords.length,
                records: attendanceRecords.map(record => ({
                    studentId: record.studentId,
                    studentName: record.studentName,
                    centre: record.centre,
                    timestamp: record.timestamp,
                    checkInTime: new Date(record.timestamp).toLocaleTimeString(),
                    timeAgo: Math.floor((now - new Date(record.timestamp)) / 1000) + ' seconds ago'
                }))
            },
            lastUpdated: new Date().toISOString()
        });
    } catch (e) {
        console.error('live attendance error:', e);
        res.status(500).json({ 
            ok: false, 
            message: 'Failed to get live attendance', 
            error: String(e?.message || e) 
        });
    }
});

// Get attendance count for a session (for popup display)
router.get('/session/:sessionCode/attendance-count', auth(['lecturer','admin']), async (req, res) => {
    try {
        const { sessionCode } = req.params;
        const usingDb = mongoose.connection?.readyState === 1;
        
        let count = 0;
        let attendees = [];
        
        if (usingDb) {
            const logs = await AttendanceLog.find({ sessionCode }).lean();
            count = logs.length;
            attendees = logs.map(log => ({
                studentId: log.studentId,
                studentName: log.studentName || 'Unknown',
                timestamp: log.timestamp
            }));
        } else {
            const logs = attendanceLogsMem.filter(l => l.sessionCode === sessionCode);
            count = logs.length;
            attendees = logs.map(log => ({
                studentId: log.studentId,
                studentName: log.studentName || 'Unknown',
                timestamp: log.timestamp
            }));
        }
        
        res.json({
            ok: true,
            sessionCode,
            attendanceCount: count,
            attendees: attendees.slice(0, 10), // Show last 10 attendees
            totalAttendees: count
        });
    } catch (e) {
        console.error('attendance count error:', e);
        res.status(500).json({ ok: false, message: 'Failed to get attendance count', error: String(e?.message || e) });
    }
});

// Enhanced attendance export with multiple formats
router.get('/export', auth(['lecturer','admin']), async (req, res) => {
    const { courseCode, sessionCode, date = '', filterType = 'day', format = 'csv', startDate, endDate } = req.query || {};
    const usingDb = mongoose.connection?.readyState === 1;
    
    try {
        // Enhanced date filtering
        let start = null, end = null;
        
        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Include full end date
        } else if (date) {
            const base = new Date(String(date));
            if (!isNaN(base.getTime())) {
                start = new Date(base);
                end = new Date(base);
                if (String(filterType) === 'week') {
                    const d = start.getDay();
                    const diffToMonday = (d + 6) % 7;
                    start.setDate(start.getDate() - diffToMonday);
                    end.setDate(start.getDate() + 7);
                } else if (String(filterType) === 'month') {
                    start.setDate(1);
                    end.setMonth(start.getMonth() + 1);
                    end.setDate(1);
                } else {
                    end.setDate(end.getDate() + 1);
                }
            }
        }
        
        // Get filtered data
        let result = [];
        if (usingDb) {
            let query = {};
            if (courseCode) query.courseCode = courseCode;
            if (sessionCode) query.sessionCode = sessionCode;
            if (start && end) {
                query.timestamp = { 
                    $gte: start.toISOString(), 
                    $lte: end.toISOString() 
                };
            }
            
            result = await AttendanceLog.find(query).sort({ timestamp: -1 }).lean();
        } else {
            result = attendanceLogsMem;
            if (courseCode) result = result.filter(r => (r.courseCode || '') === String(courseCode));
            if (sessionCode) result = result.filter(r => (r.sessionCode || '') === String(sessionCode));
            if (start && end) result = result.filter(r => {
                const t = new Date(r.timestamp);
                return !isNaN(t.getTime()) && t >= start && t <= end;
            });
        }
        
        // Format data for export
        const exportData = result.map(record => ({
            'Session Code': record.sessionCode || '',
            'Course Code': record.courseCode || '',
            'Course Name': record.courseName || '',
            'Student ID': record.studentId || '',
            'Student Name': record.studentName || 'Unknown Student',
            'Centre': record.centre || 'Not specified',
            'Date': record.timestamp ? new Date(record.timestamp).toLocaleDateString() : '',
            'Time': record.timestamp ? new Date(record.timestamp).toLocaleTimeString() : '',
            'Lecturer': record.lecturer || '',
            'Status': 'Present',
            'Check-in Method': record.checkInMethod || 'Unknown'
        }));
        
        if (format.toLowerCase() === 'excel') {
            // For Excel format, we'll still use CSV but with proper headers for Excel compatibility
            const fields = Object.keys(exportData[0] || {});
            const parser = new Parser({ fields });
            const csv = parser.parse(exportData);
            
            // Add BOM for proper UTF-8 encoding in Excel
            const csvWithBOM = '\uFEFF' + csv;
            
            res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="attendance_export_${Date.now()}.csv"`);
            res.send(csvWithBOM);
        } else {
            // Standard CSV format
            const fields = Object.keys(exportData[0] || {});
            const parser = new Parser({ fields });
            const csv = parser.parse(exportData);
            
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="attendance_export_${Date.now()}.csv"`);
            res.send(csv);
        }
    } catch (e) {
        console.error('export error:', e);
        res.status(500).json({ ok: false, message: 'Failed to export', error: String(e?.message || e) });
    }
});

// Get attendance records for lecturer (for frontend export preview)
router.get('/lecturer/:lecturerId/records', auth(['lecturer','admin']), async (req, res) => {
    try {
        const { lecturerId } = req.params;
        const { courseCode, startDate, endDate, limit = 1000 } = req.query || {};
        
        // Security check
        if (req.user.role !== 'admin' && req.user.id !== lecturerId && req.user.name !== lecturerId) {
            return res.status(403).json({ 
                ok: false, 
                message: 'Access denied. Can only view your own records.' 
            });
        }
        
        const usingDb = mongoose.connection?.readyState === 1;
        let records = [];
        
        if (usingDb) {
            let query = { lecturer: req.user.name };
            if (courseCode) query.courseCode = courseCode;
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.timestamp = { 
                    $gte: start.toISOString(), 
                    $lte: end.toISOString() 
                };
            }
            
            records = await AttendanceLog.find(query)
                .sort({ timestamp: -1 })
                .limit(parseInt(limit))
                .lean();
        } else {
            records = attendanceLogsMem.filter(r => r.lecturer === req.user.name);
            if (courseCode) records = records.filter(r => r.courseCode === courseCode);
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                records = records.filter(r => {
                    const t = new Date(r.timestamp);
                    return t >= start && t <= end;
                });
            }
            records = records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, parseInt(limit));
        }
        
        // Format for frontend display
        const formattedRecords = records.map(record => ({
            sessionCode: record.sessionCode,
            courseCode: record.courseCode,
            courseName: record.courseName,
            studentId: record.studentId,
            studentName: record.studentName || 'Unknown Student',
            centre: record.centre || 'Not specified',
            date: record.timestamp ? new Date(record.timestamp).toLocaleDateString() : '',
            time: record.timestamp ? new Date(record.timestamp).toLocaleTimeString() : '',
            lecturer: record.lecturer,
            status: 'Present',
            timestamp: record.timestamp
        }));
        
        // Get unique courses for filtering
        const uniqueCourses = [...new Set(records.map(r => r.courseCode).filter(Boolean))];
        
        res.json({
            ok: true,
            success: true,
            records: formattedRecords,
            totalRecords: formattedRecords.length,
            courses: uniqueCourses,
            dateRange: {
                earliest: records.length > 0 ? records[records.length - 1].timestamp : null,
                latest: records.length > 0 ? records[0].timestamp : null
            },
            persisted: usingDb
        });
    } catch (e) {
        console.error('lecturer records error:', e);
        res.status(500).json({ 
            ok: false, 
            message: 'Failed to fetch records', 
            error: String(e?.message || e) 
        });
    }
});

// @route   POST /api/attendance/clear-sample-data
// @desc    Clear all sample/demo attendance data (ADMIN ONLY)
// @access  Private (Admin only)
router.post('/clear-sample-data', auth(['admin']), async (req, res) => {
    try {
        const usingDb = mongoose.connection?.readyState === 1;
        let clearedSessions = 0;
        let clearedLogs = 0;
        
        if (usingDb) {
            // Clear sample sessions and logs from database
            const sessionResult = await AttendanceSession.deleteMany({
                $or: [
                    { lecturer: 'Kwabena Lecturer' },
                    { lecturer: 'Prof. Anyimadu' },
                    { courseCode: 'DEMO' }
                ]
            });
            
            const logResult = await AttendanceLog.deleteMany({
                $or: [
                    { studentId: { $in: ['S1001', 'S1002', 'S1003', 'S1004', 'S1005', 'S1006', 'S1007', 'S1008'] } },
                    { studentName: { $regex: /(Alice Johnson|Bob Smith|Carol Davis|David Wilson|Eva Brown|Frank Miller|Grace Lee|Henry Taylor)/ } },
                    { checkInMethod: 'SIMULATED' }
                ]
            });
            
            clearedSessions = sessionResult.deletedCount;
            clearedLogs = logResult.deletedCount;
        }
        
        // Clear in-memory sample data
        const memorySessionsBefore = sessionsMem.length;
        const memoryLogsBefore = attendanceLogsMem.length;
        
        // Clear in-memory arrays
        sessionsMem.length = 0;
        attendanceLogsMem.length = 0;
        
        res.json({
            ok: true,
            message: 'Sample data cleared successfully',
            cleared: {
                database: {
                    sessions: clearedSessions,
                    logs: clearedLogs
                },
                memory: {
                    sessions: memorySessionsBefore,
                    logs: memoryLogsBefore
                }
            },
            note: 'Only real student check-ins will now appear in attendance records'
        });
        
    } catch (error) {
        console.error('Clear sample data error:', error);
        res.status(500).json({
            ok: false,
            message: 'Failed to clear sample data',
            error: error.message
        });
    }
});

// Debug endpoint to verify lecturerId fix is deployed
router.get('/debug/lecturerId-fix', async (req, res) => {
    try {
        const usingDb = mongoose.connection?.readyState === 1;
        
        if (!usingDb) {
            return res.json({
                deployed: true,
                message: 'LecturerId fix is deployed in code',
                database: 'not connected',
                note: 'Database not available to check records'
            });
        }

        // Check recent sessions
        const recentSession = await AttendanceSession.findOne()
            .sort({ issuedAt: -1 })
            .lean();
        
        // Check recent attendance logs
        const recentLog = await AttendanceLog.findOne()
            .sort({ timestamp: -1 })
            .lean();
        
        // Count logs with lecturerId
        const logsWithLecturerId = await AttendanceLog.countDocuments({ 
            lecturerId: { $exists: true, $ne: null } 
        });
        const totalLogs = await AttendanceLog.countDocuments();
        
        res.json({
            deployed: true,
            message: 'LecturerId fix is deployed',
            codeVersion: 'v2.0 - with lecturerId support',
            database: {
                connected: true,
                recentSession: recentSession ? {
                    sessionCode: recentSession.sessionCode,
                    lecturer: recentSession.lecturer,
                    hasLecturerId: !!recentSession.lecturerId,
                    lecturerId: recentSession.lecturerId || 'MISSING',
                    createdAt: recentSession.issuedAt
                } : null,
                recentLog: recentLog ? {
                    studentId: recentLog.studentId,
                    sessionCode: recentLog.sessionCode,
                    lecturer: recentLog.lecturer,
                    hasLecturerId: !!recentLog.lecturerId,
                    lecturerId: recentLog.lecturerId || 'MISSING',
                    timestamp: recentLog.timestamp
                } : null,
                statistics: {
                    totalLogs,
                    logsWithLecturerId,
                    logsWithoutLecturerId: totalLogs - logsWithLecturerId,
                    percentageFixed: totalLogs > 0 ? Math.round((logsWithLecturerId / totalLogs) * 100) : 0
                }
            },
            instructions: {
                ifNoRecordsHaveLecturerId: 'Generate a NEW session after this deployment and have a student check in',
                oldSessions: 'Old sessions created before the fix will not have lecturerId',
                solution: 'Always use newly generated sessions to ensure lecturerId is saved'
            }
        });
        
    } catch (error) {
        res.status(500).json({
            deployed: true,
            message: 'LecturerId fix is deployed but error checking database',
            error: error.message
        });
    }
});

// Reset attendance data (lecturer only)
router.delete('/reset', auth(['lecturer', 'admin']), async (req, res) => {
    try {
        const lecturerId = req.user.id;
        const { sessionCode, courseCode, confirmReset } = req.body;
        
        // Safety check - require explicit confirmation
        if (confirmReset !== true) {
            return res.status(400).json({
                ok: false,
                message: 'Please confirm reset by setting confirmReset to true',
                warning: 'This action will delete attendance records'
            });
        }
        
        const usingDb = mongoose.connection?.readyState === 1;
        
        if (!usingDb) {
            // Reset memory stores
            const sessionsBefore = sessionsMem.length;
            const logsBefore = attendanceLogsMem.length;
            
            sessionsMem.length = 0;
            attendanceLogsMem.length = 0;
            
            return res.json({
                ok: true,
                message: 'Attendance data reset successfully (memory)',
                deleted: {
                    sessions: sessionsBefore,
                    logs: logsBefore
                }
            });
        }
        
        // Build query based on provided filters
        let sessionQuery = {};
        let logQuery = {};
        
        if (sessionCode) {
            // Reset specific session
            sessionQuery.sessionCode = sessionCode;
            logQuery.sessionCode = sessionCode;
        } else if (courseCode) {
            // Reset all sessions for a course
            sessionQuery.courseCode = courseCode;
            logQuery.courseCode = courseCode;
        }
        
        // Only allow lecturer to reset their own sessions
        sessionQuery.$or = [
            { lecturerId: lecturerId },
            { lecturer: req.user.name }
        ];
        
        // Find matching sessions to get their codes
        const sessions = await AttendanceSession.find(sessionQuery).select('sessionCode');
        const sessionCodes = sessions.map(s => s.sessionCode);
        
        // Update log query to match lecturer's sessions
        if (sessionCodes.length > 0) {
            logQuery.sessionCode = { $in: sessionCodes };
        } else {
            // No sessions found, try to match by lecturerId in logs
            logQuery.lecturerId = lecturerId;
        }
        
        // Delete sessions and logs
        const [deletedSessions, deletedLogs] = await Promise.all([
            AttendanceSession.deleteMany(sessionQuery),
            AttendanceLog.deleteMany(logQuery)
        ]);
        
        console.log(`🗑️ Reset attendance: ${deletedSessions.deletedCount} sessions, ${deletedLogs.deletedCount} logs for lecturer ${lecturerId}`);
        
        res.json({
            ok: true,
            message: 'Attendance data reset successfully',
            deleted: {
                sessions: deletedSessions.deletedCount,
                logs: deletedLogs.deletedCount
            },
            filters: {
                sessionCode: sessionCode || 'all',
                courseCode: courseCode || 'all'
            }
        });
        
    } catch (error) {
        console.error('Reset attendance error:', error);
        res.status(500).json({
            ok: false,
            message: 'Failed to reset attendance data',
            error: error.message
        });
    }
});

// Parameterized reset endpoint: DELETE /api/attendance/reset/:lecturerId
// This endpoint allows resetting attendance for a specific lecturer by ID
router.delete('/reset/:lecturerId', auth(['lecturer', 'admin']), async (req, res) => {
    try {
        const targetLecturerId = req.params.lecturerId;
        const { sessionCode, courseCode, confirmReset } = req.body;
        
        // Security: Only allow lecturers to reset their own data, or admins to reset anyone's
        if (req.user.role !== 'admin' && req.user.id !== targetLecturerId) {
            return res.status(403).json({
                ok: false,
                message: 'You can only reset your own attendance data'
            });
        }
        
        // Safety check - require explicit confirmation
        if (confirmReset !== true) {
            return res.status(400).json({
                ok: false,
                message: 'Please confirm reset by setting confirmReset to true',
                warning: 'This action will delete attendance records'
            });
        }
        
        const usingDb = mongoose.connection?.readyState === 1;
        
        if (!usingDb) {
            // Reset memory stores
            const sessionsBefore = sessionsMem.length;
            const logsBefore = attendanceLogsMem.length;
            
            sessionsMem.length = 0;
            attendanceLogsMem.length = 0;
            
            return res.json({
                ok: true,
                message: 'Attendance data reset successfully (memory)',
                deleted: {
                    sessions: sessionsBefore,
                    logs: logsBefore
                }
            });
        }
        
        // Get lecturer info for name-based fallback
        const User = require('../models/User');
        const lecturer = await User.findById(targetLecturerId).select('name');
        
        if (!lecturer) {
            return res.status(404).json({
                ok: false,
                message: 'Lecturer not found'
            });
        }
        
        // Build query based on provided filters
        let sessionQuery = {};
        let logQuery = {};
        
        if (sessionCode) {
            // Reset specific session
            sessionQuery.sessionCode = sessionCode;
            logQuery.sessionCode = sessionCode;
        } else if (courseCode) {
            // Reset all sessions for a course
            sessionQuery.courseCode = courseCode;
            logQuery.courseCode = courseCode;
        }
        
        // Filter by lecturer ID (with name fallback for old records)
        sessionQuery.$or = [
            { lecturerId: targetLecturerId },
            { lecturer: lecturer.name }
        ];
        
        // Find matching sessions to get their codes
        const sessions = await AttendanceSession.find(sessionQuery).select('sessionCode');
        const sessionCodes = sessions.map(s => s.sessionCode);
        
        // Update log query to match lecturer's sessions
        if (sessionCodes.length > 0) {
            logQuery.sessionCode = { $in: sessionCodes };
        } else {
            // No sessions found, try to match by lecturerId in logs
            logQuery.$or = [
                { lecturerId: targetLecturerId },
                { lecturer: lecturer.name }
            ];
        }
        
        // Delete sessions and logs
        const [deletedSessions, deletedLogs] = await Promise.all([
            AttendanceSession.deleteMany(sessionQuery),
            AttendanceLog.deleteMany(logQuery)
        ]);
        
        console.log(`🗑️ Reset attendance: ${deletedSessions.deletedCount} sessions, ${deletedLogs.deletedCount} logs for lecturer ${targetLecturerId}`);
        
        res.json({
            ok: true,
            message: 'Attendance data reset successfully',
            deleted: {
                sessions: deletedSessions.deletedCount,
                logs: deletedLogs.deletedCount
            },
            filters: {
                lecturerId: targetLecturerId,
                sessionCode: sessionCode || 'all',
                courseCode: courseCode || 'all'
            }
        });
        
    } catch (error) {
        console.error('Reset attendance by lecturer ID error:', error);
        res.status(500).json({
            ok: false,
            message: 'Failed to reset attendance data',
            error: error.message
        });
    }
});

module.exports = router;