const express = require("express");
const fetch = require("node-fetch");

const router = express.Router();

const BASE_URL = "https://v1.rugby.api-sports.io";
const API_KEY = process.env.API_SPORTS_KEY;

// 🔥 SIMPLE CACHE
const cache = {};

/* ==================================================
   FIXTURES
   ================================================== */

router.get("/fixtures", async (req, res) => {
  const { league, season } = req.query;

  const key = `fixtures-${league}-${season}`;

  try {
    if (
      cache[key] &&
      Date.now() - cache[key].ts < 60000
    ) {
      return res.json(cache[key].data);
    }

    const response = await fetch(
      `${BASE_URL}/fixtures?league=${league}&season=${season}`,
      {
        headers: {
          "x-apisports-key": API_KEY,
        },
      }
    );

    const data = await response.json();

    cache[key] = {
      ts: Date.now(),
      data: data.response || [],
    };

    res.json(cache[key].data);
  } catch (err) {
    res.status(500).json({ error: "API failed" });
  }
});

/* ==================================================
   STANDINGS
   ================================================== */

router.get("/standings", async (req, res) => {
  const { league, season } = req.query;

  const key = `standings-${league}-${season}`;

  try {
    if (
      cache[key] &&
      Date.now() - cache[key].ts < 300000
    ) {
      return res.json(cache[key].data);
    }

    const response = await fetch(
      `${BASE_URL}/standings?league=${league}&season=${season}`,
      {
        headers: {
          "x-apisports-key": API_KEY,
        },
      }
    );

    const data = await response.json();

    cache[key] = {
      ts: Date.now(),
      data: data.response || [],
    };

    res.json(cache[key].data);
  } catch (err) {
    res.status(500).json({ error: "API failed" });
  }
});

module.exports = router;