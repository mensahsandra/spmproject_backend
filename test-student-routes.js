// Test student performance routes
const https = require('https');

const BASE_URL = 'https://spmproject-backend.vercel.app';

function testEndpoint(path, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
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

    req.end();
  });
}

async function testStudentRoutes() {
  console.log('🧪 TESTING STUDENT PERFORMANCE ROUTES...\n');
  console.log(`Testing: ${BASE_URL}\n`);

  // Test without authentication first
  console.log('1. Testing routes without authentication (should fail with 401):');
  
  const routes = [
    '/api/grades/academic-years',
    '/api/grades/semesters', 
    '/api/grades/select-result-data',
    '/api/grades/student-results?studentId=1234567'
  ];

  for (const route of routes) {
    try {
      const result = await testEndpoint(route);
      console.log(`  ${route}: Status ${result.status}`);
      if (result.status === 401) {
        console.log(`    ✅ Correctly requires authentication`);
      } else if (result.status === 200) {
        console.log(`    ⚠️ Working without auth (might be issue)`);
      } else {
        console.log(`    ❌ Unexpected status: ${result.status}`);
      }
    } catch (error) {
      console.log(`  ${route}: ❌ Error - ${error.message}`);
    }
  }

  console.log('\n💡 To test with authentication, use:');
  console.log('node test-student-routes.js YOUR_JWT_TOKEN');
  
  // If token provided as argument
  const token = process.argv[2];
  if (token) {
    console.log('\n2. Testing with provided token:');
    for (const route of routes) {
      try {
        const result = await testEndpoint(route, token);
        console.log(`  ${route}: Status ${result.status}`);
        if (result.success) {
          console.log(`    ✅ Success`);
        } else {
          console.log(`    ❌ Failed: ${JSON.stringify(result.data).substring(0, 100)}`);
        }
      } catch (error) {
        console.log(`  ${route}: ❌ Error - ${error.message}`);
      }
    }
  }
}

testStudentRoutes().catch(console.error);