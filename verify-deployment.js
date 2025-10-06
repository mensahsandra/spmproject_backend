// Deployment verification script
const https = require('https');

const BASE_URL = 'https://spmproject-backend.vercel.app';

function testEndpoint(path, method = 'GET', data = null, headers = {}) {
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

async function verifyDeployment() {
  console.log('🔍 VERIFYING DEPLOYMENT...\n');
  console.log(`Testing: ${BASE_URL}\n`);

  const tests = [
    {
      name: '1. Health Check',
      path: '/api/health',
      expected: 'Server status and info'
    },
    {
      name: '2. Quiz Routes Test',
      path: '/api/quizzes/test',
      expected: 'Quiz routes working message'
    },
    {
      name: '3. Quiz Health Check',
      path: '/api/quizzes/health',
      expected: 'Quiz system status and endpoints'
    },
    {
      name: '4. Minimal Quiz Creation',
      path: '/api/quizzes/create-minimal',
      method: 'POST',
      data: {
        title: 'Deployment Test Quiz',
        courseCode: 'BIT364',
        description: 'Testing deployment'
      },
      expected: 'Success response with quiz data'
    },
    {
      name: '5. Auth Routes Check',
      path: '/api/auth/login',
      method: 'GET',
      expected: 'Method not allowed message (confirms route exists)'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`${test.name}:`);
      console.log(`  Testing: ${test.method || 'GET'} ${test.path}`);
      
      const result = await testEndpoint(
        test.path, 
        test.method || 'GET', 
        test.data
      );
      
      if (result.success) {
        console.log(`  ✅ SUCCESS (${result.status})`);
        console.log(`  📝 Response: ${JSON.stringify(result.data).substring(0, 100)}...`);
        passed++;
      } else {
        console.log(`  ❌ FAILED (${result.status})`);
        console.log(`  📝 Response: ${JSON.stringify(result.data || result.error).substring(0, 200)}...`);
        failed++;
      }
      
    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
      failed++;
    }
    
    console.log(`  💡 Expected: ${test.expected}\n`);
  }

  console.log('📊 DEPLOYMENT VERIFICATION RESULTS:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%\n`);

  if (passed === tests.length) {
    console.log('🎉 ALL TESTS PASSED! Deployment is successful!');
    console.log('💡 Your quiz management system is ready to use!');
  } else if (passed > 0) {
    console.log('⚠️ PARTIAL SUCCESS - Some endpoints are working');
    console.log('💡 Check failed tests and redeploy if needed');
  } else {
    console.log('🚨 DEPLOYMENT FAILED - No endpoints are working');
    console.log('💡 Check Vercel deployment logs and redeploy');
  }

  console.log('\n🔗 Next steps:');
  console.log('1. If tests passed: Test your frontend quiz creation');
  console.log('2. If tests failed: Check Vercel logs and redeploy');
  console.log('3. Test with authentication using a real lecturer token');
}

// Run verification
verifyDeployment().catch(console.error);