const http = require('http');

// Test with the correct course code that's in our database
async function testWithCorrectCourseCode() {
    console.log('🧪 Testing with correct course code BIT301...\n');
    
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
    
    try {
        // Test with BIT301 (the course we actually have data for)
        console.log('📚 Test: GET /api/grades/enrolled?courseCode=BIT301');
        const response = await makeRequest('/api/grades/enrolled?courseCode=BIT301');
        console.log('✅ Status:', response.status);
        
        if (response.status === 401) {
            console.log('🔒 Expected 401 - authentication required');
            console.log('📋 Response:', response.data);
        } else {
            console.log('📊 Students found:', response.data.totalStudents || 0);
            console.log('🎯 Data source:', response.data.dataSource || 'unknown');
            
            if (response.data.students && response.data.students.length > 0) {
                console.log('👥 First 3 students:');
                response.data.students.slice(0, 3).forEach((student, idx) => {
                    console.log(`   ${idx + 1}. ${student.fullName}: Class=${student.classAssessment || 'null'}, Mid=${student.midSemester || 'null'}`);
                });
            }
        }
        
        console.log('\n' + '='.repeat(60));
        
        // Also test what happens with a different course code
        console.log('\n📚 Test: GET /api/grades/enrolled?courseCode=BIT364');
        const response2 = await makeRequest('/api/grades/enrolled?courseCode=BIT364');
        console.log('✅ Status:', response2.status);
        
        if (response2.status === 401) {
            console.log('🔒 Expected 401 - authentication required');
        } else {
            console.log('📊 Students found:', response2.data.totalStudents || 0);
            console.log('🎯 Data source:', response2.data.dataSource || 'unknown');
        }
        
        console.log('\n💡 Database contains data for course: BIT301');
        console.log('💡 If frontend requests different course, it will get sample data');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the test
testWithCorrectCourseCode();