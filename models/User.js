// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'lecturer', 'admin'], default: 'student', index: true },
  name: { type: String, required: true },
  
  // Student fields
  studentId: { type: String, index: true },
  course: String, // Legacy field - kept for backward compatibility
  centre: String,
  semester: String,
  
  // Lecturer fields
  staffId: { type: String, index: true },
  honorific: { type: String, enum: ['Prof.', 'Dr.', 'Mr.', 'Ms.', 'Mrs.', 'Assoc. Prof.', 'Asst. Prof.'], default: 'Mr.' },
  title: String, // e.g., "Senior Lecturer", "Professor", "Associate Professor"
  department: String, // e.g., "Computer Science", "Information Technology"
  officeLocation: String,
  phoneNumber: String,
  
  // Enhanced course management (for both students and lecturers)
  courses: [String], // Current active courses (enrolled for students, taught for lecturers)
  
  // Detailed course enrollment/teaching history
  courseEnrollments: [{
    courseCode: { type: String, required: true },
    courseName: String,
    enrolledAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'completed', 'dropped', 'withdrawn'], default: 'active' },
    semester: String,
    academicYear: String,
    grade: String, // Final grade if completed
    credits: Number
  }],
  
  // For lecturers - teaching assignments
  teachingAssignments: [{
    courseCode: { type: String, required: true },
    courseName: String,
    assignedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'completed', 'inactive'], default: 'active' },
    semester: String,
    academicYear: String,
    studentsEnrolled: { type: Number, default: 0 }
  }],
  
  // Common fields
  fullName: String, // Computed field: honorific + name
  avatar: String, // Profile picture URL
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

UserSchema.index({ createdAt: -1 });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
