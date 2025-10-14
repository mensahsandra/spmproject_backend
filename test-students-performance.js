const http = require('http');

// Test the updated students performance endpoint
async function testStudentsPerformance() {
    console.log('🧪 Testing updated /api/students/performance endpoint...\n');
    
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
        // Test students performance for BIT364
        console.log('📚 Test: GET /api/students/performance?courseCode=BIT364');
        const response = await makeRequest('/api/students/performance?courseCode=BIT364');
        console.log('✅ Status:', response.status);
        
        if (response.status === 401) {
            console.log('🔒 Expected 401 - authentication required for this endpoint');
            console.log('📋 Response:', response.data);
        } else if (response.status === 200) {
            console.log('📊 Total students:', response.data.totalStudents || 0);
            console.log('🎯 Data source:', response.data.dataSource || 'unknown');
            console.log('📚 Course name:', response.data.courseName || 'unknown');
            
            if (response.data.students && response.data.students.length > 0) {
                console.log('\n👥 Students from grades table:');
                response.data.students.forEach((student, idx) => {
                    console.log(`   ${idx + 1}. ${student.fullName}: Class=${student.classAssessment || 'null'}, Mid=${student.midSemester || 'null'}`);
                });
                
                if (response.data.summary) {
                    console.log('\n📊 Summary:');
                    console.log(`   - Students with Class Assessment: ${response.data.summary.studentsWithClassAssessment}`);
                    console.log(`   - Students with Mid Semester: ${response.data.summary.studentsWithMidSemester}`);
                    console.log(`   - Average Class Assessment: ${response.data.summary.averageClassAssessment?.toFixed(1) || 'N/A'}`);
                    console.log(`   - Average Mid Semester: ${response.data.summary.averageMidSemester?.toFixed(1) || 'N/A'}`);
                }
            } else {
                console.log('📝 No students found in grades table');
            }
        } else {
            console.log('❌ Unexpected status:', response.status);
            console.log('📋 Response:', response.data);
        }
        
        console.log('\n💡 This endpoint now fetches directly from grades table');
        console.log('💡 Maps student names and grades from the database columns');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the test
testStudentsPerformance();