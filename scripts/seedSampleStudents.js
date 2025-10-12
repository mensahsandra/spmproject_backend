// scripts/seedSampleStudents.js
// Script to seed 4 sample students for BIT364 course

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config/.env' });

// Import models
const User = require('../models/User');
const connectDB = require('../config/db');

const sampleStudents = [
    {
        email: 'john.doe@student.edu',
        password: 'Student123!',
        role: 'student',
        name: 'John Kwaku Doe',
        studentId: '1234568',
        courses: ['BIT364'],
        courseEnrollments: [{
            courseCode: 'BIT364',
            courseName: 'Web Development',
            enrolledAt: new Date('2024-09-01'),
            status: 'active',
            semester: 'Block 1',
            academicYear: '2024-2025',
            credits: 3
        }],
        centre: 'Main Campus',
        semester: 'Block 1',
        isActive: true
    },
    {
        email: 'saaed.hawa@student.edu',
        password: 'Student123!',
        role: 'student',
        name: 'Saaed Hawa',
        studentId: '1234456',
        courses: ['BIT364'],
        courseEnrollments: [{
            courseCode: 'BIT364',
            courseName: 'Web Development',
            enrolledAt: new Date('2024-09-01'),
            status: 'active',
            semester: 'Block 1',
            academicYear: '2024-2025',
            credits: 3
        }],
        centre: 'Main Campus',
        semester: 'Block 1',
        isActive: true
    },
    {
        email: 'kwarteng.samuel@student.edu',
        password: 'Student123!',
        role: 'student',
        name: 'Kwarteng Samuel',
        studentId: '1233456',
        courses: ['BIT364'],
        courseEnrollments: [{
            courseCode: 'BIT364',
            courseName: 'Web Development',
            enrolledAt: new Date('2024-09-01'),
            status: 'active',
            semester: 'Block 1',
            academicYear: '2024-2025',
            credits: 3
        }],
        centre: 'Main Campus',
        semester: 'Block 1',
        isActive: true
    },
    {
        email: 'nashiru.alhassan@student.edu',
        password: 'Student123!',
        role: 'student',
        name: 'Nashiru Alhassan',
        studentId: '1234557',
        courses: ['BIT364'],
        courseEnrollments: [{
            courseCode: 'BIT364',
            courseName: 'Web Development',
            enrolledAt: new Date('2024-09-01'),
            status: 'active',
            semester: 'Block 1',
            academicYear: '2024-2025',
            credits: 3
        }],
        centre: 'Main Campus',
        semester: 'Block 1',
        isActive: true
    }
];

async function seedSampleStudents() {
    try {
        console.log('🌱 Starting sample students seeding...');
        
        // Connect to database
        await connectDB();
        console.log('✅ Database connected');

        let createdCount = 0;
        let skippedCount = 0;
        let updatedCount = 0;

        for (const studentData of sampleStudents) {
            // Check if student already exists
            const existingStudent = await User.findOne({ 
                $or: [
                    { email: studentData.email },
                    { studentId: studentData.studentId }
                ]
            });

            if (existingStudent) {
                console.log(`⚠️  Student already exists: ${studentData.name} (${studentData.studentId})`);
                
                // Update existing student with new data
                existingStudent.name = studentData.name;
                existingStudent.courses = studentData.courses;
                existingStudent.courseEnrollments = studentData.courseEnrollments;
                existingStudent.centre = studentData.centre;
                existingStudent.semester = studentData.semester;
                existingStudent.isActive = studentData.isActive;
                
                await existingStudent.save();
                updatedCount++;
                console.log(`✏️  Updated: ${studentData.name}`);
            } else {
                // Hash password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(studentData.password, salt);

                // Create new student
                const newStudent = new User({
                    ...studentData,
                    password: hashedPassword
                });

                await newStudent.save();
                createdCount++;
                console.log(`✅ Created: ${studentData.name} (${studentData.studentId})`);
            }
        }

        console.log('\n📊 Seeding Summary:');
        console.log(`   ✅ Created: ${createdCount} students`);
        console.log(`   ✏️  Updated: ${updatedCount} students`);
        console.log(`   ⚠️  Skipped: ${skippedCount} students`);
        console.log(`   📝 Total: ${sampleStudents.length} students processed`);
        
        console.log('\n🎓 Sample Student Credentials:');
        sampleStudents.forEach(student => {
            console.log(`   📧 ${student.email} / 🔑 Student123!`);
        });

        console.log('\n✅ Sample students seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding sample students:', error);
        process.exit(1);
    }
}

// Run the seeding function
seedSampleStudents();