// Diagnose frontend-backend mismatch issue
const http = require('http');

async function diagnoseFrontendIssue() {
    console.log('🔍 DIAGNOSING FRONTEND-BACKEND MISMATCH...\n');
    
    // Test 1: Check what the frontend URL shows
    console.log('1️⃣ FRONTEND URL ANALYSIS:');
    console.log('   Frontend URL: spmproject-web.vercel.app/lecturer/attendance');
    console.log('   This suggests frontend is calling: spmproject-backend.vercel.app');
    console.log('   But our fixes are on: localhost:3000\n');
    
    // Test 2: Test local backend (where our fixes are)
    console.log('2️⃣ TESTING LOCAL BACKEND (WITH FIXES):');
    try {
        const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'kwabena@knust.edu.gh',
                password: 'password123!'
            })
        });
        
        const loginData = await loginResponse.json();
        if (loginData.success) {
            console.log('   ✅ Local backend login works');
            console.log('   👤 User:', loginData.user.name);
            console.log('   🆔 User ID:', loginData.user.id);
            
            // Test /me endpoint
            const meResponse = await fetch('http://localhost:3000/api/auth/me', {
                headers: { 'Authorization': `Bearer ${loginData.token}` }
            });
            const meData = await meResponse.json();
            
            console.log('   📋 /me endpoint response:');
            console.log('   - Name:', meData.user?.name);
            console.log('   - Honorific:', meData.user?.honorific);
            console.log('   - Courses:', meData.user?.courses);
            console.log('   - LecturerId:', meData.user?.lecturerId || meData.user?.id);
        }
    } catch (error) {
        console.log('   ❌ Local backend error:', error.message);
    }
    
    // Test 3: Test deployed backend (what frontend is actually calling)
    console.log('\n3️⃣ TESTING DEPLOYED BACKEND (WHAT FRONTEND CALLS):');
    try {
        const deployedLoginResponse = await fetch('https://spmproject-backend.vercel.app/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'kwabena@knust.edu.gh',
                password: 'password123!'
            })
        });
        
        const deployedLoginData = await deployedLoginResponse.json();
        if (deployedLoginData.success) {
            console.log('   ✅ Deployed backend login works');
            console.log('   👤 User:', deployedLoginData.user.name);
            console.log('   🆔 User ID:', deployedLoginData.user.id);
            
            // Test /me endpoint on deployed
            const deployedMeResponse = await fetch('https://spmproject-backend.vercel.app/api/auth/me', {
                headers: { 'Authorization': `Bearer ${deployedLoginData.token}` }
            });
            const deployedMeData = await deployedMeResponse.json();
            
            console.log('   📋 Deployed /me endpoint response:');
            console.log('   - Name:', deployedMeData.user?.name);
            console.log('   - Honorific:', deployedMeData.user?.honorific);
            console.log('   - Courses:', deployedMeData.user?.courses);
            console.log('   - LecturerId:', deployedMeData.user?.lecturerId || deployedMeData.user?.id);
        }
    } catch (error) {
        console.log('   ❌ Deployed backend error:', error.message);
    }
    
    console.log('\n🎯 DIAGNOSIS SUMMARY:');
    console.log('The frontend is calling the OLD deployed backend without our fixes.');
    console.log('Solutions:');
    console.log('1. Deploy the fixes to Vercel (recommended)');
    console.log('2. Update frontend to call localhost:3000 (for testing)');
    console.log('3. Update the deployed backend with our fixed code');
}

diagnoseFrontendIssue();