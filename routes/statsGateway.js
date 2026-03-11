const express = require("express");
const axios = require("axios");

const router = express.Router();

/*
========================================
DSG CONFIG
========================================
*/

const DSG_BASE_URL = "https://dsg-api.com";

const DSG_AUTH_KEY = process.env.DSG_AUTH_KEY;

/*
========================================
COMPETITION CONFIG
========================================
*/

const COMPETITION = {
  league: 51,
  season: 2026
};

/*
========================================
CACHE SYSTEM
========================================
*/

const CACHE_DURATION = 60 * 1000;

let fixturesCache = null;
let fixturesLastFetch = 0;

let standingsCache = null;
let standingsLastFetch = 0;

/*
========================================
COUNTRY NORMALIZER
========================================
*/

function normalizeCountry(name) {

  if (!name) return "unknown";

  return name
    .toLowerCase()
    .replace(/\s/g, "-");

}

/*
========================================
DSG MATCH CONVERTER
========================================
*/

function convertMatch(match) {

  return {

    id: match.id,

    tournament: match.competition?.name || "International",

    date: match.startTime?.split("T")[0],

    venue: match.venue?.name || "TBC",

    home: {
      name: match.homeTeam?.name,
      country: normalizeCountry(match.homeTeam?.name)
    },

    away: {
      name: match.awayTeam?.name,
      country: normalizeCountry(match.awayTeam?.name)
    },

    score: {
      home: match.homeScore ?? null,
      away: match.awayScore ?? null
    }

  };

}

function convertFixtures(matches) {

  if (!Array.isArray(matches)) return [];

  return matches.map(convertMatch);

}

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
      `${DSG_BASE_URL}/fixtures`,
      {
        headers: {
          Authorization: DSG_AUTH_KEY
        }
      }
    );

    const converted = convertFixtures(response.data);

    fixturesCache = converted;
    fixturesLastFetch = now;

    res.json(converted);

  } catch (error) {

    console.error("DSG Fixtures fetch error");

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
      `${DSG_BASE_URL}/standings`,
      {
        headers: {
          Authorization: DSG_AUTH_KEY
        }
      }
    );

    const rows = response.data?.standings || [];

    const standings = rows.map((row) => ({

      team: row.team?.name,

      country: normalizeCountry(row.team?.name),

      played: row.played,

      won: row.won,

      lost: row.lost,

      pointsFor: row.pointsFor,

      pointsAgainst: row.pointsAgainst,

      difference: row.pointsFor - row.pointsAgainst,

      points: row.points,

      form: row.form || ""

    }));

    standingsCache = standings;
    standingsLastFetch = now;

    res.json(standings);

  } catch (error) {

    console.error("DSG Standings fetch error");

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
      `${DSG_BASE_URL}/matches/${matchId}`,
      {
        headers: {
          Authorization: DSG_AUTH_KEY
        }
      }
    );

    const match = convertMatch(response.data);

    res.json(match);

  } catch (error) {

    console.error("DSG Match fetch error");

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