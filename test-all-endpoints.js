// Test all critical endpoints that frontend needs
const https = require('https');

const BASE_URL = 'https://spmproject-backend.vercel.app';

function testEndpoint(path, method = 'GET', headers = {}, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ 
            status: res.statusCode, 
            data: parsed,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (e) {
          resolve({ 
            status: res.statusCode, 
            data: body, 
            error: 'Invalid JSON',
            success: false
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAllEndpoints() {
  console.log('🧪 TESTING ALL CRITICAL ENDPOINTS...\n');

  // Test 1: Login and get token
  console.log('1️⃣ TESTING LOGIN:');
  let authToken = null;
  
  try {
    const loginResult = await testEndpoint('/api/auth/login', 'POST', {}, {
      email: 'ransford@knust.edu.gh',
      password: 'password0!',
      studentId: '1234567'
    });
    
    if (loginResult.success && loginResult.data.token) {
      authToken = loginResult.data.token;
      console.log('   ✅ Login successful');
      console.log('   ✅ Token received');
      console.log('   👤 User role:', loginResult.data.user.role);
    } else {
      console.log('   ❌ Login failed:', loginResult.data);
      return;
    }
  } catch (e) {
    console.log('   ❌ Login error:', e.message);
    return;
  }

  // Test 2: Auth endpoints with token
  console.log('\n2️⃣ TESTING AUTH ENDPOINTS:');
  const authEndpoints = [
    '/api/auth/me',
    '/api/auth/student/dashboard'
  ];

  for (const endpoint of authEndpoints) {
    try {
      const result = await testEndpoint(endpoint, 'GET', {
        'Authorization': `Bearer ${authToken}`
      });
      console.log(`   ${endpoint}: ${result.success ? '✅' : '❌'} (${result.status})`);
      if (!result.success) {
        console.log(`     Error: ${JSON.stringify(result.data).substring(0, 100)}`);
      }
    } catch (e) {
      console.log(`   ${endpoint}: ❌ ${e.message}`);
    }
  }

  // Test 3: Student grade endpoints (should work without auth now)
  console.log('\n3️⃣ TESTING STUDENT GRADE ENDPOINTS:');
  const studentEndpoints = [
    '/api/grades/academic-years',
    '/api/grades/semesters',
    '/api/grades/select-result-data',
    '/api/grades/student-results?studentId=1234567'
  ];

  for (const endpoint of studentEndpoints) {
    try {
      const result = await testEndpoint(endpoint);
      console.log(`   ${endpoint}: ${result.success ? '✅' : '❌'} (${result.status})`);
      if (!result.success) {
        console.log(`     Error: ${JSON.stringify(result.data).substring(0, 100)}`);
      }
    } catch (e) {
      console.log(`   ${endpoint}: ❌ ${e.message}`);
    }
  }

  // Test 4: Other critical endpoints
  console.log('\n4️⃣ TESTING OTHER ENDPOINTS:');
  const otherEndpoints = [
    '/api/health',
    '/api/attendance/health',
    '/api/cwa/health'
  ];

  for (const endpoint of otherEndpoints) {
    try {
      const result = await testEndpoint(endpoint);
      console.log(`   ${endpoint}: ${result.success ? '✅' : '❌'} (${result.status})`);
    } catch (e) {
      console.log(`   ${endpoint}: ❌ ${e.message}`);
    }
  }

  console.log('\n📋 SUMMARY:');
  console.log('If all tests show ✅, the backend is working perfectly.');
  console.log('The frontend redirect issue is likely caused by:');
  console.log('  1. Frontend authentication logic redirecting on ANY error');
  console.log('  2. Frontend not properly handling API responses');
  console.log('  3. Frontend routing configuration issues');
  console.log('  4. Browser cache/storage corruption');
  
  console.log('\n🔧 FRONTEND FIXES TO TRY:');
  console.log('1. Clear ALL browser data (cache, localStorage, cookies)');
  console.log('2. Try incognito/private browsing mode');
  console.log('3. Check browser console for JavaScript errors');
  console.log('4. Check if frontend is calling the right API endpoints');
  console.log('5. Verify frontend authentication token handling');
}

testAllEndpoints().catch(console.error);