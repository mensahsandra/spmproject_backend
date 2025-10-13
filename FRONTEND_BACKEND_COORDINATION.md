# 🔄 Frontend-Backend Coordination Guide

## 📋 Overview
This document addresses the specific issues found in the frontend integration and provides exact solutions for the Quiz Management and Student Performance pages.

---

## 🚨 Current Issues & Solutions

### Issue 1: 400 Error - "Course code, assessment type, and score are required"

**Problem:** Frontend is calling `/api/grades/bulk-assign` but not sending required fields.

**Console Error:**
```
❌ [API-FETCH] Request failed: Object { status: 400, statusText: "", data: {…} }
POST https://spmproject-backend.vercel.app/api/grades/bulk-assign [HTTP/2 400 368ms]
```

**Root Cause:** The backend requires `courseCode`, `assessmentType`, and `score` in the request body, but frontend is not sending them.

---

## ✅ Solution 1: Update Quiz Management Component

### Required UI Changes (Based on Quiz management design.png)

The Quiz Management page needs to include:

1. **Assessment Type Dropdown** - To select "Assessment", "Midsem", or "End of Semester"
2. **Course Code** - Should be passed from the course selection
3. **Grade Input Fields** - For each student

### Updated Quiz Management Component

```jsx
import React, { useState, useEffect } from 'react';
import './QuizManagement.css';

const QuizManagement = () => {
  const [courseCode, setCourseCode] = useState('BIT364'); // From course selection
  const [assessmentType, setAssessmentType] = useState('Assessment');
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [loading, setLoading] = useState(false);

  // Assessment type options
  const assessmentTypes = [
    { value: 'Assessment', label: 'Assessment' },
    { value: 'Midsem', label: 'Mid Semester' },
    { value: 'End of Semester', label: 'End of Semester' }
  ];

  // Fetch enrolled students
  useEffect(() => {
    fetchEnrolledStudents();
  }, [courseCode]);

  const fetchEnrolledStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/grades/enrolled?courseCode=${courseCode}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setStudents(data.students);
        
        // Initialize grades object with existing grades
        const initialGrades = {};
        data.students.forEach(student => {
          initialGrades[student.studentId] = {
            assessment: student.assessment || '',
            midsem: student.midsem || '',
            endOfSemester: student.endOfSemester || ''
          };
        });
        setGrades(initialGrades);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  // Handle grade input change
  const handleGradeChange = (studentId, value) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [assessmentType.toLowerCase().replace(/ /g, '')]: value
      }
    }));
  };

  // Save individual grade
  const saveIndividualGrade = async (studentId) => {
    try {
      const student = students.find(s => s.studentId === studentId);
      const gradeValue = grades[studentId]?.[assessmentType.toLowerCase().replace(/ /g, '')] || '';
      
      if (!gradeValue) {
        alert('Please enter a grade value');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/grades/assign`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            courseCode: courseCode,
            studentId: studentId,
            studentName: student.fullName,
            assessmentType: assessmentType,
            score: parseFloat(gradeValue),
            maxScore: 100, // Adjust based on your grading system
            feedback: ''
          })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        alert('✅ Grade saved successfully!');
        fetchEnrolledStudents(); // Refresh data
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error saving grade:', error);
      alert('❌ Failed to save grade');
    }
  };

  // Save all grades (bulk assign)
  const saveAllGrades = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Save each student's grade individually
      const savePromises = students.map(async (student) => {
        const gradeValue = grades[student.studentId]?.[assessmentType.toLowerCase().replace(/ /g, '')] || '';
        
        if (!gradeValue) return null; // Skip if no grade entered
        
        return fetch(
          `${import.meta.env.VITE_API_URL}/api/grades/assign`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              courseCode: courseCode,
              studentId: student.studentId,
              studentName: student.fullName,
              assessmentType: assessmentType,
              score: parseFloat(gradeValue),
              maxScore: 100,
              feedback: ''
            })
          }
        );
      });

      await Promise.all(savePromises.filter(p => p !== null));
      
      alert('✅ All grades saved successfully!');
      fetchEnrolledStudents(); // Refresh data
      
    } catch (error) {
      console.error('Error saving grades:', error);
      alert('❌ Failed to save grades');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quiz-management">
      <div className="quiz-header">
        <h2>Quiz Management</h2>
        
        {/* Assessment Type Dropdown */}
        <div className="assessment-type-selector">
          <label>Assessment Type:</label>
          <select 
            value={assessmentType} 
            onChange={(e) => setAssessmentType(e.target.value)}
            className="assessment-dropdown"
          >
            {assessmentTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <button 
          className="create-quiz-btn"
          onClick={() => {/* Navigate to create quiz */}}
        >
          Create Quiz
        </button>
      </div>

      {/* Students Table */}
      <table className="students-table">
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Name</th>
            <th>Grade</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {students.map(student => (
            <tr key={student.studentId}>
              <td>{student.studentId}</td>
              <td>{student.fullName}</td>
              <td>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={grades[student.studentId]?.[assessmentType.toLowerCase().replace(/ /g, '')] || ''}
                  onChange={(e) => handleGradeChange(student.studentId, e.target.value)}
                  placeholder="Enter grade"
                  className="grade-input"
                />
              </td>
              <td>
                <button 
                  onClick={() => saveIndividualGrade(student.studentId)}
                  className="save-btn"
                >
                  Save
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Save All Button */}
      <div className="bulk-actions">
        <button 
          onClick={saveAllGrades}
          disabled={loading}
          className="save-all-btn"
        >
          {loading ? 'Saving...' : 'Save All Grades'}
        </button>
      </div>
    </div>
  );
};

export default QuizManagement;
```

### CSS Styling (QuizManagement.css)

```css
.quiz-management {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.quiz-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
}

.quiz-header h2 {
  margin: 0;
  color: #333;
}

.assessment-type-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.assessment-type-selector label {
  font-weight: 600;
  color: #555;
}

.assessment-dropdown {
  padding: 8px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 200px;
}

.create-quiz-btn {
  background: #2e7d32;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.create-quiz-btn:hover {
  background: #1b5e20;
}

.students-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.students-table thead {
  background: #f5f5f5;
}

.students-table th,
.students-table td {
  padding: 12px;
  text-align: left;
  border: 1px solid #e0e0e0;
}

.students-table th {
  font-weight: 600;
  color: #333;
}

.grade-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.save-btn {
  background: #1976d2;
  color: white;
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.save-btn:hover {
  background: #1565c0;
}

.bulk-actions {
  margin-top: 20px;
  text-align: right;
}

.save-all-btn {
  background: #2e7d32;
  color: white;
  padding: 12px 30px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
}

.save-all-btn:hover {
  background: #1b5e20;
}

.save-all-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
```

---

## ✅ Solution 2: Update Student Performance Page

### Change "Grade Change History" to "Student Performance"

The page at `https://spmproject-web.vercel.app/lecturer/assessment` should display a table like the Grade sample.png image with columns:
- Student
- Assignment (Assessment)
- Mid Semester (Midsem)
- End of Semester

### Student Performance Component

```jsx
import React, { useState, useEffect } from 'react';
import './StudentPerformance.css';

const StudentPerformance = () => {
  const [courseCode, setCourseCode] = useState('BIT364');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudentPerformance();
  }, [courseCode]);

  const fetchStudentPerformance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/grades/enrolled?courseCode=${courseCode}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Error fetching performance:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-performance">
      <h2>Student Performance - {courseCode}</h2>
      
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <table className="performance-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Assignment</th>
              <th>Mid Semester</th>
              <th>End of Semester</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.studentId}>
                <td>{student.fullName}</td>
                <td>{student.assessment || '-'}</td>
                <td>{student.midsem || '-'}</td>
                <td>{student.endOfSemester || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Navigation Buttons */}
      <div className="action-buttons">
        <button 
          onClick={() => {/* Navigate to Quiz Management */}}
          className="nav-btn quiz-btn"
        >
          Quiz Management
        </button>
        <button 
          onClick={() => {/* Stay on current page or refresh */}}
          className="nav-btn performance-btn"
        >
          View Performance Table
        </button>
      </div>
    </div>
  );
};

export default StudentPerformance;
```

### CSS Styling (StudentPerformance.css)

```css
.student-performance {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.student-performance h2 {
  margin-bottom: 20px;
  color: #333;
}

.performance-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.performance-table thead {
  background: #f5f5f5;
}

.performance-table th,
.performance-table td {
  padding: 12px;
  text-align: center;
  border: 1px solid #e0e0e0;
}

.performance-table th {
  font-weight: 600;
  color: #333;
}

.performance-table tbody tr:hover {
  background: #f9f9f9;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 20px;
}

.nav-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}

.quiz-btn {
  background: #1976d2;
  color: white;
}

.quiz-btn:hover {
  background: #1565c0;
}

.performance-btn {
  background: #2e7d32;
  color: white;
}

.performance-btn:hover {
  background: #1b5e20;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}
```

---

## 📡 API Endpoints Reference

### 1. Get Enrolled Students with Grades
```
GET /api/grades/enrolled?courseCode=BIT364
```

**Response:**
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
    }
  ],
  "totalStudents": 4
}
```

### 2. Assign Individual Grade
```
POST /api/grades/assign
```

**Request Body:**
```json
{
  "courseCode": "BIT364",
  "studentId": "1234568",
  "studentName": "John Kwaku Doe",
  "assessmentType": "Assessment",
  "score": 85,
  "maxScore": 100,
  "feedback": "Good work"
}
```

**Response:**
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

### 3. Get Semester/Block Options
```
GET /api/grades/semesters
```

**Response:**
```json
{
  "success": true,
  "semesters": [
    { "value": "Block 1", "label": "Block 1" },
    { "value": "Block 2", "label": "Block 2" }
  ]
}
```

### 4. Get Grade History
```
GET /api/grades/history?courseCode=BIT364
```

**Response:**
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
      "feedback": "Good understanding",
      "lecturer": "Kwabena Lecturer"
    }
  ],
  "totalRecords": 12,
  "assessmentTypes": ["Assessment", "Midsem", "End of Semester"],
  "students": ["John Kwaku Doe", "Saaed Hawa", "Kwarteng Samuel", "Nashiru Alhassan"]
}
```

---

## 🔧 Backend Requirements Checklist

### ✅ Already Implemented:

1. ✅ `/api/grades/semesters` - Returns Block 1 and Block 2
2. ✅ `/api/grades/enrolled` - Returns students with categorized grades
3. ✅ `/api/grades/assign` - Assigns individual grades
4. ✅ `/api/grades/history` - Returns complete grade history
5. ✅ `/api/grades/select-result-data` - Returns academic years and blocks
6. ✅ `/api/grades/student-results` - Returns student results with filters

### 📝 Field Requirements:

**For `/api/grades/assign` (Individual Grade):**
- ✅ `courseCode` (required)
- ✅ `studentId` (required)
- ✅ `studentName` (optional, defaults to "Unknown Student")
- ✅ `assessmentType` (required) - "Assessment", "Midsem", or "End of Semester"
- ✅ `score` (required) - Numeric value
- ✅ `maxScore` (required) - Numeric value (typically 100)
- ✅ `feedback` (optional)

**For `/api/grades/bulk-assign` (Bulk Grade Assignment):**
- ✅ `courseCode` (required)
- ✅ `assessmentType` (required)
- ✅ `score` (required)
- ✅ `maxScore` (optional)
- ✅ `grade` (optional, auto-calculated)
- ✅ `feedback` (optional)
- ✅ `studentFilter` (optional) - 'all', 'attendees', 'quiz_submitters'

---

## 🎯 Frontend Action Items

### Immediate Actions:

1. **Update Quiz Management Page:**
   - ✅ Add Assessment Type dropdown with options: "Assessment", "Midsem", "End of Semester"
   - ✅ Ensure `courseCode` is passed from course selection
   - ✅ Send all required fields when calling `/api/grades/assign`
   - ✅ Display grade input fields for each student

2. **Update Student Performance Page:**
   - ✅ Change page title from "Grade Change History" to "Student Performance"
   - ✅ Display table with columns: Student, Assignment, Mid Semester, End of Semester
   - ✅ Add navigation buttons to Quiz Management and Performance Table
   - ✅ Call `/api/grades/enrolled?courseCode=BIT364` to fetch data

3. **Update Student Results Page:**
   - ✅ Call `/api/grades/semesters` to get Block 1 and Block 2 options
   - ✅ Update dropdown to show "Block 1" and "Block 2" instead of "Semester 1, 2, 3"

### Testing Checklist:

- [ ] Test Quiz Management with Assessment Type selection
- [ ] Test individual grade save
- [ ] Test bulk grade save
- [ ] Verify Student Performance table displays correctly
- [ ] Verify navigation between Quiz Management and Student Performance
- [ ] Test Block dropdown on Student Results page
- [ ] Verify all API calls include Authorization header

---

## 🐛 Troubleshooting

### Issue: 400 Error - "Course code, assessment type, and score are required"

**Solution:** Ensure your request body includes:
```javascript
{
  courseCode: "BIT364",
  assessmentType: "Assessment", // or "Midsem" or "End of Semester"
  score: 85,
  maxScore: 100,
  studentId: "1234568",
  studentName: "John Kwaku Doe"
}
```

### Issue: 404 Error on endpoints

**Solution:** Verify you're using the correct base URL:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'https://spmproject-backend.vercel.app';
```

### Issue: Unauthorized (401) errors

**Solution:** Ensure token is included in headers:
```javascript
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
}
```

---

## 📞 Support

If you encounter any issues:
1. Check browser console for detailed error messages
2. Verify API endpoint URLs
3. Confirm request body structure matches documentation
4. Test endpoints using the provided test credentials

**Test Credentials:**
- Lecturer: kwabena@knust.edu.gh / password123!
- Student: john.doe@student.edu / Student123!

---

## 🎉 Summary

**Backend Status:** ✅ All endpoints are working and deployed

**Frontend Required Changes:**
1. Add Assessment Type dropdown to Quiz Management
2. Update API calls to include all required fields
3. Change "Grade Change History" to "Student Performance"
4. Update semester dropdown to use Block system

**Expected Result:** No more 404 or 400 errors, full grade management functionality working!