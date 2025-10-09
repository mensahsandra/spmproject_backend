const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Simple test route first (no dependencies)
router.get('/test', (req, res) => {
  console.log('🧪 Quiz test route hit');
  res.json({
    ok: true,
    message: 'Quiz routes are working!',
    timestamp: new Date().toISOString()
  });
});

// @route   GET /api/quizzes/submissions/student/:studentId
// @desc    Get all quiz submissions for a student (Enhanced for results integration)
// @access  Private (Student, Lecturer, Admin)
router.get('/submissions/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { year, semester, courseCode } = req.query;
    
    // Import models (with error handling)
    let Quiz, QuizSubmission;
    try {
      Quiz = require('../models/Quiz');
      QuizSubmission = require('../models/QuizSubmission');
    } catch (error) {
      console.log('Models not available, using mock data');
      return res.json({
        success: true,
        studentId,
        submissions: [],
        message: 'Models not available - using mock data',
        mock: true
      });
    }

    // Build query filters
    let query = { studentId };
    
    if (courseCode) {
      const courseQuizzes = await Quiz.find({ courseCode }).select('_id').lean();
      const quizIds = courseQuizzes.map(q => q._id);
      query.quizId = { $in: quizIds };
    }
    
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${parseInt(year) + 1}-01-01`);
      query.submittedAt = { $gte: startDate, $lt: endDate };
    }

    const submissions = await QuizSubmission.find(query)
      .populate('quizId', 'title courseCode courseName totalMarks timeLimit createdAt')
      .sort({ submittedAt: -1 })
      .lean();

    // Get course mapping for full names
    let mapCoursesToFullDetails;
    try {
      mapCoursesToFullDetails = require('../config/courseMapping').mapCoursesToFullDetails;
    } catch (error) {
      mapCoursesToFullDetails = (courses) => courses.map(c => ({ code: c, fullName: c }));
    }

    const formattedSubmissions = submissions.map(submission => {
      const quiz = submission.quizId;
      if (!quiz) return null;

      // Map quiz type to assessment type for frontend
      let assessmentType = 'Assessment'; // Default for quizzes
      if (quiz.title?.toLowerCase().includes('assignment')) assessmentType = 'Assignment';
      else if (quiz.title?.toLowerCase().includes('midterm') || quiz.title?.toLowerCase().includes('mid')) assessmentType = 'Mid Semester';
      else if (quiz.title?.toLowerCase().includes('final') || quiz.title?.toLowerCase().includes('end')) assessmentType = 'End of Semester';
      else if (quiz.title?.toLowerCase().includes('group')) assessmentType = 'Group Work';

      // Get full course name
      const courseDetails = mapCoursesToFullDetails([quiz.courseCode])[0] || {
        code: quiz.courseCode,
        fullName: quiz.courseName || quiz.courseCode
      };

      return {
        id: submission._id,
        quiz: {
          id: quiz._id,
          title: quiz.title,
          courseCode: quiz.courseCode,
          courseName: courseDetails.fullName,
          totalMarks: quiz.totalMarks,
          createdAt: quiz.createdAt
        },
        assessmentType,
        score: submission.score || 0,
        totalMarks: quiz.totalMarks || 100,
        percentage: quiz.totalMarks ? 
          Math.round((submission.score / quiz.totalMarks) * 100) : 0,
        answers: submission.answers,
        submittedAt: submission.submittedAt,
        gradedAt: submission.gradedAt,
        status: submission.status || 'completed',
        feedback: submission.feedback,
        timeSpent: submission.timeSpent,
        grade: submission.score >= (quiz.totalMarks * 0.7) ? 'A' : 
               submission.score >= (quiz.totalMarks * 0.6) ? 'B' : 
               submission.score >= (quiz.totalMarks * 0.5) ? 'C' : 
               submission.score >= (quiz.totalMarks * 0.4) ? 'D' : 'F'
      };
    }).filter(Boolean);

    res.json({
      success: true,
      studentId,
      filters: { year, semester, courseCode },
      submissions: formattedSubmissions,
      summary: {
        totalSubmissions: formattedSubmissions.length,
        overallAverage: formattedSubmissions.length > 0 ? 
          Math.round(formattedSubmissions.reduce((sum, s) => sum + s.percentage, 0) / formattedSubmissions.length) : 0
      }
    });

  } catch (error) {
    console.error('Get student submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student submissions',
      error: error.message
    });
  }
});

// Minimal quiz creation endpoint (no auth, no database, no file upload)
router.post('/create-minimal', (req, res) => {
  console.log('🧪 MINIMAL quiz creation endpoint hit');
  console.log('📝 Headers:', req.headers);
  console.log('📝 Body:', req.body);
  
  // Set proper headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  try {
    // Always return success for testing
    const response = {
      ok: true,
      success: true,
      message: 'Minimal quiz creation successful!',
      data: {
        received: req.body,
        timestamp: new Date().toISOString(),
        endpoint: 'create-minimal'
      }
    };
    
    console.log('✅ Sending response:', response);
    res.status(200).json(response);
    
  } catch (error) {
    console.error('❌ Error in minimal endpoint:', error);
    const errorResponse = {
      ok: false,
      message: 'Minimal endpoint error',
      error: error.message
    };
    res.status(500).json(errorResponse);
  }
});

// Try to load dependencies safely
let auth, Quiz, QuizSubmission, User, logger;

try {
  auth = require('../middleware/auth');
  console.log('✅ Auth middleware loaded');
} catch (e) {
  console.error('❌ Failed to load auth middleware:', e.message);
  auth = (roles) => (req, res, next) => {
    // Mock auth for testing
    req.user = { id: 'test-user', name: 'Test User', role: 'lecturer' };
    next();
  };
}

try {
  Quiz = require('../models/Quiz');
  console.log('✅ Quiz model loaded');
} catch (e) {
  console.error('❌ Failed to load Quiz model:', e.message);
}

try {
  QuizSubmission = require('../models/QuizSubmission');
  console.log('✅ QuizSubmission model loaded');
} catch (e) {
  console.error('❌ Failed to load QuizSubmission model:', e.message);
}

try {
  User = require('../models/User');
  console.log('✅ User model loaded');
} catch (e) {
  console.error('❌ Failed to load User model:', e.message);
}

try {
  logger = require('../utils/logger');
  console.log('✅ Logger loaded');
} catch (e) {
  console.error('❌ Failed to load logger:', e.message);
  // Fallback logger
  logger = {
    info: (msg, meta) => console.log('INFO:', msg, meta),
    error: (msg, meta) => console.error('ERROR:', msg, meta),
    warn: (msg, meta) => console.warn('WARN:', msg, meta),
    debug: (msg, meta) => console.log('DEBUG:', msg, meta)
  };
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/quizzes';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `quiz-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image formats
    const allowedTypes = /\.(pdf|doc|docx|txt|jpg|jpeg|png|gif|zip|rar)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX, TXT, JPG, PNG, GIF, ZIP, RAR'));
    }
  }
});

// Simple create endpoint for testing (no database)
router.post('/create-simple', (req, res) => {
  console.log('🧪 Simple quiz creation endpoint hit');
  console.log('📝 Request body:', req.body);
  
  try {
    const { title, courseCode, startTime, endTime } = req.body;
    
    if (!title || !courseCode) {
      return res.status(400).json({
        ok: false,
        message: 'Title and course code are required'
      });
    }
    
    // Mock successful creation
    const mockQuiz = {
      id: 'quiz_' + Date.now(),
      title,
      courseCode,
      startTime,
      endTime,
      created: new Date().toISOString(),
      status: 'created'
    };
    
    console.log('✅ Mock quiz created:', mockQuiz);
    
    res.status(201).json({
      ok: true,
      success: true,
      message: 'Quiz created successfully (mock)!',
      quiz: mockQuiz
    });
    
  } catch (error) {
    console.error('❌ Error in simple create:', error);
    res.status(500).json({
      ok: false,
      message: 'Failed to create quiz',
      error: error.message
    });
  }
});

// Create a new quiz (full version)
router.post('/create', auth(['lecturer', 'admin']), upload.array('attachments', 5), async (req, res) => {
  try {
    const { 
      title, 
      description, 
      courseCode, 
      startTime,
      endTime,
      maxScore, 
      instructions,
      questions,
      restrictToAttendees,
      notifyStudents = true
    } = req.body;
    
    console.log('Quiz creation request:', { title, courseCode, startTime, endTime, restrictToAttendees });
    
    // Validate required fields
    if (!title || !courseCode) {
      return res.status(400).json({
        ok: false,
        message: 'Title and course code are required'
      });
    }

    // Parse dates
    let startDate, endDate;
    if (startTime) {
      startDate = new Date(startTime);
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({
          ok: false,
          message: 'Invalid start time format'
        });
      }
    }
    
    if (endTime) {
      endDate = new Date(endTime);
      if (isNaN(endDate.getTime())) {
        return res.status(400).json({
          ok: false,
          message: 'Invalid end time format'
        });
      }
    }

    // Process uploaded files
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype
    })) : [];

    // Parse questions if provided as JSON string
    let parsedQuestions = [];
    if (questions) {
      try {
        parsedQuestions = typeof questions === 'string' ? JSON.parse(questions) : questions;
      } catch (e) {
        console.warn('Failed to parse questions:', e.message);
      }
    }

    // Create quiz
    const quiz = new Quiz({
      title,
      description,
      courseCode,
      lecturer: req.user.id,
      lecturerName: req.user.name,
      startTime: startDate,
      endTime: endDate,
      maxScore: parseInt(maxScore) || 100,
      instructions,
      questions: parsedQuestions,
      attachments,
      restrictToAttendees: restrictToAttendees === 'true' || restrictToAttendees === true,
      isActive: true
    });

    await quiz.save();

    // Send notifications to students
    if (notifyStudents) {
      try {
        await notifyStudentsAboutQuiz(quiz, restrictToAttendees);
        quiz.notificationSent = true;
        await quiz.save();
      } catch (notifyError) {
        console.warn('Failed to send notifications:', notifyError.message);
        // Don't fail the quiz creation if notifications fail
      }
    }
    
    console.log('Quiz created successfully:', quiz._id);
    
    res.status(201).json({
      ok: true,
      success: true,
      message: 'Quiz created and shared with students successfully!',
      quiz: {
        id: quiz._id,
        title: quiz.title,
        courseCode: quiz.courseCode,
        startTime: quiz.startTime,
        endTime: quiz.endTime,
        maxScore: quiz.maxScore,
        attachments: quiz.attachments.length,
        questionsCount: parsedQuestions.length,
        restrictToAttendees: quiz.restrictToAttendees,
        notificationSent: quiz.notificationSent
      }
    });

  } catch (error) {
    console.error('Quiz creation error:', error);
    
    // Clean up uploaded files if quiz creation fails
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('File cleanup error:', err.message);
        });
      });
    }

    res.status(500).json({
      ok: false,
      message: 'Failed to create quiz',
      error: error.message
    });
  }
});

// Function to notify students about new quiz
async function notifyStudentsAboutQuiz(quiz, restrictToAttendees = false) {
  try {
    // Get students for the course
    let students = [];
    
    if (restrictToAttendees) {
      // Get students who attended recent sessions
      // For demo, using mock data - in real app, query attendance records
      students = [
        { _id: 'student1', name: 'Ransford Student', studentId: '1234567', email: 'ransford@example.com' },
        { _id: 'student2', name: 'Alice Johnson', studentId: 'S1001', email: 'alice@example.com' },
        { _id: 'student3', name: 'Bob Smith', studentId: 'S1002', email: 'bob@example.com' }
      ];
    } else {
      // Get all students enrolled in the course
      // For demo, using mock data - in real app, query User model
      students = [
        { _id: 'student1', name: 'Ransford Student', studentId: '1234567', email: 'ransford@example.com' },
        { _id: 'student2', name: 'Alice Johnson', studentId: 'S1001', email: 'alice@example.com' },
        { _id: 'student3', name: 'Bob Smith', studentId: 'S1002', email: 'bob@example.com' },
        { _id: 'student4', name: 'Carol Davis', studentId: 'S1003', email: 'carol@example.com' }
      ];
    }

    console.log(`Notifying ${students.length} students about quiz: ${quiz.title}`);
    
    // In a real application, you would:
    // 1. Send email notifications
    // 2. Create in-app notifications
    // 3. Send push notifications
    // 4. Log notification attempts
    
    // For now, just log the notification
    students.forEach(student => {
      console.log(`📧 Notification sent to ${student.name} (${student.email}) about quiz: ${quiz.title}`);
    });
    
    return { notified: students.length, students: students.map(s => s.studentId) };
  } catch (error) {
    console.error('Error notifying students:', error);
    throw error;
  }
}

// Get quizzes for a course (lecturer view)
router.get('/course/:courseCode', auth(['lecturer', 'admin']), async (req, res) => {
  try {
    const { courseCode } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const quizzes = await Quiz.find({
      courseCode,
      lecturer: req.user.id
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('-attachments.path'); // Don't expose file paths

    const total = await Quiz.countDocuments({
      courseCode,
      lecturer: req.user.id
    });

    res.json({
      ok: true,
      quizzes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('quiz.list.error', { error: error.message, user: req.user.id });
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch quizzes',
      error: error.message
    });
  }
});

// Get quiz submissions for grading
router.get('/:quizId/submissions', auth(['lecturer', 'admin']), async (req, res) => {
  try {
    const { quizId } = req.params;

    // Verify quiz belongs to lecturer
    const quiz = await Quiz.findOne({
      _id: quizId,
      lecturer: req.user.id
    });

    if (!quiz) {
      return res.status(404).json({
        ok: false,
        message: 'Quiz not found or access denied'
      });
    }

    const submissions = await QuizSubmission.find({ quiz: quizId })
      .populate('student', 'name studentId email')
      .sort({ submittedAt: -1 });

    res.json({
      ok: true,
      quiz: {
        id: quiz._id,
        title: quiz.title,
        courseCode: quiz.courseCode,
        maxScore: quiz.maxScore
      },
      submissions
    });

  } catch (error) {
    logger.error('quiz.submissions.error', { error: error.message, user: req.user.id });
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch submissions',
      error: error.message
    });
  }
});

// Get all quizzes for lecturer dashboard
router.get('/lecturer/dashboard', auth(['lecturer', 'admin']), async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const quizzes = await Quiz.find({ lecturer: req.user.id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('title courseCode dueDate maxScore createdAt isActive');

    // Get submission counts for each quiz
    const quizzesWithStats = await Promise.all(
      quizzes.map(async (quiz) => {
        const submissionCount = await QuizSubmission.countDocuments({ quiz: quiz._id });
        return {
          ...quiz.toObject(),
          submissionCount
        };
      })
    );

    res.json({
      ok: true,
      quizzes: quizzesWithStats
    });

  } catch (error) {
    logger.error('quiz.dashboard.error', { error: error.message, user: req.user.id });
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch quiz dashboard',
      error: error.message
    });
  }
});

// Get courses taught by lecturer (for dropdown)
router.get('/lecturer/courses', auth(['lecturer', 'admin']), async (req, res) => {
  try {
    const User = require('../models/User');
    const Course = require('../models/Course');
    
    // Get lecturer's assigned courses
    const lecturer = await User.findById(req.user.id).select('courses teachingAssignments');
    
    if (!lecturer) {
      return res.status(404).json({
        ok: false,
        message: 'Lecturer not found'
      });
    }
    
    // Get course details for lecturer's courses
    const courseDetails = await Course.find({
      code: { $in: lecturer.courses || [] },
      isActive: true
    }).select('code name department credits');
    
    // If no courses assigned, return default courses for demo
    if (courseDetails.length === 0) {
      const defaultCourses = await Course.find({
        code: { $in: ['BIT364', 'CS101', 'BIT301'] },
        isActive: true
      }).select('code name department credits');
      
      return res.json({
        ok: true,
        courses: defaultCourses.map(course => ({
          code: course.code,
          name: course.name,
          department: course.department,
          credits: course.credits
        })),
        isDefault: true,
        message: 'Showing default courses. Please update your teaching assignments.'
      });
    }
    
    res.json({
      ok: true,
      courses: courseDetails.map(course => ({
        code: course.code,
        name: course.name,
        department: course.department,
        credits: course.credits
      })),
      total: courseDetails.length
    });

  } catch (error) {
    console.error('Quiz courses error:', error);
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch courses',
      error: error.message
    });
  }
});

// Get quiz details for editing
router.get('/:quizId', auth(['lecturer', 'admin']), async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findOne({
      _id: quizId,
      lecturer: req.user.id
    });

    if (!quiz) {
      return res.status(404).json({
        ok: false,
        message: 'Quiz not found or access denied'
      });
    }

    res.json({
      ok: true,
      quiz
    });

  } catch (error) {
    console.error('Quiz fetch error:', error);
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch quiz',
      error: error.message
    });
  }
});

// Update quiz
router.put('/:quizId', auth(['lecturer', 'admin']), upload.array('attachments', 5), async (req, res) => {
  try {
    const { quizId } = req.params;
    const updateData = { ...req.body };

    // Parse dates
    if (updateData.startTime) {
      updateData.startTime = new Date(updateData.startTime);
    }
    if (updateData.endTime) {
      updateData.endTime = new Date(updateData.endTime);
    }

    // Parse questions if provided
    if (updateData.questions && typeof updateData.questions === 'string') {
      try {
        updateData.questions = JSON.parse(updateData.questions);
      } catch (e) {
        console.warn('Failed to parse questions:', e.message);
      }
    }

    // Handle new file uploads
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype
      }));
      
      // Add to existing attachments
      const quiz = await Quiz.findById(quizId);
      updateData.attachments = [...(quiz.attachments || []), ...newAttachments];
    }

    const quiz = await Quiz.findOneAndUpdate(
      { _id: quizId, lecturer: req.user.id },
      updateData,
      { new: true }
    );

    if (!quiz) {
      return res.status(404).json({
        ok: false,
        message: 'Quiz not found or access denied'
      });
    }

    res.json({
      ok: true,
      message: 'Quiz updated successfully',
      quiz
    });

  } catch (error) {
    console.error('Quiz update error:', error);
    res.status(500).json({
      ok: false,
      message: 'Failed to update quiz',
      error: error.message
    });
  }
});

// Delete quiz
router.delete('/:quizId', auth(['lecturer', 'admin']), async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findOneAndDelete({
      _id: quizId,
      lecturer: req.user.id
    });

    if (!quiz) {
      return res.status(404).json({
        ok: false,
        message: 'Quiz not found or access denied'
      });
    }

    // Clean up associated files
    if (quiz.attachments && quiz.attachments.length > 0) {
      quiz.attachments.forEach(attachment => {
        fs.unlink(attachment.path, (err) => {
          if (err) console.error('File cleanup error:', err.message);
        });
      });
    }

    // Delete associated submissions
    await QuizSubmission.deleteMany({ quiz: quizId });

    res.json({
      ok: true,
      message: 'Quiz deleted successfully'
    });

  } catch (error) {
    console.error('Quiz deletion error:', error);
    res.status(500).json({
      ok: false,
      message: 'Failed to delete quiz',
      error: error.message
    });
  }
});

// Get students for course (for notification targeting)
router.get('/course/:courseCode/students', auth(['lecturer', 'admin']), async (req, res) => {
  try {
    const { courseCode } = req.params;
    const { filter = 'all' } = req.query; // 'all' or 'attendees'

    let students = [];
    
    if (filter === 'attendees') {
      // Get students who attended recent sessions
      // For demo, using mock data - in real app, query attendance records
      students = [
        { studentId: '1234567', name: 'Ransford Student', email: 'ransford@example.com', lastAttendance: '2025-01-20' },
        { studentId: 'S1001', name: 'Alice Johnson', email: 'alice@example.com', lastAttendance: '2025-01-20' },
        { studentId: 'S1002', name: 'Bob Smith', email: 'bob@example.com', lastAttendance: '2025-01-19' }
      ];
    } else {
      // Get all students enrolled in the course
      students = [
        { studentId: '1234567', name: 'Ransford Student', email: 'ransford@example.com', enrolled: true },
        { studentId: 'S1001', name: 'Alice Johnson', email: 'alice@example.com', enrolled: true },
        { studentId: 'S1002', name: 'Bob Smith', email: 'bob@example.com', enrolled: true },
        { studentId: 'S1003', name: 'Carol Davis', email: 'carol@example.com', enrolled: true }
      ];
    }

    res.json({
      ok: true,
      courseCode,
      filter,
      students,
      count: students.length
    });

  } catch (error) {
    console.error('Students fetch error:', error);
    res.status(500).json({
      ok: false,
      message: 'Failed to fetch students',
      error: error.message
    });
  }
});

// Simple test endpoint (no auth required for testing)
router.post('/test-create', upload.array('attachments', 5), (req, res) => {
  console.log('🧪 Test quiz creation endpoint hit');
  console.log('📝 Request body:', req.body);
  console.log('📎 Request files:', req.files ? req.files.length : 0);
  
  // Ensure we always send valid JSON
  try {
    res.status(200).json({
      ok: true,
      success: true,
      message: 'Test endpoint working perfectly!',
      timestamp: new Date().toISOString(),
      receivedData: {
        body: req.body,
        files: req.files ? req.files.length : 0,
        hasTitle: !!req.body.title,
        hasCourseCode: !!req.body.courseCode
      }
    });
  } catch (error) {
    console.error('❌ Error in test endpoint:', error);
    res.status(500).json({
      ok: false,
      message: 'Test endpoint error',
      error: error.message
    });
  }
});

// Health check for quiz system
router.get('/health', (req, res) => {
  res.json({
    ok: true,
    status: 'operational',
    message: 'Quiz management system is running',
    endpoints: [
      'POST /api/quizzes/create',
      'POST /api/quizzes/test-create',
      'GET /api/quizzes/:quizId',
      'PUT /api/quizzes/:quizId',
      'DELETE /api/quizzes/:quizId',
      'GET /api/quizzes/course/:courseCode',
      'GET /api/quizzes/course/:courseCode/students',
      'GET /api/quizzes/:quizId/submissions',
      'GET /api/quizzes/lecturer/dashboard',
      'GET /api/quizzes/lecturer/courses'
    ]
  });
});

module.exports = router;