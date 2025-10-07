const express = require('express');
const { Parser } = require('json2csv');
const router = express.Router();
const auth = require('../middleware/auth');

// In-memory grades store for demo with enhanced assessment data
const gradeStore = [
    { courseCode: 'BIT364', studentId: '1234567', studentName: 'Ransford Student', assessmentType: 'Quiz 1', score: 18, maxScore: 20, percentage: 90, grade: 'A', submissionDate: '2025-01-20T10:30:00Z', feedback: 'Excellent work!', lecturer: 'Kwabena Lecturer' },
    { courseCode: 'BIT364', studentId: '1234567', studentName: 'Ransford Student', assessmentType: 'Assignment 1', score: 42, maxScore: 50, percentage: 84, grade: 'B+', submissionDate: '2025-01-18T14:15:00Z', feedback: 'Good analysis', lecturer: 'Kwabena Lecturer' },
    { courseCode: 'BIT364', studentId: 'S1001', studentName: 'Alice Johnson', assessmentType: 'Quiz 1', score: 16, maxScore: 20, percentage: 80, grade: 'B', submissionDate: '2025-01-20T10:32:00Z', feedback: 'Well done', lecturer: 'Kwabena Lecturer' },
    { courseCode: 'BIT364', studentId: 'S1002', studentName: 'Bob Smith', assessmentType: 'Quiz 1', score: 19, maxScore: 20, percentage: 95, grade: 'A', submissionDate: '2025-01-20T10:28:00Z', feedback: 'Outstanding!', lecturer: 'Kwabena Lecturer' },
    { courseCode: 'BIT364', studentId: 'S1003', studentName: 'Carol Davis', assessmentType: 'Assignment 1', score: 38, maxScore: 50, percentage: 76, grade: 'B', submissionDate: '2025-01-18T16:20:00Z', feedback: 'Good effort', lecturer: 'Kwabena Lecturer' },
    { courseCode: 'CS101', studentId: '1234567', studentName: 'Ransford Student', assessmentType: 'Midterm Exam', score: 78, maxScore: 100, percentage: 78, grade: 'B+', submissionDate: '2025-01-15T09:00:00Z', feedback: 'Solid understanding', lecturer: 'Prof. Anyimadu' },
    { courseCode: 'CS101', studentId: 'S1001', studentName: 'Alice Johnson', assessmentType: 'Project 1', score: 88, maxScore: 100, percentage: 88, grade: 'A-', submissionDate: '2025-01-22T23:59:00Z', feedback: 'Creative solution', lecturer: 'Prof. Anyimadu' },
    { courseCode: 'CS101', studentId: 'S1002', studentName: 'Bob Smith', assessmentType: 'Midterm Exam', score: 65, maxScore: 100, percentage: 65, grade: 'C+', submissionDate: '2025-01-15T09:00:00Z', feedback: 'Needs improvement', lecturer: 'Prof. Anyimadu' }
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
            '/api/grades/student-results'
        ]
    });
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
router.get('/academic-years', auth(['student', 'lecturer', 'admin']), (req, res) => {
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
router.get('/semesters', auth(['student', 'lecturer', 'admin']), (req, res) => {
    const semesters = [
        { value: 'semester-1', label: 'Semester 1' },
        { value: 'semester-2', label: 'Semester 2' },
        { value: 'semester-3', label: 'Semester 3' }
    ];
    res.json({
        success: true,
        semesters
    });
});

// Student: Get initial data for select-result page
router.get('/select-result-data', auth(['student', 'lecturer', 'admin']), (req, res) => {
    const academicYears = [
        { value: '2024-2025', label: '2024/2025' },
        { value: '2023-2024', label: '2023/2024' },
        { value: '2022-2023', label: '2022/2023' }
    ];
    
    const semesters = [
        { value: 'semester-1', label: 'Semester 1' },
        { value: 'semester-2', label: 'Semester 2' },
        { value: 'semester-3', label: 'Semester 3' }
    ];
    
    res.json({
        success: true,
        data: {
            academicYears,
            semesters,
            defaultAcademicYear: '2024-2025',
            defaultSemester: 'semester-3'
        }
    });
});

// Student: Get results for select-result page
router.get('/student-results', auth(['student', 'admin']), (req, res) => {
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

module.exports = router;