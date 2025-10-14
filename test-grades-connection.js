const axios = require('axios');

// Test the grades database connection
async function testGradesEndpoints() {
    const baseURL = 'https://spmproject-backend.vercel.app';
    
    console.log('🧪 Testing grades database endpoints...\n');
    
    try {
        // Test 1: Get enrolled students with grades for BIT364 (the course we just seeded)
        console.log('📚 Test 1: GET /api/grades/enrolled?courseCode=BIT364');
        const enrolledResponse = await axios.get(`${baseURL}/api/grades/enrolled?courseCode=BIT364`);
        console.log('✅ Status:', enrolledResponse.status);
        console.log('📊 Students found:', enrolledResponse.data.totalStudents);
        console.log('🎯 Data source:', enrolledResponse.data.dataSource);
        
        if (enrolledResponse.data.students && enrolledResponse.data.students.length > 0) {
            console.log('👥 Sample student data:');
            enrolledResponse.data.students.slice(0, 2).forEach(student => {
                console.log(`   - ${student.fullName}: Class=${student.classAssessment || 'null'}, Mid=${student.midSemester || 'null'}, End=${student.endOfSemester || 'null'}`);
            });
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test 2: Get student performance data for BIT364
        console.log('📊 Test 2: GET /api/grades/student-performance?courseCode=BIT364');
        const performanceResponse = await axios.get(`${baseURL}/api/grades/student-performance?courseCode=BIT364`);
        console.log('✅ Status:', performanceResponse.status);
        console.log('📈 Total students:', performanceResponse.data.totalStudents);
        console.log('💯 Students with grades:', performanceResponse.data.studentsWithGrades);
        console.log('📋 Completion rate:', performanceResponse.data.summary.completionRate + '%');
        console.log('🎯 Data source:', performanceResponse.data.dataSource);
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test 3: Get students API for BIT364
        console.log('👥 Test 3: GET /api/students/performance?courseCode=BIT364');
        const studentsResponse = await axios.get(`${baseURL}/api/students/performance?courseCode=BIT364`);
        console.log('✅ Status:', studentsResponse.status);
        console.log('🎓 Total students:', studentsResponse.data.totalStudents);
        console.log('📚 Course:', studentsResponse.data.courseName);
        
        if (studentsResponse.data.students && studentsResponse.data.students.length > 0) {
            console.log('🔍 First student sample:');
            const firstStudent = studentsResponse.data.students[0];
            console.log(`   - ${firstStudent.fullName}:`);
            console.log(`     Class Assessment: ${firstStudent.classAssessment || 'null'}`);
            console.log(`     Mid Semester: ${firstStudent.midSemester || 'null'}`);
            console.log(`     End of Semester: ${firstStudent.endOfSemester || 'null'}`);
            console.log(`     Academic Year: ${firstStudent.academicYear}`);
        }
        
        console.log('\n✅ All tests completed successfully!');
        console.log('\n🎯 Frontend Integration Points:');
        console.log('   - https://spmproject-web.vercel.app/lecturer/assessment');
        console.log('   - Section 3: Student Management & Performance');
        console.log('   - Should now show real database data');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response:', error.response.data);
        }
    }
}

// Run the tests
testGradesEndpoints();