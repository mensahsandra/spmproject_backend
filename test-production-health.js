const axios = require('axios');

async function testProductionAPI() {
    const baseURL = 'https://spmproject-backend.vercel.app';
    
    console.log('🧪 Testing production API health and accessibility...\n');
    
    try {
        // Test 1: Basic health check
        console.log('1️⃣ Testing basic health endpoint...');
        const healthResponse = await axios.get(`${baseURL}/api/health`);
        console.log('✅ Health Status:', healthResponse.status);
        console.log('📊 Response:', healthResponse.data);
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Test 2: Grades health check  
        console.log('2️⃣ Testing grades system health...');
        const gradesHealthResponse = await axios.get(`${baseURL}/api/grades/health`);
        console.log('✅ Grades Health Status:', gradesHealthResponse.status);
        console.log('📊 Available endpoints:', gradesHealthResponse.data.endpoints?.length || 0);
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Test 3: Test a protected endpoint (should return 401)
        console.log('3️⃣ Testing protected endpoint (should return 401)...');
        try {
            const protectedResponse = await axios.get(`${baseURL}/api/grades/enrolled?courseCode=BIT364`);
            console.log('❌ Unexpected success:', protectedResponse.status);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('✅ Protected endpoint working: 401 Unauthorized');
                console.log('📋 Auth response:', error.response.data);
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Test 4: CORS and basic connectivity
        console.log('4️⃣ Testing CORS and connectivity...');
        const corsResponse = await axios.options(`${baseURL}/api/grades/health`);
        console.log('✅ CORS preflight:', corsResponse.status);
        console.log('📋 CORS headers available:', !!corsResponse.headers);
        
        console.log('\n🎉 Production backend is accessible and working!');
        console.log('🔍 Issue likely in frontend authentication or API configuration');
        
    } catch (error) {
        console.error('❌ Production API test failed:', error.message);
        if (error.response) {
            console.error('📋 Status:', error.response.status);
            console.error('📋 Response:', error.response.data);
        }
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            console.error('🔌 Network connectivity issue - backend may be down');
        }
    }
}

// Run the comprehensive test
testProductionAPI();