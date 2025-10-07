// Comprehensive frontend issue diagnostic
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
            success: res.statusCode >= 200 && res.statusCode < 300,
            headers: res.headers
          });
        } catch (e) {
          resolve({ 
            status: res.statusCode, 
            data: body, 
            error: 'Invalid JSON',
            success: false,
            headers: res.headers
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

async function diagnoseFrontendIssue() {
  console.log('🔍 DIAGNOSING FRONTEND REDIRECT ISSUE...\n');
  console.log(`Testing: ${BASE_URL}\n`);

  // Test 1: Basic connectivity
  console.log('1️⃣ BASIC CONNECTIVITY TESTS:');
  try {
    const health = await testEndpoint('/api/health');
    console.log(`   Health Check: ${health.success ? '✅' : '❌'} (${health.status})`);
    if (health.success) {
      console.log(`   Server: ${health.data.service} - ${health.data.status}`);
      console.log(`   DB State: ${health.data.dbState}`);
    }
  } catch (e) {
    console.log(`   Health Check: ❌ ${e.message}`);
  }

  // Test 2: Authentication endpoints
  console.log('\n2️⃣ AUTHENTICATION ENDPOINTS:');
  
  const authTests = [
    { path: '/api/auth/login', method: 'GET', expected: 'Method not allowed (405)' },
    { path: '/api/auth/me', method: 'GET', expected: 'Missing token (401)' },
    { path: '/api/auth/student/dashboard', method: 'GET', expected: 'Missing token (401)' },
    { path: '/api/auth/lecturer/dashboard', method: 'GET', expected: 'Missing token (401)' }
  ];

  for (const test of authTests) {
    try {
      const result = await testEndpoint(test.path, test.method);
      const status = result.status;
      console.log(`   ${test.path}: ${status === 401 || status === 405 ? '✅' : '❌'} (${status})`);
      if (status !== 401 && status !== 405) {
        console.log(`     ⚠️ Unexpected: ${JSON.stringify(result.data).substring(0, 100)}`);
      }
    } catch (e) {
      console.log(`   ${test.path}: ❌ ${e.message}`);
    }
  }

  // Test 3: Student routes
  console.log('\n3️⃣ STUDENT ROUTES (should require auth):');
  
  const studentRoutes = [
    '/api/grades/academic-years',
    '/api/grades/semesters',
    '/api/grades/select-result-data',
    '/api/grades/student-results'
  ];

  for (const route of studentRoutes) {
    try {
      const result = await testEndpoint(route);
      console.log(`   ${route}: ${result.status === 401 ? '✅' : '❌'} (${result.status})`);
      if (result.status !== 401) {
        console.log(`     ⚠️ Should require auth: ${JSON.stringify(result.data).substring(0, 80)}`);
      }
    } catch (e) {
      console.log(`   ${route}: ❌ ${e.message}`);
    }
  }

  // Test 4: Lecturer routes
  console.log('\n4️⃣ LECTURER ROUTES (should require auth):');
  
  const lecturerRoutes = [
    '/api/quizzes/lecturer/courses',
    '/api/quizzes/lecturer/dashboard',
    '/api/grades/list'
  ];

  for (const route of lecturerRoutes) {
    try {
      const result = await testEndpoint(route);
      console.log(`   ${route}: ${result.status === 401 ? '✅' : '❌'} (${result.status})`);
      if (result.status !== 401) {
        console.log(`     ⚠️ Should require auth: ${JSON.stringify(result.data).substring(0, 80)}`);
      }
    } catch (e) {
      console.log(`   ${route}: ❌ ${e.message}`);
    }
  }

  // Test 5: CORS headers
  console.log('\n5️⃣ CORS CONFIGURATION:');
  try {
    const result = await testEndpoint('/api/health');
    const corsHeaders = {
      'access-control-allow-origin': result.headers['access-control-allow-origin'],
      'access-control-allow-credentials': result.headers['access-control-allow-credentials'],
      'access-control-allow-methods': result.headers['access-control-allow-methods']
    };
    
    console.log('   CORS Headers:');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      console.log(`     ${key}: ${value || 'Not set'}`);
    });
  } catch (e) {
    console.log(`   CORS Check: ❌ ${e.message}`);
  }

  // Test 6: Test login functionality
  console.log('\n6️⃣ LOGIN TEST (with test credentials):');
  try {
    const loginResult = await testEndpoint('/api/auth/login', 'POST', {}, {
      email: 'ransford@knust.edu.gh',
      password: 'password0!',
      studentId: '1234567'
    });
    
    console.log(`   Login attempt: ${loginResult.success ? '✅' : '❌'} (${loginResult.status})`);
    if (loginResult.success) {
      console.log(`   Token received: ${loginResult.data.token ? '✅' : '❌'}`);
      console.log(`   User role: ${loginResult.data.user?.role || 'Unknown'}`);
      
      // Test authenticated request
      if (loginResult.data.token) {
        console.log('\n   Testing authenticated request:');
        const authTest = await testEndpoint('/api/auth/me', 'GET', {
          'Authorization': `Bearer ${loginResult.data.token}`
        });
        console.log(`   Auth/me with token: ${authTest.success ? '✅' : '❌'} (${authTest.status})`);
      }
    } else {
      console.log(`   Login error: ${JSON.stringify(loginResult.data)}`);
    }
  } catch (e) {
    console.log(`   Login test: ❌ ${e.message}`);
  }

  console.log('\n📋 DIAGNOSIS SUMMARY:');
  console.log('If all tests show ✅, the backend is working correctly.');
  console.log('If frontend still redirects, the issue is likely:');
  console.log('  1. Frontend authentication token management');
  console.log('  2. Frontend routing configuration');
  console.log('  3. Frontend error handling');
  console.log('  4. Browser cache/storage issues');
  
  console.log('\n🔧 FRONTEND DEBUGGING STEPS:');
  console.log('1. Open browser dev tools (F12)');
  console.log('2. Check Console tab for JavaScript errors');
  console.log('3. Check Network tab for failed API calls');
  console.log('4. Check Application tab > Local Storage for auth token');
  console.log('5. Try clearing browser cache and localStorage');
  console.log('6. Try logging in again with fresh credentials');
}

diagnoseFrontendIssue().catch(console.error);