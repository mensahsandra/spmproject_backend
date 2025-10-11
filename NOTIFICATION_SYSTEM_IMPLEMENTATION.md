# Notification System Implementation - Complete Guide

## Overview
This document describes the comprehensive notification system implemented for the Student Performance Metrics application. The system provides real-time notifications for quiz creation, submissions, grading, and attendance tracking.

## Implementation Summary

### ✅ Completed Features

#### 1. **Attendance Reset Endpoint** 
- **Route**: `DELETE /api/attendance/reset`
- **Access**: Lecturer only
- **Purpose**: Reset attendance sessions with safety checks
- **Safety**: Requires `confirmReset: true` parameter
- **File**: `routes/attendance.js`

#### 2. **Notification Infrastructure**
Created complete notification system with:
- **Model**: `models/Notification.js` - Comprehensive schema with indexes
- **Routes**: `routes/notifications.js` - Full CRUD operations
- **Service**: `services/notificationService.js` - Business logic layer

#### 3. **Quiz Creation Notifications**
- **Trigger**: When lecturer creates quiz at `/lecturer/assessment`
- **Recipients**: 
  - All students enrolled in the course → notification sent to `/student/assessment` and `/student/notifications?tab=notifications`
  - Lecturer → confirmation notification sent to `/lecturer/notifications`
- **Implementation**: `routes/quizzes.js` - POST `/api/quizzes/create`

#### 4. **QR Scan Notifications**
- **Trigger**: When student scans QR code for attendance
- **Recipients**: Lecturer who created the session
- **Notification**: Sent to `/lecturer/notifications` with student details
- **Action Link**: Points to `/lecturer/attendance`
- **Implementation**: `routes/attendance.js` - POST `/api/attendance/check-in`

#### 5. **Quiz Submission Notifications**
- **Trigger**: When student submits quiz
- **Recipients**:
  - Student → confirmation sent to `/student/notifications?tab=notifications`
  - Lecturer → new submission alert sent to `/lecturer/notifications` and `/lecturer/assessment`
- **Implementation**: `routes/quizzes.js` - POST `/api/quizzes/:quizId/submit`

#### 6. **Quiz Grading Notifications**
- **Trigger**: When lecturer grades a submission
- **Recipients**:
  - Student → results notification sent to `/student/notifications?tab=notifications`
  - Lecturer → grading confirmation sent to `/lecturer/notifications`
- **Implementation**: `routes/quizzes.js` - POST `/api/quizzes/:quizId/submissions/:submissionId/grade`

#### 7. **Separate Student/Lecturer Notification Feeds**
- Notifications are segregated by `recipientRole` field
- Each user only sees their own notifications filtered by `recipientId`
- Bell icon count shows unread notifications per user

---

## API Endpoints

### Notification Endpoints

#### Get All Notifications
```http
GET /api/notifications
Authorization: Bearer <token>
Query Parameters:
  - page (default: 1)
  - limit (default: 20)
  - type (optional: filter by notification type)
  - read (optional: true/false)
```

#### Get Unread Count
```http
GET /api/notifications/unread-count
Authorization: Bearer <token>
Response: { ok: true, count: 5 }
```

#### Mark as Read
```http
PATCH /api/notifications/:id/read
Authorization: Bearer <token>
```

#### Mark All as Read
```http
POST /api/notifications/mark-all-read
Authorization: Bearer <token>
```

#### Delete Notification
```http
DELETE /api/notifications/:id
Authorization: Bearer <token>
```

#### Get Statistics
```http
GET /api/notifications/stats
Authorization: Bearer <token>
Response: {
  total: 50,
  unread: 5,
  byType: { quiz_created: 10, attendance_scan: 20, ... }
}
```

### Quiz Endpoints (New)

#### Submit Quiz (Student)
```http
POST /api/quizzes/:quizId/submit
Authorization: Bearer <token> (student role)
Content-Type: multipart/form-data
Body:
  - submissionText (optional)
  - submissionFiles (optional, max 5 files)
```

#### Grade Quiz (Lecturer)
```http
POST /api/quizzes/:quizId/submissions/:submissionId/grade
Authorization: Bearer <token> (lecturer role)
Content-Type: application/json
Body: {
  "score": 85,
  "feedback": "Great work!"
}
```

#### Get Available Quizzes (Student)
```http
GET /api/quizzes/student/available
Authorization: Bearer <token> (student role)
Query Parameters:
  - courseCode (optional)
```

#### Get Student Submissions
```http
GET /api/quizzes/student/submissions
Authorization: Bearer <token> (student role)
```

### Attendance Endpoints (Updated)

#### Reset Attendance
```http
DELETE /api/attendance/reset
Authorization: Bearer <token> (lecturer role)
Content-Type: application/json
Body: {
  "confirmReset": true
}
```

---

## Notification Types

| Type | Recipient | Trigger | Action URL |
|------|-----------|---------|------------|
| `quiz_created` | Student | Lecturer creates quiz | `/student/assessment` |
| `quiz_created` | Lecturer | Quiz creation confirmation | `/lecturer/assessment` |
| `quiz_submitted` | Student | Student submits quiz | `/student/notifications?tab=notifications` |
| `quiz_submitted` | Lecturer | New submission received | `/lecturer/assessment` |
| `quiz_graded` | Student | Lecturer grades submission | `/student/notifications?tab=notifications` |
| `quiz_graded` | Lecturer | Grading confirmation | `/lecturer/notifications` |
| `attendance_scan` | Lecturer | Student scans QR code | `/lecturer/attendance` |
| `attendance_session_created` | Lecturer | Session created | `/lecturer/attendance` |

---

## Database Schema

### Notification Model
```javascript
{
  recipientId: ObjectId,           // User who receives notification
  recipientRole: String,           // 'student', 'lecturer', 'admin'
  type: String,                    // Notification type (see table above)
  title: String,                   // Notification title
  message: String,                 // Notification message
  read: Boolean,                   // Read status
  readAt: Date,                    // When marked as read
  relatedQuizId: ObjectId,         // Related quiz (if applicable)
  relatedSubmissionId: ObjectId,   // Related submission (if applicable)
  relatedCourseCode: String,       // Related course
  relatedSessionCode: String,      // Related attendance session
  metadata: Object,                // Additional data
  actionUrl: String,               // Frontend URL to navigate to
  actionLabel: String,             // Button label
  priority: String,                // 'low', 'normal', 'high', 'urgent'
  expiresAt: Date,                 // Auto-expiration date
  createdAt: Date,                 // Creation timestamp
  updatedAt: Date                  // Last update timestamp
}
```

### Indexes
- `{ recipientId: 1, read: 1, createdAt: -1 }` - Fast unread queries
- `{ recipientId: 1, type: 1 }` - Filter by type
- `{ expiresAt: 1 }` - Auto-cleanup expired notifications
- `{ createdAt: 1 }` - Time-based queries

---

## Files Modified/Created

### Created Files
1. ✅ `models/Notification.js` - Notification data model
2. ✅ `routes/notifications.js` - Notification API routes
3. ✅ `services/notificationService.js` - Notification business logic

### Modified Files
1. ✅ `routes/attendance-sessions-alias.js` - Added authentication middleware
2. ✅ `routes/attendance.js` - Added reset endpoint and QR scan notifications
3. ✅ `app.js` - Registered notification routes
4. ✅ `routes/quizzes.js` - Integrated notifications for quiz lifecycle

---

## Notification Flow Examples

### Example 1: Quiz Creation Flow
```
1. Lecturer creates quiz at /lecturer/assessment
   ↓
2. POST /api/quizzes/create
   ↓
3. Quiz saved to database
   ↓
4. NotificationService.notifyQuizCreated() called
   ↓
5. System finds all students in course
   ↓
6. Creates notification for each student
   ↓
7. Creates confirmation notification for lecturer
   ↓
8. Students see notification at /student/notifications
9. Lecturer sees confirmation at /lecturer/notifications
10. Bell icon count updates for all recipients
```

### Example 2: Quiz Submission Flow
```
1. Student submits quiz at /student/assessment
   ↓
2. POST /api/quizzes/:quizId/submit
   ↓
3. Submission saved to database
   ↓
4. NotificationService.notifyQuizSubmitted() called
   ↓
5. Creates confirmation notification for student
   ↓
6. Creates grading alert for lecturer
   ↓
7. Student sees confirmation at /student/notifications
8. Lecturer sees new submission at /lecturer/notifications
9. Bell icon count updates for both users
```

### Example 3: QR Scan Flow
```
1. Student scans QR code
   ↓
2. POST /api/attendance/check-in
   ↓
3. Attendance logged to database
   ↓
4. NotificationService.notifyAttendanceScan() called
   ↓
5. Creates notification for lecturer
   ↓
6. Lecturer sees scan notification at /lecturer/notifications
7. Bell icon count updates
```

---

## Security Features

1. **Role-Based Access Control**: All endpoints use `auth()` middleware with role restrictions
2. **User Isolation**: Users can only see their own notifications (filtered by `recipientId`)
3. **Reset Safety**: Attendance reset requires explicit confirmation parameter
4. **Lecturer Verification**: Quiz grading verifies quiz ownership before allowing grading
5. **Submission Validation**: Checks quiz timing and prevents duplicate submissions

---

## Error Handling

All notification operations use try-catch blocks to prevent failures from breaking core functionality:

```javascript
try {
  await NotificationService.notifyQuizCreated(quiz, lecturerId);
} catch (notifyError) {
  console.warn('Failed to send notifications:', notifyError.message);
  // Core operation continues even if notification fails
}
```

This ensures that:
- Quiz creation succeeds even if notifications fail
- Attendance logging works even if lecturer notification fails
- Grading completes even if student notification fails

---

## Testing Checklist

### Quiz Notifications
- [ ] Create quiz as lecturer → verify student receives notification
- [ ] Create quiz as lecturer → verify lecturer receives confirmation
- [ ] Check bell icon count increases for both
- [ ] Click notification → verify navigation to correct page

### Submission Notifications
- [ ] Submit quiz as student → verify student receives confirmation
- [ ] Submit quiz as student → verify lecturer receives grading alert
- [ ] Check bell icon count increases for both
- [ ] Click notification → verify navigation to correct page

### Grading Notifications
- [ ] Grade submission as lecturer → verify student receives results
- [ ] Grade submission as lecturer → verify lecturer receives confirmation
- [ ] Check bell icon count increases for both
- [ ] Click notification → verify navigation to correct page

### Attendance Notifications
- [ ] Scan QR code as student → verify lecturer receives notification
- [ ] Check bell icon count increases for lecturer
- [ ] Click notification → verify navigation to attendance page

### Notification Management
- [ ] Mark notification as read → verify count decreases
- [ ] Mark all as read → verify count goes to zero
- [ ] Delete notification → verify it's removed
- [ ] Filter by type → verify correct notifications shown
- [ ] Check pagination works correctly

### Reset Functionality
- [ ] Try reset without confirmation → verify it fails
- [ ] Reset with confirmation → verify sessions cleared
- [ ] Try reset as non-lecturer → verify access denied

---

## Deployment Notes

### Environment Variables
No new environment variables required. Uses existing:
- `MONGO_URI` or `MONGODB_URI` - MongoDB connection
- `JWT_SECRET` - JWT authentication
- `FRONTEND_ORIGINS` - CORS configuration

### Database Migration
No migration needed. Notification collection will be created automatically on first notification.

### Vercel Deployment
All changes are compatible with Vercel serverless deployment:
- No long-running processes
- Stateless notification creation
- MongoDB connection pooling handled by existing infrastructure

---

## Frontend Integration Guide

### Fetching Notifications
```javascript
// Get all notifications
const response = await fetch('/api/notifications', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { notifications, pagination } = await response.json();

// Get unread count for bell icon
const countResponse = await fetch('/api/notifications/unread-count', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { count } = await countResponse.json();
```

### Marking as Read
```javascript
// Mark single notification as read
await fetch(`/api/notifications/${notificationId}/read`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Mark all as read
await fetch('/api/notifications/mark-all-read', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Handling Notification Click
```javascript
function handleNotificationClick(notification) {
  // Mark as read
  markAsRead(notification._id);
  
  // Navigate to action URL
  if (notification.actionUrl) {
    router.push(notification.actionUrl);
  }
}
```

---

## Performance Considerations

1. **Indexes**: Compound indexes ensure fast queries even with thousands of notifications
2. **Pagination**: Default limit of 20 prevents large data transfers
3. **Selective Population**: Only necessary fields are populated in queries
4. **Auto-Expiration**: Old notifications can be automatically cleaned up using `expiresAt`
5. **Non-Blocking**: Notification failures don't block core operations

---

## Future Enhancements

Potential improvements for future iterations:

1. **Real-time Updates**: Integrate WebSocket/Socket.io for instant notifications
2. **Email Notifications**: Send email for high-priority notifications
3. **Push Notifications**: Browser push notifications for urgent alerts
4. **Notification Preferences**: Allow users to customize notification types
5. **Batch Operations**: Bulk delete/mark as read for multiple notifications
6. **Rich Notifications**: Support for images, attachments, and formatted content
7. **Notification History**: Archive old notifications instead of deleting
8. **Analytics**: Track notification open rates and engagement

---

## Support & Troubleshooting

### Common Issues

**Issue**: Notifications not appearing
- Check user authentication token is valid
- Verify `recipientId` matches logged-in user
- Check notification hasn't expired (`expiresAt`)

**Issue**: Bell icon count incorrect
- Call `/api/notifications/unread-count` to refresh
- Verify notifications are being marked as read correctly

**Issue**: Duplicate notifications
- Check for duplicate API calls in frontend
- Verify unique indexes are working (quiz + student for submissions)

**Issue**: Reset button not working
- Ensure `confirmReset: true` is in request body
- Verify user has lecturer role
- Check authentication token is valid

---

## Conclusion

The notification system is now fully implemented and integrated with:
- ✅ Quiz creation, submission, and grading workflows
- ✅ Attendance QR code scanning
- ✅ Separate student and lecturer notification feeds
- ✅ Bell icon unread counts
- ✅ Attendance reset functionality

All endpoints are secured with role-based authentication and include proper error handling. The system is ready for deployment to Vercel production.

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: Production Ready ✅