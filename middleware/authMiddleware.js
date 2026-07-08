// =====================================================
// Auth Middleware — Rugby Anthem Zone
// Shared one-tier auth middleware
// =====================================================

const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      typeof authHeader !== "string" ||
      !authHeader.toLowerCase().startsWith("bearer ")
    ) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const jwtSecret = (process.env.JWT_SECRET || "").trim();

    if (!jwtSecret) {
      console.error("❌ JWT_SECRET missing in auth middleware");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const decoded = jwt.verify(token, jwtSecret);

    req.userId = decoded.userId ? String(decoded.userId) : null;
    req.userEmail = decoded.email ? String(decoded.email).toLowerCase() : null;

    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = { authMiddleware };