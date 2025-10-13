# 🚀 API Request Examples - Quick Reference

## 📌 Base URL
```
Production: https://spmproject-backend.vercel.app
Local: http://localhost:5000
```

---

## 🔐 Authentication Header (Required for all requests)
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## 1️⃣ Assign Individual Grade

### Endpoint
```
POST /api/grades/assign
```

### JavaScript Fetch Example
```javascript
const assignGrade = async (studentId, studentName, assessmentType, score) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(
    'https://spmproject-backend.vercel.app/api/grades/assign',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        courseCode: 'BIT364',           // ✅ REQUIRED
        studentId: studentId,            // ✅ REQUIRED
        studentName: studentName,        // ✅ REQUIRED
        assessmentType: assessmentType,  // ✅ REQUIRED: "Assessment", "Midsem", or "End of Semester"
        score: parseFloat(score),        // ✅ REQUIRED: Number
        maxScore: 100,                   // ✅ REQUIRED: Number
        feedback: ''                     // ⚪ Optional
      })
    }
  );
  
  const data = await response.json();
  return data;
};

// Usage
await assignGrade('1234568', 'John Kwaku Doe', 'Assessment', 85);
```

### cURL Example
```bash
curl -X POST https://spmproject-backend.vercel.app/api/grades/assign \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "courseCode": "BIT364",
    "studentId": "1234568",
    "studentName": "John Kwaku Doe",
    "assessmentType": "Assessment",
    "score": 85,
    "maxScore": 100,
    "feedback": "Good work"
  }'
```

### Request Body Schema
```typescript
{
  courseCode: string;      // ✅ REQUIRED - e.g., "BIT364"
  studentId: string;       // ✅ REQUIRED - e.g., "1234568"
  studentName: string;     // ✅ REQUIRED - e.g., "John Kwaku Doe"
  assessmentType: string;  // ✅ REQUIRED - "Assessment" | "Midsem" | "End of Semester"
  score: number;           // ✅ REQUIRED - e.g., 85
  maxScore: number;        // ✅ REQUIRED - e.g., 100
  feedback?: string;       // ⚪ OPTIONAL - e.g., "Good work"
}
```

### Success Response (200)
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
    "submissionDate": "2025-01-30T10:00:00Z",
    "feedback": "Good work",
    "lecturer": "Kwabena Lecturer"
  }
}
```

### Error Response (400)
```json
{
  "success": false,
  "message": "courseCode, studentId, assessmentType, score, and maxScore are required"
}
```

---

## 2️⃣ Get Enrolled Students with Grades

### Endpoint
```
GET /api/grades/enrolled?courseCode=BIT364
```

### JavaScript Fetch Example
```javascript
const getEnrolledStudents = async (courseCode) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(
    `https://spmproject-backend.vercel.app/api/grades/enrolled?courseCode=${courseCode}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  return data;
};

// Usage
const result = await getEnrolledStudents('BIT364');
console.log(result.students); // Array of students with grades
```

### cURL Example
```bash
curl -X GET "https://spmproject-backend.vercel.app/api/grades/enrolled?courseCode=BIT364" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Query Parameters
```typescript
{
  courseCode: string;  // ✅ REQUIRED - e.g., "BIT364"
}
```

### Success Response (200)
```json
{
  "success": true,
  "courseCode": "BIT364",
  "courseName": "Web Development",
  "students": [
    {
      "studentId": "1234568",
      "fullName": "John Kwaku Doe",
      "assessment": 85,
      "midsem": 78,
      "endOfSemester": 88,
      "totalGrades": 3
    },
    {
      "studentId": "1234456",
      "fullName": "Saaed Hawa",
      "assessment": 92,
      "midsem": 89,
      "endOfSemester": 95,
      "totalGrades": 3
    },
    {
      "studentId": "1233456",
      "fullName": "Kwarteng Samuel",
      "assessment": 72,
      "midsem": 75,
      "endOfSemester": 80,
      "totalGrades": 3
    },
    {
      "studentId": "1234557",
      "fullName": "Nashiru Alhassan",
      "assessment": 88,
      "midsem": 82,
      "endOfSemester": 90,
      "totalGrades": 3
    }
  ],
  "totalStudents": 4
}
```

---

## 3️⃣ Get Semester/Block Options

### Endpoint
```
GET /api/grades/semesters
```

### JavaScript Fetch Example
```javascript
const getSemesters = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(
    'https://spmproject-backend.vercel.app/api/grades/semesters',
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  return data.semesters;
};

// Usage
const semesters = await getSemesters();
// Returns: [{ value: "Block 1", label: "Block 1" }, { value: "Block 2", label: "Block 2" }]
```

### cURL Example
```bash
curl -X GET https://spmproject-backend.vercel.app/api/grades/semesters \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Success Response (200)
```json
{
  "success": true,
  "semesters": [
    { "value": "Block 1", "label": "Block 1" },
    { "value": "Block 2", "label": "Block 2" }
  ]
}
```

---

## 4️⃣ Get Grade History

### Endpoint
```
GET /api/grades/history?courseCode=BIT364
```

### JavaScript Fetch Example
```javascript
const getGradeHistory = async (courseCode) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(
    `https://spmproject-backend.vercel.app/api/grades/history?courseCode=${courseCode}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  return data;
};

// Usage
const history = await getGradeHistory('BIT364');
console.log(history.history); // Array of all grade records
```

### cURL Example
```bash
curl -X GET "https://spmproject-backend.vercel.app/api/grades/history?courseCode=BIT364" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Success Response (200)
```json
{
  "success": true,
  "courseCode": "BIT364",
  "courseName": "Web Development",
  "history": [
    {
      "id": "BIT364-1234568-Assessment",
      "studentId": "1234568",
      "studentName": "John Kwaku Doe",
      "assessmentType": "Assessment",
      "score": 85,
      "maxScore": 100,
      "percentage": 85,
      "grade": "B+",
      "submissionDate": "2025-01-25T14:30:00Z",
      "feedback": "Good understanding of web concepts",
      "lecturer": "Kwabena Lecturer"
    }
  ],
  "totalRecords": 12,
  "assessmentTypes": ["Assessment", "Midsem", "End of Semester"],
  "students": ["John Kwaku Doe", "Saaed Hawa", "Kwarteng Samuel", "Nashiru Alhassan"]
}
```

---

## 5️⃣ Bulk Assign Grades (Alternative Method)

### Endpoint
```
POST /api/grades/bulk-assign
```

### JavaScript Fetch Example
```javascript
const bulkAssignGrades = async (courseCode, assessmentType, score) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(
    'https://spmproject-backend.vercel.app/api/grades/bulk-assign',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        courseCode: courseCode,          // ✅ REQUIRED
        assessmentType: assessmentType,  // ✅ REQUIRED
        score: parseFloat(score),        // ✅ REQUIRED
        maxScore: 100,                   // ⚪ Optional
        grade: 'B+',                     // ⚪ Optional (auto-calculated)
        feedback: '',                    // ⚪ Optional
        studentFilter: 'all'             // ⚪ Optional: 'all', 'attendees', 'quiz_submitters'
      })
    }
  );
  
  const data = await response.json();
  return data;
};

// Usage
await bulkAssignGrades('BIT364', 'Assessment', 85);
```

### Request Body Schema
```typescript
{
  courseCode: string;       // ✅ REQUIRED - e.g., "BIT364"
  assessmentType: string;   // ✅ REQUIRED - "Assessment" | "Midsem" | "End of Semester"
  score: number;            // ✅ REQUIRED - e.g., 85
  maxScore?: number;        // ⚪ OPTIONAL - e.g., 100
  grade?: string;           // ⚪ OPTIONAL - e.g., "B+" (auto-calculated if not provided)
  feedback?: string;        // ⚪ OPTIONAL - e.g., "Good work"
  studentFilter?: string;   // ⚪ OPTIONAL - 'all' | 'attendees' | 'quiz_submitters'
}
```

### Success Response (200)
```json
{
  "ok": true,
  "message": "Successfully assigned grades to 4 students",
  "assignedGrades": 4,
  "studentFilter": "all",
  "courseCode": "BIT364",
  "assessmentType": "Assessment",
  "grades": [
    {
      "courseCode": "BIT364",
      "studentId": "1234567",
      "studentName": "Ransford Student",
      "assessmentType": "Assessment",
      "score": 85,
      "maxScore": 100,
      "percentage": 85,
      "grade": "B+",
      "submissionDate": "2025-01-30T10:00:00Z",
      "feedback": "",
      "lecturer": "Kwabena Lecturer"
    }
  ]
}
```

---

## 🎯 Assessment Type Values

**Valid Assessment Types:**
- `"Assessment"` - For assignments, quizzes, class work
- `"Midsem"` - For mid-semester exams
- `"End of Semester"` - For final exams

**⚠️ Important:** Use exact spelling and capitalization!

---

## 🔑 Test Credentials

### Lecturer Account
```
Email: kwabena@knust.edu.gh
Password: password123!
```

### Student Accounts
```
Email: john.doe@student.edu
Password: Student123!

Email: saaed.hawa@student.edu
Password: Student123!

Email: kwarteng.samuel@student.edu
Password: Student123!

Email: nashiru.alhassan@student.edu
Password: Student123!
```

---

## 🧪 Testing with Postman

### 1. Login to get token
```
POST https://spmproject-backend.vercel.app/api/auth/login
Body: {
  "email": "kwabena@knust.edu.gh",
  "password": "password123!"
}
```

### 2. Copy token from response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Use token in subsequent requests
Add to Headers:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ❌ Common Errors

### Error 1: 400 - Missing Required Fields
```json
{
  "success": false,
  "message": "courseCode, studentId, assessmentType, score, and maxScore are required"
}
```
**Solution:** Ensure all required fields are included in request body

### Error 2: 401 - Unauthorized
```json
{
  "message": "No token, authorization denied"
}
```
**Solution:** Include Authorization header with valid token

### Error 3: 404 - Endpoint Not Found
```
Cannot GET /api/grades/enroled
```
**Solution:** Check spelling - it's `/enrolled` not `/enroled`

### Error 4: 500 - Server Error
```json
{
  "success": false,
  "message": "Failed to assign grade",
  "error": "..."
}
```
**Solution:** Check server logs or contact backend team

---

## 📱 React Hook Example

```javascript
import { useState } from 'react';

const useGradeAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const API_URL = import.meta.env.VITE_API_URL || 'https://spmproject-backend.vercel.app';
  
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });
  
  const assignGrade = async (gradeData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/grades/assign`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(gradeData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to assign grade');
      }
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const getEnrolledStudents = async (courseCode) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_URL}/api/grades/enrolled?courseCode=${courseCode}`,
        { headers: getAuthHeaders() }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch students');
      }
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    error,
    assignGrade,
    getEnrolledStudents
  };
};

export default useGradeAPI;
```

### Usage in Component
```javascript
import useGradeAPI from './hooks/useGradeAPI';

const QuizManagement = () => {
  const { loading, error, assignGrade, getEnrolledStudents } = useGradeAPI();
  
  const handleSaveGrade = async () => {
    try {
      const result = await assignGrade({
        courseCode: 'BIT364',
        studentId: '1234568',
        studentName: 'John Kwaku Doe',
        assessmentType: 'Assessment',
        score: 85,
        maxScore: 100
      });
      
      console.log('Grade saved:', result);
      alert('✅ Grade saved successfully!');
    } catch (err) {
      console.error('Error:', err);
      alert(`❌ Error: ${err.message}`);
    }
  };
  
  return (
    <div>
      <button onClick={handleSaveGrade} disabled={loading}>
        {loading ? 'Saving...' : 'Save Grade'}
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
};
```

---

## ✅ Quick Checklist

Before making API calls, ensure:

- [ ] Base URL is correct (`https://spmproject-backend.vercel.app`)
- [ ] Authorization header includes valid token
- [ ] Content-Type is set to `application/json`
- [ ] All required fields are included in request body
- [ ] Assessment type uses exact values: "Assessment", "Midsem", or "End of Semester"
- [ ] Score and maxScore are numbers, not strings
- [ ] Course code matches existing courses (e.g., "BIT364")

---

## 🎉 Success!

If you follow these examples exactly, your API calls will work perfectly! 🚀