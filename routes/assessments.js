const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const auth = require('../middleware/auth');
const AssessmentService = require('../services/assessmentService');
const { AssessmentTypeValues } = require('../constants/assessmentTypes');

const router = express.Router();

// Configure uploads directory with serverless-safe fallback
const uploadDir = path.join(__dirname, '..', 'uploads', 'assessments');
const fallbackDir = path.join(os.tmpdir(), 'uploads', 'assessments');

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

let activeUploadDir = uploadDir;
try {
  ensureDirectory(uploadDir);
} catch (error) {
  console.warn(`Failed to create assessments upload dir at ${uploadDir}, using tmp fallback`, error.message);
  ensureDirectory(fallbackDir);
  activeUploadDir = fallbackDir;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, activeUploadDir);
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

// @route   POST /api/assessments/bulk-grade-:sessionId/bulk-grade
// @desc    Apply bulk grades to multiple students for an assessment
// @access  Private (Lecturer, Admin)
router.post('/bulk-grade-:sessionId/bulk-grade', auth(['lecturer', 'admin']), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { courseCode, assessmentType, grades, academicYear } = req.body;

    console.log(`📊 [BULK-GRADE] Processing bulk grade request for session ${sessionId}`);
    console.log(`📊 [BULK-GRADE] Course: ${courseCode}, Assessment: ${assessmentType}, Grades count: ${grades?.length || 0}`);

    if (!courseCode || !assessmentType || !grades || !Array.isArray(grades)) {
      return res.status(400).json({
        success: false,
        message: 'courseCode, assessmentType, and grades array are required'
      });
    }

    if (grades.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one grade entry is required'
      });
    }

    // Validate grade entries
    for (const grade of grades) {
      if (!grade.studentId || grade.score === undefined || grade.score === null) {
        return res.status(400).json({
          success: false,
          message: 'Each grade entry must have studentId and score'
        });
      }
    }

    const Grade = require('../models/Grade');
    const gradeUpdates = [];
    const currentDate = new Date();

    // Process each grade entry
    for (const gradeEntry of grades) {
      const gradeData = {
        studentId: gradeEntry.studentId,
        studentName: gradeEntry.studentName || 'Student',
        courseCode: courseCode,
        assessmentType: assessmentType,
        score: gradeEntry.score,
        maxScore: gradeEntry.maxScore || 100,
        percentage: gradeEntry.maxScore ? Math.round((gradeEntry.score / gradeEntry.maxScore) * 100) : 0,
        academicYear: academicYear || '2024/2025',
        semester: 'Semester 1',
        block: 'Block A',
        dateEntered: currentDate,
        lecturer: req.user?.name || req.user?.fullName || 'Lecturer',
        lecturerId: req.user?.id,
        sessionId: sessionId
      };

      // Calculate letter grade
      if (gradeData.percentage >= 90) gradeData.letterGrade = 'A';
      else if (gradeData.percentage >= 80) gradeData.letterGrade = 'B+';
      else if (gradeData.percentage >= 75) gradeData.letterGrade = 'B';
      else if (gradeData.percentage >= 70) gradeData.letterGrade = 'B-';
      else if (gradeData.percentage >= 65) gradeData.letterGrade = 'C+';
      else if (gradeData.percentage >= 60) gradeData.letterGrade = 'C';
      else if (gradeData.percentage >= 55) gradeData.letterGrade = 'C-';
      else if (gradeData.percentage >= 50) gradeData.letterGrade = 'D';
      else gradeData.letterGrade = 'F';

      gradeUpdates.push(gradeData);
    }

    // Try to save to database
    let savedCount = 0;
    try {
      for (const gradeData of gradeUpdates) {
        await Grade.findOneAndUpdate(
          { 
            studentId: gradeData.studentId, 
            courseCode: gradeData.courseCode, 
            assessmentType: gradeData.assessmentType 
          },
          gradeData,
          { upsert: true, new: true }
        );
        savedCount++;
      }
      console.log(`✅ [BULK-GRADE] Successfully saved ${savedCount} grades to database`);
    } catch (dbError) {
      console.warn('❌ [BULK-GRADE] Database save failed:', dbError.message);
      // Continue without database save
    }

    // Also update the in-memory grade store for immediate frontend response
    const gradeStore = require('./grades').gradeStore || [];
    for (const gradeData of gradeUpdates) {
      // Remove existing grade if any
      const existingIndex = gradeStore.findIndex(g => 
        g.studentId === gradeData.studentId && 
        g.courseCode === gradeData.courseCode && 
        g.assessmentType === gradeData.assessmentType
      );
      
      if (existingIndex >= 0) {
        gradeStore[existingIndex] = {
          ...gradeStore[existingIndex],
          ...gradeData,
          grade: gradeData.letterGrade,
          submissionDate: gradeData.dateEntered,
          feedback: gradeData.feedback || 'Bulk graded'
        };
      } else {
        gradeStore.push({
          ...gradeData,
          grade: gradeData.letterGrade,
          submissionDate: gradeData.dateEntered,
          feedback: gradeData.feedback || 'Bulk graded'
        });
      }
    }

    console.log(`✅ [BULK-GRADE] Successfully processed ${gradeUpdates.length} bulk grades`);

    res.json({
      success: true,
      message: `Successfully applied grades to ${gradeUpdates.length} students`,
      sessionId: sessionId,
      courseCode: courseCode,
      assessmentType: assessmentType,
      processedGrades: gradeUpdates.length,
      savedToDatabase: savedCount,
      academicYear: academicYear || '2024/2025'
    });

  } catch (error) {
    console.error('❌ [BULK-GRADE] Error processing bulk grades:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk grades',
      error: error.message
    });
  }
});

// @route   GET /api/assessments/bulk-grade-:sessionId
// @desc    Get bulk grading session info and current grades
// @access  Private (Lecturer, Admin)
router.get('/bulk-grade-:sessionId', auth(['lecturer', 'admin']), async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { courseCode } = req.query;

    console.log(`📊 [BULK-GRADE] Fetching bulk grade session ${sessionId} for course ${courseCode}`);

    // Sample response for bulk grading session
    const response = {
      success: true,
      sessionId: sessionId,
      courseCode: courseCode || 'BIT301',
      status: 'active',
      createdAt: new Date().toISOString(),
      students: [
        { studentId: '1234568', fullName: 'John Kwaku Doe', currentGrade: null },
        { studentId: '1234456', fullName: 'Saaed Hawa', currentGrade: null },
        { studentId: '1233456', fullName: 'Kwarteng Samuel', currentGrade: null },
        { studentId: '1234557', fullName: 'Nashiru Alhassan', currentGrade: null }
      ],
      assessmentTypes: ['Class Assessment', 'Mid Semester', 'End of Semester'],
      maxScore: 100
    };

    res.json(response);

  } catch (error) {
    console.error('❌ [BULK-GRADE] Error fetching session info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bulk grading session',
      error: error.message
    });
  }
});

module.exports = router;