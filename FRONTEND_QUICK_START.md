# 🚀 Frontend Quick Start Guide

## ✅ Backend Status: DEPLOYED & WORKING!

All endpoints are now live at: `https://spmproject-backend.vercel.app`

---

## 🎯 What's Fixed

### ✅ The 404 Errors Are Gone!
- `GET /api/grades/enrolled?courseCode=BIT364` ✅ Working
- `GET /api/grades/history?courseCode=BIT364` ✅ Working

### ✅ Sample Students Available
4 students are now in the database with complete grades:
- John Kwaku Doe (1234568)
- Saaed Hawa (1234456)
- Kwarteng Samuel (1233456)
- Nashiru Alhassan (1234557)

### ✅ Block System Implemented
Semester dropdown now shows "Block 1" and "Block 2" instead of "Semester 1, 2, 3"

---

## 🔧 Frontend Changes Needed

### 1. **Lecturer Assessment Page** (`/lecturer/assessment`)

**Current Issue:** Calling non-existent endpoints causing 404 errors

**Fix:** Update the API calls

#### Before (causing 404):
```jsx
// ❌ This was failing
const response = await fetch(`${API_URL}/api/grades/enrolled?courseCode=BIT364`);
```

#### After (now works):
```jsx
// ✅ This now works!
import { useState, useEffect } from 'react';

function AssessmentPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('BIT364');

  useEffect(() => {
    fetchEnrolledStudents();
  }, [selectedCourse]);

  async function fetchEnrolledStudents() {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/grades/enrolled?courseCode=${selectedCourse}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setStudents(data.students);
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to fetch students');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="loading">Loading students...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="assessment-page">
      <h1>Quiz Management - {selectedCourse}</h1>
      
      <table className="students-table">
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
    </div>
  );
}

export default AssessmentPage;
```

---

### 2. **Student Results Page** (`/student/display-result`)

**Current Issue:** Semester dropdown shows "Semester 1, 2, 3"

**Fix:** Update to use Block system

#### Before:
```jsx
// ❌ Hardcoded semesters
const semesters = ['Semester 1', 'Semester 2', 'Semester 3'];
```

#### After:
```jsx
// ✅ Fetch from API
import { useState, useEffect } from 'react';

function DisplayResult() {
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');

  useEffect(() => {
    fetchSemesters();
  }, []);

  async function fetchSemesters() {
    try {
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
      
      if (data.success) {
        setSemesters(data.semesters);
        // Set default to Block 1
        if (data.semesters.length > 0) {
          setSelectedSemester(data.semesters[0].value);
        }
      }
    } catch (err) {
      console.error('Error fetching semesters:', err);
    }
  }

  return (
    <div className="results-page">
      <h1>Student Results</h1>
      
      <select 
        value={selectedSemester}
        onChange={(e) => setSelectedSemester(e.target.value)}
      >
        <option value="">Select Block</option>
        {semesters.map(sem => (
          <option key={sem.value} value={sem.value}>
            {sem.label}
          </option>
        ))}
      </select>
      
      {/* Rest of your results display */}
    </div>
  );
}

export default DisplayResult;
```

---

## 📋 Complete Example: Quiz Management Component

Here's a complete, production-ready component:

```jsx
// components/QuizManagement.jsx
import { useState, useEffect } from 'react';
import './QuizManagement.css';

function QuizManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('BIT364');
  const [showGradeForm, setShowGradeForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchEnrolledStudents();
  }, [selectedCourse]);

  async function fetchEnrolledStudents() {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${API_URL}/api/grades/enrolled?courseCode=${selectedCourse}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch students: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setStudents(data.students);
      } else {
        throw new Error(data.message || 'Failed to fetch students');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function assignGrade(gradeData) {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${API_URL}/api/grades/assign`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(gradeData)
        }
      );

      if (!response.ok) {
        throw new Error('Failed to assign grade');
      }

      const data = await response.json();
      
      if (data.success) {
        alert('Grade assigned successfully!');
        fetchEnrolledStudents(); // Refresh the list
        setShowGradeForm(false);
      }
    } catch (err) {
      console.error('Error assigning grade:', err);
      alert('Failed to assign grade: ' + err.message);
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading students...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>⚠️ Error Loading Students</h3>
        <p>{error}</p>
        <button onClick={fetchEnrolledStudents}>Retry</button>
      </div>
    );
  }

  return (
    <div className="quiz-management">
      <div className="header">
        <h1>Quiz Management</h1>
        <div className="course-selector">
          <label>Course:</label>
          <select 
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="BIT364">BIT364 - Web Development</option>
            {/* Add more courses as needed */}
          </select>
        </div>
      </div>

      <div className="students-section">
        <h2>Enrolled Students ({students.length})</h2>
        
        <table className="students-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Assessment</th>
              <th>Midsem</th>
              <th>End of Semester</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  No students enrolled in this course
                </td>
              </tr>
            ) : (
              students.map(student => (
                <tr key={student.studentId}>
                  <td>{student.studentId}</td>
                  <td>{student.fullName}</td>
                  <td>{student.email}</td>
                  <td className="grade-cell">{student.assessment}</td>
                  <td className="grade-cell">{student.midsem}</td>
                  <td className="grade-cell">{student.endOfSemester}</td>
                  <td>
                    <button 
                      className="btn-assign"
                      onClick={() => {
                        setSelectedStudent(student);
                        setShowGradeForm(true);
                      }}
                    >
                      Assign Grade
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showGradeForm && selectedStudent && (
        <GradeAssignmentModal
          student={selectedStudent}
          courseCode={selectedCourse}
          onSubmit={assignGrade}
          onClose={() => {
            setShowGradeForm(false);
            setSelectedStudent(null);
          }}
        />
      )}
    </div>
  );
}

// Grade Assignment Modal Component
function GradeAssignmentModal({ student, courseCode, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    assessmentType: 'Assessment',
    score: '',
    maxScore: 100,
    feedback: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    onSubmit({
      courseCode,
      studentId: student.studentId,
      assessmentType: formData.assessmentType,
      score: parseFloat(formData.score),
      maxScore: parseFloat(formData.maxScore),
      feedback: formData.feedback,
      lecturerName: 'Current Lecturer' // Get from auth context
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Assign Grade</h2>
        <p>Student: {student.fullName} ({student.studentId})</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Assessment Type:</label>
            <select 
              value={formData.assessmentType}
              onChange={(e) => setFormData({...formData, assessmentType: e.target.value})}
              required
            >
              <option value="Assessment">Assessment</option>
              <option value="Midsem">Midsem</option>
              <option value="End of Semester">End of Semester</option>
            </select>
          </div>

          <div className="form-group">
            <label>Score:</label>
            <input
              type="number"
              min="0"
              max={formData.maxScore}
              value={formData.score}
              onChange={(e) => setFormData({...formData, score: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Max Score:</label>
            <input
              type="number"
              min="1"
              value={formData.maxScore}
              onChange={(e) => setFormData({...formData, maxScore: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Feedback (optional):</label>
            <textarea
              value={formData.feedback}
              onChange={(e) => setFormData({...formData, feedback: e.target.value})}
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Assign Grade
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuizManagement;
```

---

## 🎨 CSS Styling (Optional)

```css
/* QuizManagement.css */
.quiz-management {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.course-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.students-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.students-table th,
.students-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.students-table th {
  background: #f5f5f5;
  font-weight: 600;
}

.grade-cell {
  font-family: monospace;
  font-weight: 500;
}

.btn-assign {
  padding: 6px 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-assign:hover {
  background: #45a049;
}

.loading-container,
.error-container {
  text-align: center;
  padding: 40px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-cancel,
.btn-submit {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-cancel {
  background: #f5f5f5;
  color: #333;
}

.btn-submit {
  background: #4CAF50;
  color: white;
}
```

---

## ✅ Testing Checklist

After implementing the changes:

- [ ] Open `/lecturer/assessment` page
- [ ] Check browser console - no 404 errors
- [ ] Verify 4 students are displayed
- [ ] Verify grades show in Assessment, Midsem, End of Semester columns
- [ ] Test grade assignment form
- [ ] Open `/student/display-result` page
- [ ] Verify semester dropdown shows "Block 1" and "Block 2"
- [ ] Login as sample student and view grades

---

## 🔑 Sample Login Credentials

### Lecturer Account:
- **Email:** kwabena@knust.edu.gh
- **Password:** password123!

### Student Accounts:
- **Email:** john.doe@student.edu | **Password:** Student123!
- **Email:** saaed.hawa@student.edu | **Password:** Student123!
- **Email:** kwarteng.samuel@student.edu | **Password:** Student123!
- **Email:** nashiru.alhassan@student.edu | **Password:** Student123!

---

## 🚀 Deploy Frontend

After making changes:

```bash
cd frontend
git add .
git commit -m "fix: Update grade endpoints and add Block system"
git push origin main
```

Vercel will auto-deploy your frontend.

---

## ✅ Success!

Once deployed, your application will:
- ✅ Load quiz management without 404 errors
- ✅ Display 4 sample students with grades
- ✅ Show Block 1 and Block 2 in dropdowns
- ✅ Allow lecturers to assign grades
- ✅ Allow students to view their results

**Backend is ready! Just update your frontend code and deploy! 🎉**