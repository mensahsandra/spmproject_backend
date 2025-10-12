// services/gradeService.js
// Centralized grade management service

const User = require('../models/User');
const { courseMapping } = require('../utils/courseMapping');

/**
 * Calculate letter grade based on percentage
 * @param {number} percentage - The percentage score (0-100)
 * @returns {string} Letter grade (A, A-, B+, etc.)
 */
function calculateLetterGrade(percentage) {
    if (percentage >= 90) return 'A';
    if (percentage >= 85) return 'A-';
    if (percentage >= 80) return 'B+';
    if (percentage >= 75) return 'B';
    if (percentage >= 70) return 'B-';
    if (percentage >= 65) return 'C+';
    if (percentage >= 60) return 'C';
    if (percentage >= 55) return 'C-';
    if (percentage >= 50) return 'D';
    return 'F';
}

/**
 * Add or update a grade in the gradeStore
 * @param {Array} gradeStore - The in-memory grade store
 * @param {Object} gradeData - Grade data to add/update
 * @returns {Object} The created or updated grade entry
 */
function addOrUpdateGrade(gradeStore, gradeData) {
    const {
        courseCode,
        studentId,
        studentName,
        assessmentType,
        score,
        maxScore,
        feedback = '',
        lecturerName = 'System'
    } = gradeData;

    // Calculate percentage and letter grade
    const percentage = (score / maxScore) * 100;
    const grade = calculateLetterGrade(percentage);

    // Check if grade already exists
    const existingGradeIndex = gradeStore.findIndex(
        g => g.courseCode === courseCode && 
             g.studentId === studentId && 
             g.assessmentType === assessmentType
    );

    const gradeEntry = {
        courseCode,
        studentId,
        studentName,
        assessmentType,
        score,
        maxScore,
        percentage: parseFloat(percentage.toFixed(2)),
        grade,
        submissionDate: new Date().toISOString(),
        feedback,
        lecturerName
    };

    if (existingGradeIndex !== -1) {
        // Update existing grade
        gradeStore[existingGradeIndex] = gradeEntry;
        console.log(`✏️  Updated grade: ${studentName} - ${courseCode} - ${assessmentType}`);
    } else {
        // Add new grade
        gradeStore.push(gradeEntry);
        console.log(`✅ Added grade: ${studentName} - ${courseCode} - ${assessmentType}`);
    }

    return gradeEntry;
}

/**
 * Sync quiz submission grade to gradeStore
 * @param {Array} gradeStore - The in-memory grade store
 * @param {Object} submission - Quiz submission object
 * @param {Object} quiz - Quiz object
 * @param {string} lecturerName - Name of the lecturer grading
 * @returns {Object} The created or updated grade entry
 */
async function syncQuizGradeToStore(gradeStore, submission, quiz, lecturerName = 'Lecturer') {
    try {
        // Get student information
        const student = await User.findById(submission.studentId);
        if (!student) {
            console.error(`❌ Student not found: ${submission.studentId}`);
            return null;
        }

        // Determine assessment type based on quiz title
        let assessmentType = 'Assessment';
        const quizTitle = quiz.title.toLowerCase();
        
        if (quizTitle.includes('mid') || quizTitle.includes('midterm')) {
            assessmentType = 'Midsem';
        } else if (quizTitle.includes('final') || quizTitle.includes('end') || quizTitle.includes('exam')) {
            assessmentType = 'End of Semester';
        }

        // Add or update grade in store
        const gradeEntry = addOrUpdateGrade(gradeStore, {
            courseCode: quiz.courseCode,
            studentId: student.studentId,
            studentName: student.name,
            assessmentType,
            score: submission.score,
            maxScore: quiz.totalMarks,
            feedback: submission.feedback || '',
            lecturerName
        });

        return gradeEntry;

    } catch (error) {
        console.error('❌ Error syncing quiz grade to store:', error);
        return null;
    }
}

/**
 * Get enrolled students with their grades for a course
 * @param {Array} gradeStore - The in-memory grade store
 * @param {string} courseCode - Course code to filter by
 * @returns {Array} Array of students with their grades
 */
async function getEnrolledStudentsWithGrades(gradeStore, courseCode) {
    try {
        // Get all students enrolled in the course
        const enrolledStudents = await User.find({
            role: 'student',
            'courseEnrollments.courseCode': courseCode,
            isActive: true
        }).select('studentId name email courseEnrollments');

        // Map students with their grades
        const studentsWithGrades = enrolledStudents.map(student => {
            // Get all grades for this student in this course
            const studentGrades = gradeStore.filter(
                g => g.courseCode === courseCode && g.studentId === student.studentId
            );

            // Categorize grades by assessment type
            const assessment = studentGrades.find(g => 
                g.assessmentType.toLowerCase().includes('assessment') ||
                g.assessmentType.toLowerCase().includes('quiz') ||
                g.assessmentType.toLowerCase().includes('assignment')
            );

            const midsem = studentGrades.find(g => 
                g.assessmentType.toLowerCase().includes('mid') ||
                g.assessmentType.toLowerCase().includes('midterm')
            );

            const endOfSemester = studentGrades.find(g => 
                g.assessmentType.toLowerCase().includes('final') ||
                g.assessmentType.toLowerCase().includes('end') ||
                g.assessmentType.toLowerCase().includes('exam')
            );

            return {
                studentId: student.studentId,
                fullName: student.name,
                email: student.email,
                assessment: assessment ? `${assessment.score}/${assessment.maxScore} (${assessment.grade})` : 'N/A',
                midsem: midsem ? `${midsem.score}/${midsem.maxScore} (${midsem.grade})` : 'N/A',
                endOfSemester: endOfSemester ? `${endOfSemester.score}/${endOfSemester.maxScore} (${endOfSemester.grade})` : 'N/A',
                rawGrades: {
                    assessment: assessment || null,
                    midsem: midsem || null,
                    endOfSemester: endOfSemester || null
                }
            };
        });

        return studentsWithGrades;

    } catch (error) {
        console.error('❌ Error getting enrolled students with grades:', error);
        throw error;
    }
}

/**
 * Get grade history for a course
 * @param {Array} gradeStore - The in-memory grade store
 * @param {string} courseCode - Course code to filter by
 * @returns {Array} Array of grade history entries
 */
function getGradeHistory(gradeStore, courseCode) {
    const courseGrades = gradeStore.filter(g => g.courseCode === courseCode);
    
    // Sort by submission date (most recent first)
    return courseGrades.sort((a, b) => 
        new Date(b.submissionDate) - new Date(a.submissionDate)
    );
}

/**
 * Get student grades for results display
 * @param {Array} gradeStore - The in-memory grade store
 * @param {string} studentId - Student ID
 * @param {string} courseCode - Course code (optional)
 * @param {string} semester - Semester/Block (optional)
 * @returns {Array} Array of student grades
 */
function getStudentGrades(gradeStore, studentId, courseCode = null, semester = null) {
    let grades = gradeStore.filter(g => g.studentId === studentId);
    
    if (courseCode) {
        grades = grades.filter(g => g.courseCode === courseCode);
    }
    
    // Note: semester filtering would require additional data in gradeStore
    // For now, we'll return all grades for the student
    
    return grades;
}

module.exports = {
    calculateLetterGrade,
    addOrUpdateGrade,
    syncQuizGradeToStore,
    getEnrolledStudentsWithGrades,
    getGradeHistory,
    getStudentGrades
};