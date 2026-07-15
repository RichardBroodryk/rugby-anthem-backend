const axios = require("axios");
const { mapNewsItem } = require("../utils/newsMapper");

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

/* ================= GET NEWS ================= */

async function getNews() {
  const start = Date.now();

  console.log("🟡 [NEWS SERVICE] Fetching news...");

  // ✅ CHECK IF API KEY EXISTS
  if (!GNEWS_API_KEY || GNEWS_API_KEY === "xxxxxxxxxxxxxxxxxxxxxxxxxxx") {
    console.error("🔴 [NEWS SERVICE] GNEWS_API_KEY is not set or is invalid!");
    console.error("🔴 Please set GNEWS_API_KEY in your .env file");
    return [];
  }

  try {
    console.log(`🟡 Using API Key: ${GNEWS_API_KEY.substring(0, 5)}...`);

    const response = await axios.get(
      "https://gnews.io/api/v4/search",
      {
        params: {
          q: "rugby",
          lang: "en",
          max: 20,
          token: GNEWS_API_KEY,
        },
        timeout: 10000, // 10 second timeout
      }
    );

    console.log(`🟡 [NEWS SERVICE] Response status: ${response.status}`);

    // ✅ LOG THE FULL RESPONSE STRUCTURE
    console.log("🟡 [NEWS SERVICE] Response data keys:", Object.keys(response.data));
    console.log("🟡 [NEWS SERVICE] Articles found:", response.data?.articles?.length || 0);

    const articles = response.data?.articles || [];

    if (!articles.length) {
      console.warn("⚠️ [NEWS SERVICE] API returned 0 articles");
      // ✅ LOG FULL RESPONSE FOR DEBUGGING
      console.warn("📦 [NEWS SERVICE] Full response:", JSON.stringify(response.data, null, 2));
      return [];
    }

    // ✅ LOG FIRST ARTICLE STRUCTURE
    console.log("🟡 [NEWS SERVICE] First article structure:", Object.keys(articles[0]));

    const mapped = articles.map(mapNewsItem).filter(Boolean);

    console.log(
      `🟢 [NEWS SERVICE] SUCCESS (${mapped.length} items) — ${Date.now() - start}ms`
    );

    return mapped;
  } catch (error) {
    console.error("🔴 [NEWS SERVICE] ERROR:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      code: error.code,
    });

    // ✅ CHECK FOR SPECIFIC ERROR TYPES
    if (error.response?.status === 429) {
      console.error("🔴 Rate limit exceeded - GNews API daily limit reached");
    } else if (error.response?.status === 401) {
      console.error("🔴 Invalid API key - please check your GNEWS_API_KEY");
    } else if (error.code === 'ECONNABORTED') {
      console.error("🔴 Request timeout - GNews API taking too long");
    }

    return []; // 🔥 DO NOT FALL BACK
  }
}

module.exports = { getNews };