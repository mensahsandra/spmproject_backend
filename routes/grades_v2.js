const express = require('express');
const router = express.Router();
const GradesController = require('../controllers/gradesController');

router.get('/enrolled', GradesController.getEnrolled);
router.post('/bulk-update', GradesController.bulkUpdate);
router.get('/bulk-update', (req, res) => res.status(405).json({ ok: false, error: 'method_not_allowed', message: 'Use POST with { courseCode, updates[] }' }));
router.get('/history', GradesController.getHistory);

module.exports = router;
