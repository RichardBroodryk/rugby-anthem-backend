const express = require("express");
const router = express.Router();
const db = require("../db");

// ======================================================
// GET /api/videos
//
// Examples:
//
// /api/videos
//
// /api/videos?category=highlight
//
// /api/videos?category=hit,moment,try,tackle
//
// ======================================================

router.get("/", async (req, res) => {
  try {
    const { category } = req.query;

    let sql = `
      SELECT *
      FROM videos
    `;

    const params = [];

    if (category) {
      const categories = category
        .split(",")
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean);

      if (categories.length > 0) {
        const placeholders = categories
          .map((_, i) => `$${i + 1}`)
          .join(",");

        sql += `
          WHERE LOWER(category) IN (${placeholders})
        `;

        params.push(...categories);
      }
    }

    sql += `
      ORDER BY published_at DESC, id DESC
    `;

    const result = await db.query(sql, params);

    console.log(
      `🎥 Returning ${result.rows.length} video(s)${
        category ? ` for [${category}]` : ""
      }`
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to fetch videos"
    });
  }
});

module.exports = router;