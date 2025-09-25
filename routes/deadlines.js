const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({
        message: 'Upcoming deadlines and assignments',
        deadlines: [
            { 
                title: 'Project Report - Database Systems', 
                due: '2025-04-20',
                daysLeft: 6,
                priority: 'High'
            },
            { 
                title: 'Assignment 3 - Web Development', 
                due: '2025-04-25',
                daysLeft: 11,
                priority: 'Medium'
            },
            { 
                title: 'Quiz - Data Structures', 
                due: '2025-04-18',
                daysLeft: 4,
                priority: 'High'
            }
        ],
        totalPending: 3
    });
});

module.exports = router;