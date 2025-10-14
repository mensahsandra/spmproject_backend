const axios = require('axios');

async function seedProductionDatabase() {
    const baseURL = 'https://spmproject-backend.vercel.app';
    
    console.log('🌱 Seeding production database with BIT364 data...\n');
    
    try {
        // First, verify what data currently exists
        console.log('🔍 Step 1: Checking current database state...');
        const verifyResponse = await axios.get(`${baseURL}/api/admin/verify-data?courseCode=BIT364`);
        console.log('📊 Current BIT364 records:', verifyResponse.data.totalRecords);
        
        if (verifyResponse.data.courseSummary.BIT364) {
            console.log('👥 Existing students:');
            verifyResponse.data.courseSummary.BIT364.forEach(student => {
                console.log(`   - ${student.studentName}: Class=${student.classAssessment || 'null'}, Mid=${student.midSemester || 'null'}`);
            });
        } else {
            console.log('❌ No BIT364 data found in production database');
        }
        
        console.log('\n' + '='.repeat(60));
        
        // Seed the production database
        console.log('\n🌱 Step 2: Seeding production database...');
        const seedResponse = await axios.post(`${baseURL}/api/admin/seed-bit364`);
        
        console.log('✅ Seeding successful!');
        console.log('📈 Records deleted:', seedResponse.data.recordsDeleted);
        console.log('📈 Records inserted:', seedResponse.data.recordsInserted);
        console.log('📈 Verification count:', seedResponse.data.verificationCount);
        
        console.log('\n👥 Seeded students:');
        seedResponse.data.students.forEach(student => {
            console.log(`   - ${student.studentName}: Class=${student.classAssessment || 'null'}, Mid=${student.midSemester || 'null'}`);
        });
        
        console.log('\n' + '='.repeat(60));
        
        // Final verification
        console.log('\n✅ Step 3: Final verification...');
        const finalVerify = await axios.get(`${baseURL}/api/admin/verify-data?courseCode=BIT364`);
        console.log('📊 Final BIT364 records:', finalVerify.data.totalRecords);
        
        console.log('\n🎉 Production database seeding complete!');
        console.log('🎯 Frontend should now show real database data');
        console.log('🌐 Test at: https://spmproject-web.vercel.app/lecturer/assessment');
        
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response:', error.response.data);
        }
    }
}

// Run the seeding
seedProductionDatabase();