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
    const date =
      req.query.date ||
      new Date().toISOString().split("T")[0];

    const matches = await getMatches({
      date,
    });

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
    const date =
      req.query.date ||
      new Date().toISOString().split("T")[0];

    const fixtures = await getMatches({
      date,
    });

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
    const { league, season } = req.query;

    const standings = await getStandings(
      league,
      season ? Number(season) : undefined
    );

    res.json(standings);
  } catch (error) {
    console.error("STANDINGS ERROR:", error.message);

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
    const { league, season } = req.query;

    const teams = await getTeams(
      league,
      season ? Number(season) : undefined
    );

    res.json(teams);
  } catch (error) {
    console.error("TEAMS ERROR:", error.message);

    res.status(500).json({
      success: false,
      error: "Failed to fetch teams",
    });
  }
});

module.exports = router;