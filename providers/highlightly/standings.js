const client = require("./client");
const { convertStandings } = require("./converter");

async function getStandings(leagueId, season) {
  try {
    const params = {};

    if (leagueId !== undefined && leagueId !== null) {
      params.leagueId = Number(leagueId);
    }

    if (season !== undefined && season !== null) {
      params.season = Number(season);
    }

    console.log("🏆 STANDINGS SEARCH:", params);

    const response = await client.get("/standings", {
      params,
    });

    return convertStandings(response.data);
  } catch (error) {
    if (error.response) {
      console.error("STATUS:", error.response.status);
      console.error(
        "BODY:",
        JSON.stringify(error.response.data, null, 2)
      );
    } else {
      console.error(error.message);
    }

    throw error;
  }
}

module.exports = {
  getStandings,
};