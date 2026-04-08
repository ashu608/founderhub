// backend/middleware/auth.js
const jwt = require("jsonwebtoken");

const requireAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Authentication required" });
    const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch { res.status(401).json({ error: "Invalid or expired token" }); }
};

const optionalAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
      req.userId = decoded.userId;
    }
  } catch { /* unauthenticated is fine */ }
  next();
};

module.exports = { requireAuth, optionalAuth };