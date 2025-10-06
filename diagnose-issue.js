// Comprehensive diagnostic script
const http = require('http');
const fs = require('fs');

console.log('🔍 DIAGNOSING QUIZ API ISSUE...\n');

// Step 1: Check if server is running
function checkServerRunning() {
  return new Promise((resolve) => {
    console.log('1️⃣ Checking if server is running on port 3000...');
    
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`   ✅ Server is running! Status: ${res.statusCode}`);
        console.log(`   📝 Health response: ${body}\n`);
        resolve(true);
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ Server not responding: ${err.message}`);
      console.log(`   💡 Please start your server with: npm start\n`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`   ❌ Server timeout - may be starting up`);
      console.log(`   💡 Wait a moment and try again\n`);
      resolve(false);
    });

    req.end();
  });
}

// Step 2: Check quiz routes
function checkQuizRoutes() {
  return new Promise((resolve) => {
    console.log('2️⃣ Checking quiz routes...');
    
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/quizzes/test',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`   ✅ Quiz routes working! Status: ${res.statusCode}`);
        console.log(`   📝 Response: ${body}\n`);
        resolve(true);
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ Quiz routes not working: ${err.message}\n`);
      resolve(false);
    });

    req.end();
  });
}

// Step 3: Test simple quiz creation
function testSimpleQuizCreation() {
  return new Promise((resolve) => {
    console.log('3️⃣ Testing simple quiz creation...');
    
    const postData = JSON.stringify({
      title: 'Test Quiz',
      courseCode: 'BIT364',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString()
    });

    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/quizzes/create-simple',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   📝 Response: ${body}`);
        
        if (res.statusCode === 201) {
          console.log(`   ✅ Simple quiz creation works!\n`);
          resolve(true);
        } else {
          console.log(`   ⚠️ Unexpected status code\n`);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ Quiz creation failed: ${err.message}\n`);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

// Step 4: Check file structure
function checkFileStructure() {
  console.log('4️⃣ Checking file structure...');
  
  const requiredFiles = [
    'app.js',
    'index.js',
    'routes/quizzes.js',
    'models/Quiz.js',
    'middleware/auth.js',
    'utils/logger.js'
  ];

  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`   ✅ ${file} exists`);
    } else {
      console.log(`   ❌ ${file} missing`);
    }
  });
  console.log();
}

// Run all diagnostics
async function runDiagnostics() {
  checkFileStructure();
  
  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    console.log('🚨 SERVER NOT RUNNING - Please start with: npm start');
    return;
  }
  
  const routesWorking = await checkQuizRoutes();
  if (!routesWorking) {
    console.log('🚨 QUIZ ROUTES NOT WORKING - Check server logs');
    return;
  }
  
  const creationWorking = await testSimpleQuizCreation();
  if (!creationWorking) {
    console.log('🚨 QUIZ CREATION NOT WORKING - Check request format');
    return;
  }
  
  console.log('🎉 ALL TESTS PASSED!');
  console.log('💡 If frontend still shows JSON error, check:');
  console.log('   - Browser network tab for actual request/response');
  console.log('   - CORS settings');
  console.log('   - Authentication token');
  console.log('   - Frontend request URL and format');
}

runDiagnostics();