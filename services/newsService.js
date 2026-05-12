const axios = require("axios");
const { mapNewsItem } = require("../utils/newsMapper");
const { newsData } = require("../fallback/newsData");

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

/* ================= GET NEWS ================= */

async function getNews() {
  const start = Date.now();

  console.log("🟡 [NEWS SERVICE] Fetching news...");

  try {
    const response = await axios.get(
      "https://gnews.io/api/v4/search",
      {
        params: {
          q: "rugby",
          lang: "en",
          max: 20,
          token: GNEWS_API_KEY,
        },
      }
    );

    console.log("🟡 RAW RESPONSE:", response.data);

    const articles = response.data?.articles || [];

    console.log(`🟡 API returned ${articles.length} articles`);

    if (!articles.length) {
      console.warn("⚠️ EMPTY API RESPONSE — NOT USING FALLBACK");
      return []; // 🔥 DO NOT FALL BACK HERE
    }

    const mapped = articles.map(mapNewsItem).filter(Boolean);

    console.log(
      `🟢 SUCCESS (${mapped.length}) — ${Date.now() - start}ms`
    );

    return mapped;
  } catch (error) {
    console.error(
      "🔴 FULL ERROR:",
      error.response?.data || error.message
    );

    return []; // 🔥 DO NOT FALL BACK
  }
}

module.exports = { getNews };