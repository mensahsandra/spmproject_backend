// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'lecturer', 'admin'], default: 'student', index: true },
  name: { type: String, required: true },
  studentId: { type: String, index: true },
  course: String,
  centre: String,
  semester: String,
  staffId: { type: String, index: true },
}, { timestamps: true });

UserSchema.index({ createdAt: -1 });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
