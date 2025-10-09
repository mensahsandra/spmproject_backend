// Test what the frontend should expect from the backend
async function testFrontendExpectations() {
    try {
        console.log('🧪 TESTING FRONTEND EXPECTATIONS...\n');
        
        // Test the exact endpoints the frontend calls
        console.log('1️⃣ TESTING LECTURER LOGIN...');
        const loginResponse = await fetch('https://spmproject-backend.vercel.app/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'kwabena@knust.edu.gh',
                password: 'password123!'
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('✅ Login Response:', {
            success: loginData.success,
            userName: loginData.user?.name,
            userRole: loginData.user?.role,
            userId: loginData.user?.id
        });
        
        if (!loginData.success) return;
        
        const token = loginData.token;
        const userId = loginData.user.id;
        
        // Test /me endpoint (for profile data)
        console.log('\n2️⃣ TESTING /ME ENDPOINT (Profile Data)...');
        const meResponse = await fetch('https://spmproject-backend.vercel.app/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const meData = await meResponse.json();
        console.log('✅ /me Response:', {
            success: meData.success,
            name: meData.user?.name,
            fullName: meData.user?.fullName,
            honorific: meData.user?.honorific,
            department: meData.user?.department,
            courses: meData.user?.courses,
            courseNames: meData.user?.courseNames
        });
        
        // Test lecturer profile endpoint
        console.log('\n3️⃣ TESTING LECTURER PROFILE ENDPOINT...');
        const profileResponse = await fetch('https://spmproject-backend.vercel.app/api/auth/lecturer/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const profileData = await profileResponse.json();
        console.log('✅ Lecturer Profile Response:', {
            success: profileData.success,
            name: profileData.lecturer?.name,
            fullName: profileData.lecturer?.fullName,
            department: profileData.lecturer?.department,
            courses: profileData.lecturer?.courses,
            courseNames: profileData.lecturer?.courseNames
        });
        
        // Test attendance endpoint (main issue)
        console.log('\n4️⃣ TESTING ATTENDANCE ENDPOINT...');
        const attendanceResponse = await fetch(`https://spmproject-backend.vercel.app/api/attendance/lecturer/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const attendanceData = await attendanceResponse.json();
        console.log('✅ Attendance Response:', {
            success: attendanceData.success,
            lecturerName: attendanceData.lecturer?.name,
            lecturerFullName: attendanceData.lecturer?.fullName,
            lecturerDepartment: attendanceData.lecturer?.department,
            courses: attendanceData.lecturer?.courses,
            courseNames: attendanceData.lecturer?.courseNames,
            totalRecords: attendanceData.records?.length || 0,
            currentSession: attendanceData.currentSession ? {
                courseCode: attendanceData.currentSession.courseCode,
                courseName: attendanceData.currentSession.courseName,
                attendeeCount: attendanceData.currentSession.attendees?.length || 0
            } : null
        });
        
        // Test courses endpoint (for assessment page)
        console.log('\n5️⃣ TESTING COURSES ENDPOINT (Assessment Page)...');
        const coursesResponse = await fetch('https://spmproject-backend.vercel.app/api/auth/lecturer/courses', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const coursesData = await coursesResponse.json();
        console.log('✅ Courses Response:', {
            success: coursesData.success,
            lecturerName: coursesData.lecturer?.name,
            lecturerFullName: coursesData.lecturer?.fullName,
            totalCourses: coursesData.totalCourses,
            courseNames: coursesData.courseNames,
            courses: coursesData.courses?.map(c => ({
                code: c.code,
                name: c.name,
                fullName: c.fullName,
                canCreateQuiz: c.canCreateQuiz
            }))
        });
        
        console.log('\n🎯 FRONTEND INTEGRATION SUMMARY:');
        console.log('The frontend should now show:');
        console.log('• Lecturer Name: Prof. Kwabena Lecturer');
        console.log('• Department: Information Technology');
        console.log('• Courses: Business Information Technology, Database Management Systems, etc.');
        console.log('• Dynamic attendance records when students scan QR codes');
        console.log('• Full course names in assessment dropdown');
        
        console.log('\n🔧 If frontend still shows old data:');
        console.log('1. Clear browser cache (Ctrl+Shift+R)');
        console.log('2. Check if frontend is calling the correct API endpoints');
        console.log('3. Verify frontend is using the token correctly');
        console.log('4. Check browser console for any JavaScript errors');
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

testFrontendExpectations();