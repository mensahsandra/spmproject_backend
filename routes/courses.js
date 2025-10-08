const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Course = require('../models/Course');
const User = require('../models/User');

// @route   GET /api/courses/available
// @desc    Get all available courses for enrollment/assignment
// @access  Private
router.get('/available', auth(['student', 'lecturer', 'admin']), async (req, res) => {
  try {
    const { department, level, semester } = req.query;
    
    // Build filter query
    const filter = { isActive: true };
    if (department) filter.department = department;
    if (level) filter.level = level;
    if (semester && semester !== 'All') filter.semester = { $in: [semester, 'All'] };
    
    const courses = await Course.find(filter)
      .sort({ department: 1, level: 1, code: 1 })
      .select('code name department credits description level semester maxEnrollment currentEnrollment');
    
    res.json({
      success: true,
      courses,
      total: courses.length
    });
  } catch (error) {
    console.error('Get available courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available courses',
      error: error.message
    });
  }
});

// @route   GET /api/courses/departments
// @desc    Get all departments for filtering
// @access  Private
router.get('/departments', auth(['student', 'lecturer', 'admin']), async (req, res) => {
  try {
    const departments = await Course.distinct('department', { isActive: true });
    
    res.json({
      success: true,
      departments: departments.sort()
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
      error: error.message
    });
  }
});

// @route   POST /api/courses/enroll
// @desc    Enroll student in a course or assign course to lecturer
// @access  Private
router.post('/enroll', auth(['student', 'lecturer', 'admin']), async (req, res) => {
  try {
    const { courseCode, semester, academicYear } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!courseCode) {
      return res.status(400).json({
        success: false,
        message: 'Course code is required'
      });
    }
    
    // Check if course exists
    const course = await Course.findOne({ code: courseCode, isActive: true });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or inactive'
      });
    }
    
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if already enrolled/assigned
    if (user.courses && user.courses.includes(courseCode)) {
      return res.status(400).json({
        success: false,
        message: `Already ${userRole === 'student' ? 'enrolled in' : 'assigned to'} this course`
      });
    }
    
    // Add to courses array
    const updatedCourses = [...(user.courses || []), courseCode];
    
    // Prepare update object
    const updateObj = {
      courses: updatedCourses
    };
    
    // Add to appropriate enrollment/assignment history
    if (userRole === 'student') {
      const enrollment = {
        courseCode,
        courseName: course.name,
        enrolledAt: new Date(),
        status: 'active',
        semester: semester || 'Current',
        academicYear: academicYear || '2024-2025',
        credits: course.credits
      };
      
      updateObj.$push = { courseEnrollments: enrollment };
      
      // Update course enrollment count
      await Course.findByIdAndUpdate(course._id, {
        $inc: { currentEnrollment: 1 }
      });
      
    } else if (userRole === 'lecturer') {
      const assignment = {
        courseCode,
        courseName: course.name,
        assignedAt: new Date(),
        status: 'active',
        semester: semester || 'Current',
        academicYear: academicYear || '2024-2025'
      };
      
      updateObj.$push = { teachingAssignments: assignment };
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateObj,
      { new: true }
    ).select('-password');
    
    res.json({
      success: true,
      message: `Successfully ${userRole === 'student' ? 'enrolled in' : 'assigned to'} ${course.name}`,
      user: {
        id: updatedUser._id,
        courses: updatedUser.courses,
        courseEnrollments: updatedUser.courseEnrollments,
        teachingAssignments: updatedUser.teachingAssignments
      }
    });
    
  } catch (error) {
    console.error('Course enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in course',
      error: error.message
    });
  }
});

// @route   DELETE /api/courses/unenroll/:courseCode
// @desc    Unenroll from course or remove teaching assignment
// @access  Private
router.delete('/unenroll/:courseCode', auth(['student', 'lecturer', 'admin']), async (req, res) => {
  try {
    const { courseCode } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if enrolled/assigned
    if (!user.courses || !user.courses.includes(courseCode)) {
      return res.status(400).json({
        success: false,
        message: `Not ${userRole === 'student' ? 'enrolled in' : 'assigned to'} this course`
      });
    }
    
    // Remove from courses array
    const updatedCourses = user.courses.filter(code => code !== courseCode);
    
    // Prepare update object
    const updateObj = {
      courses: updatedCourses
    };
    
    // Update enrollment/assignment status
    if (userRole === 'student') {
      updateObj['courseEnrollments.$[elem].status'] = 'withdrawn';
      
      // Update course enrollment count
      const course = await Course.findOne({ code: courseCode });
      if (course) {
        await Course.findByIdAndUpdate(course._id, {
          $inc: { currentEnrollment: -1 }
        });
      }
      
    } else if (userRole === 'lecturer') {
      updateObj['teachingAssignments.$[elem].status'] = 'inactive';
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateObj,
      { 
        new: true,
        arrayFilters: [{ 'elem.courseCode': courseCode, 'elem.status': 'active' }]
      }
    ).select('-password');
    
    res.json({
      success: true,
      message: `Successfully ${userRole === 'student' ? 'unenrolled from' : 'removed assignment for'} ${courseCode}`,
      user: {
        id: updatedUser._id,
        courses: updatedUser.courses,
        courseEnrollments: updatedUser.courseEnrollments,
        teachingAssignments: updatedUser.teachingAssignments
      }
    });
    
  } catch (error) {
    console.error('Course unenrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unenroll from course',
      error: error.message
    });
  }
});

// @route   GET /api/courses/my-courses
// @desc    Get user's current courses with details
// @access  Private
router.get('/my-courses', auth(['student', 'lecturer', 'admin']), async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get detailed course information
    const courseDetails = await Course.find({
      code: { $in: user.courses || [] },
      isActive: true
    });
    
    // Combine course details with enrollment/assignment info
    const coursesWithDetails = courseDetails.map(course => {
      const courseObj = course.toObject();
      
      if (user.role === 'student') {
        const enrollment = user.courseEnrollments?.find(
          e => e.courseCode === course.code && e.status === 'active'
        );
        courseObj.enrollmentInfo = enrollment;
      } else if (user.role === 'lecturer') {
        const assignment = user.teachingAssignments?.find(
          a => a.courseCode === course.code && a.status === 'active'
        );
        courseObj.assignmentInfo = assignment;
      }
      
      return courseObj;
    });
    
    res.json({
      success: true,
      courses: coursesWithDetails,
      total: coursesWithDetails.length,
      userRole: user.role
    });
    
  } catch (error) {
    console.error('Get my courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user courses',
      error: error.message
    });
  }
});

module.exports = router;