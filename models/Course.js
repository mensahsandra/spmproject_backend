const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true,
    trim: true,
    index: true 
  },
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  department: { 
    type: String, 
    required: true,
    default: 'Information Technology' 
  },
  credits: { 
    type: Number, 
    default: 3,
    min: 1,
    max: 6 
  },
  description: { 
    type: String,
    default: '' 
  },
  prerequisites: [String], // Array of course codes
  semester: { 
    type: String, 
    enum: ['Fall', 'Spring', 'Summer', 'All'],
    default: 'All' 
  },
  level: { 
    type: String, 
    enum: ['100', '200', '300', '400', 'Graduate'],
    default: '300' 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  maxEnrollment: { 
    type: Number, 
    default: 100 
  },
  currentEnrollment: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

// Indexes for better performance
CourseSchema.index({ department: 1, isActive: 1 });
CourseSchema.index({ level: 1, semester: 1 });

module.exports = mongoose.models.Course || mongoose.model('Course', CourseSchema);