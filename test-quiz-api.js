// Simple test script to verify quiz API endpoints
const http = require('http');

function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, error: 'Invalid JSON' });
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

async function runTests() {
  console.log('🧪 Testing Quiz API Endpoints...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const health = await testEndpoint('/api/quizzes/health');
    console.log(`   Status: ${health.status}`);
    console.log(`   Response: ${JSON.stringify(health.data, null, 2)}\n`);

    // Test courses endpoint
    console.log('2. Testing courses endpoint...');
    const courses = await testEndpoint('/api/quizzes/lecturer/courses');
    console.log(`   Status: ${courses.status}`);
    console.log(`   Response: ${JSON.stringify(courses.data, null, 2)}\n`);

    // Test create endpoint (without auth - should fail)
    console.log('3. Testing create endpoint (no auth)...');
    const createTest = await testEndpoint('/api/quizzes/test-create', 'POST', {
      title: 'Test Quiz',
      courseCode: 'BIT364',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString()
    });
    console.log(`   Status: ${createTest.status}`);
    console.log(`   Response: ${JSON.stringify(createTest.data, null, 2)}\n`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests if server is running
console.log('Make sure your server is running on port 3000...');
setTimeout(runTests, 1000);