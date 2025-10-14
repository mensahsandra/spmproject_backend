const mongoose = require('mongoose');

const gradeHistorySchema = new mongoose.Schema({
  oldGrade: { type: String },
  newGrade: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: String },
}, { _id: false });

const GradeSchema = new mongoose.Schema({
  // Student Information
  studentId: { type: String, required: true, index: true },
  studentName: { type: String, required: true },
  
  // Course Information
  courseCode: { type: String, required: true, index: true },
  courseName: { type: String },
  
  // Academic Information
  academicYear: { type: String, default: '2024/2025' },
  semester: { type: String, default: 'Semester 1' },
  block: { type: String, default: 'Block A' },
  
  // Grade Components (as requested in the structure)
  classAssessment: { type: Number, min: 0, max: 100 },
  midSemester: { type: Number, min: 0, max: 100 },
  endOfSemester: { type: Number, min: 0, max: 100 },
  
  // Additional Assessment Fields
  assessmentType: { type: String }, // For backwards compatibility
  score: { type: Number }, // For backwards compatibility
  maxScore: { type: Number, default: 100 },
  percentage: { type: Number },
  letterGrade: { type: String },
  
  // Metadata
  dateEntered: { type: Date, default: Date.now },
  lecturer: { type: String },
  lecturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Legacy fields for compatibility
  currentGrade: { type: String },
  history: [gradeHistorySchema]
}, { 
  timestamps: true,
  // Ensure both old and new structures work
  strict: false 
});

// Compound indexes for efficient queries
GradeSchema.index({ courseCode: 1, studentId: 1 });
GradeSchema.index({ academicYear: 1, semester: 1, block: 1 });
GradeSchema.index({ studentId: 1, academicYear: 1 });

// Virtual for calculating total/average
GradeSchema.virtual('totalScore').get(function() {
  const scores = [this.classAssessment, this.midSemester, this.endOfSemester].filter(s => s !== null && s !== undefined);
  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) : 0;
});

GradeSchema.virtual('averageScore').get(function() {
  const scores = [this.classAssessment, this.midSemester, this.endOfSemester].filter(s => s !== null && s !== undefined);
  return scores.length > 0 ? this.totalScore / scores.length : 0;
});

// Method to calculate letter grade from average
GradeSchema.methods.calculateLetterGrade = function() {
  const avg = this.averageScore;
  if (avg >= 90) return 'A';
  if (avg >= 80) return 'B+';
  if (avg >= 75) return 'B';
  if (avg >= 70) return 'B-';
  if (avg >= 65) return 'C+';
  if (avg >= 60) return 'C';
  if (avg >= 55) return 'C-';
  if (avg >= 50) return 'D';
  return 'F';
};

module.exports = mongoose.models.Grade || mongoose.model('Grade', GradeSchema);
