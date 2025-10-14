const http = require('http');

// Test the public grades endpoints (no auth required)
function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.end();
    });
}

async function testPublicEndpoints() {
    console.log('🧪 Testing PUBLIC endpoints (no auth required)...\n');
    
    try {
        // Test 1: Health check
        console.log('💚 Test 1: GET /api/grades/health');
        const healthResponse = await makeRequest('/api/grades/health');
        console.log('✅ Status:', healthResponse.status);
        console.log('📊 Response:', healthResponse.data);
        console.log();
        
        // Test 2: Root grades endpoint
        console.log('🏠 Test 2: GET /api/grades/');
        const rootResponse = await makeRequest('/api/grades/');
        console.log('✅ Status:', rootResponse.status);
        console.log('📊 Response:', rootResponse.data);
        console.log();
        
        // Test 3: Academic years
        console.log('📅 Test 3: GET /api/grades/academic-years');
        const yearsResponse = await makeRequest('/api/grades/academic-years');
        console.log('✅ Status:', yearsResponse.status);
        console.log('📊 Response:', yearsResponse.data);
        console.log();
        
        // Test 4: Semesters
        console.log('📚 Test 4: GET /api/grades/semesters');
        const semestersResponse = await makeRequest('/api/grades/semesters');
        console.log('✅ Status:', semestersResponse.status);
        console.log('📊 Response:', semestersResponse.data);
        console.log();
        
        console.log('✅ All public endpoint tests completed!');
        console.log('💡 Auth endpoints (/enrolled, /student-performance) require JWT token');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('💡 Make sure the server is running locally on port 3000');
    }
}

// Run the tests
testPublicEndpoints();