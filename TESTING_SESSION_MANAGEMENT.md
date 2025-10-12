# Testing Guide: Session Management & Reset Features

## Quick Test Checklist

### ✅ Test 1: Automatic Stale Session Cleanup

**Scenario**: Verify expired sessions are automatically removed when generating new session

```bash
# Step 1: Generate session with 1-minute duration
POST http://localhost:3000/api/attendance/generate-session
Authorization: Bearer <lecturer_token>
Content-Type: application/json

{
    "courseCode": "BIT364",
    "courseName": "Test Course",
    "durationMinutes": 1
}

# Expected Response:
{
    "ok": true,
    "session": {
        "sessionCode": "ABC123-XYZ789",
        "remainingSeconds": 60
    }
}

# Step 2: Wait 61 seconds for expiration

# Step 3: Generate new session (should auto-clean expired one)
POST http://localhost:3000/api/attendance/generate-session
Authorization: Bearer <lecturer_token>
Content-Type: application/json

{
    "courseCode": "BIT364",
    "courseName": "Test Course",
    "durationMinutes": 30
}

# Expected Response: Success (no "already have active session" error)
# Expected Log: "🧹 [CLEANUP] Removed 1 expired session(s)"
```

**✅ PASS**: New session created without errors
**❌ FAIL**: Gets "You already have an active session" error

---

### ✅ Test 2: Background Cleanup Service

**Scenario**: Verify service runs automatically every 5 minutes

```bash
# Step 1: Start server and check logs
npm run dev

# Expected Logs:
# "Database connection established"
# "Session cleanup service started"
# "✅ Server running on port 3000"

# Step 2: Create expired session manually in database
# (Use MongoDB Compass or mongo shell)
db.attendancesessions.insertOne({
    sessionCode: "EXPIRED-TEST",
    courseCode: "TEST",
    courseName: "Test",
    lecturer: "Test Lecturer",
    lecturerId: ObjectId("..."),
    issuedAt: new Date(Date.now() - 600000),  // 10 minutes ago
    expiresAt: new Date(Date.now() - 300000), // 5 minutes ago (expired)
    createdAt: new Date(),
    updatedAt: new Date()
})

# Step 3: Wait up to 5 minutes and check logs

# Expected Log (within 5 minutes):
# "🧹 [SESSION-CLEANUP] Removed 1 expired session(s)"
```

**✅ PASS**: Expired session removed automatically
**❌ FAIL**: Session still exists after 5+ minutes

---

### ✅ Test 3: Reset Endpoint (General)

**Scenario**: Reset all attendance for authenticated lecturer

```bash
# Step 1: Generate session and record attendance
POST http://localhost:3000/api/attendance/generate-session
Authorization: Bearer <lecturer_token>

POST http://localhost:3000/api/attendance/check-in
Authorization: Bearer <student_token>
Content-Type: application/json

{
    "studentId": "12345",
    "sessionCode": "ABC123-XYZ789"
}

# Step 2: Reset attendance
DELETE http://localhost:3000/api/attendance/reset
Authorization: Bearer <lecturer_token>
Content-Type: application/json

{
    "confirmReset": true
}

# Expected Response:
{
    "ok": true,
    "message": "Attendance data reset successfully",
    "deleted": {
        "sessions": 1,
        "logs": 1
    }
}

# Step 3: Verify data deleted
GET http://localhost:3000/api/attendance/logs
Authorization: Bearer <lecturer_token>

# Expected: Empty array or no logs for that session
```

**✅ PASS**: Sessions and logs deleted
**❌ FAIL**: Data still exists

---

### ✅ Test 4: Reset Endpoint (By Lecturer ID)

**Scenario**: Reset attendance for specific lecturer

```bash
# Step 1: Get lecturer ID
# Login as lecturer and decode JWT token to get user ID
# Or query database: db.users.findOne({ email: "lecturer@example.com" })

# Step 2: Generate session
POST http://localhost:3000/api/attendance/generate-session
Authorization: Bearer <lecturer_token>

# Step 3: Reset by lecturer ID
DELETE http://localhost:3000/api/attendance/reset/507f1f77bcf86cd799439011
Authorization: Bearer <lecturer_token>
Content-Type: application/json

{
    "confirmReset": true
}

# Expected Response:
{
    "ok": true,
    "message": "Attendance data reset successfully",
    "deleted": {
        "sessions": 1,
        "logs": 0
    },
    "filters": {
        "lecturerId": "507f1f77bcf86cd799439011",
        "sessionCode": "all",
        "courseCode": "all"
    }
}
```

**✅ PASS**: Lecturer's data deleted
**❌ FAIL**: Error or data not deleted

---

### ✅ Test 5: Security - Lecturer Can't Reset Others' Data

**Scenario**: Verify lecturers can only reset their own data

```bash
# Step 1: Try to reset another lecturer's data
DELETE http://localhost:3000/api/attendance/reset/DIFFERENT_LECTURER_ID
Authorization: Bearer <lecturer_token>
Content-Type: application/json

{
    "confirmReset": true
}

# Expected Response: 403 Forbidden
{
    "ok": false,
    "message": "You can only reset your own attendance data"
}
```

**✅ PASS**: Gets 403 error
**❌ FAIL**: Able to delete other lecturer's data

---

### ✅ Test 6: Alias Routes Work

**Scenario**: Verify frontend can use alias routes

```bash
# Test 1: Generate session via alias
POST http://localhost:3000/api/attendance-sessions
Authorization: Bearer <lecturer_token>
Content-Type: application/json

{
    "courseCode": "BIT364",
    "durationMinutes": 30
}

# Expected: Success (same as /api/attendance/generate-session)

# Test 2: Reset via alias
DELETE http://localhost:3000/api/attendance-sessions/reset
Authorization: Bearer <lecturer_token>
Content-Type: application/json

{
    "confirmReset": true
}

# Expected: Success (same as /api/attendance/reset)

# Test 3: Reset by ID via alias
DELETE http://localhost:3000/api/attendance-sessions/reset/507f1f77bcf86cd799439011
Authorization: Bearer <lecturer_token>
Content-Type: application/json

{
    "confirmReset": true
}

# Expected: Success (same as /api/attendance/reset/:lecturerId)
```

**✅ PASS**: All alias routes work
**❌ FAIL**: Route not found errors

---

### ✅ Test 7: Confirmation Required

**Scenario**: Verify reset requires explicit confirmation

```bash
# Try to reset without confirmation
DELETE http://localhost:3000/api/attendance/reset
Authorization: Bearer <lecturer_token>
Content-Type: application/json

{
    "confirmReset": false
}

# Expected Response: 400 Bad Request
{
    "ok": false,
    "message": "Please confirm reset by setting confirmReset to true",
    "warning": "This action will delete attendance records"
}
```

**✅ PASS**: Gets 400 error with warning
**❌ FAIL**: Deletes data without confirmation

---

### ✅ Test 8: Selective Reset (By Session Code)

**Scenario**: Reset only specific session

```bash
# Step 1: Generate two sessions (different courses)
POST http://localhost:3000/api/attendance/generate-session
Body: { "courseCode": "BIT364", "durationMinutes": 30 }
# Note sessionCode1

POST http://localhost:3000/api/attendance/generate-session
# Wait for first to expire, then:
Body: { "courseCode": "BIT365", "durationMinutes": 30 }
# Note sessionCode2

# Step 2: Reset only first session
DELETE http://localhost:3000/api/attendance/reset
Authorization: Bearer <lecturer_token>
Content-Type: application/json

{
    "confirmReset": true,
    "sessionCode": "sessionCode1"
}

# Expected: Only first session deleted, second remains
```

**✅ PASS**: Only specified session deleted
**❌ FAIL**: All sessions deleted

---

### ✅ Test 9: Selective Reset (By Course Code)

**Scenario**: Reset all sessions for specific course

```bash
DELETE http://localhost:3000/api/attendance/reset
Authorization: Bearer <lecturer_token>
Content-Type: application/json

{
    "confirmReset": true,
    "courseCode": "BIT364"
}

# Expected: Only BIT364 sessions deleted
```

**✅ PASS**: Only specified course sessions deleted
**❌ FAIL**: Wrong sessions deleted

---

### ✅ Test 10: Active Session Check

**Scenario**: Check if lecturer has active session

```bash
# Step 1: Generate session
POST http://localhost:3000/api/attendance/generate-session
Authorization: Bearer <lecturer_token>

# Step 2: Check active session
GET http://localhost:3000/api/attendance/active-session
Authorization: Bearer <lecturer_token>

# Expected Response:
{
    "ok": true,
    "hasActiveSession": true,
    "session": {
        "sessionCode": "ABC123-XYZ789",
        "remainingSeconds": 1234,
        "expiresAt": "2024-01-15T10:30:00Z"
    }
}

# Step 3: Wait for expiration, check again
GET http://localhost:3000/api/attendance/active-session

# Expected Response:
{
    "ok": true,
    "hasActiveSession": false
}
```

**✅ PASS**: Correctly reports active/inactive status
**❌ FAIL**: Wrong status reported

---

## Postman/Thunder Client Collection

### Environment Variables
```json
{
    "baseUrl": "http://localhost:3000",
    "lecturerToken": "eyJhbGc...",
    "studentToken": "eyJhbGc...",
    "lecturerId": "507f1f77bcf86cd799439011"
}
```

### Collection Structure
```
Session Management Tests/
├── 1. Generate Session
├── 2. Check Active Session
├── 3. Generate Session (Should Fail - Active)
├── 4. Wait & Generate (Should Succeed - Cleanup)
├── 5. Reset All (General)
├── 6. Reset By Lecturer ID
├── 7. Reset Specific Session
├── 8. Reset Specific Course
├── 9. Security Test (Wrong Lecturer)
└── 10. Alias Routes Test
```

---

## Common Issues & Solutions

### Issue: "You already have an active session"
**Cause**: Session hasn't expired yet
**Solutions**:
1. Wait for session to expire
2. Use reset endpoint to clear
3. Check cleanup service is running

### Issue: "Route not found"
**Cause**: Wrong endpoint URL
**Solutions**:
1. Use `/api/attendance/reset` not `/api/attendance-sessions/reset` (or use alias)
2. Check server logs for route registration
3. Verify `attendance-sessions-alias.js` is loaded

### Issue: "Please confirm reset"
**Cause**: Missing or wrong `confirmReset` value
**Solution**: Add `"confirmReset": true` (boolean) to request body

### Issue: "You can only reset your own data"
**Cause**: Lecturer ID mismatch
**Solutions**:
1. Use your own lecturer ID
2. Login as admin for cross-lecturer resets
3. Check JWT token is valid

### Issue: Cleanup service not running
**Cause**: Service not started or DB disconnected
**Solutions**:
1. Check logs for "Session cleanup service started"
2. Verify database connection
3. Restart server

---

## Monitoring Commands

### Check Service Status
```bash
# Check server logs for:
grep "SESSION-CLEANUP" logs.txt
grep "CLEANUP" logs.txt
```

### Database Queries
```javascript
// Count active sessions
db.attendancesessions.countDocuments({ expiresAt: { $gt: new Date() } })

// Count expired sessions
db.attendancesessions.countDocuments({ expiresAt: { $lte: new Date() } })

// Find lecturer's sessions
db.attendancesessions.find({ lecturerId: ObjectId("...") })

// Find expired sessions
db.attendancesessions.find({ expiresAt: { $lte: new Date() } })
```

---

## Performance Testing

### Load Test: Multiple Sessions
```bash
# Generate 10 sessions rapidly (should fail after first)
for i in {1..10}; do
    curl -X POST http://localhost:3000/api/attendance/generate-session \
         -H "Authorization: Bearer $TOKEN" \
         -H "Content-Type: application/json" \
         -d '{"durationMinutes": 30}'
done

# Expected: 1 success, 9 failures (active session)
```

### Load Test: Cleanup Performance
```bash
# Create 100 expired sessions in DB
# Wait for cleanup cycle
# Check time taken in logs
```

---

## Success Criteria

All tests should pass:
- ✅ Automatic cleanup on generation
- ✅ Background service runs every 5 minutes
- ✅ Reset endpoint works (general)
- ✅ Reset by lecturer ID works
- ✅ Security prevents cross-lecturer resets
- ✅ Alias routes work correctly
- ✅ Confirmation required for resets
- ✅ Selective resets work (session/course)
- ✅ Active session check works
- ✅ No 400 errors from stale sessions

---

## Deployment Testing

### Vercel Production Tests
```bash
# Replace localhost with production URL
BASE_URL="https://spmproject-backend.vercel.app"

# Test 1: Generate session
curl -X POST $BASE_URL/api/attendance/generate-session \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"courseCode": "BIT364", "durationMinutes": 30}'

# Test 2: Reset
curl -X DELETE $BASE_URL/api/attendance/reset \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"confirmReset": true}'

# Test 3: Reset by ID
curl -X DELETE $BASE_URL/api/attendance/reset/$LECTURER_ID \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"confirmReset": true}'
```

### Expected Production Behavior
- ✅ All endpoints respond within 2 seconds
- ✅ Cleanup service runs (check logs in Vercel dashboard)
- ✅ No memory leaks or crashes
- ✅ CORS headers present
- ✅ Rate limiting works

---

## Rollback Plan

If issues occur in production:

1. **Immediate**: Revert to previous deployment in Vercel
2. **Database**: Expired sessions won't cause issues (just clutter)
3. **Frontend**: Can still use old reset endpoint
4. **Logs**: Check Vercel logs for errors

---

## Next Steps After Testing

1. ✅ All tests pass locally
2. ✅ Deploy to Vercel staging
3. ✅ Run production tests
4. ✅ Monitor logs for 24 hours
5. ✅ Update frontend to use new endpoints
6. ✅ Document any issues found
7. ✅ Create monitoring dashboard (optional)

---

## Support

For issues during testing:
1. Check server logs first
2. Verify database connection
3. Test with Postman/Thunder Client
4. Review `ATTENDANCE_SESSION_MANAGEMENT.md`
5. Check this testing guide

**All tests should pass before deploying to production!**