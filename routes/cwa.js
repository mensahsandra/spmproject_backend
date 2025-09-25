const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ 
        currentCWA: 87.5,
        previousCWA: 85.2,
        improvement: '+2.3',
        status: 'Excellent',
        message: 'Your Cumulative Weighted Average is performing well. Keep up the good work!',
        breakdown: {
            semester1: 84.0,
            semester2: 85.2,
            semester3: 87.5
        }
    });
});

module.exports = router;