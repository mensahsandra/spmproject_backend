// Course code to full name mapping
const COURSE_MAPPING = {
    // Information Technology Courses
    'BIT364': {
        code: 'BIT364',
        name: 'Business Information Technology',
        fullName: 'Business Information Technology',
        department: 'Information Technology',
        credits: 3,
        level: 300
    },
    'BIT301': {
        code: 'BIT301', 
        name: 'Database Management Systems',
        fullName: 'Database Management Systems',
        department: 'Information Technology',
        credits: 3,
        level: 300
    },
    'CS101': {
        code: 'CS101',
        name: 'Introduction to Computer Science',
        fullName: 'Introduction to Computer Science', 
        department: 'Computer Science',
        credits: 3,
        level: 100
    },
    'IT201': {
        code: 'IT201',
        name: 'Information Technology Fundamentals',
        fullName: 'Information Technology Fundamentals',
        department: 'Information Technology',
        credits: 3,
        level: 200
    },
    'CS201': {
        code: 'CS201',
        name: 'Data Structures and Algorithms',
        fullName: 'Data Structures and Algorithms',
        department: 'Computer Science',
        credits: 4,
        level: 200
    },
    'STAT301': {
        code: 'STAT301',
        name: 'Statistical Methods',
        fullName: 'Statistical Methods and Analysis',
        department: 'Statistics',
        credits: 3,
        level: 300
    },
    'MATH201': {
        code: 'MATH201',
        name: 'Discrete Mathematics',
        fullName: 'Discrete Mathematics for Computer Science',
        department: 'Mathematics',
        credits: 3,
        level: 200
    },
    'IT301': {
        code: 'IT301',
        name: 'Systems Analysis and Design',
        fullName: 'Systems Analysis and Design',
        department: 'Information Technology',
        credits: 3,
        level: 300
    },
    'CS301': {
        code: 'CS301',
        name: 'Software Engineering',
        fullName: 'Software Engineering Principles',
        department: 'Computer Science',
        credits: 4,
        level: 300
    },
    'IT401': {
        code: 'IT401',
        name: 'Information Security',
        fullName: 'Information Security and Cybersecurity',
        department: 'Information Technology',
        credits: 3,
        level: 400
    }
};

// Department to full name mapping
const DEPARTMENT_MAPPING = {
    'Information Technology': 'Information Technology',
    'Computer Science': 'Computer Science',
    'Statistics': 'Statistics',
    'Mathematics': 'Mathematics',
    'IT': 'Information Technology',
    'CS': 'Computer Science',
    'STAT': 'Statistics',
    'MATH': 'Mathematics'
};

// Helper functions
function getCourseFullName(courseCode) {
    const course = COURSE_MAPPING[courseCode];
    return course ? course.fullName : courseCode;
}

function getCourseName(courseCode) {
    const course = COURSE_MAPPING[courseCode];
    return course ? course.name : courseCode;
}

function getCourseDetails(courseCode) {
    return COURSE_MAPPING[courseCode] || {
        code: courseCode,
        name: courseCode,
        fullName: courseCode,
        department: 'Unknown',
        credits: 3,
        level: 100
    };
}

function getDepartmentFullName(deptCode) {
    return DEPARTMENT_MAPPING[deptCode] || deptCode;
}

// Get courses by department
function getCoursesByDepartment(department) {
    return Object.values(COURSE_MAPPING).filter(course => 
        course.department === department || course.department === getDepartmentFullName(department)
    );
}

// Enhanced course mapping with full details
function mapCoursesToFullDetails(courseCodes) {
    if (!Array.isArray(courseCodes)) return [];
    
    return courseCodes.map(code => ({
        code: code,
        name: getCourseName(code),
        fullName: getCourseFullName(code),
        details: getCourseDetails(code)
    }));
}

module.exports = {
    COURSE_MAPPING,
    DEPARTMENT_MAPPING,
    getCourseFullName,
    getCourseName,
    getCourseDetails,
    getDepartmentFullName,
    getCoursesByDepartment,
    mapCoursesToFullDetails
};