// Quick test to verify lecturerId is being saved
const mongoose = require('mongoose');
require('dotenv').config();

const { AttendanceSession, AttendanceLog } = require('./models/Attendance');

async function testLecturerId() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Check recent sessions
        const recentSessions = await AttendanceSession.find()
            .sort({ issuedAt: -1 })
            .limit(5)
            .lean();
        
        console.log('\n📋 Recent Sessions:');
        recentSessions.forEach((session, i) => {
            console.log(`\n${i + 1}. Session: ${session.sessionCode}`);
            console.log(`   Lecturer: ${session.lecturer}`);
            console.log(`   LecturerId: ${session.lecturerId || '❌ MISSING'}`);
            console.log(`   Created: ${session.issuedAt}`);
        });

        // Check recent attendance logs
        const recentLogs = await AttendanceLog.find()
            .sort({ timestamp: -1 })
            .limit(5)
            .lean();
        
        console.log('\n\n📝 Recent Attendance Logs:');
        recentLogs.forEach((log, i) => {
            console.log(`\n${i + 1}. Student: ${log.studentId} - ${log.studentName || 'Unknown'}`);
            console.log(`   Session: ${log.sessionCode}`);
            console.log(`   Lecturer: ${log.lecturer}`);
            console.log(`   LecturerId: ${log.lecturerId || '❌ MISSING'}`);
            console.log(`   Timestamp: ${log.timestamp}`);
        });

        // Check if any logs have lecturerId
        const logsWithLecturerId = await AttendanceLog.countDocuments({ lecturerId: { $exists: true, $ne: null } });
        const totalLogs = await AttendanceLog.countDocuments();
        
        console.log(`\n\n📊 Statistics:`);
        console.log(`   Total Attendance Logs: ${totalLogs}`);
        console.log(`   Logs with LecturerId: ${logsWithLecturerId}`);
        console.log(`   Logs without LecturerId: ${totalLogs - logsWithLecturerId}`);

        if (logsWithLecturerId === 0 && totalLogs > 0) {
            console.log('\n⚠️  WARNING: No attendance logs have lecturerId!');
            console.log('   This means the fix hasn\'t been applied to any records yet.');
            console.log('   Solution: Generate a NEW session and have a student check in.');
        }

        await mongoose.disconnect();
        console.log('\n✅ Test complete');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testLecturerId();
