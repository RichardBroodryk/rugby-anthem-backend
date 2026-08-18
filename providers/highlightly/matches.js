const client = require("./client");
const { convertMatches } = require("./converter");

/*
==================================================
RAZ — HIGHLIGHTLY MATCH PROVIDER
AUTHORITATIVE LIVE MATCH SOURCE
==================================================

Highlightly's /matches endpoint accepts a single
date parameter.

RAZ therefore retrieves a SMALL controlled window.

IMPORTANT:

We do NOT request a large rolling window.

The provider uses a maximum of four Highlightly
requests for the default window:

- yesterday
- today
- tomorrow
- day after tomorrow

This gives RAZ:

- yesterday's completed matches
- today's live matches
- today's remaining fixtures
- near-future fixture continuity

Multiple RAZ pages call getMatches().

The cache prevents repeated Highlightly requests
for the SAME request window.

The cache is deliberately keyed by request options
so that data for one date can NEVER be returned for
another date.
==================================================
*/

/*
==================================================
DATE HELPERS
==================================================
*/

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function addDays(date, days) {
  const result = new Date(date);

  result.setUTCDate(
    result.getUTCDate() + days
  );

  return result;
}

/*
==================================================
CACHE
==================================================

Each request window gets its own cache entry.

Example:

2026-08-21 → separate cache
2026-08-22 → separate cache
2026-08-23 → separate cache

This is essential because /fixtures?date=YYYY-MM-DD
is used by the frontend for specific match dates.
==================================================
*/

const cache = new Map();

const CACHE_TTL = 60 * 1000;
const NPC_HIGHLIGHTLY_LEAGUE_ID = 68864;
const NPC_SEASON = 2026;

/*
==================================================
ACTIVE REQUEST LOCKS
==================================================

If two pages request the SAME window at exactly
the same time, they share the same Highlightly
request.

Different dates are allowed to have their own
request.

Example:

Page A → 2026-08-22
Page B → 2026-08-22

Both share one request.

But:

Page A → 2026-08-22
Page B → 2026-08-23

These remain separate.
==================================================
*/

const activeRequests = new Map();

/*
==================================================
RAZ → HIGHLIGHTLY LEAGUE IDS
==================================================
*/

const HIGHLIGHTLY_LEAGUE_IDS = {
  npc: 68864,
};

/*
==================================================
CACHE KEY
==================================================
*/

function createCacheKey(options = {}) {
  const normalized = {
    fromDate: options.fromDate || null,
    toDate: options.toDate || null,
    daysBack:
      options.daysBack !== undefined
        ? Number(options.daysBack)
        : null,
    daysForward:
      options.daysForward !== undefined
        ? Number(options.daysForward)
        : null,
    ...options,
  };

  return JSON.stringify(normalized);
}

/*
==================================================
SINGLE-DAY FETCH
==================================================
*/

async function fetchMatchesForDate(
  date,
  filters = {}
) {
  const params = {
    timezone: "Africa/Johannesburg",
    limit: 100,
    date,
    ...filters,
  };

  console.log(
    "🏉 MATCH SEARCH:",
    params
  );

  const response = await client.get(
    "/matches",
    {
      params,
    }
  );

  const converted =
    convertMatches(response.data);

  console.log(
    `🏉 HIGHLIGHTLY FIXTURES ${date}: ${converted.length}`
  );

  return converted;
}

/*
==================================================
NPC SEASON FETCH
==================================================

Bunnings NPC is a season-based dataset.

RAZ uses:

npc
    ↓
Highlightly leagueId 68864
    ↓
season 2026

This retrieves the complete NPC season instead
of allowing older completed matches to disappear
from the rolling date window.
==================================================
*/

async function fetchNpcSeason() {
  const params = {
    timezone: "Africa/Johannesburg",
    limit: 100,
    leagueId:
      NPC_HIGHLIGHTLY_LEAGUE_ID,
    season: NPC_SEASON,
  };

  console.log(
    "🏉 NPC SEASON SEARCH:",
    params
  );

  const response =
    await client.get(
      "/matches",
      {
        params,
      }
    );

  const converted =
    convertMatches(
      response.data
    );

  console.log(
    `🏉 HIGHLIGHTLY NPC 2026 MATCHES: ${converted.length}`
  );

  return converted;
}

/*
==================================================
WINDOW FETCH
==================================================
*/

async function fetchMatchesWindow(
  options = {}
) {

    /*
  --------------------------------------------------
  NPC SEASON MODE
  --------------------------------------------------

  NPC does not use the normal rolling date window.

  The complete 2026 season is requested directly
  from Highlightly.
  --------------------------------------------------
  */

  if (
    String(options.league || "")
      .toLowerCase() === "npc"
  ) {
    return fetchNpcSeason();
  }
  /*
  --------------------------------------------------
  DEFAULT WINDOW

  Yesterday
  Today
  Tomorrow
  Day after tomorrow

  Four requests maximum.
  --------------------------------------------------
  */

  const {
    fromDate,
    toDate,
    daysBack = 1,
    daysForward = 2,
    league,
    ...filters
  } = options;

  if (league) {
    const key = String(league)
      .trim()
      .toLowerCase();

    const highlightlyLeagueId =
      HIGHLIGHTLY_LEAGUE_IDS[key];

    if (highlightlyLeagueId) {
      filters.leagueId =
        highlightlyLeagueId;
    }
  }

  const today = new Date();

  const startDate = fromDate
    ? new Date(
        `${fromDate}T00:00:00.000Z`
      )
    : addDays(
        today,
        Number(daysBack)
          ? -Number(daysBack)
          : -1
      );

  const endDate = toDate
    ? new Date(
        `${toDate}T00:00:00.000Z`
      )
    : addDays(
        today,
        Number(daysForward)
          ? Number(daysForward)
          : 2
      );

  const dates = [];

  let cursor = startDate;

  while (cursor <= endDate) {
    dates.push(
      formatDate(cursor)
    );

    cursor = addDays(
      cursor,
      1
    );
  }

  console.log(
    `🏉 HIGHLIGHTLY MATCH WINDOW: ${dates[0]} → ${
      dates[dates.length - 1]
    }`
  );

  /*
  --------------------------------------------------
  FETCH DAYS
  --------------------------------------------------
  */

  const allMatches = [];

  for (const date of dates) {
    try {
      const matches =
        await fetchMatchesForDate(
          date,
          filters
        );

      allMatches.push(
        ...matches
      );
    } catch (error) {
      /*
      ----------------------------------------------
      ONE DAY FAILING MUST NOT DESTROY THE WINDOW
      ----------------------------------------------
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

      /*
      Continue to the next date.
      */
    }
  }

  /*
  --------------------------------------------------
  DEDUPLICATE
  --------------------------------------------------
  */

  const uniqueMatches =
    new Map();

  allMatches.forEach(
    (match) => {
      if (
        !match ||
        !match.id
      ) {
        return;
      }

      uniqueMatches.set(
        String(match.id),
        match
      );
    }
  );

  const result =
    Array.from(
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
}

/*
==================================================
MAIN
==================================================
*/

async function getMatches(
  options = {}
) {
  const cacheKey =
    createCacheKey(options);

  const now = Date.now();

  /*
  --------------------------------------------------
  CACHE CHECK
  --------------------------------------------------
  */

  const cached =
    cache.get(cacheKey);

  if (
    cached &&
    now - cached.timestamp < CACHE_TTL
  ) {
    console.log(
      "⚡ HIGHLIGHTLY CACHE HIT:",
      cached.matches.length,
      cacheKey
    );

    return cached.matches;
  }

  /*
  --------------------------------------------------
  ACTIVE REQUEST CHECK
  --------------------------------------------------
  */

  if (
    activeRequests.has(cacheKey)
  ) {
    console.log(
      "⏳ HIGHLIGHTLY REQUEST ALREADY RUNNING — SHARING IT:",
      cacheKey
    );

    return activeRequests.get(
      cacheKey
    );
  }

  /*
  --------------------------------------------------
  START NEW REQUEST
  --------------------------------------------------
  */

  const request =
    fetchMatchesWindow(options);

  activeRequests.set(
    cacheKey,
    request
  );

  try {
    const result =
      await request;

    cache.set(
      cacheKey,
      {
        matches: result,
        timestamp: Date.now(),
      }
    );

    return result;
  } finally {
    activeRequests.delete(
      cacheKey
    );
  }
}

/*
==================================================
CLEAR CACHE
==================================================

Useful when we need to force an immediate refresh
after an important event.
==================================================
*/

function clearMatchesCache() {
  cache.clear();

  console.log(
    "🧹 HIGHLIGHTLY MATCH CACHE CLEARED"
  );
}

/*
==================================================
EXPORTS
==================================================
*/

module.exports = {
  getMatches,
  clearMatchesCache,
};