// utils/seedDefaults.js
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function ensureDefaultUsers() {
  try {
    const studentEmail = 'student@knust.edu.gh';
    const lecturerEmail = 'lecturer@knust.edu.gh';
    const defaults = [
      { email: studentEmail, password: 'password', name: 'Test Student', role: 'student', studentId: '12345678', centre: 'Kumasi', semester: '3/4' },
      { email: lecturerEmail, password: 'password', name: 'Dr. Jane Smith', role: 'lecturer', staffId: 'L001' }
    ];
    for (const d of defaults) {
      const existing = await User.findOne({ email: d.email });
      if (existing) {
        continue;
      }
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(d.password, salt);
      await User.create({ ...d, email: d.email.toLowerCase(), password: hashed });
      console.log('[auto-seed] created user', d.email);
    }
  } catch (e) {
    console.warn('[auto-seed] failed:', e.message || e);
  }
}

module.exports = ensureDefaultUsers;
