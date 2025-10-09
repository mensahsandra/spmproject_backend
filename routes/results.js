// routes/results.js - Student results aggregation API
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Quiz = require('../models/Quiz');
const QuizSubmission = require('../models/QuizSubmission');
const User = require('../models/User');
const { mapCoursesToFullDetails } = require('../config/courseMapping');

// @route   GET /api/results/student
// @desc    Get student results aggregated by year, semester, block
// @access  Private (Student)
router.get('/student', auth(['student', 'admin']), async (req, res) => {
    try {
        const { year, semester, block } = req.query;
        const studentId = req.user.id;
        
        // Get student information
        const student = await User.findById(studentId).select('name studentId courses course').lean();
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Get student's courses
        const studentCourses = student.courses || (student.course ? [student.course] : []);
        const coursesWithDetails = mapCoursesToFullDetails(studentCourses);

        // Get quiz submissions for this student
        const quizSubmissions = await QuizSubmission.find({
            studentId: student.studentId || studentId,
            ...(year && { createdAt: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${parseInt(year) + 1}-01-01`) } })
        }).populate('quizId').lean();

        // Group results by course
        const resultsByCourse = {};

        // Process quiz submissions
        for (const submission of quizSubmissions) {
            const quiz = submission.quizId;
            if (!quiz) continue;

            const courseCode = quiz.courseCode;
            const courseDetails = coursesWithDetails.find(c => c.code === courseCode) || {
                code: courseCode,
                name: courseCode,
                fullName: courseCode
            };

            if (!resultsByCourse[courseCode]) {
                resultsByCourse[courseCode] = {
                    courseCode,
                    courseName: courseDetails.fullName,
                    assessments: [],
                    totalScore: 0,
                    maxScore: 0,
                    averageScore: 0
                };
            }

            // Map quiz to assessment type
            let assessmentType = 'Assessment'; // Default for quizzes
            if (quiz.title?.toLowerCase().includes('assignment')) assessmentType = 'Assignment';
            else if (quiz.title?.toLowerCase().includes('midterm') || quiz.title?.toLowerCase().includes('mid')) assessmentType = 'Mid Semester';
            else if (quiz.title?.toLowerCase().includes('final') || quiz.title?.toLowerCase().includes('end')) assessmentType = 'End of Semester';
            else if (quiz.title?.toLowerCase().includes('group')) assessmentType = 'Group Work';

            const assessment = {
                id: submission._id,
                type: assessmentType,
                title: quiz.title,
                score: submission.score || 0,
                maxScore: quiz.totalMarks || 100,
                percentage: quiz.totalMarks ? Math.round((submission.score / quiz.totalMarks) * 100) : 0,
                submittedAt: submission.submittedAt,
                gradedAt: submission.gradedAt,
                status: submission.status || 'completed',
                feedback: submission.feedback
            };

            resultsByCourse[courseCode].assessments.push(assessment);
            resultsByCourse[courseCode].totalScore += assessment.score;
            resultsByCourse[courseCode].maxScore += assessment.maxScore;
        }

        // Calculate averages
        Object.values(resultsByCourse).forEach(course => {
            if (course.maxScore > 0) {
                course.averageScore = Math.round((course.totalScore / course.maxScore) * 100);
            }
        });

        // Format response for frontend
        const results = Object.values(resultsByCourse).map(course => ({
            courseCode: course.courseCode,
            courseName: course.courseName,
            assessments: course.assessments.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)),
            summary: {
                totalAssessments: course.assessments.length,
                averageScore: course.averageScore,
                totalScore: course.totalScore,
                maxScore: course.maxScore
            }
        }));

        res.json({
            success: true,
            student: {
                id: student._id,
                name: student.name,
                studentId: student.studentId
            },
            filters: {
                year: year || new Date().getFullYear(),
                semester: semester || 'current',
                block: block || 'all'
            },
            results,
            summary: {
                totalCourses: results.length,
                totalAssessments: results.reduce((sum, course) => sum + course.assessments.length, 0),
                overallAverage: results.length > 0 ? 
                    Math.round(results.reduce((sum, course) => sum + course.summary.averageScore, 0) / results.length) : 0
            }
        });

    } catch (error) {
        console.error('Student results error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch student results',
            error: error.message
        });
    }
});

// @route   GET /api/results/course/:courseCode
// @desc    Get results for a specific course
// @access  Private (Student)
router.get('/course/:courseCode', auth(['student', 'admin']), async (req, res) => {
    try {
        const { courseCode } = req.params;
        const studentId = req.user.id;

        const student = await User.findById(studentId).select('name studentId').lean();
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Get quiz submissions for this course
        const quizSubmissions = await QuizSubmission.find({
            studentId: student.studentId || studentId
        }).populate({
            path: 'quizId',
            match: { courseCode: courseCode }
        }).lean();

        const validSubmissions = quizSubmissions.filter(s => s.quizId);

        const assessments = validSubmissions.map(submission => {
            const quiz = submission.quizId;
            
            let assessmentType = 'Assessment';
            if (quiz.title?.toLowerCase().includes('assignment')) assessmentType = 'Assignment';
            else if (quiz.title?.toLowerCase().includes('midterm')) assessmentType = 'Mid Semester';
            else if (quiz.title?.toLowerCase().includes('final')) assessmentType = 'End of Semester';
            else if (quiz.title?.toLowerCase().includes('group')) assessmentType = 'Group Work';

            return {
                id: submission._id,
                type: assessmentType,
                title: quiz.title,
                score: submission.score || 0,
                maxScore: quiz.totalMarks || 100,
                percentage: quiz.totalMarks ? Math.round((submission.score / quiz.totalMarks) * 100) : 0,
                submittedAt: submission.submittedAt,
                gradedAt: submission.gradedAt,
                status: submission.status || 'completed',
                feedback: submission.feedback
            };
        });

        res.json({
            success: true,
            courseCode,
            assessments: assessments.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)),
            summary: {
                totalAssessments: assessments.length,
                averageScore: assessments.length > 0 ? 
                    Math.round(assessments.reduce((sum, a) => sum + a.percentage, 0) / assessments.length) : 0
            }
        });

    } catch (error) {
        console.error('Course results error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch course results',
            error: error.message
        });
    }
});

module.exports = router;