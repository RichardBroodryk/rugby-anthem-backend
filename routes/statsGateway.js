const express = require("express");

const client = require("../providers/highlightly/client");

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

Both endpoints also support an optional:

?league=npc

parameter for targeted competition requests.
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
      league,
    } = req.query;

    const options = {};

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

    if (league) {
      options.league = String(league);
    }

    console.log(
      "📊 MATCHES REQUEST:",
      {
        requestedDate: date
          ? String(date)
          : undefined,
        league: league
          ? String(league)
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

The date MUST be passed through to the provider.

The endpoint also supports:

/fixtures?league=npc

for targeted competition requests.
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
      league,
    } = req.query;

    const options = {};

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

    if (league) {
      options.league = String(league);
    }

    console.log(
      "📅 FIXTURES REQUEST:",
      {
        requestedDate: date
          ? String(date)
          : undefined,
        league: league
          ? String(league)
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
MATCH DETAILS — TEMPORARY INSPECTION ENDPOINT

Purpose:

Retrieve the RAW Highlightly response for one
specific match.

This is deliberately NOT converted or altered.

We need to inspect exactly what Highlightly
provides before building the RAZ Match Intelligence
layer.

Example:

/match-details/47312129

Bulls vs New Zealand
Highlightly ID: 47312129

DO NOT build frontend statistics from this endpoint
yet.

This endpoint exists only to inspect the provider's
available detailed match data.
==================================================
*/

router.get(
  "/match-details/:matchId",
  async (req, res) => {
    try {
      const {
        matchId,
      } = req.params;

      console.log(
        "🔎 HIGHLIGHTLY MATCH DETAILS REQUEST:",
        matchId
      );

      const response =
        await client.get(
          `/matches/${matchId}`
        );

      console.log(
        "🔎 HIGHLIGHTLY MATCH DETAILS RESPONSE:",
        JSON.stringify(
          response.data,
          null,
          2
        )
      );

      res.json(
        response.data
      );
    } catch (error) {
      console.error(
        "========== MATCH DETAILS ERROR =========="
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
        "========================================="
      );

      res.status(500).json({
        success: false,
        error:
          "Failed to fetch match details",
      });
    }
  }
);
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