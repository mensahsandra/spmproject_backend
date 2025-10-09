// routes/auth.js (updated for real Mongo users)
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
    "/login",
    [
        body("email").isEmail().withMessage("Please enter a valid email"),
        body("password").exists().withMessage("Password is required"),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: "Validation errors",
                    errors: errors.array(),
                });
            }

            const { email, password } = req.body;
            const suppliedId = req.body?.studentId || req.body?.userId;

            const user = await User.findOne({ email: email.toLowerCase() }).lean();
            if (!user) {
                console.warn('login.user_not_found', { email: email.toLowerCase() });
                return res.status(400).json({
                    success: false,
                    message: "Invalid credentials",
                });
            }
            console.log("body: ", req.body)
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                console.warn('login.password_mismatch', { email: email.toLowerCase() });
                return res.status(400).json({
                    success: false,
                    message: "Invalid credentials",
                });
            }

            if (user.role === "student" && suppliedId && user.studentId && user.studentId !== suppliedId) {
                console.warn('login.student_id_mismatch', { email: email.toLowerCase(), suppliedId, expected: user.studentId });
                return res.status(400).json({
                    success: false,
                    message: "Invalid student ID",
                });
            }

            const payload = {
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    name: user.name,
                    ...(user.studentId && { studentId: user.studentId }),
                    ...(user.staffId && { staffId: user.staffId })
                },
            };

            // Sign JWT
            jwt.sign(
                payload,
                process.env.JWT_SECRET || 'dev_secret_change_me',
                { expiresIn: "24h" },
                (err, token) => {
                    if (err) {
                        console.error('JWT sign error:', err);
                        return res.status(500).json({ success: false, message: 'Server error', error: String(err?.message || err) });
                    }
                    return res.json({
                        success: true,
                        message: "Login successful",
                        token,
                        user: payload.user,
                    });
                }
            );
        } catch (error) {
            console.error("Login error:", error.message);
            res.status(500).json({
                success: false,
                message: "Server error",
            });
        }
    }
);

// Helpful GET for /api/auth/login (avoid confusing 404 when probing in browser)
router.get('/login', (req, res) => {
    res.status(405).json({
        ok: false,
        error: 'method_not_allowed',
        message: 'Use POST with JSON body { email, password, studentId? } to login'
    });
});

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post(
    "/register",
    [
        body("email").isEmail().withMessage("Please enter a valid email"),
        body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
        body("name").notEmpty().withMessage("Name is required"),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: "Validation errors",
                    errors: errors.array(),
                });
            }

            const { email, password, name, role = "student", studentId, staffId, course, centre, semester } = req.body;
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "User already exists",
                });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const newUser = await User.create({
                email: email.toLowerCase(),
                password: hashedPassword,
                name,
                role,
                studentId: role === 'student' ? studentId : undefined,
                staffId: role === 'lecturer' ? staffId : undefined,
                course, centre, semester,
            });

            // Create JWT payload
            const payload = {
                user: {
                    id: newUser._id,
                    email: newUser.email,
                    role: newUser.role,
                    name: newUser.name,
                    ...(newUser.studentId && { studentId: newUser.studentId }),
                    ...(newUser.staffId && { staffId: newUser.staffId })
                },
            };

            // Sign JWT
            jwt.sign(
                payload,
                process.env.JWT_SECRET || 'dev_secret_change_me',
                { expiresIn: "24h" },
                (err, token) => {
                    if (err) throw err;
                    res.status(201).json({
                        success: true,
                        message: "Registration successful",
                        token,
                        user: payload.user,
                    });
                }
            );
        } catch (error) {
            console.error("Registration error:", error.message);
            res.status(500).json({
                success: false,
                message: "Server error",
            });
        }
    }
);

// @route   POST /api/auth/add-test-users
// @desc    Add test users (DEVELOPMENT ONLY)
// @access  Public (but would be restricted in production)
router.post("/add-test-users", async (req, res) => {
    try {
        // Hash passwords
        const salt = await bcrypt.genSalt(10);
        const studentPasswordHash = await bcrypt.hash('password0!', salt);
        const lecturerPasswordHash = await bcrypt.hash('password123!', salt);

        // Define student user
        const studentUser = {
            email: 'ransford@knust.edu.gh',
            password: studentPasswordHash,
            name: 'Ransford Student',
            role: 'student',
            studentId: '1234567',
            course: 'Computer Science',
            centre: 'Kumasi',
            semester: 'Fall 2025'
        };

        // Define lecturer user with enhanced details
        const lecturerUser = {
            email: 'kwabena@knust.edu.gh',
            password: lecturerPasswordHash,
            name: 'Kwabena Lecturer',
            role: 'lecturer',
            staffId: 'STF123',
            centre: 'Kumasi',
            honorific: 'Prof.',
            title: 'Senior Lecturer',
            department: 'Information Technology',
            courses: ['BIT364', 'BIT301', 'CS101'],
            officeLocation: 'IT Block, Room 205',
            phoneNumber: '+233-24-123-4567',
            fullName: 'Prof. Kwabena Lecturer'
        };

        // Check if users exist and create/update as needed
        let studentResult = await User.findOneAndUpdate(
            { email: studentUser.email },
            studentUser,
            { upsert: true, new: true }
        );

        let lecturerResult = await User.findOneAndUpdate(
            { email: lecturerUser.email },
            lecturerUser,
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            message: "Test users created/updated successfully",
            users: {
                student: {
                    email: studentUser.email,
                    studentId: studentUser.studentId,
                    role: 'student'
                },
                lecturer: {
                    email: lecturerUser.email,
                    staffId: lecturerUser.staffId,
                    role: 'lecturer'
                }
            }
        });
    } catch (error) {
        console.error("Error adding test users:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: String(error?.message || error)
        });
    }
});

// Seed a few students with course assignments (for grades enrolled endpoint)
router.post('/add-sample-students', async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const pw = await bcrypt.hash('password0!', salt);
        const samples = [
            { email: 'stud1@knust.edu.gh', password: pw, name: 'Student One', role: 'student', studentId: 'S1001', course: 'BIT364' },
            { email: 'stud2@knust.edu.gh', password: pw, name: 'Student Two', role: 'student', studentId: 'S1002', course: 'BIT364' },
            { email: 'stud3@knust.edu.gh', password: pw, name: 'Student Three', role: 'student', studentId: 'S1003', course: 'BIT364' },
        ];
        const results = [];
        for (const s of samples) {
            const r = await User.findOneAndUpdate(
                { email: s.email },
                s,
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
            results.push({ email: r.email, studentId: r.studentId, course: r.course });
        }
        res.json({ ok: true, created: results.length, students: results });
    } catch (error) {
        console.error('add-sample-students error:', error);
        res.status(500).json({ ok: false, message: 'Server error', error: String(error?.message || error) });
    }
});

// Helpful GET to indicate seeding endpoint usage (so a browser visit is informative)
router.get('/add-test-users', (req, res) => {
    res.status(405).json({ ok: false, error: 'method_not_allowed', message: 'Use POST to /api/auth/add-test-users to (re)seed test users' });
});

// Debug endpoint to see what's in the token
router.get('/debug-token', (req, res) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!token) {
            return res.json({
                debug: true,
                issue: 'no_token',
                authHeader: authHeader,
                message: 'No token provided'
            });
        }

        const jwt = require('jsonwebtoken');
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');

        res.json({
            debug: true,
            issue: 'none',
            tokenValid: true,
            payload: payload,
            userRole: payload.user?.role || payload.role,
            userId: payload.user?.id || payload.id,
            message: 'Token is valid'
        });
    } catch (e) {
        res.json({
            debug: true,
            issue: 'invalid_token',
            error: e.message,
            message: 'Token is invalid'
        });
    }
});

// Temporary bypass endpoint for debugging
router.get('/me-bypass', async (req, res) => {
    // Return a mock successful response to stop redirect loop
    res.json({
        success: true,
        user: {
            id: 'debug-user',
            userId: 'debug-user',
            lecturerId: 'debug-user', // This should fix the undefined lecturer ID
            email: 'debug@example.com',
            name: 'Debug Lecturer',
            role: 'lecturer', // Change to lecturer to test attendance
            staffId: 'STF123',
            honorific: 'Prof.',
            title: 'Senior Lecturer',
            department: 'Information Technology',
            courses: ['BIT364', 'BIT301', 'CS101'],
            fullName: 'Prof. Debug Lecturer',
            centre: 'Kumasi',
            officeLocation: 'IT Block, Room 205'
        },
        debug: true,
        message: 'Bypass endpoint - for debugging only'
    });
});

// Enhanced /me endpoint with explicit IDs and full lecturer details
router.get('/me-enhanced', auth(['student', 'lecturer', 'admin']), async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password').lean();
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const responseUser = {
            id: user._id,
            userId: user._id,
            lecturerId: user._id, // Explicit lecturerId for attendance routes
            email: user.email,
            name: user.name,
            role: user.role,
            centre: user.centre,
            isActive: user.isActive !== false
        };

        // Add student-specific fields
        if (user.role === 'student') {
            Object.assign(responseUser, {
                studentId: user.studentId,
                course: user.course,
                semester: user.semester
            });
        }

        // Add lecturer-specific fields
        if (user.role === 'lecturer') {
            Object.assign(responseUser, {
                staffId: user.staffId,
                honorific: user.honorific || 'Mr.',
                title: user.title || 'Lecturer',
                department: user.department || 'Information Technology',
                courses: user.courses || ['BIT364'],
                fullName: user.fullName || `${user.honorific || 'Mr.'} ${user.name}`,
                officeLocation: user.officeLocation,
                phoneNumber: user.phoneNumber
            });
        }

        res.json({
            success: true,
            user: responseUser
        });
    } catch (error) {
        console.error("Enhanced auth me error:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current authenticated user
// @access  Private
router.get('/me', auth(['student', 'lecturer', 'admin']), async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password').lean();
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                ...(user.studentId && { studentId: user.studentId }),
                ...(user.staffId && { staffId: user.staffId }),
                ...(user.course && { course: user.course }),
                ...(user.centre && { centre: user.centre }),
                ...(user.semester && { semester: user.semester })
            }
        });
    } catch (error) {
        console.error("Auth me error:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth(['student', 'lecturer', 'admin']), async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password').lean();
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                ...(user.studentId && { studentId: user.studentId }),
                ...(user.staffId && { staffId: user.staffId }),
                ...(user.course && { course: user.course }),
                ...(user.centre && { centre: user.centre }),
                ...(user.semester && { semester: user.semester })
            }
        });
    } catch (error) {
        console.error("Profile fetch error:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

// @route   GET /api/auth/lecturer/profile
// @desc    Get lecturer profile (alias for profile with lecturer-specific data)
// @access  Private (Lecturer only)
router.get('/lecturer/profile', auth(['lecturer', 'admin']), async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password').lean();
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Lecturer not found"
            });
        }

        if (user.role !== 'lecturer' && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Lecturer role required."
            });
        }

        res.json({
            success: true,
            lecturer: {
                id: user._id,
                email: user.email,
                name: user.name,
                fullName: user.fullName || `${user.honorific || 'Mr.'} ${user.name}`,
                honorific: user.honorific || 'Mr.',
                role: user.role,
                staffId: user.staffId || 'N/A',
                centre: user.centre || 'Not specified',
                department: user.department || 'Information Technology',
                title: user.title || 'Lecturer',
                courses: user.courses || [],
                courseAssignments: user.teachingAssignments || [],
                officeLocation: user.officeLocation,
                phoneNumber: user.phoneNumber,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error("Lecturer profile fetch error:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

// @route   GET /api/auth/student/dashboard
// @desc    Get student dashboard data with greeting and navigation info
// @access  Private (Student only)
router.get('/student/dashboard', auth(['student', 'admin']), async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password').lean();
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        // Get current date for greeting
        const today = new Date();
        const dateString = today.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        res.json({
            success: true,
            showGreeting: true, // Always true for dashboard
            greeting: {
                date: dateString,
                message: `Hello, ${user.name}!`,
                description: "Your dashboard gives quick access to attendance, grades and notifications.",
                subtitle: "Helping you stay ahead every step of the way"
            },
            profile: {
                name: user.name,
                role: user.role,
                studentId: user.studentId,
                email: user.email,
                centre: user.centre || 'Not specified',
                avatar: user.avatar || null
            },
            dashboardCards: [
                {
                    id: 'attendance',
                    title: 'Attendance',
                    description: "Here for today's class? Click to check in and mark your attendance.",
                    icon: 'attendance',
                    color: 'green',
                    link: '/student/attendance'
                },
                {
                    id: 'performance',
                    title: 'Check Performance',
                    description: "Check your grades obtained for your registered courses.",
                    icon: 'performance',
                    color: 'green',
                    link: '/student/performance'
                },
                {
                    id: 'deadlines',
                    title: 'Upcoming Deadlines',
                    description: "Check all approaching assignment and project deadlines.",
                    icon: 'deadlines',
                    color: 'red',
                    link: '/student/deadlines'
                }
            ],
            navigation: {
                main: [
                    { id: 'home', label: 'Home', path: '/student/dashboard', active: true },
                    { id: 'attendance', label: 'Attendance', path: '/student/attendance', active: false },
                    { id: 'performance', label: 'Performance', path: '/student/performance', active: false },
                    { id: 'deadlines', label: 'Deadlines', path: '/student/deadlines', active: false }
                ],
                otherServices: [
                    { id: 'counselling', label: 'Counselling', path: '/student/counselling', active: false },
                    { id: 'about', label: 'About Us', path: '/student/about', active: false }
                ]
            }
        });
    } catch (error) {
        console.error("Student dashboard fetch error:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

// @route   GET /api/auth/lecturer/dashboard
// @desc    Get lecturer dashboard data with greeting and navigation info
// @access  Private (Lecturer only)
router.get('/lecturer/dashboard', auth(['lecturer', 'admin']), async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password').lean();
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Lecturer not found"
            });
        }

        // Get current date for greeting
        const today = new Date();
        const dateString = today.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        res.json({
            success: true,
            showGreeting: true, // Always true for dashboard
            greeting: {
                date: dateString,
                message: `Welcome, ${user.name}!`,
                description: "Your dashboard gives quick access to attendance logs, generate sessions, grades update and notifications.",
                subtitle: "Helping you stay ahead every step of the way"
            },
            profile: {
                name: user.name,
                fullName: user.fullName || `${user.honorific || 'Mr.'} ${user.name}`,
                honorific: user.honorific || 'Mr.',
                title: user.title || 'Lecturer',
                department: user.department || 'Information Technology',
                role: user.role,
                staffId: user.staffId,
                email: user.email,
                centre: user.centre || 'Not specified',
                courses: user.courses || ['BIT364'],
                officeLocation: user.officeLocation,
                phoneNumber: user.phoneNumber,
                avatar: user.avatar || null
            },
            dashboardCards: [
                {
                    id: 'generate',
                    title: 'Generate Session Code',
                    description: "Access all Your Courses in One Place",
                    icon: 'generate',
                    color: 'green',
                    link: '/lecturer/generate'
                },
                {
                    id: 'attendance',
                    title: 'View Attendance Logs',
                    description: "Get an Overview of Class Attendance",
                    icon: 'attendance',
                    color: 'green',
                    link: '/lecturer/attendance'
                },
                {
                    id: 'grades',
                    title: 'Input/Update Grades',
                    description: "View and Manage Pending Assessments to Grade",
                    icon: 'grades',
                    color: 'green',
                    link: '/lecturer/assessment'
                },
                {
                    id: 'export',
                    title: 'Export Reports',
                    description: "Easily export student performance reports in CSV or PDF format for academic review, record-keeping, or submission.",
                    icon: 'export',
                    color: 'green',
                    link: '/lecturer/export'
                }
            ],
            navigation: {
                main: [
                    { id: 'home', label: 'Home', path: '/lecturer/dashboard', active: true },
                    { id: 'generate', label: 'Generate', path: '/lecturer/generate', active: false },
                    { id: 'attendance', label: 'Attendance', path: '/lecturer/attendance', active: false },
                    { id: 'assessment', label: 'Assessment', path: '/lecturer/assessment', active: false },
                    { id: 'export', label: 'Export', path: '/lecturer/export', active: false }
                ],
                otherServices: [
                    { id: 'counselling', label: 'Counselling', path: '/lecturer/counselling', active: false },
                    { id: 'feedback', label: 'Feedback', path: '/lecturer/feedback', active: false }
                ]
            }
        });
    } catch (error) {
        console.error("Lecturer dashboard fetch error:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

// @route   GET /api/auth/page-config/:role/:page
// @desc    Get page-specific configuration (whether to show greeting, etc.)
// @access  Private
router.get('/page-config/:role/:page', auth(['student', 'lecturer', 'admin']), async (req, res) => {
    try {
        const { role, page } = req.params;

        // Define which pages should show greeting
        const dashboardPages = ['dashboard', 'home'];
        const showGreeting = dashboardPages.includes(page);

        res.json({
            success: true,
            pageConfig: {
                role,
                page,
                showGreeting,
                showProfile: true, // Always show profile in top-right
                layout: 'dashboard' // Always use dashboard layout
            }
        });
    } catch (error) {
        console.error("Page config fetch error:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile including courses
// @access  Private
router.put('/profile', auth(['student', 'lecturer', 'admin']), async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            name,
            courses,
            centre,
            semester,
            honorific,
            title,
            department,
            officeLocation,
            phoneNumber
        } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Prepare update object
        const updateObj = {};

        // Common fields
        if (name) updateObj.name = name;
        if (centre) updateObj.centre = centre;
        if (semester) updateObj.semester = semester;

        // Role-specific fields
        if (user.role === 'lecturer') {
            if (honorific) updateObj.honorific = honorific;
            if (title) updateObj.title = title;
            if (department) updateObj.department = department;
            if (officeLocation) updateObj.officeLocation = officeLocation;
            if (phoneNumber) updateObj.phoneNumber = phoneNumber;

            // Update fullName if honorific or name changed
            if (honorific || name) {
                updateObj.fullName = `${honorific || user.honorific || 'Mr.'} ${name || user.name}`;
            }
        }

        // Handle courses update
        if (courses && Array.isArray(courses)) {
            updateObj.courses = courses;
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateObj,
            { new: true }
        ).select('-password');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: updatedUser._id,
                userId: updatedUser._id,
                lecturerId: updatedUser._id,
                email: updatedUser.email,
                name: updatedUser.name,
                role: updatedUser.role,
                courses: updatedUser.courses,
                centre: updatedUser.centre,
                semester: updatedUser.semester,
                ...(updatedUser.role === 'student' && {
                    studentId: updatedUser.studentId,
                    courseEnrollments: updatedUser.courseEnrollments
                }),
                ...(updatedUser.role === 'lecturer' && {
                    staffId: updatedUser.staffId,
                    honorific: updatedUser.honorific,
                    title: updatedUser.title,
                    department: updatedUser.department,
                    fullName: updatedUser.fullName,
                    officeLocation: updatedUser.officeLocation,
                    phoneNumber: updatedUser.phoneNumber,
                    teachingAssignments: updatedUser.teachingAssignments
                })
            }
        });
    } catch (error) {
        console.error("Profile update error:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

// @route   PATCH /api/auth/courses
// @desc    Update only user courses
// @access  Private
router.patch('/courses', auth(['student', 'lecturer', 'admin']), async (req, res) => {
    try {
        const userId = req.user.id;
        const { courses } = req.body;

        if (!courses || !Array.isArray(courses)) {
            return res.status(400).json({
                success: false,
                message: 'Courses array is required'
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { courses },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            message: 'Courses updated successfully',
            user: {
                id: updatedUser._id,
                courses: updatedUser.courses,
                role: updatedUser.role
            }
        });
    } catch (error) {
        console.error("Courses update error:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

// @route   GET /api/auth/lecturer/courses
// @desc    Get lecturer's assigned courses (for frontend dropdowns)
// @access  Private (Lecturer only)
router.get('/lecturer/courses', auth(['lecturer', 'admin']), async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password').lean();
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Lecturer not found"
            });
        }

        if (user.role !== 'lecturer' && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Lecturer role required."
            });
        }

        // Get course details for assigned courses
        const Course = require('../models/Course');
        let courseDetails = [];

        if (user.courses && user.courses.length > 0) {
            courseDetails = await Course.find({
                code: { $in: user.courses },
                isActive: true
            }).select('code name department credits description').lean();
        }

        // If no courses assigned, provide default courses for demo
        if (courseDetails.length === 0) {
            courseDetails = [
                {
                    code: 'BIT364',
                    name: 'Business Information Technology',
                    department: 'Information Technology',
                    credits: 3,
                    description: 'Introduction to business applications of information technology'
                },
                {
                    code: 'BIT301',
                    name: 'Database Management Systems',
                    department: 'Information Technology',
                    credits: 3,
                    description: 'Comprehensive study of database design and implementation'
                }
            ];
        }

        res.json({
            success: true,
            lecturer: {
                id: user._id,
                name: user.name,
                fullName: user.fullName || `${user.honorific || 'Mr.'} ${user.name}`
            },
            courses: courseDetails.map(course => ({
                code: course.code,
                name: course.name,
                department: course.department,
                credits: course.credits,
                description: course.description
            })),
            totalCourses: courseDetails.length
        });
    } catch (error) {
        console.error("Lecturer courses fetch error:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

module.exports = router;