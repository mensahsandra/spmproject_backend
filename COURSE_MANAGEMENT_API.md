# 📚 Course Management API Documentation

## 🎉 **New Features Implemented**

### ✅ **Complete Course Management System**
- Course enrollment/assignment for students and lecturers
- Profile updates with course selection
- Dynamic course loading (no more mock data)
- Course history tracking
- Department and level filtering

## 🚀 **New API Endpoints**

### **Course Management**

#### 1. Get Available Courses
```
GET /api/courses/available?department=IT&level=300&semester=Fall
Authorization: Bearer <token>
```
**Response:**
```json
{
  "success": true,
  "courses": [
    {
      "code": "BIT364",
      "name": "Business Information Technology",
      "department": "Information Technology",
      "credits": 3,
      "description": "Introduction to business applications...",
      "level": "300",
      "semester": "All",
      "maxEnrollment": 100,
      "currentEnrollment": 25
    }
  ],
  "total": 12
}
```

#### 2. Get Departments
```
GET /api/courses/departments
Authorization: Bearer <token>
```
**Response:**
```json
{
  "success": true,
  "departments": [
    "Information Technology",
    "Computer Science", 
    "Business Administration",
    "Mathematics"
  ]
}
```

#### 3. Enroll in Course
```
POST /api/courses/enroll
Authorization: Bearer <token>
Content-Type: application/json
```
**Body:**
```json
{
  "courseCode": "BIT364",
  "semester": "Fall 2025",
  "academicYear": "2024-2025"
}
```

#### 4. Unenroll from Course
```
DELETE /api/courses/unenroll/BIT364
Authorization: Bearer <token>
```

#### 5. Get My Courses
```
GET /api/courses/my-courses
Authorization: Bearer <token>
```
**Response:**
```json
{
  "success": true,
  "courses": [
    {
      "code": "BIT364",
      "name": "Business Information Technology",
      "department": "Information Technology",
      "credits": 3,
      "enrollmentInfo": {
        "enrolledAt": "2025-01-06T...",
        "status": "active",
        "semester": "Fall 2025"
      }
    }
  ],
  "userRole": "student"
}
```

### **Profile Management**

#### 6. Update Complete Profile
```
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json
```
**Body:**
```json
{
  "name": "John Doe",
  "courses": ["BIT364", "CS101"],
  "centre": "Kumasi",
  "honorific": "Prof.",
  "title": "Senior Lecturer",
  "department": "Information Technology",
  "officeLocation": "IT Block, Room 205",
  "phoneNumber": "+233-24-123-4567"
}
```

#### 7. Update Only Courses
```
PATCH /api/auth/courses
Authorization: Bearer <token>
Content-Type: application/json
```
**Body:**
```json
{
  "courses": ["BIT364", "CS101", "BIT301"]
}
```

### **Enhanced Existing Endpoints**

#### 8. Enhanced User Profile
```
GET /api/auth/me-enhanced
Authorization: Bearer <token>
```
**Now Returns:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "courses": ["BIT364", "CS101"],
    "courseEnrollments": [
      {
        "courseCode": "BIT364",
        "courseName": "Business Information Technology",
        "enrolledAt": "2025-01-06T...",
        "status": "active",
        "semester": "Fall 2025",
        "credits": 3
      }
    ],
    "honorific": "Prof.",
    "fullName": "Prof. John Doe",
    "department": "Information Technology"
  }
}
```

#### 9. Real Quiz Courses (No More Mock Data)
```
GET /api/quizzes/lecturer/courses
Authorization: Bearer <token>
```
**Now Returns Real Course Data:**
```json
{
  "ok": true,
  "courses": [
    {
      "code": "BIT364",
      "name": "Business Information Technology",
      "department": "Information Technology",
      "credits": 3
    }
  ]
}
```

## 🗄️ **Database Changes**

### **Enhanced User Model**
```javascript
{
  // Enhanced course management
  courses: [String], // Current active courses
  
  // Detailed enrollment history
  courseEnrollments: [{
    courseCode: String,
    courseName: String,
    enrolledAt: Date,
    status: String, // 'active', 'completed', 'dropped'
    semester: String,
    academicYear: String,
    grade: String,
    credits: Number
  }],
  
  // Teaching assignments (lecturers)
  teachingAssignments: [{
    courseCode: String,
    courseName: String,
    assignedAt: Date,
    status: String, // 'active', 'completed', 'inactive'
    semester: String,
    academicYear: String
  }]
}
```

### **New Course Model**
```javascript
{
  code: String, // "BIT364"
  name: String, // "Business Information Technology"
  department: String,
  credits: Number,
  description: String,
  prerequisites: [String],
  level: String, // "100", "200", "300", "400"
  semester: String, // "Fall", "Spring", "All"
  maxEnrollment: Number,
  currentEnrollment: Number,
  isActive: Boolean
}
```

## 🌱 **Database Seeding**

### **Seed Courses**
```bash
npm run seed:courses
```
**Seeds 12 courses across 4 departments:**
- Information Technology (BIT364, BIT301, BIT201, BIT401)
- Computer Science (CS101, CS201, CS301, CS302)
- Business Administration (BUS201, BUS301)
- Mathematics (MATH201, MATH301)

### **Seed Everything**
```bash
npm run seed:all
```

## 🧪 **Testing the New Features**

### **Test Course Enrollment**
```javascript
// Get available courses
fetch('/api/courses/available')
  .then(r => r.json())
  .then(d => console.log('Available courses:', d.courses));

// Enroll in a course
fetch('/api/courses/enroll', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    courseCode: 'BIT364',
    semester: 'Fall 2025'
  })
});

// Update profile courses
fetch('/api/auth/courses', {
  method: 'PATCH',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    courses: ['BIT364', 'CS101', 'BIT301']
  })
});
```

## 🎯 **Frontend Integration Guide**

### **1. Course Selection Component**
```javascript
// Fetch available courses
const [courses, setCourses] = useState([]);
const [userCourses, setUserCourses] = useState([]);

useEffect(() => {
  // Get available courses
  fetch('/api/courses/available', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(r => r.json())
  .then(d => setCourses(d.courses));
  
  // Get user's current courses
  fetch('/api/courses/my-courses', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(r => r.json())
  .then(d => setUserCourses(d.courses));
}, []);
```

### **2. Course Enrollment**
```javascript
const enrollInCourse = async (courseCode) => {
  const response = await fetch('/api/courses/enroll', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ courseCode })
  });
  
  if (response.ok) {
    // Refresh user courses
    fetchUserCourses();
  }
};
```

### **3. Profile Update**
```javascript
const updateProfile = async (profileData) => {
  const response = await fetch('/api/auth/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(profileData)
  });
  
  if (response.ok) {
    const data = await response.json();
    setUser(data.user);
  }
};
```

## 🎉 **Benefits**

### ✅ **For Students:**
- Select and enroll in multiple courses
- View course details and prerequisites
- Track enrollment history
- Update profile with course preferences

### ✅ **For Lecturers:**
- Manage teaching assignments
- View assigned courses in quiz creation
- Update profile with honorifics and course info
- Track teaching history

### ✅ **For System:**
- No more mock data
- Real course enrollment tracking
- Proper course-user relationships
- Scalable course management

## 🚀 **Ready to Use!**

The complete course management system is now implemented and ready for frontend integration. Users can now properly select, enroll in, and manage their courses with full backend support!