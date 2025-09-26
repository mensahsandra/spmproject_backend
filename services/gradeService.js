const mongoose = require('mongoose');
const User = require('../models/User');
const Grade = require('../models/Grade');

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

  static async bulkUpdate(courseCode, updates, changedBy) {
    const usingDb = mongoose.connection?.readyState === 1;
    if (!usingDb) return { ok: false, message: 'database_not_connected' };

    let updated = 0;
    for (const { studentId, grade } of updates) {
      const sid = String(studentId);
      const newGrade = String(grade);
      const existing = await Grade.findOne({ courseCode, studentId: sid });
      const oldGrade = existing?.currentGrade ?? null;

      const studentUser = await User.findOne({ studentId: sid }).select('_id');

      await Grade.findOneAndUpdate(
        { courseCode, studentId: sid },
        {
          $set: { currentGrade: newGrade, student: studentUser?._id },
          $push: { history: { oldGrade, newGrade, changedBy } }
        },
        { upsert: true, new: true }
      );
      updated += 1;
    }
    return { ok: true, updated };
  }

  static async getHistory(courseCode) {
    const usingDb = mongoose.connection?.readyState === 1;
    if (!usingDb) return [];

    const docs = await Grade.find({ courseCode }).lean();
    const history = [];
    for (const g of docs) {
      for (const h of (g.history || [])) {
        history.push({
          id: `${g._id}-${new Date(h.changedAt).getTime()}`,
          changedAt: h.changedAt,
          studentId: g.studentId,
          courseCode: g.courseCode,
          oldGrade: h.oldGrade ?? null,
          newGrade: h.newGrade,
          changedBy: h.changedBy || ''
        });
      }
    }
    history.sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));
    return history;
  }
}

module.exports = GradeService;
