const http = require('http');

// Test the grades database connection locally
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

async function testLocalGradesEndpoints() {
    console.log('🧪 Testing LOCAL grades database endpoints...\n');
    
    try {
        // Test 1: Get enrolled students with grades
        console.log('📚 Test 1: GET /api/grades/enrolled?courseCode=BIT301');
        const enrolledResponse = await makeRequest('/api/grades/enrolled?courseCode=BIT301');
        console.log('✅ Status:', enrolledResponse.status);
        console.log('📊 Students found:', enrolledResponse.data.totalStudents || 0);
        console.log('🎯 Data source:', enrolledResponse.data.dataSource || 'unknown');
        
        if (enrolledResponse.data.students && enrolledResponse.data.students.length > 0) {
            console.log('👥 Sample student data:');
            enrolledResponse.data.students.slice(0, 2).forEach(student => {
                console.log(`   - ${student.fullName}: Class=${student.classAssessment || 'null'}, Mid=${student.midSemester || 'null'}, End=${student.endOfSemester || 'null'}`);
            });
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test 2: Get student performance data
        console.log('📊 Test 2: GET /api/grades/student-performance?courseCode=BIT301');
        const performanceResponse = await makeRequest('/api/grades/student-performance?courseCode=BIT301');
        console.log('✅ Status:', performanceResponse.status);
        console.log('📈 Total students:', performanceResponse.data.totalStudents || 0);
        console.log('💯 Students with grades:', performanceResponse.data.studentsWithGrades || 0);
        console.log('📋 Completion rate:', (performanceResponse.data.summary?.completionRate || 0) + '%');
        console.log('🎯 Data source:', performanceResponse.data.dataSource || 'unknown');
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test 3: Get students API
        console.log('👥 Test 3: GET /api/students/performance?courseCode=BIT301');
        const studentsResponse = await makeRequest('/api/students/performance?courseCode=BIT301');
        console.log('✅ Status:', studentsResponse.status);
        console.log('🎓 Total students:', studentsResponse.data.totalStudents || 0);
        console.log('📚 Course:', studentsResponse.data.courseName || 'unknown');
        
        if (studentsResponse.data.students && studentsResponse.data.students.length > 0) {
            console.log('🔍 First student sample:');
            const firstStudent = studentsResponse.data.students[0];
            console.log(`   - ${firstStudent.fullName}:`);
            console.log(`     Class Assessment: ${firstStudent.classAssessment || 'null'}`);
            console.log(`     Mid Semester: ${firstStudent.midSemester || 'null'}`);
            console.log(`     End of Semester: ${firstStudent.endOfSemester || 'null'}`);
            console.log(`     Academic Year: ${firstStudent.academicYear}`);
        }
        
        console.log('\n✅ All LOCAL tests completed successfully!');
        console.log('\n🎯 Next Step: Test deployed backend and frontend integration');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('💡 Make sure the server is running locally on port 3000: npm start or node index.js');
    }
}

// Run the tests
testLocalGradesEndpoints();