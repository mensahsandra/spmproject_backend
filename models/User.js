// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'lecturer', 'admin'], default: 'student', index: true },
  name: { type: String, required: true },
  
  // Student fields
  studentId: { type: String, index: true },
  course: String, // For students: their enrolled course
  centre: String,
  semester: String,
  
  // Lecturer fields
  staffId: { type: String, index: true },
  honorific: { type: String, enum: ['Prof.', 'Dr.', 'Mr.', 'Ms.', 'Mrs.', 'Assoc. Prof.', 'Asst. Prof.'], default: 'Mr.' },
  title: String, // e.g., "Senior Lecturer", "Professor", "Associate Professor"
  department: String, // e.g., "Computer Science", "Information Technology"
  courses: [String], // Array of courses taught e.g., ["BIT364", "CS101", "BIT301"]
  officeLocation: String,
  phoneNumber: String,
  
  // Common fields
  fullName: String, // Computed field: honorific + name
  avatar: String, // Profile picture URL
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

UserSchema.index({ createdAt: -1 });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
