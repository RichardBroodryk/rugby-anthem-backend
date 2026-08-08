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

Highlightly is the live rugby data source.

This gateway deliberately keeps the API surface
stable for the RAZ frontend.
==================================================
*/

/*
==================================================
MATCH DATA

/ matches
/ fixtures

Both endpoints use the same rolling match provider.

The provider retrieves:
- recent finished matches
- today's matches
- upcoming matches

The /fixtures endpoint also supports the legacy
frontend ?date=YYYY-MM-DD request.
==================================================
*/

/*
==================================================
MATCHES
==================================================
*/

router.get("/matches", async (req, res) => {
  try {
    const {
      date,
      fromDate,
      toDate,
      daysBack,
      daysForward,
    } = req.query;

    const options = {};

    /*
    --------------------------------------------------
    DATE COMPATIBILITY

    If the frontend supplies:

    ?date=2026-08-22

    treat it as a single-day request.
    --------------------------------------------------
    */

    if (date) {
      const requestedDate = String(date);

      options.fromDate = requestedDate;
      options.toDate = requestedDate;
    } else {
      if (fromDate) {
        options.fromDate = String(fromDate);
      }

      if (toDate) {
        options.toDate = String(toDate);
      }
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
      {
        requestedDate: date
          ? String(date)
          : undefined,
        options,
      }
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
==================================================
FIXTURES

Frontend compatibility alias.

IMPORTANT:

This uses the exact same Highlightly provider
as /matches.

There is no separate fixture data source.

The frontend historically calls:

/fixtures?date=YYYY-MM-DD

That date MUST be passed through to the provider.
==================================================
*/

router.get("/fixtures", async (req, res) => {
  try {
    const {
      date,
      fromDate,
      toDate,
      daysBack,
      daysForward,
    } = req.query;

    const options = {};

    /*
    --------------------------------------------------
    DATE COMPATIBILITY

    Convert:

    ?date=2026-08-22

    into:

    {
      fromDate: "2026-08-22",
      toDate: "2026-08-22"
    }

    This forces Highlightly to retrieve that
    specific match day rather than the default
    rolling window.
    --------------------------------------------------
    */

    if (date) {
      const requestedDate = String(date);

      options.fromDate = requestedDate;
      options.toDate = requestedDate;
    } else {
      if (fromDate) {
        options.fromDate = String(fromDate);
      }

      if (toDate) {
        options.toDate = String(toDate);
      }
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
      {
        requestedDate: date
          ? String(date)
          : undefined,
        options,
      }
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
==================================================
STANDINGS
==================================================
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
==================================================
TEAMS
==================================================
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