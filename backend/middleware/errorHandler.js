// backend/middleware/errorHandler.js
const errorHandler = (err, req, res, _next) => {
  console.error(`[error] ${req.method} ${req.path}`, err.message);
  if (err.name === "ValidationError") return res.status(400).json({ error: "Validation failed", details: Object.values(err.errors).map(e=>e.message) });
  if (err.code === 11000)             return res.status(409).json({ error: `${Object.keys(err.keyValue)[0]} already exists` });
  if (err.name === "CastError")       return res.status(400).json({ error: "Invalid ID format" });
  if (err.name === "JsonWebTokenError")  return res.status(401).json({ error: "Invalid token" });
  if (err.name === "TokenExpiredError")  return res.status(401).json({ error: "Token expired" });
  if (err.message?.startsWith("CORS:"))  return res.status(403).json({ error: err.message });
  res.status(err.statusCode || 500).json({ error: process.env.NODE_ENV === "production" ? "Something went wrong" : err.message });
};

module.exports = errorHandler;