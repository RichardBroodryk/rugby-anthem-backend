// =====================================================
// Auth Middleware — Rugby Anthem Zone
// =====================================================

const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 IMPORTANT: match your system
    req.userId = decoded.userId;

    next();

  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = { authMiddleware };