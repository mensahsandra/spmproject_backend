const express = require('express');
const { Parser } = require('json2csv');
const router = express.Router();

// In-memory grades store for demo
// Structure: { courseCode, studentId, score, grade, updatedAt }
const gradeStore = [
    { courseCode: 'BIT364', studentId: '12345678', score: 85, grade: 'A', updatedAt: new Date().toISOString() },
];

router.get('/', (req, res) => {
    res.json({
        message: 'Your current grades',
        grades: gradeStore,
        semester: 'Semester 3',
        totalCredits: 12
    });
});

// Lecturer: list grades (optionally filter by courseCode)
router.get('/list', (req, res) => {
    const { courseCode } = req.query || {};
    const list = courseCode ? gradeStore.filter(g => g.courseCode === String(courseCode)) : gradeStore;
    res.json({ ok: true, count: list.length, grades: list });
});

// Lecturer: update or upsert a grade
router.post('/update', (req, res) => {
    const { courseCode, studentId, score, grade } = req.body || {};
    if (!courseCode || !studentId) {
        return res.status(400).json({ ok: false, message: 'courseCode and studentId are required' });
    }
    const idx = gradeStore.findIndex(g => g.courseCode === courseCode && g.studentId === studentId);
    const entry = { courseCode, studentId, score: Number(score ?? 0), grade: grade || null, updatedAt: new Date().toISOString() };
    if (idx >= 0) gradeStore[idx] = entry; else gradeStore.push(entry);
    res.json({ ok: true, message: 'Grade saved', grade: entry });
});

// Lecturer: export CSV
router.get('/export', (req, res) => {
    const { courseCode } = req.query || {};
    const list = courseCode ? gradeStore.filter(g => g.courseCode === String(courseCode)) : gradeStore;
    const fields = ['updatedAt','courseCode','studentId','score','grade'];
    const parser = new Parser({ fields });
    const csv = parser.parse(list);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="grades_export_${Date.now()}.csv"`);
    res.send(csv);
});

module.exports = router;