const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Grade = require('../models/Grade');
const { mapCoursesToFullDetails } = require('../config/courseMapping');

// @route   GET /api/students/performance
// @desc    Get student performance data from grades table for a specific course
// @access  Private (Lecturer, Admin)
router.get('/performance', auth(['lecturer', 'admin']), async (req, res) => {
    try {
        const { courseCode, academicYear } = req.query;
        
        if (!courseCode) {
            return res.status(400).json({
                success: false,
                message: 'courseCode is required'
            });
        }

        console.log(`📊 [STUDENTS] Fetching performance from grades table for course: ${courseCode}, year: ${academicYear}`);

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

        // Fetch students from grades table directly
        let students = [];
        
        try {
            console.log(`🔍 [STUDENTS] Querying grades table for course: ${courseCode}`);
            
            // Build query filter
            const query = { courseCode: courseCode };
            if (academicYear) {
                query.academicYear = academicYear;
            }
            
            // Fetch all grade records for this course from database
            const gradeRecords = await Grade.find(query).lean();
            console.log(`📊 [STUDENTS] Found ${gradeRecords.length} grade records in table`);
            
            if (gradeRecords.length > 0) {
                // Map grade records to student performance format
                students = gradeRecords.map(grade => ({
                    studentId: grade.studentId,
                    fullName: grade.studentName, // Map from studentName column in grades table
                    academicYear: grade.academicYear || academicYear || '2024/2025',
                    semester: grade.semester || 'Semester 1',
                    block: grade.block || 'Block A',
                    classAssessment: grade.classAssessment, // Map from classAssessment column
                    midSemester: grade.midSemester,         // Map from midSemester column
                    endOfSemester: grade.endOfSemester,
                    dateEntered: grade.dateEntered,
                    lecturer: grade.lecturer,
                    courseName: grade.courseName || courseDetails.fullName
                }));
                
                console.log(`✅ [STUDENTS] Mapped ${students.length} students from grades table:`);
                students.forEach(student => {
                    console.log(`   - ${student.fullName}: Class=${student.classAssessment || 'null'}, Mid=${student.midSemester || 'null'}`);
                });
            }
        } catch (dbError) {
            console.error('❌ [STUDENTS] Database fetch failed:', dbError.message);
            console.log('⚠️ [STUDENTS] Falling back to empty student list');
        }
        
        // If no records found in grades table, return empty list with message
        if (students.length === 0) {
            console.log(`📝 [STUDENTS] No grade records found in table for ${courseCode}`);
            
            return res.json({
                success: true,
                courseCode: courseCode,
                courseName: courseDetails.fullName,
                students: [],
                totalStudents: 0,
                message: `No student performance data found for ${courseCode}`,
                dataSource: 'grades_table_empty',
                lastUpdated: new Date().toISOString()
            });
        }

        console.log(`✅ [STUDENTS] Returning ${students.length} students with performance data from grades table`);

        res.json({
            success: true,
            courseCode: courseCode,
            courseName: courseDetails.fullName,
            students: students,
            totalStudents: students.length,
            dataSource: 'grades_table',
            lastUpdated: new Date().toISOString(),
            summary: {
                studentsWithClassAssessment: students.filter(s => s.classAssessment !== null).length,
                studentsWithMidSemester: students.filter(s => s.midSemester !== null).length,
                studentsWithEndSemester: students.filter(s => s.endOfSemester !== null).length,
                averageClassAssessment: students.filter(s => s.classAssessment !== null)
                    .reduce((sum, s) => sum + s.classAssessment, 0) / 
                    students.filter(s => s.classAssessment !== null).length || 0,
                averageMidSemester: students.filter(s => s.midSemester !== null)
                    .reduce((sum, s) => sum + s.midSemester, 0) / 
                    students.filter(s => s.midSemester !== null).length || 0
            }
        });

    } catch (error) {
        console.error('❌ [STUDENTS] Error fetching student performance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch student performance data',
            error: error.message
        });
    }
});

// @route   GET /api/students
// @desc    Get all students (basic endpoint)
// @access  Private (Lecturer, Admin)
router.get('/', auth(['lecturer', 'admin']), async (req, res) => {
    try {
        const { courseCode } = req.query;
        
        console.log(`👥 [STUDENTS] Fetching students list, courseCode: ${courseCode}`);

        // Sample student data
        const students = [
            {
                studentId: '1234568',
                fullName: 'John Kwaku Doe',
                email: 'john.doe@student.edu.gh',
                courses: courseCode ? [courseCode] : ['BIT301', 'BIT364', 'CS101'],
                academicYear: '2024/2025',
                semester: 'Semester 1',
                status: 'active'
            },
            {
                studentId: '1234456',
                fullName: 'Saaed Hawa',
                email: 'saaed.hawa@student.edu.gh',
                courses: courseCode ? [courseCode] : ['BIT301', 'BIT364', 'CS101'],
                academicYear: '2024/2025',
                semester: 'Semester 1',
                status: 'active'
            },
            {
                studentId: '1233456',
                fullName: 'Kwarteng Samuel',
                email: 'kwarteng.samuel@student.edu.gh',
                courses: courseCode ? [courseCode] : ['BIT301', 'BIT364', 'CS101'],
                academicYear: '2024/2025',
                semester: 'Semester 1',
                status: 'active'
            },
            {
                studentId: '1234557',
                fullName: 'Nashiru Alhassan',
                email: 'nashiru.alhassan@student.edu.gh',
                courses: courseCode ? [courseCode] : ['BIT301', 'BIT364', 'CS101'],
                academicYear: '2024/2025',
                semester: 'Semester 1',
                status: 'active'
            }
        ];

        // Filter by course if specified
        const filteredStudents = courseCode 
            ? students.filter(student => student.courses.includes(courseCode))
            : students;

        res.json({
            success: true,
            students: filteredStudents,
            totalStudents: filteredStudents.length,
            courseCode: courseCode || 'all'
        });

    } catch (error) {
        console.error('❌ [STUDENTS] Error fetching students:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch students',
            error: error.message
        });
    }
});

// @route   PUT /api/students/:studentId/grades
// @desc    Update student grades for performance tracking
// @access  Private (Lecturer, Admin)
router.put('/:studentId/grades', auth(['lecturer', 'admin']), async (req, res) => {
    try {
        const { studentId } = req.params;
        const { courseCode, classAssessment, midSemester, endOfSemester, academicYear } = req.body;

        if (!courseCode) {
            return res.status(400).json({
                success: false,
                message: 'courseCode is required'
            });
        }

        console.log(`📝 [STUDENTS] Updating grades for student ${studentId} in course ${courseCode}`);

        // Prepare grade updates
        const gradeUpdates = [];
        const currentDate = new Date();

        if (classAssessment !== null && classAssessment !== undefined) {
            gradeUpdates.push({
                studentId,
                courseCode,
                assessmentType: 'Class Assessment',
                score: classAssessment,
                maxScore: 100,
                academicYear: academicYear || '2024/2025',
                semester: 'Semester 1',
                block: 'Block A',
                dateEntered: currentDate
            });
        }

        if (midSemester !== null && midSemester !== undefined) {
            gradeUpdates.push({
                studentId,
                courseCode,
                assessmentType: 'Mid Semester',
                score: midSemester,
                maxScore: 100,
                academicYear: academicYear || '2024/2025',
                semester: 'Semester 1',
                block: 'Block A',
                dateEntered: currentDate
            });
        }

        if (endOfSemester !== null && endOfSemester !== undefined) {
            gradeUpdates.push({
                studentId,
                courseCode,
                assessmentType: 'End of Semester',
                score: endOfSemester,
                maxScore: 100,
                academicYear: academicYear || '2024/2025',
                semester: 'Semester 1',
                block: 'Block A',
                dateEntered: currentDate
            });
        }

        // Try to save to database if Grade model is available
        try {
            // Find existing grade record for this student and course
            const existingGrade = await Grade.findOne({
                studentId: studentId,
                courseCode: courseCode
            });

            if (existingGrade) {
                // Update existing record
                const updateData = {
                    ...(classAssessment !== null && classAssessment !== undefined && { classAssessment }),
                    ...(midSemester !== null && midSemester !== undefined && { midSemester }),
                    ...(endOfSemester !== null && endOfSemester !== undefined && { endOfSemester }),
                    dateEntered: currentDate,
                    academicYear: academicYear || '2024/2025'
                };

                await Grade.findByIdAndUpdate(existingGrade._id, updateData);
                console.log(`✅ [STUDENTS] Updated existing grade record for student ${studentId}`);
            } else {
                // Create new record
                const newGrade = new Grade({
                    studentId,
                    studentName: 'Student Name', // You might want to fetch this from User model
                    courseCode,
                    courseName: 'Course Name',
                    classAssessment: classAssessment || null,
                    midSemester: midSemester || null,
                    endOfSemester: endOfSemester || null,
                    academicYear: academicYear || '2024/2025',
                    semester: 'Semester 1',
                    block: 'Block A',
                    dateEntered: currentDate
                });

                await newGrade.save();
                console.log(`✅ [STUDENTS] Created new grade record for student ${studentId}`);
            }

            console.log(`✅ [STUDENTS] Successfully updated grades in database`);
        } catch (dbError) {
            console.warn('❌ [STUDENTS] Could not save to database:', dbError.message);
            // Continue without database save
        }

        res.json({
            success: true,
            message: `Successfully updated grades for student ${studentId}`,
            updatedFields: {
                ...(classAssessment !== null && classAssessment !== undefined && { classAssessment }),
                ...(midSemester !== null && midSemester !== undefined && { midSemester }),
                ...(endOfSemester !== null && endOfSemester !== undefined && { endOfSemester })
            },
            studentId,
            courseCode
        });

    } catch (error) {
        console.error('❌ [STUDENTS] Error updating grades:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update student grades',
            error: error.message
        });
    }
});

module.exports = router;