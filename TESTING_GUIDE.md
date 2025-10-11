# Testing Guide - Notification System

## Quick Test Checklist

### ✅ 1. Reset Button Fix
**Test**: Attendance reset at https://spmproject-web.vercel.app/lecturer/attendance

**Steps**:
1. Login as lecturer
2. Navigate to `/lecturer/attendance`
3. Click "Reset" button
4. Confirm reset action

**Expected Result**: 
- ✅ Attendance data is reset successfully
- ✅ No "Route not found" error

**API Call**:
```bash
DELETE /api/attendance/reset
# OR
DELETE /api/attendance-sessions/reset
Authorization: Bearer <lecturer-token>
Content-Type: application/json

{
  "confirmReset": true
}
```

---

### ✅ 2. Quiz Creation Notifications

**Test**: Create quiz at https://spmproject-web.vercel.app/lecturer/assessment

**Steps**:
1. Login as lecturer
2. Navigate to `/lecturer/assessment`
3. Create a new quiz with course code
4. Submit quiz

**Expected Results**:
- ✅ Lecturer receives confirmation notification at `/lecturer/notifications`
- ✅ All students in the course receive notification at `/student/notifications?tab=notifications`
- ✅ Bell icon count increases for lecturer and students
- ✅ Students can access quiz at `/student/assessment`

**API Call**:
```bash
POST /api/quizzes/create
Authorization: Bearer <lecturer-token>
Content-Type: application/json

{
  "title": "Test Quiz",
  "courseCode": "BIT364",
  "description": "Test quiz description",
  "startTime": "2025-01-25T10:00:00Z",
  "endTime": "2025-01-26T10:00:00Z",
  "maxScore": 100,
  "notifyStudents": true
}
```

**Verify Notifications**:
```bash
# As lecturer
GET /api/notifications/unread-count
Authorization: Bearer <lecturer-token>

# As student
GET /api/notifications/unread-count
Authorization: Bearer <student-token>
```

---

### ✅ 3. QR Code Scan Notifications

**Test**: Scan QR code generated at https://spmproject-web.vercel.app/lecturer/generatesession

**Steps**:
1. Login as lecturer
2. Navigate to `/lecturer/generatesession`
3. Generate QR code for a session
4. Login as student (different browser/incognito)
5. Scan the QR code
6. Check lecturer notifications

**Expected Results**:
- ✅ Lecturer receives notification at `/lecturer/notifications`
- ✅ Notification shows student name and course
- ✅ Bell icon count increases for lecturer
- ✅ Action link points to `/lecturer/attendance`

**API Call**:
```bash
POST /api/attendance/check-in
Authorization: Bearer <student-token>
Content-Type: application/json

{
  "studentId": "1234567",
  "qrCode": "{\"sessionCode\":\"ABC-XYZ\",\"courseCode\":\"BIT364\"}",
  "centre": "Kumasi",
  "timestamp": "2025-01-25T10:00:00.000Z"
}
```

**Verify Notification**:
```bash
GET /api/notifications
Authorization: Bearer <lecturer-token>
```

---

### ✅ 4. Quiz Submission Notifications

**Test**: Submit quiz at https://spmproject-web.vercel.app/student/assessment

**Steps**:
1. Login as student
2. Navigate to `/student/assessment`
3. Open available quiz
4. Complete and submit quiz
5. Check notifications for both student and lecturer

**Expected Results**:
- ✅ Student receives confirmation at `/student/notifications?tab=notifications`
- ✅ Lecturer receives "new submission" alert at `/lecturer/notifications`
- ✅ Lecturer can grade from `/lecturer/assessment`
- ✅ Bell icon count increases for both

**API Call**:
```bash
POST /api/quizzes/:quizId/submit
Authorization: Bearer <student-token>
Content-Type: multipart/form-data

{
  "submissionText": "My quiz answers..."
}
```

**Verify Notifications**:
```bash
# Student notification
GET /api/notifications
Authorization: Bearer <student-token>

# Lecturer notification
GET /api/notifications
Authorization: Bearer <lecturer-token>
```

---

### ✅ 5. Quiz Grading Notifications

**Test**: Grade submission at https://spmproject-web.vercel.app/lecturer/assessment

**Steps**:
1. Login as lecturer
2. Navigate to `/lecturer/assessment`
3. View quiz submissions
4. Grade a submission
5. Check notifications for both student and lecturer

**Expected Results**:
- ✅ Student receives results notification at `/student/notifications?tab=notifications`
- ✅ Lecturer receives grading confirmation at `/lecturer/notifications`
- ✅ Bell icon count increases for both
- ✅ Student can view score and feedback

**API Call**:
```bash
POST /api/quizzes/:quizId/submissions/:submissionId/grade
Authorization: Bearer <lecturer-token>
Content-Type: application/json

{
  "score": 85,
  "feedback": "Great work! Well done."
}
```

**Verify Notifications**:
```bash
# Student notification
GET /api/notifications
Authorization: Bearer <student-token>

# Lecturer notification
GET /api/notifications
Authorization: Bearer <lecturer-token>
```

---

### ✅ 6. Bell Icon Count

**Test**: Verify unread notification counts

**Steps**:
1. Login as user (student or lecturer)
2. Check bell icon count
3. Click a notification
4. Verify count decreases

**Expected Results**:
- ✅ Count shows correct number of unread notifications
- ✅ Count updates when notification is marked as read
- ✅ Count is separate for students and lecturers

**API Calls**:
```bash
# Get unread count
GET /api/notifications/unread-count
Authorization: Bearer <token>

# Mark as read
PATCH /api/notifications/:notificationId/read
Authorization: Bearer <token>

# Mark all as read
POST /api/notifications/mark-all-read
Authorization: Bearer <token>
```

---

### ✅ 7. Notification Segregation

**Test**: Verify students and lecturers see different notifications

**Steps**:
1. Login as student
2. Check notifications at `/student/notifications?tab=notifications`
3. Note the notifications shown
4. Login as lecturer
5. Check notifications at `/lecturer/notifications`
6. Verify different notifications are shown

**Expected Results**:
- ✅ Students only see student-specific notifications
- ✅ Lecturers only see lecturer-specific notifications
- ✅ No cross-contamination of notifications

**API Calls**:
```bash
# Student notifications
GET /api/notifications
Authorization: Bearer <student-token>

# Lecturer notifications
GET /api/notifications
Authorization: Bearer <lecturer-token>
```

---

## Common Issues & Solutions

### Issue: "Route not found" for reset
**Solution**: ✅ Fixed! Added redirect in `attendance-sessions-alias.js`

### Issue: Notifications not appearing
**Solutions**:
- Verify user is authenticated (check JWT token)
- Check `recipientId` matches logged-in user
- Verify notification hasn't expired
- Check database connection

### Issue: Bell icon count incorrect
**Solutions**:
- Call `/api/notifications/unread-count` to refresh
- Verify notifications are being marked as read
- Check for duplicate notifications

### Issue: Duplicate notifications
**Solutions**:
- Check for duplicate API calls in frontend
- Verify unique indexes are working
- Check notification service logs

---

## API Response Examples

### Successful Quiz Creation
```json
{
  "ok": true,
  "success": true,
  "message": "Quiz created and shared with students successfully!",
  "quiz": {
    "id": "65b1234567890abcdef12345",
    "title": "Test Quiz",
    "courseCode": "BIT364",
    "notificationSent": true
  }
}
```

### Notification Response
```json
{
  "ok": true,
  "notifications": [
    {
      "_id": "65b1234567890abcdef12345",
      "recipientId": "65b0987654321fedcba09876",
      "recipientRole": "student",
      "type": "quiz_created",
      "title": "New Quiz Available",
      "message": "A new quiz 'Test Quiz' has been created for BIT364",
      "read": false,
      "actionUrl": "/student/assessment",
      "actionLabel": "Take Quiz",
      "priority": "high",
      "createdAt": "2025-01-25T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

### Unread Count Response
```json
{
  "ok": true,
  "count": 5
}
```

---

## Testing with Postman/Thunder Client

### 1. Setup Environment Variables
```
BASE_URL = https://spmproject-backend-34xnz1owc-mensahsandras-projects.vercel.app
LECTURER_TOKEN = <your-lecturer-jwt-token>
STUDENT_TOKEN = <your-student-jwt-token>
```

### 2. Test Collection

**Collection: Notification System Tests**

1. **Login as Lecturer**
   - POST `{{BASE_URL}}/api/auth/login`
   - Save token to `LECTURER_TOKEN`

2. **Login as Student**
   - POST `{{BASE_URL}}/api/auth/login`
   - Save token to `STUDENT_TOKEN`

3. **Create Quiz (Lecturer)**
   - POST `{{BASE_URL}}/api/quizzes/create`
   - Headers: `Authorization: Bearer {{LECTURER_TOKEN}}`

4. **Check Notifications (Student)**
   - GET `{{BASE_URL}}/api/notifications`
   - Headers: `Authorization: Bearer {{STUDENT_TOKEN}}`

5. **Check Unread Count (Student)**
   - GET `{{BASE_URL}}/api/notifications/unread-count`
   - Headers: `Authorization: Bearer {{STUDENT_TOKEN}}`

6. **Submit Quiz (Student)**
   - POST `{{BASE_URL}}/api/quizzes/:quizId/submit`
   - Headers: `Authorization: Bearer {{STUDENT_TOKEN}}`

7. **Grade Quiz (Lecturer)**
   - POST `{{BASE_URL}}/api/quizzes/:quizId/submissions/:submissionId/grade`
   - Headers: `Authorization: Bearer {{LECTURER_TOKEN}}`

8. **Mark Notification as Read**
   - PATCH `{{BASE_URL}}/api/notifications/:id/read`
   - Headers: `Authorization: Bearer {{STUDENT_TOKEN}}`

---

## Deployment Verification

After deploying to Vercel, verify:

1. ✅ All routes are accessible
2. ✅ Notifications are being created in database
3. ✅ Bell icon counts are updating
4. ✅ Role-based segregation is working
5. ✅ Action URLs are correct
6. ✅ Reset button works without errors

**Quick Health Check**:
```bash
# Check API health
GET https://spmproject-backend-34xnz1owc-mensahsandras-projects.vercel.app/api/health

# Check quiz routes
GET https://spmproject-backend-34xnz1owc-mensahsandras-projects.vercel.app/api/quizzes/health

# Check notification routes
GET https://spmproject-backend-34xnz1owc-mensahsandras-projects.vercel.app/api/notifications/health
```

---

## Success Criteria

All features are working correctly when:

- ✅ Reset button works without "Route not found" error
- ✅ Quiz creation sends notifications to students and lecturer
- ✅ QR scan sends notification to lecturer
- ✅ Quiz submission sends notifications to student and lecturer
- ✅ Quiz grading sends notifications to student and lecturer
- ✅ Bell icon shows correct unread count
- ✅ Students and lecturers see separate notifications
- ✅ Action URLs navigate to correct pages
- ✅ Notifications can be marked as read
- ✅ Notification counts update correctly

---

**Last Updated**: January 2025  
**Status**: All Features Implemented ✅