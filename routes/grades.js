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

module.exports = router;