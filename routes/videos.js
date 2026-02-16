const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/videos
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM videos ORDER BY published_at DESC"
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching videos:", err);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

module.exports = router;
