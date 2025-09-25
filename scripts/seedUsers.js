// scripts/seedUsers.js
require('dotenv').config({ path: './config/.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function run() {
  const url = process.env.MONGO_URI || 'mongodb+srv://sandramensah243_db_user:BLfftPv57vGS28sr@studentmatrix0.39egn6a.mongodb.net/students-performance-db?retryWrites=true&w=majority';
  await mongoose.connect(url);
  console.log('Connected for seeding');
  const defs = [
    { email: 'student@knust.edu.gh', password: 'password', name: 'Test Student', role: 'student', studentId: '12345678', centre: 'Kumasi', semester: '3/4' },
    { email: 'lecturer@knust.edu.gh', password: 'password', name: 'Dr. Jane Smith', role: 'lecturer', staffId: 'L001' }
  ];
  for (const d of defs) {
    const exists = await User.findOne({ email: d.email });
    if (exists) { console.log('Exists:', d.email); continue; }
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(d.password, salt);
    await User.create({ ...d, email: d.email.toLowerCase(), password: hashed });
    console.log('Created:', d.email);
  }
  await mongoose.disconnect();
  console.log('Seed complete');
}
run().catch(e => { console.error(e); process.exit(1); });
