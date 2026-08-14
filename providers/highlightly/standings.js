const client = require("./client");
const { convertStandings } = require("./converter");

/*
==================================================
RAZ — HIGHLIGHTLY STANDINGS PROVIDER
==================================================

RAZ uses its own competition IDs such as:

npc
urc
super-rugby
premiership

Highlightly standings require a NUMERIC leagueId.

Therefore RAZ competition IDs must be resolved
before calling Highlightly.

Currently verified:

Bunnings NPC
RAZ ID: npc
Highlightly league ID: 68864
Available season: 2026
==================================================
*/

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
LEAGUE ID RESOLVER
==================================================
*/

function resolveHighlightlyLeagueId(leagueId) {
  /*
  ----------------------------------------------
  Already numeric
  ----------------------------------------------
  */

  if (
    typeof leagueId === "number" &&
    Number.isFinite(leagueId)
  ) {
    return leagueId;
  }

  /*
  ----------------------------------------------
  Numeric string
  ----------------------------------------------
  */

  if (
    typeof leagueId === "string" &&
    /^\d+$/.test(leagueId.trim())
  ) {
    return Number(leagueId);
  }

  /*
  ----------------------------------------------
  RAZ competition ID
  ----------------------------------------------
  */

  const key = String(leagueId || "")
    .trim()
    .toLowerCase();

  return HIGHLIGHTLY_LEAGUE_IDS[key];
}

/*
==================================================
GET STANDINGS
==================================================
*/

async function getStandings(leagueId, season) {
  try {
    const resolvedLeagueId =
      resolveHighlightlyLeagueId(leagueId);

    /*
    ----------------------------------------------
    VALIDATION
    ----------------------------------------------
    */

    if (
      resolvedLeagueId === undefined ||
      resolvedLeagueId === null ||
      !Number.isFinite(resolvedLeagueId)
    ) {
      throw new Error(
        `No Highlightly league ID configured for RAZ competition: ${leagueId}`
      );
    }

    const params = {
      leagueId: resolvedLeagueId,
    };

    if (
      season !== undefined &&
      season !== null
    ) {
      params.season = Number(season);
    }

    console.log(
      "🏆 STANDINGS SEARCH:",
      {
        razLeagueId: leagueId,
        highlightlyLeagueId:
          resolvedLeagueId,
        season: params.season,
      }
    );

    const response = await client.get(
      "/standings",
      {
        params,
      }
    );

    return convertStandings(
      response.data
    );
  } catch (error) {
    if (error.response) {
      console.error(
        "STATUS:",
        error.response.status
      );

      console.error(
        "BODY:",
        JSON.stringify(
          error.response.data,
          null,
          2
        )
      );
    } else {
      console.error(
        error.message
      );
    }

    throw error;
  }
}

module.exports = {
  getStandings,
};