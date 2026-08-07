const { resolveCompetitionId } = require("./competitionResolver");

function normalizeCountry(name) {
  if (!name) return "unknown";

  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function parseScore(score) {
  if (!score || typeof score !== "string") {
    return undefined;
  }

  const parts = score.split("-").map((part) => Number(part.trim()));

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

function resolveState(description = "") {
  const state = description.toLowerCase();

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

function buildMatchKey(match) {
  const home = (match.homeTeam?.name || "")
    .toLowerCase()
    .trim();

  const away = (match.awayTeam?.name || "")
    .toLowerCase()
    .trim();

  const date = match.date
    ? match.date.split("T")[0]
    : "";

  return `${home}_${away}_${date}`;
}

function convertMatch(match = {}) {
  return {
    id: match.id ?? 0,

    matchKey: buildMatchKey(match),

    competitionId: resolveCompetitionId(match.league),

tournament: match.league?.name || "",

leagueId: match.league?.id ?? null,

season: match.league?.season ?? null,

leagueLogo: match.league?.logo || "",

    tournamentInstanceId: undefined,

    stage: undefined,

    gender: "men",

    round: match.week || "",

    pool: undefined,

    date: match.date
      ? match.date.split("T")[0]
      : "",

    venue: match.venue?.name || "TBC",

    home: {
      name: match.homeTeam?.name || "",
      country: normalizeCountry(match.homeTeam?.name),
    },

    away: {
      name: match.awayTeam?.name || "",
      country: normalizeCountry(match.awayTeam?.name),
    },

    score: parseScore(match.state?.score),

    state: resolveState(match.state?.description),
  };
}

function extractArray(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
}

function convertMatches(response) {
  return extractArray(response).map(convertMatch);
}

function convertStanding(row = {}) {
  return {
    id: row.team?.id ?? row.id ?? null,
    name: row.team?.name ?? row.name ?? "",
    logo: row.team?.logo ?? row.logo ?? "",
    played: row.played ?? 0,
    won: row.won ?? 0,
    drawn: row.drawn ?? 0,
    lost: row.lost ?? 0,
    pointsFor: row.pointsFor ?? 0,
    pointsAgainst: row.pointsAgainst ?? 0,
    points: row.points ?? 0,
    position: row.position ?? 0,
    raw: row,
  };
}

function convertStandings(response) {
  return extractArray(response).map(convertStanding);
}

function convertTeam(team = {}) {
  return {
    id: team.id ?? null,
    name: team.name ?? "",
    logo: team.logo ?? "",
    country: {
      code: team.country?.code ?? "",
      name: team.country?.name ?? "",
      logo: team.country?.logo ?? "",
    },
    raw: team,
  };
}

function convertTeams(response) {
  return extractArray(response).map(convertTeam);
}

module.exports = {
  convertMatch,
  convertMatches,
  convertStanding,
  convertStandings,
  convertTeam,
  convertTeams,
};