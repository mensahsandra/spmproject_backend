// scripts/addUsers.js
require('dotenv').config({ path: '../config/.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// MongoDB connection
const connectDB = async () => {
  try {
    const dbUrl = process.env.MONGO_URI || "mongodb+srv://sandramensah243_db_user:BLfftPv57vGS28sr@studentmatrix0.39egn6a.mongodb.net/students-performance-db?retryWrites=true&w=majority";
    console.log('Connecting to MongoDB...');
    await mongoose.connect(dbUrl);
    console.log('MongoDB Connected');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    return false;
  }
};

// Add users
const addUsers = async () => {
  try {
    // Ensure we have a DB connection
    const connected = await connectDB();
    if (!connected) {
      console.error('Failed to connect to database');
      process.exit(1);
    }

    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const studentPasswordHash = await bcrypt.hash('password0!', salt);
    const lecturerPasswordHash = await bcrypt.hash('password123!', salt);

    // Define student user
    const studentUser = {
      email: 'ransford@knust.edu.gh',
      password: studentPasswordHash,
      name: 'Ransford Student',
      role: 'student',
      studentId: '1234567',
      course: 'Computer Science',
      centre: 'Kumasi',
      semester: 'Fall 2025'
    };

    // Define lecturer user
    const lecturerUser = {
      email: 'kwabena@knust.edu.gh',
      password: lecturerPasswordHash,
      name: 'Kwabena Lecturer',
      role: 'lecturer',
      staffId: 'STF123',
      centre: 'Kumasi'
    };

    // Check if users already exist
    const existingStudent = await User.findOne({ email: studentUser.email });
    const existingLecturer = await User.findOne({ email: lecturerUser.email });

    // Add student if they don't exist
    if (!existingStudent) {
      await User.create(studentUser);
      console.log(`✅ Student user added: ${studentUser.email}`);
    } else {
      console.log(`⚠️ Student user already exists: ${studentUser.email}`);
    }

    // Add lecturer if they don't exist
    if (!existingLecturer) {
      await User.create(lecturerUser);
      console.log(`✅ Lecturer user added: ${lecturerUser.email}`);
    } else {
      console.log(`⚠️ Lecturer user already exists: ${lecturerUser.email}`);
    }

    // Print test credentials
    console.log('\n==== TEST CREDENTIALS ====');
    console.log('Student Login:');
    console.log('  Email: ransford@knust.edu.gh');
    console.log('  Password: password0!');
    console.log('  Student ID: 1234567');
    console.log('\nLecturer Login:');
    console.log('  Email: kwabena@knust.edu.gh');
    console.log('  Password: password123!');
    console.log('  Staff ID: STF123');
    console.log('=======================\n');

    console.log('Done!');
  } catch (error) {
    console.error('Error adding users:', error);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the function
addUsers();
