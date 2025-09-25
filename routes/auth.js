// routes/auth.js (updated for real Mongo users)
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require('../models/User');
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
                return res.status(400).json({
                    success: false,
                    message: "Invalid credentials",
                });
            }

        const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid credentials",
                });
            }

        if (user.role === "student" && suppliedId && user.studentId && user.studentId !== suppliedId) {
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

        // Define lecturer user
        const lecturerUser = {
            email: 'kwabena@knust.edu.gh',
            password: lecturerPasswordHash,
            name: 'Kwabena Lecturer',
            role: 'lecturer',
            staffId: 'STF123',
            centre: 'Kumasi'
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

module.exports = router;