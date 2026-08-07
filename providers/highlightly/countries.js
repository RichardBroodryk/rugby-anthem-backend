const client = require("./client");

async function getCountries(name = "") {
  try {
    const response = await client.get("/countries", {
      params: name ? { name } : {},
    });

    return response.data;
  } catch (error) {
    console.error("❌ Failed to fetch countries:", error.message);
    throw error;
  }
}

module.exports = {
  getCountries,
};