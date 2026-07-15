const express = require("express");
const router = express.Router();
const db = require("../db");

// ======================================================
// GET /api/videos
//
// Supports:
//
// /api/videos
// /api/videos?category=highlight
// /api/videos?category=hit
// /api/videos?category=analysis
//
// ======================================================

router.get("/", async (req, res) => {
  try {
    const { category } = req.query;

    let query = `
      SELECT *
      FROM videos
    `;

    const params = [];

    if (category) {
      query += `
        WHERE LOWER(category) = LOWER($1)
      `;
      params.push(category);
    }

    query += `
      ORDER BY published_at DESC, id DESC
    `;

    const result = await db.query(query, params);

    console.log(
      `🎥 Returned ${result.rows.length} video(s)${
        category ? ` for category "${category}"` : ""
      }`
    );

    res.json(result.rows);

  } catch (err) {
    console.error("❌ Error loading videos:", err);

    res.status(500).json({
      error: "Failed to load videos",
    });
  }
});

module.exports = router;