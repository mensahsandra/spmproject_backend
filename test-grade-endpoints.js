// test-grade-endpoints.js
// Script to test the new grade management endpoints

const API_URL = process.env.API_URL || 'https://spmproject-backend.vercel.app';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function getAuthToken() {
  log('cyan', '\n🔐 Logging in as lecturer...');
  
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'kwabena@knust.edu.gh',
        password: 'password123!'
      })
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }

    const data = await response.json();
    log('green', '✅ Login successful!');
    return data.token;
  } catch (error) {
    log('red', `❌ Login failed: ${error.message}`);
    throw error;
  }
}

async function testHealthEndpoint(token) {
  log('cyan', '\n📊 Testing /api/grades/health...');
  
  try {
    const response = await fetch(`${API_URL}/api/grades/health`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      log('green', '✅ Health check passed!');
      console.log('   Available endpoints:', data.endpoints?.length || 0);
      
      // Check if new endpoints are listed
      const hasEnrolled = data.endpoints?.some(e => e.includes('enrolled'));
      const hasHistory = data.endpoints?.some(e => e.includes('history'));
      
      if (hasEnrolled && hasHistory) {
        log('green', '   ✅ New endpoints are registered!');
      } else {
        log('yellow', '   ⚠️  New endpoints not found in health check');
      }
    } else {
      log('red', '❌ Health check failed');
    }
    
    return data;
  } catch (error) {
    log('red', `❌ Health check error: ${error.message}`);
    throw error;
  }
}

async function testEnrolledEndpoint(token) {
  log('cyan', '\n👥 Testing /api/grades/enrolled...');
  
  try {
    const response = await fetch(
      `${API_URL}/api/grades/enrolled?courseCode=BIT364`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      log('green', '✅ Enrolled students endpoint working!');
      console.log(`   Course: ${data.courseName} (${data.courseCode})`);
      console.log(`   Total Students: ${data.totalStudents}`);
      
      if (data.students && data.students.length > 0) {
        log('green', '\n   📋 Sample Students:');
        data.students.slice(0, 2).forEach(student => {
          console.log(`      • ${student.fullName} (${student.studentId})`);
          console.log(`        Assessment: ${student.assessment}`);
          console.log(`        Midsem: ${student.midsem}`);
          console.log(`        End of Semester: ${student.endOfSemester}`);
        });
      }
    } else {
      log('red', '❌ Enrolled endpoint returned error');
      console.log('   Error:', data.message);
    }
    
    return data;
  } catch (error) {
    log('red', `❌ Enrolled endpoint error: ${error.message}`);
    return null;
  }
}

async function testHistoryEndpoint(token) {
  log('cyan', '\n📜 Testing /api/grades/history...');
  
  try {
    const response = await fetch(
      `${API_URL}/api/grades/history?courseCode=BIT364`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      log('green', '✅ Grade history endpoint working!');
      console.log(`   Course: ${data.courseName} (${data.courseCode})`);
      console.log(`   Total Entries: ${data.totalEntries}`);
      
      if (data.history && data.history.length > 0) {
        log('green', '\n   📋 Recent Grades:');
        data.history.slice(0, 3).forEach(entry => {
          console.log(`      • ${entry.studentName} - ${entry.assessmentType}`);
          console.log(`        Score: ${entry.score}/${entry.maxScore} (${entry.grade})`);
          console.log(`        Date: ${new Date(entry.submissionDate).toLocaleDateString()}`);
        });
      }
      
      if (data.metadata) {
        console.log('\n   📊 Metadata:');
        console.log(`      Assessment Types: ${data.metadata.assessmentTypes?.join(', ')}`);
        console.log(`      Students: ${data.metadata.students?.length || 0}`);
      }
    } else {
      log('red', '❌ History endpoint returned error');
      console.log('   Error:', data.message);
    }
    
    return data;
  } catch (error) {
    log('red', `❌ History endpoint error: ${error.message}`);
    return null;
  }
}

async function testAssignEndpoint(token) {
  log('cyan', '\n✏️  Testing /api/grades/assign...');
  
  try {
    const testGrade = {
      courseCode: 'BIT364',
      studentId: '1234568',
      assessmentType: 'Assessment',
      score: 92,
      maxScore: 100,
      feedback: 'Test grade assignment - Excellent work!',
      lecturerName: 'Test Lecturer'
    };

    const response = await fetch(
      `${API_URL}/api/grades/assign`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testGrade)
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      log('green', '✅ Grade assignment endpoint working!');
      console.log(`   Student: ${data.grade.studentName}`);
      console.log(`   Assessment: ${data.grade.assessmentType}`);
      console.log(`   Score: ${data.grade.score}/${data.grade.maxScore}`);
      console.log(`   Grade: ${data.grade.grade} (${data.grade.percentage}%)`);
      console.log(`   Feedback: ${data.grade.feedback}`);
    } else {
      log('red', '❌ Assignment endpoint returned error');
      console.log('   Error:', data.message);
    }
    
    return data;
  } catch (error) {
    log('red', `❌ Assignment endpoint error: ${error.message}`);
    return null;
  }
}

async function testSemestersEndpoint(token) {
  log('cyan', '\n📅 Testing /api/grades/semesters...');
  
  try {
    const response = await fetch(
      `${API_URL}/api/grades/semesters`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      log('green', '✅ Semesters endpoint working!');
      console.log(`   Available: ${data.semesters.join(', ')}`);
      
      // Check if it's using blocks instead of semesters
      const hasBlocks = data.semesters.some(s => s.includes('Block'));
      if (hasBlocks) {
        log('green', '   ✅ Using Block system as requested!');
      } else {
        log('yellow', '   ⚠️  Still using Semester system');
      }
    } else {
      log('red', '❌ Semesters endpoint returned error');
      console.log('   Error:', data.message);
    }
    
    return data;
  } catch (error) {
    log('red', `❌ Semesters endpoint error: ${error.message}`);
    return null;
  }
}

async function runAllTests() {
  log('blue', '\n╔════════════════════════════════════════════════╗');
  log('blue', '║   Grade Management Endpoints Test Suite       ║');
  log('blue', '╚════════════════════════════════════════════════╝');
  log('yellow', `\nAPI URL: ${API_URL}\n`);

  try {
    // Step 1: Get authentication token
    const token = await getAuthToken();
    
    // Step 2: Test health endpoint
    await testHealthEndpoint(token);
    
    // Step 3: Test enrolled students endpoint
    const enrolledResult = await testEnrolledEndpoint(token);
    
    // Step 4: Test grade history endpoint
    const historyResult = await testHistoryEndpoint(token);
    
    // Step 5: Test grade assignment endpoint
    const assignResult = await testAssignEndpoint(token);
    
    // Step 6: Test semesters endpoint
    const semestersResult = await testSemestersEndpoint(token);
    
    // Summary
    log('blue', '\n╔════════════════════════════════════════════════╗');
    log('blue', '║              Test Summary                      ║');
    log('blue', '╚════════════════════════════════════════════════╝\n');
    
    const results = [
      { name: 'Health Check', passed: true },
      { name: 'Enrolled Students', passed: enrolledResult?.success },
      { name: 'Grade History', passed: historyResult?.success },
      { name: 'Grade Assignment', passed: assignResult?.success },
      { name: 'Semesters', passed: semestersResult?.success }
    ];
    
    results.forEach(result => {
      if (result.passed) {
        log('green', `   ✅ ${result.name}`);
      } else {
        log('red', `   ❌ ${result.name}`);
      }
    });
    
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    
    log('blue', `\n   Total: ${passedCount}/${totalCount} tests passed`);
    
    if (passedCount === totalCount) {
      log('green', '\n🎉 All tests passed! Endpoints are working correctly.\n');
    } else {
      log('yellow', '\n⚠️  Some tests failed. Check the logs above for details.\n');
    }
    
  } catch (error) {
    log('red', `\n❌ Test suite failed: ${error.message}\n`);
    process.exit(1);
  }
}

// Run the tests
runAllTests();