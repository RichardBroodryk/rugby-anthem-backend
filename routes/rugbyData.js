const express = require("express");
const fetch = require("node-fetch");

const router = express.Router();

const BASE_URL = "https://v1.rugby.api-sports.io";
const API_KEY = process.env.API_SPORTS_KEY;

// 🔥 SIMPLE CACHE
const cache = {};

/* ==================================================
   FIXTURES (DEBUG ENABLED)
   ================================================== */

router.get("/fixtures", async (req, res) => {
  const { league, season } = req.query;

  console.log("🔥 REQUEST RECEIVED:", league, season);

  const key = `fixtures-${league}-${season}`;

  try {
    // ✅ CACHE HIT
    if (
      cache[key] &&
      Date.now() - cache[key].ts < 60000
    ) {
      console.log("🟡 CACHE HIT");
      return res.json(cache[key].data);
    }

    console.log("🚀 CALLING API-SPORTS...");

    const response = await fetch(
      `${BASE_URL}/fixtures?league=${league}&season=${season}`,
      {
        method: "GET",
        headers: {
          "x-apisports-key": API_KEY,
          "Accept": "application/json",
        },
      }
    );

    console.log("📡 API STATUS:", response.status);

    // 🔴 HANDLE API ERROR
    if (!response.ok) {
      const text = await response.text();
      console.error("❌ API-SPORTS ERROR BODY:", text);

      return res.status(500).json({
        error: "API failed",
        status: response.status,
      });
    }

    const data = await response.json();

    console.log(
      "✅ API SUCCESS — items:",
      data.response?.length || 0
    );

    cache[key] = {
      ts: Date.now(),
      data: data.response || [],
    };

    res.json(cache[key].data);
  } catch (err) {
    console.error("🔥 FETCH FAILED:", err.message);

    res.status(500).json({
      error: "Fetch failed",
    });
  }
});

/* ==================================================
   STANDINGS (DEBUG ENABLED)
   ================================================== */

router.get("/standings", async (req, res) => {
  const { league, season } = req.query;

  console.log("🔥 STANDINGS REQUEST:", league, season);

  const key = `standings-${league}-${season}`;

  try {
    if (
      cache[key] &&
      Date.now() - cache[key].ts < 300000
    ) {
      console.log("🟡 STANDINGS CACHE HIT");
      return res.json(cache[key].data);
    }

    console.log("🚀 CALLING API-SPORTS (STANDINGS)...");

    const response = await fetch(
      `${BASE_URL}/standings?league=${league}&season=${season}`,
      {
        method: "GET",
        headers: {
          "x-apisports-key": API_KEY,
          "Accept": "application/json",
        },
      }
    );

    console.log("📡 STANDINGS STATUS:", response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ STANDINGS ERROR BODY:", text);

      return res.status(500).json({
        error: "API failed",
        status: response.status,
      });
    }

    const data = await response.json();

    console.log(
      "✅ STANDINGS SUCCESS — items:",
      data.response?.length || 0
    );

    cache[key] = {
      ts: Date.now(),
      data: data.response || [],
    };

    res.json(cache[key].data);
  } catch (err) {
    console.error("🔥 STANDINGS FETCH FAILED:", err.message);

    res.status(500).json({
      error: "Fetch failed",
    });
  }
});

module.exports = router;