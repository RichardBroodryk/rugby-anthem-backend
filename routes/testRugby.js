const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/test-rugby", async (req, res) => {
  try {
    const response = await axios.get(
      "https://v1.rugby.api-sports.io/leagues",
      {
        headers: {
          "x-apisports-key": process.env.API_SPORTS_KEY,
        },
      }
    );

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("API-Sports error:", error.message);

    res.status(500).json({
      success: false,
      error: "Failed to fetch rugby data",
    });
  }
});

module.exports = router;
