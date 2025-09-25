// addCredentials.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Function to add the specific credentials
async function addCredentials() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(
      'mongodb+srv://sandramensah243_db_user:BLfftPv57vGS28sr@studentmatrix0.39egn6a.mongodb.net/students-performance-db?retryWrites=true&w=majority',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log('Connected to MongoDB Atlas!');

    // Define the User schema
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

    // Create or get the User model
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // Hash passwords
    console.log('Hashing passwords...');
    const salt = await bcrypt.genSalt(10);
    const studentPassword = await bcrypt.hash('password0!', salt);
    const lecturerPassword = await bcrypt.hash('password123!', salt);

    // Create student user
    console.log('Creating/updating student user...');
    const studentUser = {
      name: 'Ransford Student',
      email: 'ransford@knust.edu.gh',
      password: studentPassword,
      role: 'student',
      studentId: '1234567',
      course: 'Information Technology',
      centre: 'Kumasi',
      semester: 'Fall 2025'
    };

    // Create lecturer user
    console.log('Creating/updating lecturer user...');
    const lecturerUser = {
      name: 'Kwabena Lecturer',
      email: 'kwabena@knust.edu.gh',
      password: lecturerPassword,
      role: 'lecturer',
      staffId: 'STF123',
      centre: 'Kumasi'
    };

    // Use findOneAndUpdate to either create new users or update existing ones
    const studentResult = await User.findOneAndUpdate(
      { email: studentUser.email },
      studentUser,
      { upsert: true, new: true }
    );
    
    const lecturerResult = await User.findOneAndUpdate(
      { email: lecturerUser.email },
      lecturerUser,
      { upsert: true, new: true }
    );

    console.log(`\n✅ SUCCESS: Users created/updated in MongoDB!\n`);
    console.log('Student User:', studentUser.email, '- ID:', studentResult._id);
    console.log('Lecturer User:', lecturerUser.email, '- ID:', lecturerResult._id);
    
    console.log('\n==== LOGIN CREDENTIALS ====');
    console.log('Student:');
    console.log('  Email: ransford@knust.edu.gh');
    console.log('  Password: password0!');
    console.log('  Student ID: 1234567');
    console.log('\nLecturer:');
    console.log('  Email: kwabena@knust.edu.gh');
    console.log('  Password: password123!');
    console.log('  Staff ID: STF123');
    console.log('========================');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
addCredentials();
