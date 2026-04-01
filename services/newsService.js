const axios = require("axios");
const { mapNewsItem } = require("../utils/newsMapper");
const { newsData } = require("../fallback/newsData");

const NEWS_API_KEY = process.env.NEWS_API_KEY;

console.log("NEWS_API_KEY:", process.env.NEWS_API_KEY);

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
      token: process.env.GNEWS_API_KEY,
    },
  }
);

    const articles = response.data?.articles || [];

    console.log(
      `🟡 [NEWS SERVICE] API returned ${articles.length} articles`
    );

    const mapped = articles
      .map(mapNewsItem)
      .filter(Boolean);

    if (!mapped.length) {
      console.warn("⚠️ [NEWS SERVICE] Empty API → using fallback");
      return newsData;
    }

    console.log(
      `🟢 [NEWS SERVICE] Success (${mapped.length}) — ${
        Date.now() - start
      }ms`
    );

    return mapped;
  } catch (error) {
    console.error("🔴 [NEWS SERVICE] API failed → fallback");

    return newsData;
  }
}

module.exports = { getNews };