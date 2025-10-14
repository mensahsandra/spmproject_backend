const express = require('express');
const { Parser } = require('json2csv');
const router = express.Router();
const auth = require('../middleware/auth');

// In-memory grades store for demo with enhanced assessment data
const gradeStore = [
    // Original sample data
    { courseCode: 'BIT364', studentId: '1234567', studentName: 'Ransford Student', assessmentType: 'Quiz 1', score: 18, maxScore: 20, percentage: 90, grade: 'A', submissionDate: '2025-01-20T10:30:00Z', feedback: 'Excellent work!', lecturer: 'Kwabena Lecturer' },
    { courseCode: 'BIT364', studentId: '1234567', studentName: 'Ransford Student', assessmentType: 'Assignment 1', score: 42, maxScore: 50, percentage: 84, grade: 'B+', submissionDate: '2025-01-18T14:15:00Z', feedback: 'Good analysis', lecturer: 'Kwabena Lecturer' },
    { courseCode: 'BIT364', studentId: 'S1001', studentName: 'Alice Johnson', assessmentType: 'Quiz 1', score: 16, maxScore: 20, percentage: 80, grade: 'B', submissionDate: '2025-01-20T10:32:00Z', feedback: 'Well done', lecturer: 'Kwabena Lecturer' },
    { courseCode: 'BIT364', studentId: 'S1002', studentName: 'Bob Smith', assessmentType: 'Quiz 1', score: 19, maxScore: 20, percentage: 95, grade: 'A', submissionDate: '2025-01-20T10:28:00Z', feedback: 'Outstanding!', lecturer: 'Kwabena Lecturer' },
    { courseCode: 'BIT364', studentId: 'S1003', studentName: 'Carol Davis', assessmentType: 'Assignment 1', score: 38, maxScore: 50, percentage: 76, grade: 'B', submissionDate: '2025-01-18T16:20:00Z', feedback: 'Good effort', lecturer: 'Kwabena Lecturer' },
    { courseCode: 'CS101', studentId: '1234567', studentName: 'Ransford Student', assessmentType: 'Midterm Exam', score: 78, maxScore: 100, percentage: 78, grade: 'B+', submissionDate: '2025-01-15T09:00:00Z', feedback: 'Solid understanding', lecturer: 'Prof. Anyimadu' },
    { courseCode: 'CS101', studentId: 'S1001', studentName: 'Alice Johnson', assessmentType: 'Project 1', score: 88, maxScore: 100, percentage: 88, grade: 'A-', submissionDate: '2025-01-22T23:59:00Z', feedback: 'Creative solution', lecturer: 'Prof. Anyimadu' },
    { courseCode: 'CS101', studentId: 'S1002', studentName: 'Bob Smith', assessmentType: 'Midterm Exam', score: 65, maxScore: 100, percentage: 65, grade: 'C+', submissionDate: '2025-01-15T09:00:00Z', feedback: 'Needs improvement', lecturer: 'Prof. Anyimadu' },
    
    // Sample data for the 4 new students in BIT364 - Web Development
    // John Kwaku Doe (1234568)
    { courseCode: 'BIT364', studentId: '1234568', studentName: 'John Kwaku Doe', assessmentType: 'Assessment', score: 85, maxScore: 100, percentage: 85, grade: 'B+', submissionDate: '2025-01-25T14:30:00Z', feedback: 'Good understanding of web concepts', lecturer: 'Kwabena Lecturer' },
    { courseCode: 'BIT364', studentId: '1234568', studentName: 'John Kwaku Doe', assessmentType: 'Midsem', score: 78, maxScore: 100, percentage: 78, grade: 'B', submissionDate: '2025-01-28T10:00:00Z', feedback: 'Solid performance', lecturer: 'Kwabena Lecturer' },
    { courseCode: 'BIT364', studentId: '1234568', studentName: 'John Kwaku Doe', assessmentType: 'End of Semester', score: 88, maxScore: 100, percentage: 88, grade: 'A-', submissionDate: '2025-02-15T09:00:00Z', feedback: 'Excellent final exam', lecturer: 'Kwabena Lecturer' },
    
    // Saaed Hawa (1234456)
    { courseCode: 'BIT364', studentId: '1234456', studentName: 'Saaed Hawa', assessmentType: 'Assessment', score: 92, maxScore: 100, percentage: 92, grade: 'A', submissionDate: '2025-01-25T14:35:00Z', feedback: 'Outstanding work!', lecturer: 'Kwabena Lecturer' },
    { courseCode: 'BIT364', studentId: '1234456', studentName: 'Saaed Hawa', assessmentType: 'Midsem', score: 89, maxScore: 100, percentage: 89, grade: 'A-', submissionDate: '2025-01-28T10:05:00Z', feedback: 'Excellent understanding', lecturer: 'Kwabena Lecturer' },
    { courseCode: 'BIT364', studentId: '1234456', studentName: 'Saaed Hawa', assessmentType: 'End of Semester', score: 95, maxScore: 100, percentage: 95, grade: 'A', submissionDate: '2025-02-15T09:05:00Z', feedback: 'Perfect execution', lecturer: 'Kwabena Lecturer' },
    
    // Kwarteng Samuel (1233456)
    { courseCode: 'BIT364', studentId: '1233456', studentName: 'Kwarteng Samuel', assessmentType: 'Assessment', score: 72, maxScore: 100, percentage: 72, grade: 'B-', submissionDate: '2025-01-25T14:40:00Z', feedback: 'Good effort, needs improvement', lecturer: 'Kwabena Lecturer' },
    { courseCode: 'BIT364', studentId: '1233456', studentName: 'Kwarteng Samuel', assessmentType: 'Midsem', score: 75, maxScore: 100, percentage: 75, grade: 'B', submissionDate: '2025-01-28T10:10:00Z', feedback: 'Showing improvement', lecturer: 'Kwabena Lecturer' },
    { courseCode: 'BIT364', studentId: '1233456', studentName: 'Kwarteng Samuel', assessmentType: 'End of Semester', score: 80, maxScore: 100, percentage: 80, grade: 'B+', submissionDate: '2025-02-15T09:10:00Z', feedback: 'Great progress!', lecturer: 'Kwabena Lecturer' },
    
    // Nashiru Alhassan (1234557)
    { courseCode: 'BIT364', studentId: '1234557', studentName: 'Nashiru Alhassan', assessmentType: 'Assessment', score: 88, maxScore: 100, percentage: 88, grade: 'A-', submissionDate: '2025-01-25T14:45:00Z', feedback: 'Very good work', lecturer: 'Kwabena Lecturer' },
    { courseCode: 'BIT364', studentId: '1234557', studentName: 'Nashiru Alhassan', assessmentType: 'Midsem', score: 82, maxScore: 100, percentage: 82, grade: 'B+', submissionDate: '2025-01-28T10:15:00Z', feedback: 'Strong performance', lecturer: 'Kwabena Lecturer' },
    { courseCode: 'BIT364', studentId: '1234557', studentName: 'Nashiru Alhassan', assessmentType: 'End of Semester', score: 90, maxScore: 100, percentage: 90, grade: 'A', submissionDate: '2025-02-15T09:15:00Z', feedback: 'Excellent work throughout', lecturer: 'Kwabena Lecturer' }
];

router.get('/', (req, res) => {
    res.json({
        message: 'Your current grades',
        grades: gradeStore,
        semester: 'Semester 3',
        totalCredits: 12
    });
});

// Health check for grades/results system
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'ok',
        message: 'Grades system is operational',
        endpoints: [
            '/api/grades/academic-years',
            '/api/grades/semesters', 
            '/api/grades/select-result-data',
            '/api/grades/student-results',
            '/api/grades/student/:studentId',
            '/api/grades/enrolled',
            '/api/grades/history'
        ]
    });
});

// @route   GET /api/grades/enrolled
// @desc    Get enrolled students for a course with their grades from database
// @access  Private (Lecturer, Admin)
router.get('/enrolled', auth(['lecturer', 'admin']), async (req, res) => {
    try {
        const { courseCode } = req.query;
        
        if (!courseCode) {
            return res.status(400).json({
                success: false,
                message: 'courseCode is required'
            });
        }

        console.log(`📚 [GRADES] Fetching enrolled students for course: ${courseCode}`);

        // Get course mapping for full course name
        let mapCoursesToFullDetails;
        try {
            mapCoursesToFullDetails = require('../config/courseMapping').mapCoursesToFullDetails;
        } catch (error) {
            mapCoursesToFullDetails = (courses) => courses.map(c => ({ code: c, fullName: c }));
        }

        const courseDetails = mapCoursesToFullDetails([courseCode])[0] || {
            code: courseCode,
            fullName: courseCode
        };

        // Try to fetch grades from database first
        const Grade = require('../models/Grade');
        let enrolledStudents = [];
        
        try {
            console.log(`🔍 [GRADES] Querying database for course: ${courseCode}`);
            
            // Fetch all grades for this course from database
            const dbGrades = await Grade.find({ courseCode: courseCode }).lean();
            console.log(`📊 [GRADES] Found ${dbGrades.length} grade records in database`);
            
            if (dbGrades.length > 0) {
                // Map database grades to student format
                enrolledStudents = dbGrades.map(grade => ({
                    studentId: grade.studentId,
                    fullName: grade.studentName,
                    assessment: grade.classAssessment,
                    midsem: grade.midSemester,
                    endOfSemester: grade.endOfSemester,
                    classAssessment: grade.classAssessment, // Additional field for new frontend
                    midSemester: grade.midSemester,         // Additional field for new frontend
                    totalGrades: [grade.classAssessment, grade.midSemester, grade.endOfSemester].filter(g => g !== null).length,
                    academicYear: grade.academicYear,
                    semester: grade.semester,
                    block: grade.block,
                    dateEntered: grade.dateEntered,
                    lecturer: grade.lecturer
                }));
                
                console.log(`✅ [GRADES] Mapped ${enrolledStudents.length} students from database`);
                enrolledStudents.forEach(student => {
                    console.log(`   - ${student.fullName}: Class=${student.classAssessment || 'null'}, Mid=${student.midSemester || 'null'}, End=${student.endOfSemester || 'null'}`);
                });
            }
        } catch (dbError) {
            console.error('❌ [GRADES] Database fetch failed:', dbError.message);
            console.log('⚠️ [GRADES] Falling back to sample data');
        }
        
        // If no database records, provide sample students with empty grades
        if (enrolledStudents.length === 0) {
            console.log(`📝 [GRADES] No database records found, using sample students for ${courseCode}`);
            
            const sampleStudents = [
                { studentId: '1234568', fullName: 'John Kwaku Doe' },
                { studentId: '1234456', fullName: 'Saaed Hawa' },
                { studentId: '1233456', fullName: 'Kwarteng Samuel' },
                { studentId: '1234557', fullName: 'Nashiru Alhassan' },
                { studentId: '5', fullName: 'Alice Johnson' },
                { studentId: '2', fullName: 'Mercy Johnson' }
            ];

            enrolledStudents = sampleStudents.map(student => ({
                studentId: student.studentId,
                fullName: student.fullName,
                assessment: null,
                midsem: null,
                endOfSemester: null,
                classAssessment: null,
                midSemester: null,
                totalGrades: 0,
                academicYear: '2024/2025',
                semester: 'Semester 1',
                block: 'Block A',
                dateEntered: null,
                lecturer: null
            }));
        }

        console.log(`✅ [GRADES] Returning ${enrolledStudents.length} enrolled students for ${courseCode}`);

        res.json({
            success: true,
            courseCode: courseCode,
            courseName: courseDetails.fullName,
            students: enrolledStudents,
            totalStudents: enrolledStudents.length,
            dataSource: enrolledStudents.length > 0 && enrolledStudents[0].dateEntered ? 'database' : 'sample',
            lastUpdated: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ [GRADES] Error fetching enrolled students:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch enrolled students',
            error: error.message
        });
    }
});

// @route   GET /api/grades/history
// @desc    Get grade history for a course (all submissions and grades)
// @access  Private (Lecturer, Admin)
router.get('/history', auth(['lecturer', 'admin']), async (req, res) => {
    try {
        const { courseCode } = req.query;
        
        if (!courseCode) {
            return res.status(400).json({
                success: false,
                message: 'courseCode is required'
            });
        }

        console.log(`📜 [GRADES] Fetching grade history for course: ${courseCode}`);

        // Get course mapping for full course name
        let mapCoursesToFullDetails;
        try {
            mapCoursesToFullDetails = require('../config/courseMapping').mapCoursesToFullDetails;
        } catch (error) {
            mapCoursesToFullDetails = (courses) => courses.map(c => ({ code: c, fullName: c }));
        }

        const courseDetails = mapCoursesToFullDetails([courseCode])[0] || {
            code: courseCode,
            fullName: courseCode
        };

        // Filter grades from store by courseCode
        const courseGrades = gradeStore.filter(grade => grade.courseCode === courseCode);

        // Format grades for history view
        const formattedHistory = courseGrades.map(grade => ({
            id: `${grade.courseCode}-${grade.studentId}-${grade.assessmentType}`,
            studentId: grade.studentId,
            studentName: grade.studentName,
            assessmentType: grade.assessmentType,
            score: grade.score,
            maxScore: grade.maxScore,
            percentage: grade.percentage,
            grade: grade.grade,
            submissionDate: grade.submissionDate,
            feedback: grade.feedback,
            lecturer: grade.lecturer
        }));

        // Sort by submission date (most recent first)
        formattedHistory.sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate));

        console.log(`✅ [GRADES] Found ${formattedHistory.length} grade records for ${courseCode}`);

        res.json({
            success: true,
            courseCode: courseCode,
            courseName: courseDetails.fullName,
            history: formattedHistory,
            totalRecords: formattedHistory.length,
            assessmentTypes: [...new Set(courseGrades.map(g => g.assessmentType))],
            students: [...new Set(courseGrades.map(g => g.studentName))]
        });

    } catch (error) {
        console.error('❌ [GRADES] Error fetching grade history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch grade history',
            error: error.message
        });
    }
});

// @route   GET /api/grades/student/:studentId
// @desc    Get student grades (Enhanced for results integration)
// @access  Private (Student, Lecturer, Admin)
router.get('/student/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { year, semester, courseCode } = req.query;
        
        // Filter grades from store by studentId
        let studentGrades = gradeStore.filter(grade => 
            grade.studentId === studentId || grade.studentId === String(studentId)
        );

        // Apply filters
        if (courseCode) {
            studentGrades = studentGrades.filter(grade => grade.courseCode === courseCode);
        }

        if (year) {
            studentGrades = studentGrades.filter(grade => {
                const gradeYear = new Date(grade.submissionDate).getFullYear();
                return gradeYear === parseInt(year);
            });
        }

        // Get course mapping for full names
        let mapCoursesToFullDetails;
        try {
            mapCoursesToFullDetails = require('../config/courseMapping').mapCoursesToFullDetails;
        } catch (error) {
            mapCoursesToFullDetails = (courses) => courses.map(c => ({ code: c, fullName: c }));
        }

        // Format grades for frontend
        const formattedGrades = studentGrades.map(grade => {
            const courseDetails = mapCoursesToFullDetails([grade.courseCode])[0] || {
                code: grade.courseCode,
                fullName: grade.courseCode
            };

            // Map assessment type
            let assessmentType = 'Assessment';
            if (grade.assessmentType?.toLowerCase().includes('assignment')) assessmentType = 'Assignment';
            else if (grade.assessmentType?.toLowerCase().includes('midterm') || grade.assessmentType?.toLowerCase().includes('mid')) assessmentType = 'Mid Semester';
            else if (grade.assessmentType?.toLowerCase().includes('final') || grade.assessmentType?.toLowerCase().includes('end')) assessmentType = 'End of Semester';
            else if (grade.assessmentType?.toLowerCase().includes('project') || grade.assessmentType?.toLowerCase().includes('group')) assessmentType = 'Group Work';

            // Calculate GPA
            const gpa = grade.percentage >= 90 ? 4.0 : 
                       grade.percentage >= 85 ? 3.7 :
                       grade.percentage >= 80 ? 3.3 :
                       grade.percentage >= 75 ? 3.0 :
                       grade.percentage >= 70 ? 2.7 :
                       grade.percentage >= 65 ? 2.3 :
                       grade.percentage >= 60 ? 2.0 :
                       grade.percentage >= 55 ? 1.7 :
                       grade.percentage >= 50 ? 1.3 :
                       grade.percentage >= 45 ? 1.0 :
                       grade.percentage >= 40 ? 0.7 : 0.0;

            return {
                id: `${grade.courseCode}-${grade.studentId}-${grade.assessmentType}`,
                courseCode: grade.courseCode,
                courseName: courseDetails.fullName,
                assessmentType,
                assessmentTitle: grade.assessmentType,
                score: grade.score,
                totalMarks: grade.maxScore,
                percentage: grade.percentage,
                letterGrade: grade.grade,
                gpa,
                submittedAt: grade.submissionDate,
                gradedAt: grade.submissionDate,
                feedback: grade.feedback,
                lecturer: grade.lecturer,
                semester: semester || 'Current',
                year: year || new Date(grade.submissionDate).getFullYear()
            };
        });

        // Group by course for summary
        const byCourse = {};
        formattedGrades.forEach(grade => {
            if (!byCourse[grade.courseCode]) {
                byCourse[grade.courseCode] = {
                    courseCode: grade.courseCode,
                    courseName: grade.courseName,
                    grades: [],
                    totalPoints: 0,
                    totalCredits: 0
                };
            }
            byCourse[grade.courseCode].grades.push(grade);
            byCourse[grade.courseCode].totalPoints += grade.gpa;
            byCourse[grade.courseCode].totalCredits += 1;
        });

        // Calculate course summaries
        const courseSummaries = Object.values(byCourse).map(course => ({
            courseCode: course.courseCode,
            courseName: course.courseName,
            assessmentCount: course.grades.length,
            averageGPA: course.totalCredits > 0 ? 
                (course.totalPoints / course.totalCredits).toFixed(2) : '0.00',
            averagePercentage: course.grades.length > 0 ?
                Math.round(course.grades.reduce((sum, g) => sum + g.percentage, 0) / course.grades.length) : 0
        }));

        // Calculate overall GPA
        const totalPoints = formattedGrades.reduce((sum, g) => sum + g.gpa, 0);
        const totalCredits = formattedGrades.length;
        const overallGPA = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';

        // Get student info from grades
        const studentInfo = studentGrades.length > 0 ? {
            studentId: studentGrades[0].studentId,
            name: studentGrades[0].studentName
        } : { studentId };

        res.json({
            success: true,
            student: studentInfo,
            filters: { year, semester, courseCode },
            grades: formattedGrades.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)),
            courseSummaries,
            summary: {
                totalAssessments: formattedGrades.length,
                totalCourses: Object.keys(byCourse).length,
                overallGPA: parseFloat(overallGPA),
                averagePercentage: formattedGrades.length > 0 ?
                    Math.round(formattedGrades.reduce((sum, g) => sum + g.percentage, 0) / formattedGrades.length) : 0,
                lastGraded: formattedGrades.length > 0 ? formattedGrades[0].gradedAt : null
            }
        });

    } catch (error) {
        console.error('Get student grades error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch student grades',
            error: error.message
        });
    }
});

// Lecturer: list grades (optionally filter by courseCode)
router.get('/list', auth(['lecturer','admin']), (req, res) => {
    const { courseCode } = req.query || {};
    const list = courseCode ? gradeStore.filter(g => g.courseCode === String(courseCode)) : gradeStore;
    res.json({ ok: true, count: list.length, grades: list });
});

// Lecturer: update or upsert a grade
router.post('/update', auth(['lecturer','admin']), (req, res) => {
    const { courseCode, studentId, score, grade } = req.body || {};
    if (!courseCode || !studentId) {
        return res.status(400).json({ ok: false, message: 'courseCode and studentId are required' });
    }
    const idx = gradeStore.findIndex(g => g.courseCode === courseCode && g.studentId === studentId);
    const entry = { courseCode, studentId, score: Number(score ?? 0), grade: grade || null, updatedAt: new Date().toISOString() };
    if (idx >= 0) gradeStore[idx] = entry; else gradeStore.push(entry);
    res.json({ ok: true, message: 'Grade saved', grade: entry });
});

// @route   POST /api/grades/assign
// @desc    Assign individual grade to a student
// @access  Private (Lecturer, Admin)
router.post('/assign', auth(['lecturer', 'admin']), async (req, res) => {
    try {
        const {
            courseCode,
            studentId,
            studentName,
            assessmentType,
            score,
            maxScore,
            feedback
        } = req.body;

        // Validate required fields
        if (!courseCode || !studentId || !assessmentType || score === undefined || !maxScore) {
            return res.status(400).json({
                success: false,
                message: 'courseCode, studentId, assessmentType, score, and maxScore are required'
            });
        }

        // Calculate percentage and letter grade
        const percentage = Math.round((score / maxScore) * 100);
        const letterGrade = percentage >= 90 ? 'A' :
                           percentage >= 85 ? 'B+' :
                           percentage >= 80 ? 'B' :
                           percentage >= 75 ? 'B-' :
                           percentage >= 70 ? 'C+' :
                           percentage >= 65 ? 'C' :
                           percentage >= 60 ? 'C-' :
                           percentage >= 55 ? 'D+' :
                           percentage >= 50 ? 'D' : 'F';

        // Check if grade already exists for this student, course, and assessment type
        const existingIndex = gradeStore.findIndex(g => 
            g.courseCode === courseCode && 
            g.studentId === studentId && 
            g.assessmentType === assessmentType
        );

        const gradeEntry = {
            courseCode,
            studentId,
            studentName: studentName || 'Unknown Student',
            assessmentType,
            score: Number(score),
            maxScore: Number(maxScore),
            percentage,
            grade: letterGrade,
            submissionDate: new Date().toISOString(),
            feedback: feedback || '',
            lecturer: req.user.name || 'Unknown Lecturer'
        };

        if (existingIndex >= 0) {
            // Update existing grade
            gradeStore[existingIndex] = gradeEntry;
            console.log(`✏️ [GRADES] Updated grade for ${studentName} (${studentId}) in ${courseCode} - ${assessmentType}: ${score}/${maxScore}`);
        } else {
            // Add new grade
            gradeStore.push(gradeEntry);
            console.log(`➕ [GRADES] Added new grade for ${studentName} (${studentId}) in ${courseCode} - ${assessmentType}: ${score}/${maxScore}`);
        }

        res.json({
            success: true,
            message: existingIndex >= 0 ? 'Grade updated successfully' : 'Grade assigned successfully',
            grade: gradeEntry
        });

    } catch (error) {
        console.error('❌ [GRADES] Error assigning grade:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign grade',
            error: error.message
        });
    }
});

// Enhanced assessment export with multiple formats
router.get('/export', auth(['lecturer','admin']), (req, res) => {
    const { courseCode, format = 'csv', startDate, endDate, assessmentType } = req.query || {};
    
    try {
        // Filter data based on query parameters
        let filteredData = gradeStore;
        
        // Filter by course code
        if (courseCode) {
            filteredData = filteredData.filter(g => g.courseCode === String(courseCode));
        }
        
        // Filter by assessment type
        if (assessmentType) {
            filteredData = filteredData.filter(g => g.assessmentType === String(assessmentType));
        }
        
        // Filter by date range
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            
            filteredData = filteredData.filter(g => {
                const submissionDate = new Date(g.submissionDate);
                return submissionDate >= start && submissionDate <= end;
            });
        }
        
        // Format data for export
        const exportData = filteredData.map(record => ({
            'Course Code': record.courseCode || '',
            'Student ID': record.studentId || '',
            'Student Name': record.studentName || 'Unknown Student',
            'Assessment Type': record.assessmentType || '',
            'Score': record.score || 0,
            'Max Score': record.maxScore || 0,
            'Percentage': record.percentage || 0,
            'Grade': record.grade || '',
            'Submission Date': record.submissionDate ? new Date(record.submissionDate).toLocaleDateString() : '',
            'Submission Time': record.submissionDate ? new Date(record.submissionDate).toLocaleTimeString() : '',
            'Lecturer': record.lecturer || '',
            'Feedback': record.feedback || ''
        }));
        
        if (format.toLowerCase() === 'excel') {
            // Excel format with BOM for proper UTF-8 encoding
            const fields = Object.keys(exportData[0] || {});
            const parser = new Parser({ fields });
            const csv = parser.parse(exportData);
            const csvWithBOM = '\uFEFF' + csv;
            
            res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="assessments_export_${Date.now()}.csv"`);
            res.send(csvWithBOM);
        } else {
            // Standard CSV format
            const fields = Object.keys(exportData[0] || {});
            const parser = new Parser({ fields });
            const csv = parser.parse(exportData);
            
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="assessments_export_${Date.now()}.csv"`);
            res.send(csv);
        }
    } catch (e) {
        console.error('assessment export error:', e);
        res.status(500).json({ ok: false, message: 'Failed to export assessments', error: String(e?.message || e) });
    }
});

// Get assessment records for lecturer (for frontend export preview)
router.get('/lecturer/:lecturerId', auth(['lecturer','admin']), (req, res) => {
    try {
        const { lecturerId } = req.params;
        const { courseCode, assessmentType, startDate, endDate, limit = 1000 } = req.query || {};
        
        // Security check
        if (req.user.role !== 'admin' && req.user.id !== lecturerId && req.user.name !== lecturerId) {
            return res.status(403).json({ 
                ok: false, 
                message: 'Access denied. Can only view your own records.' 
            });
        }
        
        // Filter data
        let filteredData = gradeStore.filter(g => g.lecturer === req.user.name);
        
        if (courseCode) {
            filteredData = filteredData.filter(g => g.courseCode === courseCode);
        }
        
        if (assessmentType) {
            filteredData = filteredData.filter(g => g.assessmentType === assessmentType);
        }
        
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            
            filteredData = filteredData.filter(g => {
                const submissionDate = new Date(g.submissionDate);
                return submissionDate >= start && submissionDate <= end;
            });
        }
        
        // Sort by submission date (newest first) and limit
        filteredData = filteredData
            .sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate))
            .slice(0, parseInt(limit));
        
        // Format for frontend display
        const formattedRecords = filteredData.map(record => ({
            courseCode: record.courseCode,
            studentId: record.studentId,
            studentName: record.studentName,
            assessmentType: record.assessmentType,
            score: record.score,
            maxScore: record.maxScore,
            percentage: record.percentage,
            grade: record.grade,
            submissionDate: record.submissionDate ? new Date(record.submissionDate).toLocaleDateString() : '',
            submissionTime: record.submissionDate ? new Date(record.submissionDate).toLocaleTimeString() : '',
            lecturer: record.lecturer,
            feedback: record.feedback,
            timestamp: record.submissionDate
        }));
        
        // Get unique values for filtering
        const uniqueCourses = [...new Set(filteredData.map(r => r.courseCode).filter(Boolean))];
        const uniqueAssessmentTypes = [...new Set(filteredData.map(r => r.assessmentType).filter(Boolean))];
        
        res.json({
            ok: true,
            success: true,
            records: formattedRecords,
            totalRecords: formattedRecords.length,
            courses: uniqueCourses,
            assessmentTypes: uniqueAssessmentTypes,
            dateRange: {
                earliest: filteredData.length > 0 ? filteredData[filteredData.length - 1].submissionDate : null,
                latest: filteredData.length > 0 ? filteredData[0].submissionDate : null
            }
        });
    } catch (e) {
        console.error('lecturer assessment records error:', e);
        res.status(500).json({ 
            ok: false, 
            message: 'Failed to fetch assessment records', 
            error: String(e?.message || e) 
        });
    }
});

// Student: Get academic years for dropdown
router.get('/academic-years', (req, res) => {
    const academicYears = [
        { value: '2024-2025', label: '2024/2025' },
        { value: '2023-2024', label: '2023/2024' },
        { value: '2022-2023', label: '2022/2023' }
    ];
    res.json({
        success: true,
        academicYears
    });
});

// Student: Get semesters for dropdown
router.get('/semesters', (req, res) => {
    const semesters = [
        { value: 'Block 1', label: 'Block 1' },
        { value: 'Block 2', label: 'Block 2' }
    ];
    res.json({
        success: true,
        semesters
    });
});

// Student: Get initial data for select-result page
router.get('/select-result-data', (req, res) => {
    const academicYears = [
        { value: '2024-2025', label: '2024/2025' },
        { value: '2023-2024', label: '2023/2024' },
        { value: '2022-2023', label: '2022/2023' }
    ];
    
    const semesters = [
        { value: 'Block 1', label: 'Block 1' },
        { value: 'Block 2', label: 'Block 2' }
    ];
    
    res.json({
        success: true,
        data: {
            academicYears,
            semesters,
            defaultAcademicYear: '2024-2025',
            defaultSemester: 'Block 1'
        }
    });
});

// Student: Get results for select-result page
router.get('/student-results', (req, res) => {
    const { academicYear, semester, studentId } = req.query;
    
    // Filter results based on query parameters
    let results = gradeStore;
    
    if (studentId) {
        results = results.filter(g => g.studentId === studentId);
    }
    
    // Group results by course
    const courseResults = {};
    results.forEach(grade => {
        if (!courseResults[grade.courseCode]) {
            courseResults[grade.courseCode] = {
                courseCode: grade.courseCode,
                courseName: grade.courseCode === 'BIT364' ? 'Business Information Technology' : 
                           grade.courseCode === 'CS101' ? 'Introduction to Computer Science' : 
                           grade.courseCode,
                assessments: [],
                totalScore: 0,
                maxTotalScore: 0,
                overallGrade: '',
                creditHours: 3
            };
        }
        
        courseResults[grade.courseCode].assessments.push({
            type: grade.assessmentType,
            score: grade.score,
            maxScore: grade.maxScore,
            percentage: grade.percentage,
            grade: grade.grade,
            feedback: grade.feedback,
            submissionDate: grade.submissionDate
        });
        
        courseResults[grade.courseCode].totalScore += grade.score || 0;
        courseResults[grade.courseCode].maxTotalScore += grade.maxScore || 0;
    });
    
    // Calculate overall grades
    Object.values(courseResults).forEach(course => {
        const overallPercentage = course.maxTotalScore > 0 ? 
            (course.totalScore / course.maxTotalScore) * 100 : 0;
        
        if (overallPercentage >= 90) course.overallGrade = 'A';
        else if (overallPercentage >= 80) course.overallGrade = 'B+';
        else if (overallPercentage >= 70) course.overallGrade = 'B';
        else if (overallPercentage >= 60) course.overallGrade = 'C+';
        else if (overallPercentage >= 50) course.overallGrade = 'C';
        else course.overallGrade = 'F';
        
        course.overallPercentage = Math.round(overallPercentage);
    });
    
    res.json({
        success: true,
        academicYear: academicYear || '2024-2025',
        semester: semester || 'semester-3',
        studentId: studentId || '1234567',
        results: Object.values(courseResults),
        summary: {
            totalCourses: Object.keys(courseResults).length,
            totalCreditHours: Object.keys(courseResults).length * 3,
            gpa: calculateGPA(Object.values(courseResults))
        }
    });
});

// Bulk assign grades to students
router.post('/bulk-assign', auth(['lecturer', 'admin']), async (req, res) => {
    try {
        const { 
            courseCode, 
            assessmentType, 
            score, 
            maxScore, 
            grade, 
            feedback, 
            studentFilter = 'all' // 'all', 'attendees', 'quiz_submitters'
        } = req.body;

        // Validate required fields
        if (!courseCode || !assessmentType || score === undefined) {
            return res.status(400).json({
                ok: false,
                message: 'Course code, assessment type, and score are required'
            });
        }

        // Get students based on filter
        let targetStudents = [];
        
        if (studentFilter === 'all') {
            // Get all students enrolled in the course
            // For demo purposes, using mock data - in real app, query User model
            targetStudents = [
                { studentId: '1234567', studentName: 'Ransford Student' },
                { studentId: 'S1001', studentName: 'Alice Johnson' },
                { studentId: 'S1002', studentName: 'Bob Smith' },
                { studentId: 'S1003', studentName: 'Carol Davis' }
            ];
        } else if (studentFilter === 'attendees') {
            // Get students who attended classes (would query attendance records)
            targetStudents = [
                { studentId: '1234567', studentName: 'Ransford Student' },
                { studentId: 'S1001', studentName: 'Alice Johnson' },
                { studentId: 'S1002', studentName: 'Bob Smith' }
            ];
        } else if (studentFilter === 'quiz_submitters') {
            // Get students who submitted the quiz (would query quiz submissions)
            targetStudents = [
                { studentId: '1234567', studentName: 'Ransford Student' },
                { studentId: 'S1001', studentName: 'Alice Johnson' }
            ];
        }

        // Calculate percentage if maxScore provided
        const percentage = maxScore ? Math.round((score / maxScore) * 100) : null;
        
        // Create grade entries for each student
        const newGrades = [];
        const timestamp = new Date().toISOString();
        
        targetStudents.forEach(student => {
            // Remove existing grade for same assessment if exists
            const existingIndex = gradeStore.findIndex(g => 
                g.courseCode === courseCode && 
                g.studentId === student.studentId && 
                g.assessmentType === assessmentType
            );
            
            if (existingIndex >= 0) {
                gradeStore.splice(existingIndex, 1);
            }
            
            // Add new grade
            const gradeEntry = {
                courseCode,
                studentId: student.studentId,
                studentName: student.studentName,
                assessmentType,
                score: Number(score),
                maxScore: maxScore ? Number(maxScore) : null,
                percentage,
                grade: grade || calculateLetterGrade(percentage || (score * 5)), // Simple grade calculation
                submissionDate: timestamp,
                feedback: feedback || '',
                lecturer: req.user.name || 'Unknown Lecturer'
            };
            
            gradeStore.push(gradeEntry);
            newGrades.push(gradeEntry);
        });

        res.json({
            ok: true,
            message: `Successfully assigned grades to ${targetStudents.length} students`,
            assignedGrades: newGrades.length,
            studentFilter,
            courseCode,
            assessmentType,
            grades: newGrades
        });

    } catch (error) {
        console.error('bulk grade assignment error:', error);
        res.status(500).json({
            ok: false,
            message: 'Failed to assign bulk grades',
            error: error.message
        });
    }
});

// @route   PUT /api/grades/update-student
// @desc    Update individual student grades from assessment interface
// @access  Private (Lecturer, Admin)
router.put('/update-student', auth(['lecturer', 'admin']), async (req, res) => {
    try {
        const { studentId, courseCode, classAssessment, midSemester, endOfSemester } = req.body;
        
        if (!studentId || !courseCode) {
            return res.status(400).json({
                success: false,
                message: 'studentId and courseCode are required'
            });
        }

        console.log(`📝 [GRADES] Updating grades for student ${studentId} in course ${courseCode}`);
        console.log(`📊 [GRADES] New grades - Class: ${classAssessment}, Mid: ${midSemester}, End: ${endOfSemester}`);

        const Grade = require('../models/Grade');
        let result = null;

        try {
            // Try to update existing record or create new one
            const updateData = {
                ...(classAssessment !== null && classAssessment !== undefined && { classAssessment: Number(classAssessment) }),
                ...(midSemester !== null && midSemester !== undefined && { midSemester: Number(midSemester) }),
                ...(endOfSemester !== null && endOfSemester !== undefined && { endOfSemester: Number(endOfSemester) }),
                dateEntered: new Date(),
                lecturer: req.user?.name || 'Unknown Lecturer',
                lecturerId: req.user?.id
            };

            result = await Grade.findOneAndUpdate(
                { studentId: studentId, courseCode: courseCode },
                updateData,
                { 
                    new: true, 
                    upsert: true,
                    setDefaultsOnInsert: true
                }
            );

            console.log(`✅ [GRADES] Successfully updated database record for student ${studentId}`);

        } catch (dbError) {
            console.error('❌ [GRADES] Database update failed:', dbError.message);
            
            // Fallback to in-memory store update
            console.log('⚠️ [GRADES] Falling back to in-memory update');
            
            // Update or add to gradeStore for immediate response
            const existingGradeIndex = gradeStore.findIndex(g => 
                g.studentId === studentId && g.courseCode === courseCode
            );

            const gradeData = {
                courseCode,
                studentId,
                studentName: 'Student', // You might want to fetch this
                assessmentType: 'Mixed',
                score: classAssessment || midSemester || endOfSemester || 0,
                classAssessment,
                midSemester,
                endOfSemester,
                submissionDate: new Date().toISOString(),
                lecturer: req.user?.name || 'Unknown Lecturer'
            };

            if (existingGradeIndex >= 0) {
                gradeStore[existingGradeIndex] = { ...gradeStore[existingGradeIndex], ...gradeData };
            } else {
                gradeStore.push(gradeData);
            }
        }

        res.json({
            success: true,
            message: `Successfully updated grades for student ${studentId}`,
            studentId,
            courseCode,
            updatedGrades: {
                classAssessment: classAssessment !== null && classAssessment !== undefined ? Number(classAssessment) : null,
                midSemester: midSemester !== null && midSemester !== undefined ? Number(midSemester) : null,
                endOfSemester: endOfSemester !== null && endOfSemester !== undefined ? Number(endOfSemester) : null
            },
            databaseUpdated: !!result,
            updatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ [GRADES] Error updating student grades:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update student grades',
            error: error.message
        });
    }
});

// @route   POST /api/grades/bulk-update
// @desc    Update multiple student grades at once from assessment interface
// @access  Private (Lecturer, Admin)
router.post('/bulk-update', auth(['lecturer', 'admin']), async (req, res) => {
    try {
        const { courseCode, updates } = req.body;
        
        if (!courseCode || !updates || !Array.isArray(updates)) {
            return res.status(400).json({
                success: false,
                message: 'courseCode and updates array are required'
            });
        }

        console.log(`📝 [GRADES] Bulk updating ${updates.length} student grades for course ${courseCode}`);

        const Grade = require('../models/Grade');
        const results = [];
        let dbUpdated = 0;
        let memoryUpdated = 0;

        for (const update of updates) {
            const { studentId, classAssessment, midSemester, endOfSemester } = update;
            
            if (!studentId) {
                console.warn(`⚠️ [GRADES] Skipping update - missing studentId`);
                continue;
            }

            try {
                const updateData = {
                    ...(classAssessment !== null && classAssessment !== undefined && { classAssessment: Number(classAssessment) }),
                    ...(midSemester !== null && midSemester !== undefined && { midSemester: Number(midSemester) }),
                    ...(endOfSemester !== null && endOfSemester !== undefined && { endOfSemester: Number(endOfSemester) }),
                    dateEntered: new Date(),
                    lecturer: req.user?.name || 'Unknown Lecturer',
                    lecturerId: req.user?.id
                };

                const result = await Grade.findOneAndUpdate(
                    { studentId: studentId, courseCode: courseCode },
                    updateData,
                    { 
                        new: true, 
                        upsert: true,
                        setDefaultsOnInsert: true
                    }
                );

                results.push({
                    studentId,
                    success: true,
                    updated: updateData
                });
                dbUpdated++;

            } catch (dbError) {
                console.error(`❌ [GRADES] Failed to update student ${studentId}:`, dbError.message);
                
                // Add to results as failed
                results.push({
                    studentId,
                    success: false,
                    error: dbError.message
                });
            }
        }

        console.log(`✅ [GRADES] Bulk update complete - DB: ${dbUpdated}, Memory: ${memoryUpdated}, Total: ${results.length}`);

        res.json({
            success: true,
            message: `Successfully processed ${results.length} grade updates`,
            courseCode,
            totalUpdates: results.length,
            databaseUpdates: dbUpdated,
            memoryUpdates: memoryUpdated,
            results: results,
            updatedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ [GRADES] Error in bulk update:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process bulk grade updates',
            error: error.message
        });
    }
});

// @route   GET /api/grades/student-performance
// @desc    Get student performance data formatted for assessment page
// @access  Private (Lecturer, Admin)
router.get('/student-performance', auth(['lecturer', 'admin']), async (req, res) => {
    try {
        const { courseCode, academicYear = '2024/2025' } = req.query;
        
        if (!courseCode) {
            return res.status(400).json({
                success: false,
                message: 'courseCode is required'
            });
        }

        console.log(`📊 [STUDENT-PERFORMANCE] Fetching performance data for course: ${courseCode}`);

        const Grade = require('../models/Grade');
        let performanceData = [];

        try {
            // Fetch from database
            const dbGrades = await Grade.find({ 
                courseCode: courseCode,
                academicYear: academicYear 
            }).lean();

            console.log(`📈 [STUDENT-PERFORMANCE] Found ${dbGrades.length} records in database`);

            if (dbGrades.length > 0) {
                performanceData = dbGrades.map(grade => ({
                    id: grade._id,
                    studentId: grade.studentId,
                    studentName: grade.studentName,
                    academicYear: grade.academicYear,
                    semester: grade.semester,
                    block: grade.block,
                    classAssessment: grade.classAssessment,
                    midSemester: grade.midSemester,
                    endOfSemester: grade.endOfSemester,
                    dateEntered: grade.dateEntered,
                    lecturer: grade.lecturer,
                    // Calculate additional metrics
                    totalScore: [grade.classAssessment, grade.midSemester, grade.endOfSemester]
                        .filter(score => score !== null && score !== undefined)
                        .reduce((sum, score) => sum + score, 0),
                    completedAssessments: [grade.classAssessment, grade.midSemester, grade.endOfSemester]
                        .filter(score => score !== null && score !== undefined).length,
                    averageScore: (() => {
                        const scores = [grade.classAssessment, grade.midSemester, grade.endOfSemester]
                            .filter(score => score !== null && score !== undefined);
                        return scores.length > 0 ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1) : null;
                    })(),
                    status: (() => {
                        const hasAll = grade.classAssessment !== null && grade.midSemester !== null && grade.endOfSemester !== null;
                        const hasPartial = grade.classAssessment !== null || grade.midSemester !== null || grade.endOfSemester !== null;
                        return hasAll ? 'Complete' : hasPartial ? 'Partial' : 'Empty';
                    })()
                }));
            } else {
                // Provide empty template data
                console.log(`📝 [STUDENT-PERFORMANCE] No database records, providing empty template`);
                const sampleStudents = [
                    { studentId: '1234568', studentName: 'John Kwaku Doe' },
                    { studentId: '1234456', studentName: 'Saaed Hawa' },
                    { studentId: '1233456', studentName: 'Kwarteng Samuel' },
                    { studentId: '1234557', studentName: 'Nashiru Alhassan' },
                    { studentId: '5', studentName: 'Alice Johnson' },
                    { studentId: '2', studentName: 'Mercy Johnson' }
                ];

                performanceData = sampleStudents.map(student => ({
                    id: null,
                    studentId: student.studentId,
                    studentName: student.studentName,
                    academicYear: academicYear,
                    semester: 'Semester 1',
                    block: 'Block A',
                    classAssessment: null,
                    midSemester: null,
                    endOfSemester: null,
                    dateEntered: null,
                    lecturer: null,
                    totalScore: 0,
                    completedAssessments: 0,
                    averageScore: null,
                    status: 'Empty'
                }));
            }

        } catch (dbError) {
            console.error('❌ [STUDENT-PERFORMANCE] Database error:', dbError.message);
            return res.status(500).json({
                success: false,
                message: 'Database error occurred',
                error: dbError.message
            });
        }

        // Get course details
        let courseDetails;
        try {
            const mapCoursesToFullDetails = require('../config/courseMapping').mapCoursesToFullDetails;
            courseDetails = mapCoursesToFullDetails([courseCode])[0] || {
                code: courseCode,
                fullName: courseCode
            };
        } catch (error) {
            courseDetails = { code: courseCode, fullName: courseCode };
        }

        console.log(`✅ [STUDENT-PERFORMANCE] Returning ${performanceData.length} student performance records`);

        res.json({
            success: true,
            courseCode: courseCode,
            courseName: courseDetails.fullName,
            academicYear: academicYear,
            totalStudents: performanceData.length,
            studentsWithGrades: performanceData.filter(s => s.status !== 'Empty').length,
            students: performanceData,
            summary: {
                totalAssessments: 3, // Class, Mid, End
                completionRate: performanceData.length > 0 ? 
                    ((performanceData.filter(s => s.status === 'Complete').length / performanceData.length) * 100).toFixed(1) : 0,
                averageClassScore: (() => {
                    const scores = performanceData.map(s => s.classAssessment).filter(s => s !== null);
                    return scores.length > 0 ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1) : null;
                })(),
                averageMidScore: (() => {
                    const scores = performanceData.map(s => s.midSemester).filter(s => s !== null);
                    return scores.length > 0 ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1) : null;
                })(),
                averageEndScore: (() => {
                    const scores = performanceData.map(s => s.endOfSemester).filter(s => s !== null);
                    return scores.length > 0 ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1) : null;
                })()
            },
            dataSource: performanceData.length > 0 && performanceData[0].dateEntered ? 'database' : 'template',
            lastUpdated: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ [STUDENT-PERFORMANCE] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch student performance data',
            error: error.message
        });
    }
});

// Helper function to calculate letter grade from percentage
function calculateLetterGrade(percentage) {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C+';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
}

// Helper function to calculate GPA
function calculateGPA(courses) {
    if (courses.length === 0) return 0;
    
    const gradePoints = {
        'A': 4.0, 'B+': 3.5, 'B': 3.0, 'C+': 2.5, 'C': 2.0, 'D': 1.0, 'F': 0.0
    };
    
    let totalPoints = 0;
    let totalCredits = 0;
    
    courses.forEach(course => {
        const points = gradePoints[course.overallGrade] || 0;
        totalPoints += points * course.creditHours;
        totalCredits += course.creditHours;
    });
    
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
}

// @route   DELETE /api/grades/clear
// @desc    Clear all grades for a specific course (reset to empty state)
// @access  Private (Lecturer, Admin)
router.delete('/clear', auth(['lecturer', 'admin']), async (req, res) => {
    try {
        const { courseCode } = req.query;
        
        if (!courseCode) {
            return res.status(400).json({
                success: false,
                message: 'courseCode is required'
            });
        }

        console.log(`🧹 [GRADES] Clearing all grades for course: ${courseCode}`);

        // Remove grades from in-memory store
        const beforeCount = gradeStore.length;
        const filteredGrades = gradeStore.filter(grade => grade.courseCode !== courseCode);
        gradeStore.length = 0;
        gradeStore.push(...filteredGrades);
        const removedCount = beforeCount - filteredGrades.length;

        // Try to remove from database as well
        let dbRemovedCount = 0;
        try {
            const Grade = require('../models/Grade');
            const deleteResult = await Grade.deleteMany({ courseCode: courseCode });
            dbRemovedCount = deleteResult.deletedCount;
        } catch (dbError) {
            console.warn('❌ [GRADES] Could not clear grades from database:', dbError.message);
        }

        console.log(`✅ [GRADES] Cleared ${removedCount} grades from memory, ${dbRemovedCount} from database for course ${courseCode}`);

        res.json({
            success: true,
            message: `Successfully cleared all grades for course ${courseCode}`,
            courseCode: courseCode,
            clearedFromMemory: removedCount,
            clearedFromDatabase: dbRemovedCount,
            clearedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ [GRADES] Error clearing grades:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear grades',
            error: error.message
        });
    }
});

// @route   GET /api/grades/sample-empty
// @desc    Get sample students with empty grades for testing UI
// @access  Private (Lecturer, Admin)
router.get('/sample-empty', auth(['lecturer', 'admin']), async (req, res) => {
    try {
        const { courseCode = 'BIT301' } = req.query;
        
        console.log(`📋 [GRADES] Providing sample empty grades for course: ${courseCode}`);

        // Get course mapping for full course name
        let mapCoursesToFullDetails;
        try {
            mapCoursesToFullDetails = require('../config/courseMapping').mapCoursesToFullDetails;
        } catch (error) {
            mapCoursesToFullDetails = (courses) => courses.map(c => ({ code: c, fullName: c }));
        }

        const courseDetails = mapCoursesToFullDetails([courseCode])[0] || {
            code: courseCode,
            fullName: courseCode
        };

        // Sample students with completely empty grades
        const sampleStudents = [
            { 
                studentId: '1234568', 
                fullName: 'John Kwaku Doe', 
                assessment: null, 
                midsem: null, 
                endOfSemester: null,
                totalGrades: 0,
                academicYear: '2024/2025',
                semester: 'Semester 1',
                status: 'enrolled'
            },
            { 
                studentId: '1234456', 
                fullName: 'Saaed Hawa', 
                assessment: null, 
                midsem: null, 
                endOfSemester: null,
                totalGrades: 0,
                academicYear: '2024/2025',
                semester: 'Semester 1',
                status: 'enrolled'
            },
            { 
                studentId: '1233456', 
                fullName: 'Kwarteng Samuel', 
                assessment: null, 
                midsem: null, 
                endOfSemester: null,
                totalGrades: 0,
                academicYear: '2024/2025',
                semester: 'Semester 1',
                status: 'enrolled'
            },
            { 
                studentId: '1234557', 
                fullName: 'Nashiru Alhassan', 
                assessment: null, 
                midsem: null, 
                endOfSemester: null,
                totalGrades: 0,
                academicYear: '2024/2025',
                semester: 'Semester 1',
                status: 'enrolled'
            }
        ];

        res.json({
            success: true,
            courseCode: courseCode,
            courseName: courseDetails.fullName,
            students: sampleStudents,
            totalStudents: sampleStudents.length,
            note: 'All grades are empty - ready for new grading',
            metadata: {
                assessmentTypes: ['Assessment', 'Midsem', 'End of Semester'],
                maxScores: { assessment: 100, midsem: 100, endOfSemester: 100 }
            }
        });

    } catch (error) {
        console.error('❌ [GRADES] Error providing sample empty grades:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to provide sample empty grades',
            error: error.message
        });
    }
});

module.exports = router;