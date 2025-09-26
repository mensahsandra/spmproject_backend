const mongoose = require('mongoose');

const gradeHistorySchema = new mongoose.Schema({
  oldGrade: { type: String },
  newGrade: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: String },
}, { _id: false });

const GradeSchema = new mongoose.Schema({
  courseCode: { type: String, required: true, index: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  studentId: { type: String, required: true, index: true },
  currentGrade: { type: String },
  history: [gradeHistorySchema]
}, { timestamps: true });

GradeSchema.index({ courseCode: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.models.Grade || mongoose.model('Grade', GradeSchema);
