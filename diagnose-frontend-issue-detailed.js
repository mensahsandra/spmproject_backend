// Detailed diagnosis of frontend-backend communication issue
async function diagnoseFrontendIssue() {
    try {
        console.log('🔍 DETAILED FRONTEND-BACKEND DIAGNOSIS...\n');
        
        // Test 1: Check if the frontend is calling the right backend
        console.log('1️⃣ TESTING BACKEND ENDPOINTS...');
        
        // Test health endpoint
        const healthResponse = await fetch('https://spmproject-backend.vercel.app/api/health');
        const healthData = await healthResponse.json();
        console.log('✅ Backend Health:', {
            status: healthData.status,
            dbState: healthData.dbState,
            time: healthData.time
        });
        
        // Test 2: Login and get token
        console.log('\n2️⃣ TESTING LOGIN PROCESS...');
        const loginResponse = await fetch('https://spmproject-backend.vercel.app/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'kwabena@knust.edu.gh',
                password: 'password123!'
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('Login Response:', {
            success: loginData.success,
            hasToken: !!loginData.token,
            user: loginData.user ? {
                id: loginData.user.id,
                name: loginData.user.name,
                role: loginData.user.role,
                lecturerId: loginData.user.lecturerId || loginData.user.id
            } : null
        });
        
        if (!loginData.success) {
            console.log('❌ Login failed, cannot proceed');
            return;
        }
        
        const token = loginData.token;
        const userId = loginData.user.id;
        
        // Test 3: Check token validation
        console.log('\n3️⃣ TESTING TOKEN VALIDATION...');
        const debugTokenResponse = await fetch('https://spmproject-backend.vercel.app/api/auth/debug-token', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const debugTokenData = await debugTokenResponse.json();
        console.log('Token Debug:', debugTokenData);
        
        // Test 4: Test /me endpoint
        console.log('\n4️⃣ TESTING /ME ENDPOINT...');
        const meResponse = await fetch('https://spmproject-backend.vercel.app/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const meData = await meResponse.json();
        console.log('/me Response:', {
            success: meData.success,
            user: meData.user ? {
                id: meData.user.id,
                lecturerId: meData.user.lecturerId,
                name: meData.user.name,
                role: meData.user.role
            } : null
        });
        
        // Test 5: Test attendance endpoint with different variations
        console.log('\n5️⃣ TESTING ATTENDANCE ENDPOINTS...');
        
        // Try with user ID
        console.log('Testing with user ID:', userId);
        const attendanceResponse1 = await fetch(`https://spmproject-backend.vercel.app/api/attendance/lecturer/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Attendance with userId status:', attendanceResponse1.status);
        
        if (attendanceResponse1.status === 200) {
            const attendanceData1 = await attendanceResponse1.json();
            console.log('✅ Attendance API working with userId');
            console.log('Lecturer data:', {
                name: attendanceData1.lecturer?.name,
                fullName: attendanceData1.lecturer?.fullName,
                courses: attendanceData1.lecturer?.courses,
                recordsCount: attendanceData1.records?.length || 0
            });
        } else {
            const errorData1 = await attendanceResponse1.json();
            console.log('❌ Attendance API failed with userId:', errorData1);
        }
        
        // Try with lecturer name
        console.log('\nTesting with lecturer name: Kwabena Lecturer');
        const attendanceResponse2 = await fetch(`https://spmproject-backend.vercel.app/api/attendance/lecturer/Kwabena%20Lecturer`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Attendance with name status:', attendanceResponse2.status);
        
        // Test 6: Check what frontend might be expecting
        console.log('\n6️⃣ FRONTEND EXPECTATIONS...');
        console.log('The frontend might be looking for:');
        console.log('- lecturerId field in user object');
        console.log('- Specific response format');
        console.log('- Different endpoint structure');
        
        // Test 7: Check if there are CORS issues
        console.log('\n7️⃣ CHECKING CORS AND HEADERS...');
        console.log('Response headers from attendance call:');
        const testResponse = await fetch(`https://spmproject-backend.vercel.app/api/attendance/lecturer/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        for (let [key, value] of testResponse.headers.entries()) {
            console.log(`${key}: ${value}`);
        }
        
        console.log('\n🎯 DIAGNOSIS SUMMARY:');
        console.log('Based on the "Invalid token: No lecturer ID found" error:');
        console.log('1. Frontend is not finding lecturerId in the response');
        console.log('2. Token might not be stored/sent correctly');
        console.log('3. Frontend might be calling wrong endpoint');
        console.log('4. Response format mismatch between frontend expectations and backend');
        
    } catch (error) {
        console.error('❌ Diagnosis error:', error.message);
    }
}

diagnoseFrontendIssue();