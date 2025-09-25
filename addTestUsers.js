// addTestUsers.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the User schema directly in this script
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'lecturer', 'admin'], default: 'student', index: true },
  name: { type: String, required: true },
  studentId: { type: String, index: true },
  course: String,
  centre: String,
  semester: String,
  staffId: { type: String, index: true },
}, { timestamps: true });

// Create and add users
async function addTestUsers() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb+srv://sandramensah243_db_user:BLfftPv57vGS28sr@studentmatrix0.39egn6a.mongodb.net/students-performance-db?retryWrites=true&w=majority');
    console.log('Connected to MongoDB!');
    
    // Create User model
    const User = mongoose.model('User', UserSchema);
    
    // Hash passwords
    console.log('Creating user credentials...');
    const salt = await bcrypt.genSalt(10);
    const studentPasswordHash = await bcrypt.hash('password0!', salt);
    const lecturerPasswordHash = await bcrypt.hash('password123!', salt);
    
    // Define users
    const studentData = {
      email: 'ransford@knust.edu.gh',
      password: studentPasswordHash,
      name: 'Ransford Student',
      role: 'student',
      studentId: '1234567',
      course: 'Computer Science',
      centre: 'Kumasi',
      semester: 'Fall 2025'
    };
    
    const lecturerData = {
      email: 'kwabena@knust.edu.gh',
      password: lecturerPasswordHash,
      name: 'Kwabena Lecturer',
      role: 'lecturer',
      staffId: 'STF123',
      centre: 'Kumasi'
    };
    
    // Check if users exist
    console.log('Checking if users exist...');
    const existingStudent = await User.findOne({ email: studentData.email });
    const existingLecturer = await User.findOne({ email: lecturerData.email });
    
    // Create or update users
    if (existingStudent) {
      console.log('Updating existing student user...');
      await User.updateOne({ email: studentData.email }, studentData);
    } else {
      console.log('Creating new student user...');
      await User.create(studentData);
    }
    
    if (existingLecturer) {
      console.log('Updating existing lecturer user...');
      await User.updateOne({ email: lecturerData.email }, lecturerData);
    } else {
      console.log('Creating new lecturer user...');
      await User.create(lecturerData);
    }
    
    console.log('\n✅ TEST USERS CREATED/UPDATED SUCCESSFULLY\n');
    console.log('==== TEST CREDENTIALS ====');
    console.log('Student Login:');
    console.log('  Email: ransford@knust.edu.gh');
    console.log('  Password: password0!');
    console.log('  Student ID: 1234567');
    console.log('\nLecturer Login:');
    console.log('  Email: kwabena@knust.edu.gh');
    console.log('  Password: password123!');
    console.log('  Staff ID: STF123');
    console.log('=======================\n');
    
  } catch (error) {
    console.error('Error adding test users:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the function
addTestUsers();
