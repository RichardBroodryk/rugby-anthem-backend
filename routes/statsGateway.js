const express = require("express");

const { getMatches } = require("../providers/highlightly/matches");
const { getStandings } = require("../providers/highlightly/standings");
const { getTeams } = require("../providers/highlightly/teams");

const router = express.Router();

/*
========================================
MATCHES
========================================
*/

router.get("/matches", async (req, res) => {
  try {
    const filters = {};

    if (req.query.date) {
      filters.date = req.query.date;
    }

    if (req.query.league) {
      filters.league = Number(req.query.league);
    }

    if (req.query.season) {
      filters.season = Number(req.query.season);
    }

    const matches = await getMatches(filters);

    res.json(matches);
  } catch (error) {
    console.error("MATCHES ERROR:", error.message);

    res.status(500).json({
      success: false,
      error: "Failed to fetch matches",
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
    const filters = {};

    if (req.query.date) {
      filters.date = req.query.date;
    }

    if (req.query.league) {
      filters.league = Number(req.query.league);
    }

    if (req.query.season) {
      filters.season = Number(req.query.season);
    }

    const fixtures = await getMatches(filters);

    res.json(fixtures);
  } catch (error) {
    console.error("FIXTURES ERROR:", error.message);

    res.status(500).json({
      success: false,
      error: "Failed to fetch fixtures",
    });
  }
});

/*
========================================
STANDINGS
========================================
*/

router.get("/standings", async (req, res) => {
  try {
    const league = req.query.league
      ? Number(req.query.league)
      : undefined;

    const season = req.query.season
      ? Number(req.query.season)
      : undefined;

    console.log("🏆 STANDINGS REQUEST", {
      league,
      season,
    });

    const standings = await getStandings(
      league,
      season
    );

    res.json(standings);
  } catch (error) {
    console.error(
      "STANDINGS ERROR:",
      error.message
    );

    res.status(500).json({
      success: false,
      error: "Failed to fetch standings",
    });
  }
});

/*
========================================
TEAMS
========================================
*/

router.get("/teams", async (req, res) => {
  try {
    const league = req.query.league
      ? Number(req.query.league)
      : undefined;

    const season = req.query.season
      ? Number(req.query.season)
      : undefined;

    console.log("👥 TEAMS REQUEST", {
      league,
      season,
    });

    const teams = await getTeams(
      league,
      season
    );

    res.json(teams);
  } catch (error) {
    console.error(
      "TEAMS ERROR:",
      error.message
    );

    res.status(500).json({
      success: false,
      error: "Failed to fetch teams",
    });
  }
});

module.exports = router;