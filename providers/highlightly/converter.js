const { resolveCompetitionId } = require("./competitionResolver");

/*
==================================================
COUNTRY NORMALISATION
==================================================
*/

function normalizeCountry(name) {
  if (!name) return "unknown";

  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

/*
==================================================
SCORE PARSER
==================================================
*/

function parseScore(score) {
  if (!score || typeof score !== "string") {
    return undefined;
  }

  const parts = score
    .split("-")
    .map((part) => Number(part.trim()));

  if (
    parts.length !== 2 ||
    Number.isNaN(parts[0]) ||
    Number.isNaN(parts[1])
  ) {
    return undefined;
  }

  return {
    home: parts[0],
    away: parts[1],
  };
}

/*
==================================================
MATCH STATE
==================================================
*/

function resolveState(description = "") {
  const state = String(description).toLowerCase();

  if (
    state.includes("finished") ||
    state.includes("full time") ||
    state.includes("ended")
  ) {
    return "final";
  }

  if (
    state.includes("live") ||
    state.includes("in progress") ||
    state.includes("2nd half") ||
    state.includes("1st half")
  ) {
    return "live";
  }

  if (
    state.includes("kick off") ||
    state.includes("starting")
  ) {
    return "starting";
  }

  return "upcoming";
}

/*
==================================================
MATCH KEY
==================================================
*/

function buildMatchKey(match) {
  const normalize = (name) =>
    String(name || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

  const home = normalize(
    match.homeTeam?.name
  );

  const away = normalize(
    match.awayTeam?.name
  );

  return `${home}-vs-${away}`;
}

/*
==================================================
MATCH CONVERTER
==================================================
*/

function convertMatch(match = {}) {
  return {
    id: match.id ?? 0,

    highlightlyId: match.id ?? null,

    matchKey: buildMatchKey(match),

    competitionId:
      resolveCompetitionId(match.league),

    tournament:
      match.league?.name || "",

    leagueId:
      match.league?.id ?? null,

    season:
      match.league?.season ?? null,

    leagueLogo:
      match.league?.logo || "",

    tournamentInstanceId:
      undefined,

    stage:
      undefined,

    gender:
      "men",

    round:
      match.week || "",

    pool:
      undefined,

    date:
      match.date
        ? match.date.split("T")[0]
        : "",

    startTime:
      match.date || "",

    venue:
      match.venue?.name || "TBC",

    home: {
      name:
        match.homeTeam?.name || "",

      country:
        normalizeCountry(
          match.homeTeam?.name
        ),
    },

    away: {
      name:
        match.awayTeam?.name || "",

      country:
        normalizeCountry(
          match.awayTeam?.name
        ),
    },

    score:
      parseScore(
        match.state?.score
      ),

    state:
      resolveState(
        match.state?.description
      ),
  };
}

/*
==================================================
GENERIC ARRAY EXTRACTION
==================================================
*/

function extractArray(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (
    Array.isArray(
      response?.data?.data
    )
  ) {
    return response.data.data;
  }

  return [];
}

/*
==================================================
MATCH CONVERSION
==================================================
*/

function convertMatches(response) {
  return extractArray(response)
    .map(convertMatch);
}

/*
==================================================
STANDING CONVERTER
==================================================

Highlightly rugby standings use:

groups[]
  standings[]
    team
    wins
    loses
    draws
    gamesPlayed
    scoredPoints
    receivedPoints
    points
    position

RAZ normalises these into the frontend
StandingRow structure.
==================================================
*/

function convertStanding(row = {}) {
  return {
    id:
      row.team?.id ??
      row.id ??
      null,

    name:
      row.team?.name ??
      row.name ??
      "",

    logo:
      row.team?.logo ??
      row.logo ??
      "",

    played:
      row.gamesPlayed ??
      row.played ??
      0,

    won:
      row.wins ??
      row.won ??
      0,

    drawn:
      row.draws ??
      row.drawn ??
      0,

    lost:
      row.loses ??
      row.lost ??
      0,

    pointsFor:
      row.scoredPoints ??
      row.pointsFor ??
      0,

    pointsAgainst:
      row.receivedPoints ??
      row.pointsAgainst ??
      0,

    points:
      row.points ??
      0,

    position:
      row.position ??
      0,

    raw:
      row,
  };
}

/*
==================================================
STANDINGS ROW EXTRACTION
==================================================

Highlightly returns grouped standings:

{
  groups: [
    {
      name: "...",
      standings: [...]
    }
  ]
}

Flatten all groups into one RAZ array.

This also allows competitions with multiple
groups/conferences to work without changing the
frontend standings service.
==================================================
*/

function extractStandingsRows(response) {
  /*
  --------------------------------------------------
  DIRECT ARRAY
  --------------------------------------------------
  */

  if (Array.isArray(response)) {
    return response;
  }

  /*
  --------------------------------------------------
  GROUPED HIGHLIGHTLY RESPONSE
  --------------------------------------------------
  */

  if (Array.isArray(response?.groups)) {
    return response.groups.flatMap(
      (group) =>
        Array.isArray(
          group?.standings
        )
          ? group.standings
          : []
    );
  }

  /*
  --------------------------------------------------
  DATA WRAPPERS
  --------------------------------------------------
  */

  if (
    Array.isArray(
      response?.data?.groups
    )
  ) {
    return response.data.groups.flatMap(
      (group) =>
        Array.isArray(
          group?.standings
        )
          ? group.standings
          : []
    );
  }

  if (
    Array.isArray(
      response?.data
    )
  ) {
    return response.data;
  }

  if (
    Array.isArray(
      response?.data?.data
    )
  ) {
    return response.data.data;
  }

  return [];
}

/*
==================================================
STANDINGS CONVERSION
==================================================
*/

function convertStandings(response) {
  const rows =
    extractStandingsRows(
      response
    );

  console.log(
    `🏆 CONVERTING STANDINGS: ${rows.length} rows`
  );

  return rows.map(
    convertStanding
  );
}

/*
==================================================
TEAM CONVERTER
==================================================
*/

function convertTeam(team = {}) {
  return {
    id:
      team.id ?? null,

    name:
      team.name ?? "",

    logo:
      team.logo ?? "",

    country: {
      code:
        team.country?.code ?? "",

      name:
        team.country?.name ?? "",

      logo:
        team.country?.logo ?? "",
    },

    raw:
      team,
  };
}

/*
==================================================
TEAM CONVERSION
==================================================
*/

function convertTeams(response) {
  return extractArray(response)
    .map(convertTeam);
}

/*
==================================================
EXPORTS
==================================================
*/

module.exports = {
  convertMatch,
  convertMatches,

  convertStanding,
  convertStandings,

  convertTeam,
  convertTeams,
};