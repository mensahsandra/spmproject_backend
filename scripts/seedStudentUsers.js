const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

// Create test student users enrolled in BIT364
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
        password: 'password123' // This will be hashed
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

async function seedStudentUsers() {
    try {
        console.log('🌱 Connecting to database...');
        await connectDB();
        
        console.log('👥 Seeding student users for notifications...');
        
        for (const studentData of testStudents) {
            // Check if student already exists
            const existingStudent = await User.findOne({ 
                $or: [
                    { email: studentData.email },
                    { studentId: studentData.studentId }
                ]
            });
            
            if (existingStudent) {
                console.log(`📝 Updating existing student: ${studentData.name}`);
                // Update courses to ensure they include BIT364
                await User.findByIdAndUpdate(existingStudent._id, {
                    courses: studentData.courses,
                    academicYear: studentData.academicYear,
                    semester: studentData.semester,
                    centre: studentData.centre
                });
            } else {
                console.log(`➕ Creating new student: ${studentData.name}`);
                await User.create(studentData);
            }
        }
        
        // Verify students are enrolled in BIT364
        const bit364Students = await User.find({ 
            role: 'student',
            courses: 'BIT364' 
        }).select('name studentId courses');
        
        console.log(`✅ Successfully processed ${testStudents.length} students`);
        console.log(`📊 Students enrolled in BIT364: ${bit364Students.length}`);
        
        console.log('\n👥 BIT364 Enrolled Students:');
        bit364Students.forEach(student => {
            console.log(`   - ${student.name} (${student.studentId}): ${student.courses.join(', ')}`);
        });
        
        console.log('\n🎯 Assessment notifications will now be sent to these students');
        
    } catch (error) {
        console.error('❌ Error seeding student users:', error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

if (require.main === module) {
    seedStudentUsers();
}

module.exports = { seedStudentUsers };