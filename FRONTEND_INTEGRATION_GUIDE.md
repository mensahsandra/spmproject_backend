# Frontend Integration Guide for Grade Management

## 🎯 Overview
This guide explains how to integrate the new grade management endpoints into your frontend application.

---

## 📋 New API Endpoints Available

### 1. **Get Enrolled Students with Grades**
**Endpoint:** `GET /api/grades/enrolled`

**Purpose:** Fetch all students enrolled in a course with their grades categorized by assessment type.

**Query Parameters:**
- `courseCode` (required): The course code (e.g., "BIT364")

**Authentication:** Required (Lecturer/Admin only)

**Request Example:**
```javascript
const response = await fetch(
  `${API_URL}/api/grades/enrolled?courseCode=BIT364`,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
const data = await response.json();
```

**Response Format:**
```json
{
  "success": true,
  "courseCode": "BIT364",
  "courseName": "Web Development",
  "students": [
    {
      "studentId": "1234568",
      "fullName": "John Kwaku Doe",
      "email": "john.doe@student.edu",
      "assessment": "85/100 (B+)",
      "midsem": "78/100 (B)",
      "endOfSemester": "88/100 (A-)",
      "rawGrades": {
        "assessment": {
          "score": 85,
          "maxScore": 100,
          "percentage": 85,
          "grade": "B+",
          "submissionDate": "2024-12-10T10:30:00.000Z"
        },
        "midsem": { /* ... */ },
        "endOfSemester": { /* ... */ }
      }
    }
    // ... more students
  ],
  "totalStudents": 4
}
```

**Frontend Usage (React Example):**
```jsx
import { useState, useEffect } from 'react';

function QuizManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchEnrolledStudents() {
      try {
        const token = localStorage.getItem('token');
        const courseCode = 'BIT364'; // or get from props/state
        
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/grades/enrolled?courseCode=${courseCode}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch students');
        }

        const data = await response.json();
        setStudents(data.students);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEnrolledStudents();
  }, []);

  if (loading) return <div>Loading students...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>Student ID</th>
          <th>Full Name</th>
          <th>Assessment</th>
          <th>Midsem</th>
          <th>End of Semester</th>
        </tr>
      </thead>
      <tbody>
        {students.map(student => (
          <tr key={student.studentId}>
            <td>{student.studentId}</td>
            <td>{student.fullName}</td>
            <td>{student.assessment}</td>
            <td>{student.midsem}</td>
            <td>{student.endOfSemester}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

### 2. **Get Grade History**
**Endpoint:** `GET /api/grades/history`

**Purpose:** Fetch complete grade history for a course (all submissions and grades).

**Query Parameters:**
- `courseCode` (required): The course code (e.g., "BIT364")

**Authentication:** Required (Lecturer/Admin only)

**Request Example:**
```javascript
const response = await fetch(
  `${API_URL}/api/grades/history?courseCode=BIT364`,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
const data = await response.json();
```

**Response Format:**
```json
{
  "success": true,
  "courseCode": "BIT364",
  "courseName": "Web Development",
  "history": [
    {
      "courseCode": "BIT364",
      "studentId": "1234568",
      "studentName": "John Kwaku Doe",
      "assessmentType": "Assessment",
      "score": 85,
      "maxScore": 100,
      "percentage": 85,
      "grade": "B+",
      "submissionDate": "2024-12-10T10:30:00.000Z",
      "feedback": "Excellent work!",
      "lecturerName": "Dr. Smith"
    }
    // ... more history entries (sorted by date, most recent first)
  ],
  "totalEntries": 12,
  "metadata": {
    "assessmentTypes": ["Assessment", "Midsem", "End of Semester"],
    "students": ["John Kwaku Doe", "Saaed Hawa", "Kwarteng Samuel", "Nashiru Alhassan"]
  }
}
```

**Frontend Usage:**
```jsx
function GradeHistory({ courseCode }) {
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function fetchHistory() {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/grades/history?courseCode=${courseCode}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const data = await response.json();
      setHistory(data.history);
    }
    fetchHistory();
  }, [courseCode]);

  const filteredHistory = filter === 'all' 
    ? history 
    : history.filter(h => h.assessmentType === filter);

  return (
    <div>
      <select onChange={(e) => setFilter(e.target.value)}>
        <option value="all">All Assessments</option>
        <option value="Assessment">Assessment</option>
        <option value="Midsem">Midsem</option>
        <option value="End of Semester">End of Semester</option>
      </select>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Student</th>
            <th>Assessment Type</th>
            <th>Score</th>
            <th>Grade</th>
          </tr>
        </thead>
        <tbody>
          {filteredHistory.map((entry, idx) => (
            <tr key={idx}>
              <td>{new Date(entry.submissionDate).toLocaleDateString()}</td>
              <td>{entry.studentName}</td>
              <td>{entry.assessmentType}</td>
              <td>{entry.score}/{entry.maxScore}</td>
              <td>{entry.grade}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

### 3. **Assign Individual Grade**
**Endpoint:** `POST /api/grades/assign`

**Purpose:** Assign or update a grade for a specific student and assessment.

**Authentication:** Required (Lecturer/Admin only)

**Request Body:**
```json
{
  "courseCode": "BIT364",
  "studentId": "1234568",
  "assessmentType": "Assessment",
  "score": 85,
  "maxScore": 100,
  "feedback": "Great work!",
  "lecturerName": "Dr. Smith"
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "Grade assigned successfully",
  "grade": {
    "courseCode": "BIT364",
    "studentId": "1234568",
    "studentName": "John Kwaku Doe",
    "assessmentType": "Assessment",
    "score": 85,
    "maxScore": 100,
    "percentage": 85,
    "grade": "B+",
    "submissionDate": "2024-12-10T10:30:00.000Z",
    "feedback": "Great work!",
    "lecturerName": "Dr. Smith"
  }
}
```

**Frontend Usage:**
```jsx
async function assignGrade(gradeData) {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/grades/assign`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseCode: gradeData.courseCode,
          studentId: gradeData.studentId,
          assessmentType: gradeData.assessmentType,
          score: gradeData.score,
          maxScore: gradeData.maxScore,
          feedback: gradeData.feedback,
          lecturerName: gradeData.lecturerName
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to assign grade');
    }

    const data = await response.json();
    console.log('Grade assigned:', data.grade);
    return data;
  } catch (error) {
    console.error('Error assigning grade:', error);
    throw error;
  }
}

// Usage in a form
function GradeAssignmentForm({ student, courseCode }) {
  const [formData, setFormData] = useState({
    assessmentType: 'Assessment',
    score: '',
    maxScore: 100,
    feedback: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    await assignGrade({
      courseCode,
      studentId: student.studentId,
      assessmentType: formData.assessmentType,
      score: parseFloat(formData.score),
      maxScore: parseFloat(formData.maxScore),
      feedback: formData.feedback,
      lecturerName: 'Dr. Smith' // Get from auth context
    });

    alert('Grade assigned successfully!');
  };

  return (
    <form onSubmit={handleSubmit}>
      <select 
        value={formData.assessmentType}
        onChange={(e) => setFormData({...formData, assessmentType: e.target.value})}
      >
        <option value="Assessment">Assessment</option>
        <option value="Midsem">Midsem</option>
        <option value="End of Semester">End of Semester</option>
      </select>

      <input
        type="number"
        placeholder="Score"
        value={formData.score}
        onChange={(e) => setFormData({...formData, score: e.target.value})}
        required
      />

      <input
        type="number"
        placeholder="Max Score"
        value={formData.maxScore}
        onChange={(e) => setFormData({...formData, maxScore: e.target.value})}
        required
      />

      <textarea
        placeholder="Feedback (optional)"
        value={formData.feedback}
        onChange={(e) => setFormData({...formData, feedback: e.target.value})}
      />

      <button type="submit">Assign Grade</button>
    </form>
  );
}
```

---

### 4. **Get Semester/Block Options**
**Endpoint:** `GET /api/grades/semesters`

**Purpose:** Get available semester/block options (now returns "Block 1" and "Block 2").

**Authentication:** Required

**Response Format:**
```json
{
  "success": true,
  "semesters": ["Block 1", "Block 2"]
}
```

**Frontend Usage:**
```jsx
function SemesterSelector() {
  const [semesters, setSemesters] = useState([]);

  useEffect(() => {
    async function fetchSemesters() {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/grades/semesters`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const data = await response.json();
      setSemesters(data.semesters);
    }
    fetchSemesters();
  }, []);

  return (
    <select>
      {semesters.map(sem => (
        <option key={sem} value={sem}>{sem}</option>
      ))}
    </select>
  );
}
```

---

## 🔐 Authentication

All endpoints require a valid JWT token in the Authorization header:

```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

Get the token from your login response and store it:
```javascript
// After login
const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { token } = await loginResponse.json();
localStorage.setItem('token', token);
```

---

## 📊 Sample Student Data

The backend now has 4 sample students enrolled in BIT364:

| Student ID | Name | Email | Password |
|------------|------|-------|----------|
| 1234568 | John Kwaku Doe | john.doe@student.edu | Student123! |
| 1234456 | Saaed Hawa | saaed.hawa@student.edu | Student123! |
| 1233456 | Kwarteng Samuel | kwarteng.samuel@student.edu | Student123! |
| 1234557 | Nashiru Alhassan | nashiru.alhassan@student.edu | Student123! |

Each student has grades for:
- **Assessment** (Quiz/Assignment)
- **Midsem** (Midterm Exam)
- **End of Semester** (Final Exam)

---

## 🎨 UI Integration Checklist

### For Lecturer Assessment Page (`/lecturer/assessment`)

- [ ] **Replace hardcoded student data** with API call to `/api/grades/enrolled`
- [ ] **Display students in a table** with columns: Student ID, Full Name, Assessment, Midsem, End of Semester
- [ ] **Add loading state** while fetching data
- [ ] **Add error handling** for failed API calls
- [ ] **Add course selector** to filter by course code
- [ ] **Add grade assignment form** using `/api/grades/assign` endpoint
- [ ] **Refresh table** after assigning new grades

### For Student Results Page (`/student/display-result`)

- [ ] **Update semester dropdown** to show "Block 1" and "Block 2" (use `/api/grades/semesters`)
- [ ] **Fetch student grades** using existing endpoints
- [ ] **Display grades** grouped by assessment type
- [ ] **Show grade history** with submission dates

### General Updates

- [ ] **Update API base URL** in environment variables (`.env`)
- [ ] **Add error boundary** for API failures
- [ ] **Add toast notifications** for grade assignments
- [ ] **Implement real-time updates** (optional: WebSocket or polling)

---

## 🚀 Deployment Steps

### Backend Deployment (Vercel)

1. **Commit changes:**
```bash
git add .
git commit -m "Add grade management endpoints and sample students"
git push origin main
```

2. **Vercel will auto-deploy** (if connected to GitHub)
   - Or manually deploy: `vercel --prod`

3. **Verify deployment:**
```bash
curl https://spmproject-backend.vercel.app/api/grades/health
```

### Frontend Updates

1. **Update your frontend code** to use the new endpoints
2. **Test locally** with the deployed backend
3. **Deploy frontend** to Vercel

---

## 🧪 Testing the Endpoints

### Test Script (Node.js)
Create `test-grade-endpoints.js`:

```javascript
const API_URL = 'https://spmproject-backend.vercel.app';
const TOKEN = 'your-jwt-token-here'; // Get from login

async function testEndpoints() {
  // Test 1: Get enrolled students
  console.log('Testing /api/grades/enrolled...');
  const enrolledRes = await fetch(
    `${API_URL}/api/grades/enrolled?courseCode=BIT364`,
    {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
  const enrolledData = await enrolledRes.json();
  console.log('Enrolled students:', enrolledData);

  // Test 2: Get grade history
  console.log('\nTesting /api/grades/history...');
  const historyRes = await fetch(
    `${API_URL}/api/grades/history?courseCode=BIT364`,
    {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
  const historyData = await historyRes.json();
  console.log('Grade history:', historyData);

  // Test 3: Assign a grade
  console.log('\nTesting /api/grades/assign...');
  const assignRes = await fetch(
    `${API_URL}/api/grades/assign`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        courseCode: 'BIT364',
        studentId: '1234568',
        assessmentType: 'Assessment',
        score: 90,
        maxScore: 100,
        feedback: 'Excellent!',
        lecturerName: 'Test Lecturer'
      })
    }
  );
  const assignData = await assignRes.json();
  console.log('Grade assigned:', assignData);
}

testEndpoints();
```

Run: `node test-grade-endpoints.js`

---

## ❓ Troubleshooting

### Issue: 404 Error on Endpoints
**Solution:** Ensure backend is deployed with latest changes. Check Vercel deployment logs.

### Issue: 401 Unauthorized
**Solution:** Verify JWT token is valid and not expired. Re-login if needed.

### Issue: Empty Student List
**Solution:** Run the seed script: `node scripts/seedSampleStudents.js`

### Issue: CORS Error
**Solution:** Verify frontend URL is in `FRONTEND_ORIGINS` environment variable on Vercel.

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check network tab for API responses
3. Verify backend deployment status on Vercel
4. Check backend logs on Vercel dashboard

---

**Last Updated:** December 2024
**Backend Version:** 2.0.0
**API Base URL:** https://spmproject-backend.vercel.app