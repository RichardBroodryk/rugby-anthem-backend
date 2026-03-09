const express = require("express");
const axios = require("axios");

const router = express.Router();

const API_KEY = process.env.API_SPORTS_KEY;

const { convertGames } = require("./statsConverter");

/*
========================================
COMPETITION CONFIG
========================================
*/

const COMPETITION = {
  league: 51,   // Six Nations
  season: 2026
};

/*
========================================
CACHE SYSTEM
========================================
*/

const CACHE_DURATION = 60 * 1000; // 60 seconds

let fixturesCache = null;
let fixturesLastFetch = 0;

let standingsCache = null;
let standingsLastFetch = 0;

/*
========================================
FIXTURES
/api/stats/fixtures
========================================
*/

router.get("/fixtures", async (req, res) => {

  const now = Date.now();

  if (fixturesCache && now - fixturesLastFetch < CACHE_DURATION) {
    return res.json(fixturesCache);
  }

  try {

    const response = await axios.get(
      "https://v1.rugby.api-sports.io/games",
      {
        headers: {
          "x-apisports-key": API_KEY
        },
        params: COMPETITION
      }
    );

    const converted = convertGames(response.data);

    fixturesCache = converted;
    fixturesLastFetch = now;

    res.json(converted);

  } catch (error) {

    console.error("Fixtures fetch error");

    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }

    res.status(500).json({
      error: "Failed to fetch fixtures"
    });

  }

});

/*
========================================
STANDINGS
/api/stats/standings
========================================
*/

router.get("/standings", async (req, res) => {

  const now = Date.now();

  if (standingsCache && now - standingsLastFetch < CACHE_DURATION) {
    return res.json(standingsCache);
  }

  try {

    const response = await axios.get(
      "https://v1.rugby.api-sports.io/standings",
      {
        headers: {
          "x-apisports-key": API_KEY
        },
        params: COMPETITION
      }
    );

    const rows = response.data.response?.[0] || [];

    const standings = rows.map((row) => ({
      team: row.team.name,

      country: row.team.name
        .toLowerCase()
        .replace(/\s/g, "-"),

      played: row.games.played,

      won: row.games.win.total,

      lost: row.games.lose.total,

      pointsFor: row.goals.for,

      pointsAgainst: row.goals.against,

      difference: row.goals.for - row.goals.against,

      points: row.points,

      form: row.form
    }));

    standingsCache = standings;
    standingsLastFetch = now;

    res.json(standings);

  } catch (error) {

    console.error("Standings fetch error");

    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }

    res.status(500).json({
      error: "Failed to fetch standings"
    });

  }

});

/*
========================================
SINGLE MATCH
/api/stats/match/:id
========================================
*/

router.get("/match/:id", async (req, res) => {

  const matchId = req.params.id;

  try {

    const response = await axios.get(
      "https://v1.rugby.api-sports.io/games",
      {
        headers: {
          "x-apisports-key": API_KEY
        },
        params: {
          id: matchId
        }
      }
    );

    res.json(response.data);

  } catch (error) {

    console.error("Match fetch error");

    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }

    res.status(500).json({
      error: "Failed to fetch match data"
    });

  }

});

module.exports = router;