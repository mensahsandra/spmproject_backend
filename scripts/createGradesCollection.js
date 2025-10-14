// MongoDB Script to create grades collection
// Run this in MongoDB Compass or mongo shell

// Switch to the database (replace with your actual database name)
use("students-performance-db");

// Drop existing grades collection if it exists (optional)
db.grades.drop();

// Create the grades collection with validation schema
db.createCollection("grades", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["studentId", "studentName"],
      properties: {
        studentId: {
          bsonType: "string",
          description: "Student ID must be a string and is required"
        },
        studentName: {
          bsonType: "string",
          description: "Student name must be a string and is required"
        },
        courseCode: {
          bsonType: "string",
          description: "Course code must be a string"
        },
        courseName: {
          bsonType: "string",
          description: "Course name must be a string"
        },
        academicYear: {
          bsonType: "string",
          description: "Academic year must be a string"
        },
        semester: {
          bsonType: "string",
          description: "Semester must be a string"
        },
        block: {
          bsonType: "string",
          description: "Block must be a string"
        },
        classAssessment: {
          bsonType: ["double", "int", "null"],
          minimum: 0,
          maximum: 100,
          description: "Class assessment score between 0-100"
        },
        midSemester: {
          bsonType: ["double", "int", "null"],
          minimum: 0,
          maximum: 100,
          description: "Mid semester score between 0-100"
        },
        endOfSemester: {
          bsonType: ["double", "int", "null"],
          minimum: 0,
          maximum: 100,
          description: "End of semester score between 0-100"
        },
        dateEntered: {
          bsonType: "date",
          description: "Date when grade was entered"
        },
        lecturer: {
          bsonType: "string",
          description: "Lecturer name"
        }
      }
    }
  }
});

// Insert sample data as requested
db.grades.insertMany([
  {
    studentId: "5",
    studentName: "Alice Johnson",
    classAssessment: 85,
    midSemester: 92,
    endOfSemester: null,
    courseCode: "BIT301",
    courseName: "Database Systems",
    academicYear: "2024/2025",
    semester: "Semester 1",
    block: "Block A",
    dateEntered: new Date(),
    lecturer: "Dr. Ansah"
  },
  {
    studentId: "2",
    studentName: "Mercy Johnson",
    classAssessment: 86,
    midSemester: 62,
    endOfSemester: null,
    courseCode: "BIT301",
    courseName: "Database Systems",
    academicYear: "2024/2025",
    semester: "Semester 1",
    block: "Block A",
    dateEntered: new Date(),
    lecturer: "Dr. Ansah"
  },
  // Additional sample students with empty grades
  {
    studentId: "1234568",
    studentName: "John Kwaku Doe",
    classAssessment: null,
    midSemester: null,
    endOfSemester: null,
    courseCode: "BIT301",
    courseName: "Database Systems",
    academicYear: "2024/2025",
    semester: "Semester 1",
    block: "Block A",
    dateEntered: new Date(),
    lecturer: "Dr. Ansah"
  },
  {
    studentId: "1234456",
    studentName: "Saaed Hawa",
    classAssessment: null,
    midSemester: null,
    endOfSemester: null,
    courseCode: "BIT301",
    courseName: "Database Systems",
    academicYear: "2024/2025",
    semester: "Semester 1",
    block: "Block A",
    dateEntered: new Date(),
    lecturer: "Dr. Ansah"
  },
  {
    studentId: "1233456",
    studentName: "Kwarteng Samuel",
    classAssessment: null,
    midSemester: null,
    endOfSemester: null,
    courseCode: "BIT301",
    courseName: "Database Systems",
    academicYear: "2024/2025",
    semester: "Semester 1",
    block: "Block A",
    dateEntered: new Date(),
    lecturer: "Dr. Ansah"
  },
  {
    studentId: "1234557",
    studentName: "Nashiru Alhassan",
    classAssessment: null,
    midSemester: null,
    endOfSemester: null,
    courseCode: "BIT301",
    courseName: "Database Systems",
    academicYear: "2024/2025",
    semester: "Semester 1",
    block: "Block A",
    dateEntered: new Date(),
    lecturer: "Dr. Ansah"
  }
]);

// Create indexes for better performance
db.grades.createIndex({ "courseCode": 1, "studentId": 1 });
db.grades.createIndex({ "academicYear": 1, "semester": 1, "block": 1 });
db.grades.createIndex({ "studentId": 1 });

// Verify the data was inserted
print("Total documents inserted:", db.grades.countDocuments());

// Show sample data
print("\nSample grades data:");
db.grades.find().limit(3).forEach(doc => {
  print(`${doc.studentName} (${doc.studentId}): Class=${doc.classAssessment}, Mid=${doc.midSemester}, End=${doc.endOfSemester}`);
});

print("\nGrades collection created successfully!");
print("You can now use the following operations:");
print("- db.grades.find({ courseCode: 'BIT301' })");
print("- db.grades.find({ studentId: '5' })");
print("- db.grades.updateOne({ studentId: '5' }, { $set: { endOfSemester: 88 } })");