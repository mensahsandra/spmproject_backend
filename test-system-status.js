const axios = require('axios');

async function testSystemStatus() {
    const baseURL = 'https://spmproject-backend.vercel.app';
    
    console.log('🔍 Testing system status and demo mode...\n');
    
    try {
        // Test 1: Check system status
        console.log('1️⃣ Testing GET /api/system/status');
        const statusResponse = await axios.get(`${baseURL}/api/system/status`);
        console.log('✅ Status:', statusResponse.status);
        console.log('📊 Demo Mode:', statusResponse.data.demoMode);
        console.log('🔧 Environment:', statusResponse.data.environment);
        console.log('⚡ Features:', Object.keys(statusResponse.data.features || {}));
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Test 2: Disable demo mode
        console.log('2️⃣ Testing POST /api/system/disable-demo-mode');
        const disableDemoResponse = await axios.post(`${baseURL}/api/system/disable-demo-mode`);
        console.log('✅ Status:', disableDemoResponse.status);
        console.log('🚫 Demo Mode:', disableDemoResponse.data.demoMode);
        console.log('🔗 Real API:', disableDemoResponse.data.realApiEnabled);
        console.log('📋 Actions:', disableDemoResponse.data.actions?.length || 0, 'performed');
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        // Test 3: Health check
        console.log('3️⃣ Testing GET /api/system/health');
        const healthResponse = await axios.get(`${baseURL}/api/system/health`);
        console.log('✅ Status:', healthResponse.status);
        console.log('💚 Overall Health:', healthResponse.data.status);
        console.log('🗄️ Database:', healthResponse.data.services?.database?.status);
        console.log('🔔 Notifications:', healthResponse.data.services?.notifications?.status);
        console.log('📝 Assessments:', healthResponse.data.services?.assessments?.status);
        
        console.log('\n✅ System endpoints are working!');
        console.log('💡 Frontend should now connect to real backend APIs');
        console.log('💡 Demo mode has been disabled');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response:', error.response.data);
        }
    }
}

// Run the test
testSystemStatus();