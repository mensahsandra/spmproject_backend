// models/Attendance.js
const mongoose = require('mongoose');

const AttendanceSessionSchema = new mongoose.Schema({
  sessionCode: { type: String, required: true, index: true, unique: true },
  courseCode: String,
  courseName: String,
  lecturer: String,
  issuedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

const AttendanceLogSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  sessionCode: { type: String, required: true, index: true },
  qrRaw: String,
  courseCode: String,
  courseName: String,
  lecturer: String,
  centre: String,
  location: String,
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

AttendanceLogSchema.index({ sessionCode: 1, studentId: 1 }, { unique: true });
AttendanceLogSchema.index({ timestamp: -1 });
AttendanceLogSchema.index({ courseCode: 1, timestamp: -1 });


module.exports = {
  AttendanceSession: mongoose.models.AttendanceSession || mongoose.model('AttendanceSession', AttendanceSessionSchema),
  AttendanceLog: mongoose.models.AttendanceLog || mongoose.model('AttendanceLog', AttendanceLogSchema)
};
