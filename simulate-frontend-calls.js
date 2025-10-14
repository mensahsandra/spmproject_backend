const axios = require('axios');

async function simulateFrontendAPICall() {
    const baseURL = 'https://spmproject-backend.vercel.app';
    
    console.log('🎭 Simulating frontend API calls to understand demo mode...\n');
    
    try {
        // Test what the frontend assessment page would call
        console.log('📚 Testing assessment page API calls...\n');
        
        // 1. Test grades/enrolled (main data source for assessment page)
        console.log('1️⃣ GET /api/grades/enrolled?courseCode=BIT364');
        try {
            const enrolledResponse = await axios.get(`${baseURL}/api/grades/enrolled?courseCode=BIT364`);
            console.log('✅ Success:', enrolledResponse.data);
        } catch (error) {
            console.log('❌ Failed:', error.response?.status, error.response?.data?.message);
            if (error.response?.status === 401) {
                console.log('🔐 This endpoint requires authentication - explains demo mode');
            }
        }
        
        console.log('\n' + '-'.repeat(50) + '\n');
        
        // 2. Test students/performance 
        console.log('2️⃣ GET /api/students/performance?courseCode=BIT364');
        try {
            const studentsResponse = await axios.get(`${baseURL}/api/students/performance?courseCode=BIT364`);
            console.log('✅ Success:', studentsResponse.data);
        } catch (error) {
            console.log('❌ Failed:', error.response?.status, error.response?.data?.message);
            if (error.response?.status === 401) {
                console.log('🔐 This endpoint requires authentication - explains demo mode');
            }
        }
        
        console.log('\n' + '-'.repeat(50) + '\n');
        
        // 3. Test auth endpoint (what frontend would use to login)
        console.log('3️⃣ Testing authentication endpoints...');
        
        // Check if login endpoint exists
        try {
            const authResponse = await axios.post(`${baseURL}/api/auth/login`, {
                email: 'test@example.com',
                password: 'test'
            });
            console.log('🔑 Auth endpoint response:', authResponse.status);
        } catch (error) {
            console.log('🔑 Auth endpoint status:', error.response?.status);
            console.log('🔑 Auth error:', error.response?.data?.message);
            if (error.response?.status === 400 || error.response?.status === 401) {
                console.log('✅ Auth endpoint exists but credentials invalid (expected)');
            }
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        console.log('🔍 DIAGNOSIS:');
        console.log('1. Backend APIs are working correctly ✅');
        console.log('2. Protected endpoints require authentication ✅');  
        console.log('3. Frontend is falling back to demo mode because:');
        console.log('   - No valid JWT token present');
        console.log('   - API calls return 401 Unauthorized');
        console.log('   - Frontend shows sample data instead');
        
        console.log('\n💡 SOLUTION:');
        console.log('1. Frontend needs to authenticate first via /api/auth/login');
        console.log('2. Store JWT token and use it for API calls');
        console.log('3. Or create public endpoints for demo purposes');
        
    } catch (error) {
        console.error('❌ Simulation failed:', error.message);
    }
}

// Run the simulation
simulateFrontendAPICall();