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

exports.bulkUpdate = async (req, res) => {
  try {
    const { courseCode, updates } = req.body || {};
    if (!courseCode || !Array.isArray(updates)) {
      return res.status(400).json({ ok: false, message: 'courseCode and updates[] required' });
    }
    const changedBy = req.user?.email || req.user?.id || 'lecturer';
    const result = await GradeService.bulkUpdate(String(courseCode), updates, changedBy);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { courseCode } = req.query || {};
    if (!courseCode) return res.status(400).json({ ok: false, message: 'courseCode required' });
    const history = await GradeService.getHistory(String(courseCode));
    return res.status(200).json({ ok: true, history });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message });
  }
};
