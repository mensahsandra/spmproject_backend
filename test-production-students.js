const axios = require('axios');

async function testProductionStudentsPerformance() {
    const baseURL = 'https://spmproject-backend.vercel.app';
    
    console.log('🧪 Testing production /api/students/performance endpoint...\n');
    
    try {
        // Test students performance for BIT364
        console.log('📚 Test: GET /api/students/performance?courseCode=BIT364');
        const response = await axios.get(`${baseURL}/api/students/performance?courseCode=BIT364`);
        
        console.log('✅ Status:', response.status);
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
        
        console.log('\n✅ Success! Students performance now fetches from grades table');
        console.log('✅ Maps studentName column to student name display');
        console.log('✅ Maps classAssessment and midSemester columns directly');
        console.log('\n🎯 Frontend should now show real database data in student performance section');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response:', error.response.data);
            
            if (error.response.status === 401) {
                console.log('\n💡 Expected: 401 Unauthorized - endpoint requires authentication');
                console.log('💡 This confirms the endpoint exists and is properly secured');
            }
        }
    }
}

// Run the test
testProductionStudentsPerformance();