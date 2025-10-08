// Script to seed initial course data
const mongoose = require('mongoose');
const Course = require('../models/Course');
require('dotenv').config();

const courses = [
  // Information Technology Department
  {
    code: 'BIT364',
    name: 'Business Information Technology',
    department: 'Information Technology',
    credits: 3,
    description: 'Introduction to business applications of information technology, covering enterprise systems, e-commerce, and digital transformation.',
    level: '300',
    semester: 'All'
  },
  {
    code: 'BIT301',
    name: 'Database Management Systems',
    department: 'Information Technology',
    credits: 3,
    description: 'Comprehensive study of database design, implementation, and management using modern DBMS technologies.',
    level: '300',
    semester: 'All'
  },
  {
    code: 'BIT201',
    name: 'Web Development Fundamentals',
    department: 'Information Technology',
    credits: 3,
    description: 'Introduction to web development using HTML, CSS, JavaScript, and modern web frameworks.',
    level: '200',
    semester: 'All'
  },
  {
    code: 'BIT401',
    name: 'Information Systems Project',
    department: 'Information Technology',
    credits: 4,
    description: 'Capstone project course where students design and implement a complete information system.',
    level: '400',
    semester: 'All',
    prerequisites: ['BIT364', 'BIT301']
  },
  
  // Computer Science Department
  {
    code: 'CS101',
    name: 'Introduction to Computer Science',
    department: 'Computer Science',
    credits: 3,
    description: 'Fundamental concepts of computer science including programming, algorithms, and problem-solving.',
    level: '100',
    semester: 'All'
  },
  {
    code: 'CS201',
    name: 'Data Structures and Algorithms',
    department: 'Computer Science',
    credits: 3,
    description: 'Study of fundamental data structures and algorithms with emphasis on efficiency and implementation.',
    level: '200',
    semester: 'All',
    prerequisites: ['CS101']
  },
  {
    code: 'CS301',
    name: 'Software Engineering',
    department: 'Computer Science',
    credits: 3,
    description: 'Principles and practices of software development including design patterns, testing, and project management.',
    level: '300',
    semester: 'All',
    prerequisites: ['CS201']
  },
  {
    code: 'CS302',
    name: 'Computer Networks',
    department: 'Computer Science',
    credits: 3,
    description: 'Study of computer network architectures, protocols, and distributed systems.',
    level: '300',
    semester: 'All'
  },
  
  // Business Administration
  {
    code: 'BUS201',
    name: 'Principles of Management',
    department: 'Business Administration',
    credits: 3,
    description: 'Fundamental principles of management including planning, organizing, leading, and controlling.',
    level: '200',
    semester: 'All'
  },
  {
    code: 'BUS301',
    name: 'Entrepreneurship',
    department: 'Business Administration',
    credits: 3,
    description: 'Introduction to entrepreneurship, business planning, and startup management.',
    level: '300',
    semester: 'All'
  },
  
  // Mathematics
  {
    code: 'MATH201',
    name: 'Statistics for IT',
    department: 'Mathematics',
    credits: 3,
    description: 'Statistical methods and their applications in information technology and data analysis.',
    level: '200',
    semester: 'All'
  },
  {
    code: 'MATH301',
    name: 'Discrete Mathematics',
    department: 'Mathematics',
    credits: 3,
    description: 'Mathematical foundations for computer science including logic, sets, and graph theory.',
    level: '300',
    semester: 'All'
  }
];

async function seedCourses() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spm');
    console.log('Connected to MongoDB');

    // Clear existing courses
    await Course.deleteMany({});
    console.log('Cleared existing courses');

    // Insert new courses
    const insertedCourses = await Course.insertMany(courses);
    console.log(`✅ Successfully seeded ${insertedCourses.length} courses`);

    // Display seeded courses
    console.log('\n📚 Seeded Courses:');
    insertedCourses.forEach(course => {
      console.log(`  ${course.code} - ${course.name} (${course.department})`);
    });

    console.log('\n🎉 Course seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding courses:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedCourses();
}

module.exports = { seedCourses, courses };