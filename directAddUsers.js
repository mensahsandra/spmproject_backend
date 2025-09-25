// Direct script to add users
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
async function run() {
  try {
    // Connect to MongoDB
    const dbUrl = "mongodb+srv://sandramensah243_db_user:BLfftPv57vGS28sr@studentmatrix0.39egn6a.mongodb.net/students-performance-db?retryWrites=true&w=majority";
    console.log('Connecting to MongoDB...');
    await mongoose.connect(dbUrl);
    console.log('MongoDB Connected');
    
    // Define User schema
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

    // Create model
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

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

    // Check if users exist and create if they don't
    const existingStudent = await User.findOne({ email: studentUser.email });
    if (!existingStudent) {
      await User.create(studentUser);
      console.log(`✅ Student user added: ${studentUser.email}`);
    } else {
      console.log(`⚠️ Student user already exists: ${studentUser.email}`);
    }

    const existingLecturer = await User.findOne({ email: lecturerUser.email });
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
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
