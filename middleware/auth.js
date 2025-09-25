// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function auth(requiredRoles = []) {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (!token) return res.status(401).json({ ok: false, message: 'Missing token' });
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
      req.user = payload.user || payload;
      if (requiredRoles.length && !requiredRoles.includes(req.user.role)) {
        return res.status(403).json({ ok: false, message: 'Forbidden' });
      }
      next();
    } catch (e) {
      return res.status(401).json({ ok: false, message: 'Invalid token', error: String(e?.message || e) });
    }
  };
};
