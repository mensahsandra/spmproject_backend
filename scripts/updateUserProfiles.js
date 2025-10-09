// Update existing users with missing profile data
const mongoose = require('mongoose');
const User = require('../models/User');

async function updateUserProfiles() {
    try {
        console.log('🔄 Updating user profiles with missing data...');
        
        // Update Kwabena Lecturer specifically
        const kwabenaUpdate = await User.findOneAndUpdate(
            { email: 'kwabena@knust.edu.gh' },
            {
                $set: {
                    honorific: 'Prof.',
                    title: 'Senior Lecturer',
                    department: 'Information Technology',
                    courses: ['BIT364', 'BIT301', 'CS101'],
                    fullName: 'Prof. Kwabena Lecturer',
                    officeLocation: 'IT Block, Room 205',
                    phoneNumber: '+233-24-123-4567',
                    isActive: true
                }
            },
            { new: true, upsert: false }
        );

        if (kwabenaUpdate) {
            console.log('✅ Updated Kwabena Lecturer profile:', {
                name: kwabenaUpdate.name,
                honorific: kwabenaUpdate.honorific,
                courses: kwabenaUpdate.courses,
                fullName: kwabenaUpdate.fullName
            });
        } else {
            console.log('⚠️ Kwabena Lecturer not found - will be created on next login');
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

        // Update all students with missing courses array
        const studentUpdates = await User.updateMany(
            { 
                role: 'student',
                courses: { $exists: false }
            },
            [
                {
                    $set: {
                        courses: {
                            $cond: {
                                if: { $ne: ['$course', null] },
                                then: ['$course'],
                                else: []
                            }
                        }
                    }
                }
            ]
        );

        console.log(`✅ Updated ${studentUpdates.modifiedCount} students with courses array`);

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

        console.log('🎉 Profile update completed successfully!');
        
        return {
            success: true,
            kwabenaUpdated: !!kwabenaUpdate,
            lecturersUpdated: lecturerUpdates.modifiedCount,
            studentsUpdated: studentUpdates.modifiedCount,
            fullNameUpdates: fullNameUpdates.modifiedCount
        };

    } catch (error) {
        console.error('❌ Error updating user profiles:', error);
        throw error;
    }
}

// If run directly
if (require.main === module) {
    const connectDB = require('../config/db');
    
    connectDB().then(async () => {
        try {
            const result = await updateUserProfiles();
            console.log('Final result:', result);
            process.exit(0);
        } catch (error) {
            console.error('Script failed:', error);
            process.exit(1);
        }
    }).catch(error => {
        console.error('Database connection failed:', error);
        process.exit(1);
    });
}

module.exports = updateUserProfiles;