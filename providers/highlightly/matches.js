const client = require("./client");
const { convertMatches } = require("./converter");

/*
==================================================
RAZ — HIGHLIGHTLY MATCH PROVIDER
==================================================

AUTHORITATIVE LIVE MATCH SOURCE

The Highlightly /matches endpoint accepts a single
date parameter.

RAZ therefore retrieves a rolling window of dates so
that:

- finished matches remain available after match day
- today's matches remain live
- upcoming matches are available
- Match Page can resolve yesterday's matches
- Results can display newly completed matches
- Home can automatically move to the next fixture

The provider returns ONE combined match array.
==================================================
*/

/* ==================================================
   DATE HELPERS
   ================================================== */

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/* ==================================================
   SINGLE-DAY FETCH
   ================================================== */

async function fetchMatchesForDate(date, filters = {}) {
  const params = {
    timezone: "Africa/Johannesburg",
    limit: 100,
    date,
    ...filters,
  };

  console.log("🏉 MATCH SEARCH:", params);

  const response = await client.get("/matches", {
    params,
  });

  const converted = convertMatches(response.data);

  console.log(
    `🏉 MATCHES ${date}: ${converted.length}`
  );

  return converted;
}

/* ==================================================
   MAIN
   ================================================== */

async function getMatches(options = {}) {
  /*
  --------------------------------------------------
  ROLLING WINDOW

  Previous:
    7 days

  Current:
    today

  Future:
    14 days

  This gives RAZ enough information for:

  - recent results
  - current matches
  - upcoming fixtures
  - featured match rotation
  - direct Match Page resolution
  --------------------------------------------------
  */

  const {
    fromDate,
    toDate,
    daysBack = 7,
    daysForward = 14,
    ...filters
  } = options || {};

  try {
    const today = new Date();

    const startDate = fromDate
      ? new Date(`${fromDate}T00:00:00.000Z`)
      : addDays(today, -daysBack);

    const endDate = toDate
      ? new Date(`${toDate}T00:00:00.000Z`)
      : addDays(today, daysForward);

    const dates = [];

    let cursor = startDate;

    while (cursor <= endDate) {
      dates.push(formatDate(cursor));
      cursor = addDays(cursor, 1);
    }

    console.log(
      `🏉 HIGHLIGHTLY MATCH WINDOW: ${dates[0]} → ${
        dates[dates.length - 1]
      }`
    );

    /*
    --------------------------------------------------
    FETCH ALL DAYS
    --------------------------------------------------

    Sequential requests deliberately used here.

    This avoids firing a large burst of requests at
    Highlightly and makes the backend easier to
    monitor.
    --------------------------------------------------
    */

    const allMatches = [];

    for (const date of dates) {
      try {
        const matches = await fetchMatchesForDate(
          date,
          filters
        );

        allMatches.push(...matches);
      } catch (error) {
        /*
        ------------------------------------------------
        ONE DAY FAILING MUST NOT KILL THE WHOLE WINDOW
        ------------------------------------------------
        */

        if (error.response) {
          console.error(
            `❌ HIGHLIGHTLY ${date} FAILED:`,
            error.response.status
          );

          console.error(
            JSON.stringify(
              error.response.data,
              null,
              2
            )
          );
        } else {
          console.error(
            `❌ HIGHLIGHTLY ${date} FAILED:`,
            error.message
          );
        }
      }
    }

    /*
    --------------------------------------------------
    DEDUPLICATE
    --------------------------------------------------
    */

    const uniqueMatches = new Map();

    allMatches.forEach((match) => {
      if (!match || !match.id) return;

      uniqueMatches.set(
        String(match.id),
        match
      );
    });

    const result = Array.from(
      uniqueMatches.values()
    ).sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime()
    );

    console.log(
      `🏉 HIGHLIGHTLY WINDOW TOTAL: ${result.length}`
    );

    return result;
  } catch (error) {
    if (error.response) {
      console.error(
        "❌ HIGHLIGHTLY MATCH ERROR:",
        error.response.status
      );

      console.error(
        JSON.stringify(
          error.response.data,
          null,
          2
        )
      );
    } else {
      console.error(
        "❌ HIGHLIGHTLY MATCH ERROR:",
        error.message
      );
    }

    throw error;
  }
}

module.exports = {
  getMatches,
};