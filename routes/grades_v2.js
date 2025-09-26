const express = require('express');
const router = express.Router();
const GradesController = require('../controllers/gradesController');

router.get('/enrolled', GradesController.getEnrolled);
router.post('/bulk-update', GradesController.bulkUpdate);
router.get('/history', GradesController.getHistory);

module.exports = router;
