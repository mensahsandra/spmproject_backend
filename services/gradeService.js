const mongoose = require('mongoose');
const User = require('../models/User');

// Lightweight grade service using Mongo only when available; otherwise returns empty lists
class GradeService {
  static async getEnrolledStudents(courseCode) {
    const usingDb = mongoose.connection?.readyState === 1;
    if (!usingDb) return [];

    // For now, infer enrolled students from User documents with role student and optional course
    const filter = { role: 'student' };
    if (courseCode) filter.course = String(courseCode);

    const students = await User.find(filter).select('studentId name').lean();
    return students.map(s => ({ id: String(s._id), studentId: s.studentId || '', name: s.name || s.studentId || '' }));
  }
}

module.exports = GradeService;
