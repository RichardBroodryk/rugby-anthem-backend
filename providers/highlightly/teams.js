const client = require("./client");
const { convertTeams } = require("./converter");

async function getTeams(leagueId, season) {
  try {
    const params = {};

    if (leagueId !== undefined && leagueId !== null) {
      params.leagueId = Number(leagueId);
    }

    if (season !== undefined && season !== null) {
      params.season = Number(season);
    }

    console.log("👥 TEAMS SEARCH:", params);

    const response = await client.get("/teams", {
      params,
    });

    console.log(
      "👥 RAW TEAMS RESPONSE:"
    );
    console.log(
      JSON.stringify(response.data, null, 2)
    );

    return convertTeams(response.data);
  } catch (error) {
    console.error("========== TEAMS ERROR ==========");

    if (error.response) {
      console.error("STATUS:", error.response.status);

      console.error(
        "REQUEST PARAMS:",
        {
          leagueId,
          season,
        }
      );

      console.error(
        "RESPONSE:"
      );

      console.error(
        JSON.stringify(
          error.response.data,
          null,
          2
        )
      );
    } else {
      console.error(error.message);
    }

    console.error("================================");

    throw error;
  }
}

module.exports = {
  getTeams,
};