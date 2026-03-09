const express = require("express");
const axios = require("axios");

const router = express.Router();

/* ================= TEST ENDPOINT ================= */

router.get("/test-rugby", async (req, res) => {
  try {

    const response = await axios.get(
      "https://v1.rugby.api-sports.io/leagues",
      {
        headers: {
          "x-apisports-key": process.env.API_SPORTS_KEY
        }
      }
    );

    res.json(response.data);

  } catch (error) {

    console.error("API error:");

    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }

    res.status(500).json({
      error: "Failed to fetch rugby data"
    });
  }
});


/* ================= MATCHES ENDPOINT ================= */

router.get("/matches", async (req, res) => {
  try {

    const response = await axios.get(
      "https://v1.rugby.api-sports.io/games",
      {
        headers: {
          "x-apisports-key": process.env.API_SPORTS_KEY
        },
        params: {
          last: 10
        }
      }
    );

    res.json(response.data);

  } catch (error) {

    console.error("Match fetch error:");

    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }

    res.status(500).json({
      error: "Failed to fetch match data"
    });
  }
});


module.exports = router;