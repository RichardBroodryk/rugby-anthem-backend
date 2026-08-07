const client = require("./client");
const { convertMatches } = require("./converter");

async function getMatches(filters = {}) {
  try {
    const params = {
      timezone: "Africa/Johannesburg",
      limit: 100,
      ...filters,
    };

    console.log("🏉 MATCH SEARCH:", params);

    const response = await client.get("/matches", {
      params,
    });

    console.log(
      JSON.stringify(response.data, null, 2)
    );

    return convertMatches(response.data);
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
  getMatches,
};