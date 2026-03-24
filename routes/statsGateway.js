const express = require("express");
const axios = require("axios");

const router = express.Router();

/*
========================================
COUNTRY NORMALIZER
========================================
*/

function normalizeCountry(name) {
  if (!name) return "unknown";
  return name.toLowerCase().replace(/\s/g, "-");
}

/*
========================================
MATCH CONVERTER (FRONTEND FORMAT)
========================================
*/

function convertMatch(game) {
  return {
    id: game.id || null,

    tournament: game.league?.name || "International Test",

    date: game.date ? game.date.split("T")[0] : "",

    venue: game.venue?.name || "TBC",

    home: {
      name: game.teams?.home?.name || "",
      country: normalizeCountry(game.teams?.home?.name)
    },

    away: {
      name: game.teams?.away?.name || "",
      country: normalizeCountry(game.teams?.away?.name)
    },

    score: {
      home: game.scores?.home ?? null,
      away: game.scores?.away ?? null
    }
  };
}

function convertFixtures(fixtures) {
  if (!Array.isArray(fixtures)) return [];
  return fixtures.map(convertMatch);
}

/*
========================================
FETCH MATCHES (LIVE DATA)
========================================
*/

async function fetchMatches() {

  const today = new Date().toISOString().split("T")[0];

  try {

    const response = await axios.get(
      "https://v1.rugby.api-sports.io/games",
      {
        params: {
          date: today,
          timezone: "Africa/Johannesburg"
        },
        headers: {
          "x-apisports-key": process.env.API_SPORTS_KEY
        }
      }
    );

    const data = response.data?.response || [];

    // Prefer internationals if available
    const internationals = data.filter(match =>
      match.league?.name?.toLowerCase().includes("international") ||
      match.league?.name?.toLowerCase().includes("six nations") ||
      match.league?.name?.toLowerCase().includes("world cup")
    );

    return internationals.length > 0 ? internationals : data;

  } catch (err) {

    console.error("API-SPORTS FETCH ERROR:", err.message);

    return [];

  }

}

/*
========================================
MATCHES
========================================
*/

router.get("/matches", async (req, res) => {

  try {

    const data = await fetchMatches();
    const converted = convertFixtures(data);

    res.json(converted);

  } catch (error) {

    res.status(500).json({
      error: "Failed to fetch matches"
    });

  }

});

/*
========================================
FIXTURES (ALIAS)
========================================
*/

router.get("/fixtures", async (req, res) => {

  try {

    const data = await fetchMatches();
    const converted = convertFixtures(data);

    res.json(converted);

  } catch (error) {

    res.status(500).json({
      error: "Failed to fetch fixtures"
    });

  }

});

module.exports = router;