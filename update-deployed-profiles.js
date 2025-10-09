// Update profiles on deployed database
const mongoose = require('mongoose');
const User = require('./models/User');

async function updateDeployedProfiles() {
    try {
        console.log('🔄 Updating deployed database profiles...');
        
        // Connect to the same MongoDB that the deployed app uses
        const mongoUri = 'mongodb+srv://sandramensah243_db_user:BLfftPv57vGS28sr@studentmatrix0.39egn6a.mongodb.net/students-performance-db?retryWrites=true&w=majority';
        
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to deployed database');
        
        // Update Kwabena Lecturer specifically
        const kwabenaUpdate = await User.findOneAndUpdate(
            { email: 'kwabena@knust.edu.gh' },
            {
                $set: {
                    honorific: 'Prof.',
                    title: 'Senior Lecturer',
                    department: 'Information Technology',
                    courses: ['BIT364', 'BIT301', 'IT301', 'IT401'],
                    fullName: 'Prof. Kwabena Lecturer',
                    officeLocation: 'IT Block, Room 205',
                    phoneNumber: '+233-24-123-4567',
                    isActive: true
                }
            },
            { new: true, upsert: false }
        );

        if (kwabenaUpdate) {
            console.log('✅ Updated Kwabena Lecturer profile on deployed DB:', {
                name: kwabenaUpdate.name,
                honorific: kwabenaUpdate.honorific,
                courses: kwabenaUpdate.courses,
                fullName: kwabenaUpdate.fullName
            });
        }

        // Update all lecturers with missing honorifics
        const lecturerUpdates = await User.updateMany(
            { 
                role: 'lecturer',
                $or: [
                    { honorific: { $exists: false } },
                    { honorific: null },
                    { honorific: '' }
                ]
            },
            {
                $set: {
                    honorific: 'Mr.',
                    title: 'Lecturer',
                    department: 'Information Technology'
                }
            }
        );

        console.log(`✅ Updated ${lecturerUpdates.modifiedCount} lecturers with missing honorifics`);

        // Update all users with missing fullName
        const fullNameUpdates = await User.updateMany(
            { 
                role: 'lecturer',
                $or: [
                    { fullName: { $exists: false } },
                    { fullName: null },
                    { fullName: '' }
                ]
            },
            [
                {
                    $set: {
                        fullName: {
                            $concat: [
                                { $ifNull: ['$honorific', 'Mr.'] },
                                ' ',
                                '$name'
                            ]
                        }
                    }
                }
            ]
        );

        console.log(`✅ Updated ${fullNameUpdates.modifiedCount} lecturers with fullName`);

        console.log('🎉 Deployed database update completed!');
        
        // Test the deployed API
        console.log('\n🧪 Testing deployed API...');
        const testResponse = await fetch('https://spmproject-backend.vercel.app/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'kwabena@knust.edu.gh',
                password: 'password123!'
            })
        });
        
        const testData = await testResponse.json();
        if (testData.success) {
            const meResponse = await fetch('https://spmproject-backend.vercel.app/api/auth/me', {
                headers: { 'Authorization': `Bearer ${testData.token}` }
            });
            const meData = await meResponse.json();
            
            console.log('📋 Deployed API now returns:');
            console.log('   - Name:', meData.user?.name);
            console.log('   - Honorific:', meData.user?.honorific);
            console.log('   - Courses:', meData.user?.courses);
            console.log('   - Full Name:', meData.user?.fullName);
        }
        
        await mongoose.disconnect();
        console.log('✅ Disconnected from database');
        
    } catch (error) {
        console.error('❌ Error updating deployed profiles:', error);
    }
}

updateDeployedProfiles();