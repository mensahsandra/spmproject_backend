const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const AssessmentService = require('../services/assessmentService');
const { AssessmentTypeValues } = require('../constants/assessmentTypes');

const router = express.Router();

// Configure uploads directory
const uploadDir = path.join(__dirname, '..', 'uploads', 'assessments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `assessment-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /\.(pdf|doc|docx|txt|jpg|jpeg|png|gif|zip|rar)$/i;
    if (allowedTypes.test(file.originalname)) {
      return cb(null, true);
    }
    return cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX, TXT, JPG, PNG, GIF, ZIP, RAR'));
  }
});

// Create assessment
router.post('/', auth(['lecturer', 'admin']), upload.array('file', 5), async (req, res) => {
  try {
    const { courseCode, title, assessmentType } = req.body || {};
    if (!courseCode || !title || !assessmentType) {
      return res.status(400).json({ ok: false, message: 'courseCode, title, and assessmentType are required' });
    }
    if (!AssessmentTypeValues.includes(assessmentType)) {
      return res.status(400).json({ ok: false, message: 'Invalid assessmentType supplied' });
    }

    const lecturerUser = req.user || {};
    const created = await AssessmentService.createAssessment({
      body: req.body,
      files: req.files,
      lecturer: { _id: lecturerUser.id, name: lecturerUser.name || lecturerUser.fullName || 'Lecturer' }
    });

    return res.status(201).json({ success: true, assessmentId: created._id });
  } catch (error) {
    console.error('Assessment creation error:', error);
    return res.status(error.status || 500).json({ ok: false, message: error.message || 'Failed to create assessment' });
  }
});

// Lecturer listing
router.get('/', auth(['lecturer', 'admin']), async (req, res) => {
  try {
    const { courseCode } = req.query || {};
    const lecturerId = req.user?.id;
    const assessments = await AssessmentService.listLecturerAssessments({ courseCode, lecturerId });
    return res.json({ success: true, assessments });
  } catch (error) {
    console.error('Assessment list error:', error);
    return res.status(500).json({ ok: false, message: 'Failed to list assessments' });
  }
});

// Student listing
router.get('/student', auth(['student']), async (req, res) => {
  try {
    const { courseCode } = req.query || {};
    const studentId = req.user?.id;
    const student = studentId ? await require('../models/User').findById(studentId) : null;
    if (!student) {
      return res.status(404).json({ ok: false, message: 'Student not found' });
    }
    const assessments = await AssessmentService.listStudentAssessments({ student, courseCode });
    return res.json({ success: true, assessments });
  } catch (error) {
    console.error('Student assessment list error:', error);
    return res.status(500).json({ ok: false, message: 'Failed to list student assessments' });
  }
});

// Submission log
router.get('/:assessmentId/submissions', auth(['lecturer', 'admin']), async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const data = await AssessmentService.listSubmissions({ assessmentId });
    return res.json({ success: true, ...data });
  } catch (error) {
    console.error('Assessment submissions error:', error);
    return res.status(error.status || 500).json({ ok: false, message: error.message || 'Failed to fetch submissions' });
  }
});

// Lecturer courses helper
router.get('/lecturer/courses', auth(['lecturer']), async (req, res) => {
  try {
    const courses = await AssessmentService.getLecturerCourses({ lecturerId: req.user?.id });
    return res.json(courses.map((course) => ({ code: course.code, name: course.name })));
  } catch (error) {
    console.error('Lecturer course list error:', error);
    return res.status(500).json({ ok: false, message: 'Failed to load lecturer courses' });
  }
});

module.exports = router;