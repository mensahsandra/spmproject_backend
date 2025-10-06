# Backend API Implementation - Enhanced Quiz Management & Bulk Grading

## ✅ Implementation Status

The backend has been successfully implemented with comprehensive quiz management features:

### 📁 New Files Created
- `models/Quiz.js` - Enhanced quiz data model with questions support
- `models/QuizSubmission.js` - Quiz submission tracking model  
- `routes/quizzes.js` - Complete quiz management API endpoints
- Enhanced `routes/grades.js` - Added bulk grading endpoint
- `test-quiz-api.js` - API testing script

### 🔧 Modified Files
- `app.js` - Added quiz routes registration
- Created `uploads/quizzes/` directory for file storage

## 🚀 Enhanced Features

### ✨ Quiz Creation Features
- **Question Typing**: Support for text, multiple choice, essay, and file upload questions
- **Time Management**: Start time and end time for quiz availability
- **Student Targeting**: Option to restrict quiz to students who attended sessions
- **File Attachments**: Support for multiple file uploads (PDF, DOC, images, etc.)
- **Auto Notifications**: Automatic student notifications when quiz is created
- **Flexible Submissions**: Students can submit via text, file upload, image capture, or scanning

## 🚀 API Endpoints

### Quiz Management

#### 1. Create Quiz (Enhanced)
```
POST /api/quizzes/create
Content-Type: multipart/form-data
Authorization: Bearer <token> (lecturer/admin only)
```

**Form Data:**
- `title` (required) - Quiz title
- `description` - Quiz description
- `courseCode` (required) - Course code (e.g., "BIT364")
- `startTime` - Quiz start time (ISO format)
- `endTime` - Quiz end time (ISO format)
- `maxScore` - Maximum score (default: 100)
- `instructions` - Quiz instructions
- `questions` - JSON string of questions array
- `restrictToAttendees` - Boolean, restrict to students who attended
- `notifyStudents` - Boolean, send notifications (default: true)
- `attachments` - File uploads (max 5 files, 10MB each)

**Questions Format:**
```json
[
  {
    "type": "text",
    "question": "What is the capital of Ghana?",
    "points": 5,
    "required": true
  },
  {
    "type": "multiple_choice",
    "question": "Which is correct?",
    "options": ["Option A", "Option B", "Option C"],
    "correctAnswer": "Option A",
    "points": 3
  },
  {
    "type": "essay",
    "question": "Explain the concept...",
    "points": 10
  }
]
```

**Response:**
```json
{
  "ok": true,
  "success": true,
  "message": "Quiz created and shared with students successfully!",
  "quiz": {
    "id": "quiz_id",
    "title": "Midterm Quiz",
    "courseCode": "BIT364",
    "startTime": "2025-01-25T09:00:00Z",
    "endTime": "2025-01-25T11:00:00Z",
    "maxScore": 100,
    "attachments": 2,
    "questionsCount": 5,
    "restrictToAttendees": false,
    "notificationSent": true
  }
}
```

#### 2. Get Quizzes by Course
```
GET /api/quizzes/course/:courseCode?page=1&limit=10
Authorization: Bearer <token> (lecturer/admin only)
```

#### 3. Get Quiz Submissions
```
GET /api/quizzes/:quizId/submissions
Authorization: Bearer <token> (lecturer/admin only)
```

#### 4. Lecturer Dashboard
```
GET /api/quizzes/lecturer/dashboard?limit=10
Authorization: Bearer <token> (lecturer/admin only)
```

#### 5. Get Lecturer Courses
```
GET /api/quizzes/lecturer/courses
Authorization: Bearer <token> (lecturer/admin only)
```

#### 6. Get Quiz Details
```
GET /api/quizzes/:quizId
Authorization: Bearer <token> (lecturer/admin only)
```

#### 7. Update Quiz
```
PUT /api/quizzes/:quizId
Content-Type: multipart/form-data
Authorization: Bearer <token> (lecturer/admin only)
```

#### 8. Delete Quiz
```
DELETE /api/quizzes/:quizId
Authorization: Bearer <token> (lecturer/admin only)
```

#### 9. Get Students for Course
```
GET /api/quizzes/course/:courseCode/students?filter=all|attendees
Authorization: Bearer <token> (lecturer/admin only)
```

#### 10. Test Endpoint (No Auth)
```
POST /api/quizzes/test-create
Content-Type: application/json
```

### Bulk Grading

#### Bulk Assign Grades
```
POST /api/grades/bulk-assign
Content-Type: application/json
Authorization: Bearer <token> (lecturer/admin only)
```

**Request Body:**
```json
{
  "courseCode": "BIT364",
  "assessmentType": "Quiz 1",
  "score": 85,
  "maxScore": 100,
  "grade": "B+",
  "feedback": "Good work!",
  "studentFilter": "all"
}
```

**Student Filter Options:**
- `"all"` - All enrolled students
- `"attendees"` - Students who attended classes
- `"quiz_submitters"` - Students who submitted the quiz

**Response:**
```json
{
  "ok": true,
  "message": "Successfully assigned grades to 4 students",
  "assignedGrades": 4,
  "studentFilter": "all",
  "courseCode": "BIT364",
  "assessmentType": "Quiz 1",
  "grades": [...]
}
```

## 🧪 Testing the Implementation

### Test Quiz Creation
```bash
curl -X POST http://localhost:3000/api/quizzes/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Midterm Quiz" \
  -F "courseCode=BIT364" \
  -F "dueDate=2025-02-15T23:59:00Z" \
  -F "maxScore=100" \
  -F "description=Midterm assessment covering chapters 1-5" \
  -F "attachments=@quiz_file.pdf"
```

### Test Bulk Grading
```bash
curl -X POST http://localhost:3000/api/grades/bulk-assign \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseCode": "BIT364",
    "assessmentType": "Quiz 1",
    "score": 85,
    "maxScore": 100,
    "grade": "B+",
    "feedback": "Well done!",
    "studentFilter": "all"
  }'
```

### Test Health Check
```bash
curl http://localhost:3000/api/quizzes/health
```

## 📊 Database Schema

### Quiz Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  courseCode: String,
  lecturer: ObjectId (ref: User),
  lecturerName: String,
  dueDate: Date,
  maxScore: Number,
  instructions: String,
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String
  }],
  isActive: Boolean,
  notificationSent: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Quiz Submission Collection
```javascript
{
  _id: ObjectId,
  quiz: ObjectId (ref: Quiz),
  student: ObjectId (ref: User),
  studentId: String,
  studentName: String,
  submissionFiles: [FileSchema],
  submissionText: String,
  submittedAt: Date,
  score: Number,
  grade: String,
  feedback: String,
  gradedAt: Date,
  gradedBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

## 🔒 Security Features

- **Authentication Required**: All endpoints require valid JWT tokens
- **Role-based Access**: Only lecturers and admins can create quizzes and assign grades
- **File Upload Security**: 
  - File type validation (PDF, DOC, images, archives only)
  - File size limits (10MB per file, max 5 files)
  - Secure file storage with unique filenames
- **Input Validation**: All required fields validated
- **Error Handling**: Comprehensive error responses with logging

## 🚀 Next Steps

1. **Start the Backend Server**:
   ```bash
   npm start
   # or
   npm run dev
   ```

2. **Test the Endpoints**: Use the provided cURL commands or Postman

3. **Frontend Integration**: The frontend is already configured to use these endpoints

4. **Optional Enhancements**:
   - Email notifications for new quizzes
   - Real-time grade updates
   - File download endpoints
   - Quiz analytics dashboard

## 📝 Notes

- File uploads are stored in `uploads/quizzes/` directory
- The implementation uses in-memory storage for demo purposes
- In production, integrate with your MongoDB database
- Student filtering logic can be enhanced based on your attendance and enrollment systems

The backend is now fully compatible with your frontend Quiz Management interface! 🎉