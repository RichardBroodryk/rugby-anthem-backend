const client = require("./client");
const { convertTeams } = require("./converter");

async function getTeams() {
  try {
    const params = {
      limit: 500,
      offset: 0,
    };

    console.log("👥 TEAMS SEARCH:", params);

    const response = await client.get("/teams", {
      params,
    });

    console.log(
      "👥 TEAMS RESPONSE:",
      JSON.stringify(response.data, null, 2)
    );

    return convertTeams(response.data);
  } catch (error) {
    if (error.response) {
      console.error("========== TEAMS ERROR ==========");
      console.error("STATUS:", error.response.status);
      console.error(
        "REQUEST PARAMS:",
        error.config?.params
      );
      console.error(
        "RESPONSE:",
        JSON.stringify(error.response.data, null, 2)
      );
      console.error("=================================");
    } else {
      console.error("❌ TEAMS NETWORK ERROR:", error.message);
    }

    throw error;
  }
}

module.exports = {
  getTeams,
};