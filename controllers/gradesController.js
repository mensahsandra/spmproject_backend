const GradeService = require('../services/gradeService');

exports.getEnrolled = async (req, res) => {
  try {
    const { courseCode } = req.query || {};
    if (!courseCode) return res.status(400).json({ ok: false, message: 'courseCode required' });
    const students = await GradeService.getEnrolledStudents(String(courseCode));
    return res.status(200).json({ ok: true, students });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
};

// Placeholder bulk update that echoes input for now
exports.bulkUpdate = async (req, res) => {
  try {
    const { courseCode, updates } = req.body || {};
    if (!courseCode || !Array.isArray(updates)) {
      return res.status(400).json({ ok: false, message: 'courseCode and updates[] required' });
    }
    return res.status(200).json({ ok: true, updated: updates.length });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
};
