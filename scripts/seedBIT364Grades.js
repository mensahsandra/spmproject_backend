const mongoose = require('mongoose');
const Grade = require('../models/Grade');
const connectDB = require('../config/db');

// Add grades for BIT364 - the course the frontend is likely requesting
const bit364Grades = [
  {
    studentId: '5',
    studentName: "Alice Johnson",
    classAssessment: 85,
    midSemester: 92,
    endOfSemester: null,
    courseCode: 'BIT364',  // Changed to BIT364
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
    courseCode: 'BIT364',  // Changed to BIT364
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
    courseCode: 'BIT364',  // Changed to BIT364
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
    courseCode: 'BIT364',  // Changed to BIT364
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
    courseCode: 'BIT364',  // Changed to BIT364
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
    courseCode: 'BIT364',  // Changed to BIT364
    courseName: 'Business Information Technology',
    academicYear: '2024/2025',
    semester: 'Semester 1',
    block: 'Block A',
    dateEntered: new Date(),
    lecturerId: null,
    lecturer: 'Kwabena Lecturer'
  }
];

async function seedBIT364Grades() {
    try {
        console.log('🌱 Connecting to database...');
        await connectDB();
        
        console.log('🗑️ Cleaning existing BIT364 grades...');
        await Grade.deleteMany({ courseCode: 'BIT364' });
        
        console.log('📚 Seeding BIT364 grades...');
        const result = await Grade.insertMany(bit364Grades);
        
        console.log(`✅ Successfully seeded ${result.length} grade records for BIT364`);
        console.log('\n📊 Seeded students:');
        result.forEach(grade => {
            console.log(`   - ${grade.studentName}: Class=${grade.classAssessment || 'null'}, Mid=${grade.midSemester || 'null'}`);
        });
        
        console.log('\n🎯 Frontend should now show real database data for BIT364');
        
    } catch (error) {
        console.error('❌ Error seeding BIT364 grades:', error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

if (require.main === module) {
    seedBIT364Grades();
}

module.exports = { seedBIT364Grades };