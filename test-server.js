// Simple server test
const http = require('http');

function testServer() {
  console.log('🧪 Testing server connection...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/quizzes/test',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`📡 Server responded with status: ${res.statusCode}`);
    
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      console.log('📝 Response body:', body);
      
      if (res.statusCode === 200) {
        try {
          const parsed = JSON.parse(body);
          console.log('✅ Server is working! JSON response received:', parsed);
        } catch (e) {
          console.log('⚠️ Server responded but not with JSON:', body);
        }
      } else {
        console.log('❌ Server error or not running');
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Connection failed:', err.message);
    console.log('💡 Make sure your server is running on port 3000');
    console.log('💡 Run: npm start or node index.js');
  });

  req.end();
}

// Test after a short delay
setTimeout(testServer, 1000);

console.log('🚀 Make sure your server is running...');
console.log('📍 Testing: http://localhost:3000/api/quizzes/test');