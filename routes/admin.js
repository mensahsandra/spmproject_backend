const express = require('express');
const router = express.Router();
const Grade = require('../models/Grade');

// @route   POST /api/admin/seed-bit364
// @desc    Seed BIT364 course data (for deployment)
// @access  Public (temporary for seeding)
router.post('/seed-bit364', async (req, res) => {
    try {
        console.log('🌱 [ADMIN] Starting BIT364 seeding...');
        
        // BIT364 grades data
        const bit364Grades = [
            {
                studentId: '5',
                studentName: "Alice Johnson",
                classAssessment: 85,
                midSemester: 92,
                endOfSemester: null,
                courseCode: 'BIT364',
                courseName: 'Business Information Technology',
                academicYear: '2024/2025',
                semester: 'Semester 1',
                block: 'Block A',
                dateEntered: new Date(),
                lecturerId: null,
                lecturer: 'Kwabena Lecturer'
            },
            {
                studentId: '2',
                studentName: "Mercy Johnson",
                classAssessment: 86,
                midSemester: 62,
                endOfSemester: null,
                courseCode: 'BIT364',
                courseName: 'Business Information Technology',
                academicYear: '2024/2025',
                semester: 'Semester 1',
                block: 'Block A',
                dateEntered: new Date(),
                lecturerId: null,
                lecturer: 'Kwabena Lecturer'
            },
            {
                studentId: '1234568',
                studentName: "John Kwaku Doe",
                classAssessment: 78,
                midSemester: 85,
                endOfSemester: null,
                courseCode: 'BIT364',
                courseName: 'Business Information Technology',
                academicYear: '2024/2025',
                semester: 'Semester 1',
                block: 'Block A',
                dateEntered: new Date(),
                lecturerId: null,
                lecturer: 'Kwabena Lecturer'
            },
            {
                studentId: '1234456',
                studentName: "Saaed Hawa",
                classAssessment: 92,
                midSemester: 89,
                endOfSemester: null,
                courseCode: 'BIT364',
                courseName: 'Business Information Technology',
                academicYear: '2024/2025',
                semester: 'Semester 1',
                block: 'Block A',
                dateEntered: new Date(),
                lecturerId: null,
                lecturer: 'Kwabena Lecturer'
            },
            {
                studentId: '1233456',
                studentName: "Kwarteng Samuel",
                classAssessment: 72,
                midSemester: 75,
                endOfSemester: null,
                courseCode: 'BIT364',
                courseName: 'Business Information Technology',
                academicYear: '2024/2025',
                semester: 'Semester 1',
                block: 'Block A',
                dateEntered: new Date(),
                lecturerId: null,
                lecturer: 'Kwabena Lecturer'
            },
            {
                studentId: '1234557',
                studentName: "Nashiru Alhassan",
                classAssessment: 88,
                midSemester: 82,
                endOfSemester: null,
                courseCode: 'BIT364',
                courseName: 'Business Information Technology',
                academicYear: '2024/2025',
                semester: 'Semester 1',
                block: 'Block A',
                dateEntered: new Date(),
                lecturerId: null,
                lecturer: 'Kwabena Lecturer'
            }
        ];
        
        // Clean existing BIT364 grades
        console.log('🗑️ [ADMIN] Cleaning existing BIT364 grades...');
        const deleteResult = await Grade.deleteMany({ courseCode: 'BIT364' });
        console.log(`🗑️ [ADMIN] Deleted ${deleteResult.deletedCount} existing records`);
        
        // Insert new grades
        console.log('📚 [ADMIN] Inserting new BIT364 grades...');
        const result = await Grade.insertMany(bit364Grades);
        console.log(`✅ [ADMIN] Successfully seeded ${result.length} grade records`);
        
        // Verify the data
        const verification = await Grade.find({ courseCode: 'BIT364' }).lean();
        
        res.json({
            success: true,
            message: 'BIT364 grades seeded successfully',
            recordsDeleted: deleteResult.deletedCount,
            recordsInserted: result.length,
            verificationCount: verification.length,
            students: verification.map(v => ({
                studentName: v.studentName,
                classAssessment: v.classAssessment,
                midSemester: v.midSemester
            }))
        });
        
    } catch (error) {
        console.error('❌ [ADMIN] Error seeding BIT364:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to seed BIT364 grades',
            error: error.message
        });
    }
});

// @route   GET /api/admin/verify-data
// @desc    Verify what data exists in database
// @access  Public (temporary)
router.get('/verify-data', async (req, res) => {
    try {
        const { courseCode } = req.query;
        
        const query = courseCode ? { courseCode } : {};
        const grades = await Grade.find(query).lean();
        
        const summary = {};
        grades.forEach(grade => {
            if (!summary[grade.courseCode]) {
                summary[grade.courseCode] = [];
            }
            summary[grade.courseCode].push({
                studentName: grade.studentName,
                classAssessment: grade.classAssessment,
                midSemester: grade.midSemester,
                endOfSemester: grade.endOfSemester
            });
        });
        
        res.json({
            success: true,
            totalRecords: grades.length,
            courseSummary: summary,
            requestedCourse: courseCode || 'all'
        });
        
    } catch (error) {
        console.error('❌ [ADMIN] Error verifying data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify data',
            error: error.message
        });
    }
});

// @route   POST /api/admin/seed-student-users
// @desc    Seed student users for notifications (production)
// @access  Public (temporary)
router.post('/seed-student-users', async (req, res) => {
    try {
        console.log('👥 [ADMIN] Starting student user seeding...');
        
        const User = require('../models/User');
        
        const testStudents = [
            {
                name: 'Alice Johnson',
                email: 'alice.johnson@student.edu.gh',
                studentId: '5',
                role: 'student',
                courses: ['BIT364', 'BIT301'],
                academicYear: '2024/2025',
                semester: 'Semester 1',
                centre: 'Accra Campus',
                password: 'password123'
            },
            {
                name: 'Mercy Johnson',
                email: 'mercy.johnson@student.edu.gh',
                studentId: '2',
                role: 'student',
                courses: ['BIT364', 'BIT301'],
                academicYear: '2024/2025',
                semester: 'Semester 1',
                centre: 'Accra Campus',
                password: 'password123'
            },
            {
                name: 'John Kwaku Doe',
                email: 'john.doe@student.edu.gh',
                studentId: '1234568',
                role: 'student',
                courses: ['BIT364', 'BIT301'],
                academicYear: '2024/2025',
                semester: 'Semester 1',
                centre: 'Accra Campus',
                password: 'password123'
            },
            {
                name: 'Saaed Hawa',
                email: 'saaed.hawa@student.edu.gh',
                studentId: '1234456',
                role: 'student',
                courses: ['BIT364', 'BIT301'],
                academicYear: '2024/2025',
                semester: 'Semester 1',
                centre: 'Kumasi Campus',
                password: 'password123'
            },
            {
                name: 'Kwarteng Samuel',
                email: 'kwarteng.samuel@student.edu.gh',
                studentId: '1233456',
                role: 'student',
                courses: ['BIT364', 'BIT301'],
                academicYear: '2024/2025',
                semester: 'Semester 1',
                centre: 'Tamale Campus',
                password: 'password123'
            },
            {
                name: 'Nashiru Alhassan',
                email: 'nashiru.alhassan@student.edu.gh',
                studentId: '1234557',
                role: 'student',
                courses: ['BIT364', 'BIT301'],
                academicYear: '2024/2025',
                semester: 'Semester 1',
                centre: 'Accra Campus',
                password: 'password123'
            }
        ];
        
        const results = {
            created: [],
            updated: [],
            errors: []
        };
        
        for (const studentData of testStudents) {
            try {
                const existingStudent = await User.findOne({ 
                    $or: [
                        { email: studentData.email },
                        { studentId: studentData.studentId }
                    ]
                });
                
                if (existingStudent) {
                    await User.findByIdAndUpdate(existingStudent._id, {
                        courses: studentData.courses,
                        academicYear: studentData.academicYear,
                        semester: studentData.semester,
                        centre: studentData.centre
                    });
                    results.updated.push(studentData.name);
                } else {
                    await User.create(studentData);
                    results.created.push(studentData.name);
                }
            } catch (error) {
                results.errors.push({ name: studentData.name, error: error.message });
            }
        }
        
        // Verify students enrolled in BIT364
        const bit364Students = await User.find({ 
            role: 'student',
            courses: 'BIT364' 
        }).select('name studentId courses');
        
        res.json({
            success: true,
            message: 'Student users seeded successfully',
            results: {
                studentsCreated: results.created.length,
                studentsUpdated: results.updated.length,
                errors: results.errors.length,
                totalBIT364Enrolled: bit364Students.length
            },
            created: results.created,
            updated: results.updated,
            errors: results.errors,
            bit364Students: bit364Students.map(s => ({
                name: s.name,
                studentId: s.studentId,
                courses: s.courses
            }))
        });
        
    } catch (error) {
        console.error('❌ [ADMIN] Error seeding student users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to seed student users',
            error: error.message
        });
    }
});

module.exports = router;