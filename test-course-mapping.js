// Test course mapping functionality
try {
    console.log('🧪 Testing course mapping...');
    
    const { mapCoursesToFullDetails, getCourseFullName, getDepartmentFullName } = require('./config/courseMapping');
    
    console.log('✅ Course mapping loaded successfully');
    
    // Test individual functions
    console.log('\n📋 Testing individual functions:');
    console.log('BIT364 full name:', getCourseFullName('BIT364'));
    console.log('BIT301 full name:', getCourseFullName('BIT301'));
    console.log('IT301 full name:', getCourseFullName('IT301'));
    console.log('IT401 full name:', getCourseFullName('IT401'));
    
    // Test mapping function
    console.log('\n📚 Testing course mapping:');
    const testCourses = ['BIT364', 'BIT301', 'IT301', 'IT401'];
    const mappedCourses = mapCoursesToFullDetails(testCourses);
    
    console.log('Mapped courses:', JSON.stringify(mappedCourses, null, 2));
    
    // Test department mapping
    console.log('\n🏢 Testing department mapping:');
    console.log('IT department:', getDepartmentFullName('Information Technology'));
    
} catch (error) {
    console.error('❌ Course mapping error:', error.message);
    console.error('Stack:', error.stack);
}