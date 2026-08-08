const express = require("express");

const {
  getMatches,
} = require("../providers/highlightly/matches");

const {
  getStandings,
} = require("../providers/highlightly/standings");

const {
  getTeams,
} = require("../providers/highlightly/teams");

const router = express.Router();

/*
==================================================
RAZ STATS GATEWAY
==================================================

Highlightly is the live rugby data source.

This gateway deliberately keeps the API surface
stable for the RAZ frontend.

MATCH DATA
----------
/matches
/fixtures

Both endpoints use the same rolling match provider.

The provider retrieves:

- recent finished matches
- today's matches
- upcoming matches

This is required so a match does not disappear
simply because its calendar date has passed.
==================================================
*/

/*
========================================
MATCHES
========================================
*/

router.get("/matches", async (req, res) => {
  try {
    const {
      fromDate,
      toDate,
      daysBack,
      daysForward,
    } = req.query;

    const options = {};

    if (fromDate) {
      options.fromDate = String(fromDate);
    }

    if (toDate) {
      options.toDate = String(toDate);
    }

    if (daysBack !== undefined) {
      const parsed = Number(daysBack);

      if (Number.isFinite(parsed)) {
        options.daysBack = parsed;
      }
    }

    if (daysForward !== undefined) {
      const parsed = Number(daysForward);

      if (Number.isFinite(parsed)) {
        options.daysForward = parsed;
      }
    }

    console.log(
      "📊 MATCHES REQUEST:",
      options
    );

    const matches = await getMatches(options);

    console.log(
      `📊 MATCHES RESPONSE: ${matches.length}`
    );

    res.json(matches);
  } catch (error) {
    console.error(
      "========== MATCHES ERROR =========="
    );

    console.error(
      error.message
    );

    if (error.response) {
      console.error(
        "STATUS:",
        error.response.status
      );

      console.error(
        "RESPONSE:",
        JSON.stringify(
          error.response.data,
          null,
          2
        )
      );
    }

    console.error(
      "==================================="
    );

    res.status(500).json({
      success: false,
      error: "Failed to fetch matches",
    });
  }
});

/*
========================================
FIXTURES
========================================

Frontend compatibility alias.

IMPORTANT:
This must use the exact same provider as
/matches.

There is no separate fixture data source.
========================================
*/

router.get("/fixtures", async (req, res) => {
  try {
    const {
      fromDate,
      toDate,
      daysBack,
      daysForward,
    } = req.query;

    const options = {};

    if (fromDate) {
      options.fromDate = String(fromDate);
    }

    if (toDate) {
      options.toDate = String(toDate);
    }

    if (daysBack !== undefined) {
      const parsed = Number(daysBack);

      if (Number.isFinite(parsed)) {
        options.daysBack = parsed;
      }
    }

    if (daysForward !== undefined) {
      const parsed = Number(daysForward);

      if (Number.isFinite(parsed)) {
        options.daysForward = parsed;
      }
    }

    console.log(
      "📅 FIXTURES REQUEST:",
      options
    );

    const fixtures =
      await getMatches(options);

    console.log(
      `📅 FIXTURES RESPONSE: ${fixtures.length}`
    );

    res.json(fixtures);
  } catch (error) {
    console.error(
      "========== FIXTURES ERROR =========="
    );

    console.error(
      error.message
    );

    if (error.response) {
      console.error(
        "STATUS:",
        error.response.status
      );

      console.error(
        "RESPONSE:",
        JSON.stringify(
          error.response.data,
          null,
          2
        )
      );
    }

    console.error(
      "===================================="
    );

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
    const {
      league,
      season,
    } = req.query;

    console.log(
      "📊 STANDINGS REQUEST:",
      {
        league,
        season,
      }
    );

    const standings =
      await getStandings(
        league,
        season !== undefined
          ? Number(season)
          : undefined
      );

    res.json(standings);
  } catch (error) {
    console.error(
      "========== STANDINGS ERROR =========="
    );

    console.error(
      error.message
    );

    if (error.response) {
      console.error(
        "STATUS:",
        error.response.status
      );

      console.error(
        "RESPONSE:",
        JSON.stringify(
          error.response.data,
          null,
          2
        )
      );
    }

    console.error(
      "====================================="
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
    const {
      league,
      season,
    } = req.query;

    console.log(
      "👥 TEAMS REQUEST:",
      {
        league,
        season,
      }
    );

    const teams =
      await getTeams(
        league,
        season !== undefined
          ? Number(season)
          : undefined
      );

    res.json(teams);
  } catch (error) {
    console.error(
      "========== TEAMS ERROR =========="
    );

    console.error(
      error.message
    );

    if (error.response) {
      console.error(
        "STATUS:",
        error.response.status
      );

      console.error(
        "RESPONSE:",
        JSON.stringify(
          error.response.data,
          null,
          2
        )
      );
    }

    console.error(
      "================================="
    );

    res.status(500).json({
      success: false,
      error: "Failed to fetch teams",
    });
  }
});

module.exports = router;