const express = require("express");
const { getNews } = require("../services/newsService");

const router = express.Router();

/* ================= GET /api/news ================= */

router.get("/", async (req, res) => {
  const start = Date.now();

  console.log("🟢 [NEWS ROUTE] Request received");

  try {
    const news = await getNews();

    console.log(
      `🟢 [NEWS ROUTE] Response sent (${news.length} items) — ${
        Date.now() - start
      }ms`
    );

    // ✅ SET HEADERS TO PREVENT CACHING
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.json(news);
  } catch (error) {
    console.error("🔴 [NEWS ROUTE] Error:", error);

    // 🔥 NEVER BREAK FRONTEND
    return res.json([]);
  }
});

module.exports = router;