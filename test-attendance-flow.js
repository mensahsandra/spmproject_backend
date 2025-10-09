// Test complete attendance flow: generate session -> student scans -> lecturer sees data
async function testAttendanceFlow() {
    try {
        console.log('🧪 TESTING COMPLETE ATTENDANCE FLOW...\n');
        
        // Step 1: Lecturer login
        console.log('1️⃣ LECTURER LOGIN...');
        const lecturerLogin = await fetch('https://spmproject-backend.vercel.app/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'kwabena@knust.edu.gh',
                password: 'password123!'
            })
        });
        
        const lecturerData = await lecturerLogin.json();
        if (!lecturerData.success) {
            console.log('❌ Lecturer login failed');
            return;
        }
        
        const lecturerToken = lecturerData.token;
        const lecturerId = lecturerData.user.id;
        console.log('✅ Lecturer logged in:', lecturerData.user.name);
        
        // Step 2: Test lecturer attendance API
        console.log('\n2️⃣ TESTING LECTURER ATTENDANCE API...');
        const attendanceResponse = await fetch(`https://spmproject-backend.vercel.app/api/attendance/lecturer/${lecturerId}`, {
            headers: { 'Authorization': `Bearer ${lecturerToken}` }
        });
        
        const attendanceData = await attendanceResponse.json();
        console.log('Status:', attendanceResponse.status);
        console.log('Response:', JSON.stringify(attendanceData, null, 2));
        
        // Step 3: Generate session
        console.log('\n3️⃣ GENERATING ATTENDANCE SESSION...');
        const sessionResponse = await fetch('https://spmproject-backend.vercel.app/api/attendance/generate-session', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${lecturerToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                courseCode: 'BIT364',
                courseName: 'Business Information Technology',
                lecturer: lecturerData.user.name,
                durationMinutes: 30
            })
        });
        
        const sessionData = await sessionResponse.json();
        if (sessionData.success) {
            console.log('✅ Session generated:', sessionData.session.sessionCode);
            
            // Step 4: Student login and check-in
            console.log('\n4️⃣ STUDENT CHECK-IN...');
            const studentLogin = await fetch('https://spmproject-backend.vercel.app/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'ransford@knust.edu.gh',
                    password: 'password0!',
                    studentId: '1234567'
                })
            });
            
            const studentData = await studentLogin.json();
            if (studentData.success) {
                console.log('✅ Student logged in:', studentData.user.name);
                
                // Student checks in
                const checkinResponse = await fetch('https://spmproject-backend.vercel.app/api/attendance/check-in', {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${studentData.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        studentId: studentData.user.studentId,
                        sessionCode: sessionData.session.sessionCode,
                        timestamp: new Date().toISOString()
                    })
                });
                
                const checkinData = await checkinResponse.json();
                console.log('Check-in result:', checkinData);
                
                // Step 5: Check lecturer attendance again
                console.log('\n5️⃣ CHECKING LECTURER ATTENDANCE AFTER STUDENT CHECK-IN...');
                const updatedAttendance = await fetch(`https://spmproject-backend.vercel.app/api/attendance/lecturer/${lecturerId}`, {
                    headers: { 'Authorization': `Bearer ${lecturerToken}` }
                });
                
                const updatedData = await updatedAttendance.json();
                console.log('Updated attendance data:', JSON.stringify(updatedData, null, 2));
            }
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

testAttendanceFlow();