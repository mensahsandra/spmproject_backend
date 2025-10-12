# Attendance Session Management - Implementation Guide

## Overview

This document describes the enhanced attendance session management system that prevents stale sessions, eliminates 400 errors, and provides robust reset functionality.

## Features Implemented

### 1. Automatic Stale Session Cleanup

**Problem Solved**: Lecturers were getting "You already have an active session" errors even after sessions expired.

**Solution**: 
- Automatic cleanup of expired sessions before creating new ones
- Background service that runs every 5 minutes to remove expired sessions
- Prevents overlapping sessions and stale data

**Implementation**:
```javascript
// In routes/attendance.js - generate-session endpoint
// Automatically cleans up expired sessions before checking for active ones
const expiredSessions = await AttendanceSession.deleteMany({
    $or: [
        { lecturerId: req.user.id },
        { lecturer: lecturerName }
    ],
    expiresAt: { $lte: now }
});
```

### 2. Background Session Cleanup Service

**Location**: `services/sessionCleanupService.js`

**Features**:
- Runs automatically every 5 minutes (configurable)
- Removes all expired sessions from database
- Provides monitoring methods for active/expired session counts
- Graceful shutdown on server termination

**Usage**:
```javascript
const sessionCleanupService = require('./services/sessionCleanupService');

// Start service (runs every 5 minutes)
sessionCleanupService.start(5);

// Stop service
sessionCleanupService.stop();

// Manual cleanup
await sessionCleanupService.runCleanup();

// Clean specific lecturer's expired sessions
await sessionCleanupService.cleanupForLecturer(lecturerId, lecturerName);

// Get counts for monitoring
const expiredCount = await sessionCleanupService.getExpiredCount();
const activeCount = await sessionCleanupService.getActiveCount();
```

### 3. Parameterized Reset Endpoint

**Problem Solved**: Frontend needed a way to reset attendance for specific lecturers.

**Endpoint**: `DELETE /api/attendance/reset/:lecturerId`

**Features**:
- Reset attendance data for a specific lecturer by ID
- Security: Lecturers can only reset their own data (admins can reset anyone's)
- Supports optional filters: `sessionCode`, `courseCode`
- Requires explicit confirmation via `confirmReset: true`

**Request Example**:
```javascript
// Reset all attendance for a lecturer
DELETE /api/attendance/reset/507f1f77bcf86cd799439011
Body: {
    "confirmReset": true
}

// Reset specific session
DELETE /api/attendance/reset/507f1f77bcf86cd799439011
Body: {
    "confirmReset": true,
    "sessionCode": "ABC123-XYZ789"
}

// Reset all sessions for a course
DELETE /api/attendance/reset/507f1f77bcf86cd799439011
Body: {
    "confirmReset": true,
    "courseCode": "BIT364"
}
```

**Response Example**:
```json
{
    "ok": true,
    "message": "Attendance data reset successfully",
    "deleted": {
        "sessions": 5,
        "logs": 23
    },
    "filters": {
        "lecturerId": "507f1f77bcf86cd799439011",
        "sessionCode": "all",
        "courseCode": "all"
    }
}
```

### 4. Enhanced Alias Routes

**Location**: `routes/attendance-sessions-alias.js`

**Purpose**: Provides backward compatibility for frontend routes

**Supported Routes**:
```javascript
// Original endpoint -> Alias endpoint
POST   /api/attendance/generate-session     -> POST   /api/attendance-sessions
GET    /api/attendance/lecturer/:id         -> GET    /api/attendance-sessions
DELETE /api/attendance/reset                -> DELETE /api/attendance-sessions/reset
DELETE /api/attendance/reset/:lecturerId    -> DELETE /api/attendance-sessions/reset/:lecturerId
```

## API Endpoints Summary

### Session Generation
```
POST /api/attendance/generate-session
POST /api/attendance-sessions (alias)

Body: {
    "courseCode": "BIT364",
    "courseName": "Entrepreneurship",
    "durationMinutes": 30
}

Features:
- Automatically cleans expired sessions before generation
- Prevents duplicate active sessions
- Returns QR code and session details
```

### Check Active Session
```
GET /api/attendance/active-session

Response: {
    "ok": true,
    "hasActiveSession": true,
    "session": {
        "sessionCode": "ABC123-XYZ789",
        "remainingSeconds": 1234,
        "expiresAt": "2024-01-15T10:30:00Z"
    }
}
```

### Reset Attendance (General)
```
DELETE /api/attendance/reset
DELETE /api/attendance-sessions/reset (alias)

Body: {
    "confirmReset": true,
    "sessionCode": "ABC123-XYZ789",  // optional
    "courseCode": "BIT364"            // optional
}

Security: Resets only the authenticated lecturer's data
```

### Reset Attendance (By Lecturer ID)
```
DELETE /api/attendance/reset/:lecturerId
DELETE /api/attendance-sessions/reset/:lecturerId (alias)

Body: {
    "confirmReset": true,
    "sessionCode": "ABC123-XYZ789",  // optional
    "courseCode": "BIT364"            // optional
}

Security: 
- Lecturers can only reset their own data
- Admins can reset any lecturer's data
```

## Error Handling

### Common Errors and Solutions

#### 1. "You already have an active session"
**Cause**: Lecturer has an unexpired session
**Solution**: 
- Wait for session to expire
- Use reset endpoint to clear session
- Automatic cleanup will remove it within 5 minutes

#### 2. "Route not found" (400 error)
**Cause**: Frontend calling wrong endpoint
**Solution**: 
- Use alias routes in `attendance-sessions-alias.js`
- Frontend can call either `/api/attendance/*` or `/api/attendance-sessions/*`

#### 3. "Please confirm reset by setting confirmReset to true"
**Cause**: Safety check - reset requires explicit confirmation
**Solution**: Add `"confirmReset": true` to request body

#### 4. "You can only reset your own attendance data"
**Cause**: Lecturer trying to reset another lecturer's data
**Solution**: 
- Lecturers can only reset their own data
- Contact admin for cross-lecturer resets

## Database Schema

### AttendanceSession
```javascript
{
    sessionCode: String,      // Unique session identifier
    courseCode: String,       // Course code (e.g., "BIT364")
    courseName: String,       // Course name
    lecturer: String,         // Lecturer name (fallback)
    lecturerId: ObjectId,     // Lecturer's user ID (primary)
    issuedAt: Date,          // Session creation time
    expiresAt: Date,         // Session expiration time
    timestamps: true         // createdAt, updatedAt
}
```

### AttendanceLog
```javascript
{
    studentId: String,        // Student ID
    sessionCode: String,      // Reference to session
    studentName: String,      // Student name
    courseCode: String,       // Course code
    courseName: String,       // Course name
    lecturer: String,         // Lecturer name (fallback)
    lecturerId: ObjectId,     // Lecturer's user ID (primary)
    centre: String,          // Student's centre
    location: String,        // Check-in location
    checkInMethod: String,   // "QR_SCAN" or "MANUAL_CODE"
    timestamp: Date,         // Check-in time
    timestamps: true         // createdAt, updatedAt
}
```

## Monitoring and Maintenance

### Check Session Status
```javascript
// Get expired session count
const expiredCount = await sessionCleanupService.getExpiredCount();
console.log(`Expired sessions: ${expiredCount}`);

// Get active session count
const activeCount = await sessionCleanupService.getActiveCount();
console.log(`Active sessions: ${activeCount}`);
```

### Manual Cleanup
```javascript
// Run cleanup manually
const deletedCount = await sessionCleanupService.runCleanup();
console.log(`Cleaned up ${deletedCount} expired sessions`);

// Clean specific lecturer's sessions
const count = await sessionCleanupService.cleanupForLecturer(
    '507f1f77bcf86cd799439011',
    'Prof. Anyimadu'
);
```

### Logs to Monitor
```
🧹 [CLEANUP] Removed X expired session(s) for lecturer Y
✅ [SESSION-CLEANUP] No expired sessions found
⚠️ [CLEANUP] Failed to clean expired sessions: [error]
🗑️ Reset attendance: X sessions, Y logs for lecturer Z
```

## Configuration

### Cleanup Service Interval
```javascript
// In index.js
sessionCleanupService.start(5);  // Run every 5 minutes (default)
sessionCleanupService.start(10); // Run every 10 minutes
sessionCleanupService.start(1);  // Run every 1 minute (testing)
```

### Session Duration
```javascript
// In frontend or API request
{
    "durationMinutes": 30  // Default: 30 minutes
}
```

## Testing

### Test Stale Session Cleanup
```bash
# 1. Generate a session with short duration
POST /api/attendance/generate-session
Body: { "durationMinutes": 1 }

# 2. Wait 1 minute for expiration

# 3. Try to generate new session (should succeed with cleanup)
POST /api/attendance/generate-session
Body: { "durationMinutes": 30 }

# Expected: Old session cleaned, new session created
```

### Test Reset Endpoint
```bash
# 1. Generate session and record attendance
POST /api/attendance/generate-session
POST /api/attendance/check-in

# 2. Reset attendance
DELETE /api/attendance/reset/:lecturerId
Body: { "confirmReset": true }

# 3. Verify sessions and logs deleted
GET /api/attendance/lecturer/:lecturerId
# Expected: Empty array
```

### Test Cleanup Service
```bash
# 1. Check service is running
# Look for log: "Session cleanup service started"

# 2. Create expired session manually in DB
# Set expiresAt to past date

# 3. Wait for next cleanup cycle (max 5 minutes)
# Look for log: "🧹 [SESSION-CLEANUP] Removed X expired session(s)"
```

## Deployment Notes

### Environment Variables
No new environment variables required. Service uses existing MongoDB connection.

### Server Startup
The cleanup service starts automatically when the server starts:
```javascript
// In index.js
sessionCleanupService.start(5);
```

### Graceful Shutdown
Service stops automatically on server shutdown:
```javascript
process.on('SIGTERM', () => {
    sessionCleanupService.stop();
});
```

### Vercel Deployment
The cleanup service works on Vercel serverless functions, but note:
- Cleanup runs only when server is active
- For production, consider using a scheduled cron job
- Vercel cron jobs can trigger cleanup endpoint

## Security Considerations

1. **Authorization**: All endpoints require authentication via JWT
2. **Role-Based Access**: Only lecturers and admins can manage sessions
3. **Data Isolation**: Lecturers can only reset their own data (unless admin)
4. **Confirmation Required**: Reset operations require explicit `confirmReset: true`
5. **Audit Logging**: All operations logged with lecturer ID and counts

## Performance Optimization

1. **Indexes**: 
   - `lecturerId` indexed for fast lecturer queries
   - `expiresAt` indexed for cleanup queries
   - `sessionCode` indexed for check-in lookups

2. **Batch Operations**: 
   - Cleanup uses `deleteMany()` for efficiency
   - Reset operations use `Promise.all()` for parallel execution

3. **Lean Queries**: 
   - Uses `.lean()` for read-only operations
   - Reduces memory overhead

## Troubleshooting

### Issue: Cleanup service not running
**Check**: Look for "Session cleanup service started" in logs
**Solution**: Verify `index.js` imports and starts the service

### Issue: Sessions not being cleaned
**Check**: Database connection status
**Solution**: Cleanup only runs when `mongoose.connection.readyState === 1`

### Issue: Reset not working
**Check**: `confirmReset` parameter in request body
**Solution**: Must be exactly `true` (boolean, not string)

### Issue: 403 Forbidden on reset
**Check**: Lecturer ID matches authenticated user
**Solution**: Lecturers can only reset their own data

## Future Enhancements

1. **Real-time Notifications**: WebSocket alerts when sessions expire
2. **Session Analytics**: Dashboard showing session usage patterns
3. **Bulk Operations**: Reset multiple lecturers at once (admin only)
4. **Session Extensions**: Allow extending active sessions
5. **Scheduled Sessions**: Pre-schedule sessions for future classes

## Support

For issues or questions:
1. Check server logs for error messages
2. Verify database connection status
3. Test with Postman/Thunder Client
4. Review this documentation

## Changelog

### Version 1.0.0 (Current)
- ✅ Automatic stale session cleanup on generation
- ✅ Background cleanup service (5-minute intervals)
- ✅ Parameterized reset endpoint by lecturer ID
- ✅ Enhanced alias routes for backward compatibility
- ✅ Comprehensive error handling and logging
- ✅ Security and authorization checks
- ✅ Graceful shutdown handling