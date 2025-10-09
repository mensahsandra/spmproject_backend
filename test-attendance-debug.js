// Test attendance API directly to see debug output
const BASE_URL = 'http://localhost:3000/api';

async function testAttendanceAPI() {
    try {
        console.log('🧪 Testing Attendance API Debug...\n');
        
        // Step 1: Login to get token
        console.log('1️⃣ Logging in...');
        const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'kwabena@knust.edu.gh',
                password: 'password123!'
            })
        });
        
        const loginData = await loginResponse.json();
        const token = loginData.token;
        const userId = loginData.user.id;
        console.log('✅ Login successful, User ID:', userId);
        
        // Step 2: Test attendance API
        console.log('\n2️⃣ Testing attendance API...');
        const attendanceResponse = await fetch(`${BASE_URL}/attendance/lecturer/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const attendanceData = await attendanceResponse.json();
        console.log('Status:', attendanceResponse.status);
        console.log('Response data:', JSON.stringify(attendanceData, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testAttendanceAPI();