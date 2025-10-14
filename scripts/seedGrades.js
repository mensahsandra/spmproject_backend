const mongoose = require('mongoose');
const Grade = require('../models/Grade');
const connectDB = require('../config/db');

// Sample grades data as requested
const sampleGrades = [
  {
    studentId: '5',
    studentName: "Alice Johnson",
    classAssessment: 85,
    midSemester: 92,
    endOfSemester: null,
    courseCode: 'BIT301',
    courseName: 'Database Systems',
    academicYear: '2024/2025',
    semester: 'Semester 1',
    block: 'Block A',
    dateEntered: new Date(),
    lecturerId: null,
    lecturer: 'Dr. Ansah'
  },
  {
    studentId: '2',
    studentName: "Mercy Johnson",
    classAssessment: 86,
    midSemester: 62,
    endOfSemester: null,
    courseCode: 'BIT301',
    courseName: 'Database Systems',
    academicYear: '2024/2025',
    semester: 'Semester 1',
    block: 'Block A',
    dateEntered: new Date(),
    lecturerId: null,
    lecturer: 'Dr. Ansah'
  },
  // Additional sample data for testing
  {
    studentId: '1234568',
    studentName: "John Kwaku Doe",
    classAssessment: null,
    midSemester: null,
    endOfSemester: null,
    courseCode: 'BIT301',
    courseName: 'Database Systems',
    academicYear: '2024/2025',
    semester: 'Semester 1',
    block: 'Block A',
    dateEntered: new Date(),
    lecturerId: null,
    lecturer: 'Dr. Ansah'
  },
  {
    studentId: '1234456',
    studentName: "Saaed Hawa",
    classAssessment: null,
    midSemester: null,
    endOfSemester: null,
    courseCode: 'BIT301',
    courseName: 'Database Systems',
    academicYear: '2024/2025',
    semester: 'Semester 1',
    block: 'Block A',
    dateEntered: new Date(),
    lecturerId: null,
    lecturer: 'Dr. Ansah'
  },
  {
    studentId: '1233456',
    studentName: "Kwarteng Samuel",
    classAssessment: null,
    midSemester: null,
    endOfSemester: null,
    courseCode: 'BIT301',
    courseName: 'Database Systems',
    academicYear: '2024/2025',
    semester: 'Semester 1',
    block: 'Block A',
    dateEntered: new Date(),
    lecturerId: null,
    lecturer: 'Dr. Ansah'
  },
  {
    studentId: '1234557',
    studentName: "Nashiru Alhassan",
    classAssessment: null,
    midSemester: null,
    endOfSemester: null,
    courseCode: 'BIT301',
    courseName: 'Database Systems',
    academicYear: '2024/2025',
    semester: 'Semester 1',
    block: 'Block A',
    dateEntered: new Date(),
    lecturerId: null,
    lecturer: 'Dr. Ansah'
  }
];

async function seedGrades() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectDB();
    
    console.log('🗑️ Clearing existing grades collection...');
    await Grade.deleteMany({});
    
    console.log('📝 Inserting sample grades data...');
    const insertedGrades = await Grade.insertMany(sampleGrades);
    
    console.log(`✅ Successfully inserted ${insertedGrades.length} grade records:`);
    insertedGrades.forEach(grade => {
      console.log(`   - ${grade.studentName} (${grade.studentId}): Class=${grade.classAssessment || 'null'}, Mid=${grade.midSemester || 'null'}`);
    });
    
    // Verify the data
    console.log('\n📊 Verifying inserted data...');
    const totalGrades = await Grade.countDocuments();
    console.log(`📈 Total grades in collection: ${totalGrades}`);
    
    // Show sample data by course
    const gradesByCourse = await Grade.aggregate([
      {
        $group: {
          _id: '$courseCode',
          count: { $sum: 1 },
          students: { $push: '$studentName' }
        }
      }
    ]);
    
    console.log('\n📚 Grades by course:');
    gradesByCourse.forEach(course => {
      console.log(`   ${course._id}: ${course.count} students - ${course.students.join(', ')}`);
    });
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('📡 You can now use the following endpoints:');
    console.log('   - GET /api/students/performance?courseCode=BIT301');
    console.log('   - GET /api/grades/enrolled?courseCode=BIT301');
    console.log('   - PUT /api/students/:studentId/grades');
    
  } catch (error) {
    console.error('❌ Error seeding grades database:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    console.log('🔌 Closing database connection...');
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the seeding function
if (require.main === module) {
  console.log('🌱 Starting grades database seeding...');
  seedGrades();
}

module.exports = seedGrades;