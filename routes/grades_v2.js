const express = require('express');
const router = express.Router();
const GradesController = require('../controllers/gradesController');
const auth = require('../middleware/auth');

// Restrict all v2 grade tools to lecturers/admins
router.get('/enrolled', auth(['lecturer', 'admin']), GradesController.getEnrolled);
router.post('/bulk-update', auth(['lecturer', 'admin']), GradesController.bulkUpdate);
router.get('/bulk-update', auth(['lecturer', 'admin']), (req, res) => res.status(405).json({ ok: false, error: 'method_not_allowed', message: 'Use POST with { courseCode, updates[] }' }));
router.get('/history', auth(['lecturer', 'admin']), GradesController.getHistory);

module.exports = router;
