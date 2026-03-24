/*
========================================
RAZ STATSCONVERTER
Converts API-Sports Rugby → RAZ format
========================================
*/

function convertApiSportsGame(game) {

  const g = game || {};

  const home = g.teams?.home || {};
  const away = g.teams?.away || {};

  const result = {

    id: g.id || null,

    tournament: g.league?.name || "International Test",

    date: g.date
      ? g.date.substring(0, 10)
      : "",

    venue: g.fixture?.venue || "TBC",

    home: {
      name: home.name || "",
      country: normalizeCountry(home.name)
    },

    away: {
      name: away.name || "",
      country: normalizeCountry(away.name)
    }

  };

  if (g.scores && g.scores.home !== null && g.scores.away !== null) {

    result.score = {
      home: g.scores.home,
      away: g.scores.away
    };

  }

  return result;

}

/*
========================================
COUNTRY NORMALIZER
========================================
*/

function normalizeCountry(teamName) {

  if (!teamName) return "";

  const map = {

    "France": "france",
    "Ireland": "ireland",
    "Italy": "italy",
    "England": "england",
    "Scotland": "scotland",
    "Wales": "wales",
    "South Africa": "south-africa",
    "New Zealand": "new-zealand",
    "Australia": "australia",
    "Argentina": "argentina",
    "Japan": "japan",
    "Fiji": "fiji"

  };

  return map[teamName] || teamName.toLowerCase().replace(/\s/g, "-");

}

/*
========================================
CONVERT MULTIPLE GAMES
========================================
*/

function convertGames(apiResponse) {

  if (!apiResponse || !apiResponse.response) {
    return [];
  }

  return apiResponse.response.map(convertApiSportsGame);

}

module.exports = {
  convertGames
};