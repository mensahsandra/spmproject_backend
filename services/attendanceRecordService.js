const mongoose = require('mongoose');
const { AttendanceLog } = require('../models/Attendance');

function computeDateRange(date, filterType) {
  if (!date) return {};
  const base = new Date(String(date));
  if (isNaN(base.getTime())) return {};
  const s = new Date(base);
  const e = new Date(base);
  const f = String(filterType);
  if (f === 'week') {
    const d = s.getDay();
    const diffToMonday = (d + 6) % 7;
    s.setDate(s.getDate() - diffToMonday);
    e.setDate(s.getDate() + 7);
  } else if (f === 'month') {
    s.setDate(1);
    e.setMonth(s.getMonth() + 1);
    e.setDate(1);
  } else {
    e.setDate(e.getDate() + 1); // day default
  }
  return { start: s, end: e };
}

class AttendanceRecordService {
  static async getLogs({ courseCode, sessionCode, date, filterType = 'day', page = 1, limit = 25 }) {
    const usingDb = mongoose.connection?.readyState === 1;
    if (!usingDb) return { records: [], total: 0 };

    const { start, end } = computeDateRange(date, filterType);

    const match = {};
    if (courseCode) match.courseCode = String(courseCode);
    if (sessionCode) match.sessionCode = String(sessionCode);
    if (start && end) match.timestamp = { $gte: start, $lt: end };

    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(200, Math.max(1, parseInt(limit) || 25));

    const pipeline = [
      { $match: match },
      { $sort: { timestamp: -1, createdAt: -1 } },
      {
        $facet: {
          data: [
            { $skip: (p - 1) * l },
            { $limit: l },
            {
              $project: {
                _id: 0,
                timestamp: '$timestamp',
                studentId: '$studentId',
                centre: '$centre',
                courseCode: '$courseCode',
                courseName: '$courseName',
                lecturer: '$lecturer',
                sessionCode: '$sessionCode',
              }
            }
          ],
          total: [ { $count: 'count' } ]
        }
      }
    ];

    const result = await AttendanceLog.aggregate(pipeline);
    const data = result?.[0]?.data || [];
    const total = result?.[0]?.total?.[0]?.count || 0;
    return { records: data, total };
  }
}

module.exports = AttendanceRecordService;
