const express = require("express");
const axios = require("axios");

const router = express.Router();

/*
=====================================
API CONFIG
=====================================
*/

const DSG_BASE_URL = "https://dsg-api.com";

const DSG_USERNAME = process.env.DSG_USERNAME;
const DSG_PASSWORD = process.env.DSG_PASSWORD;


/*
=====================================
TEST API-SPORTS CONNECTION
=====================================
*/

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

    console.error("API-Sports error:");

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


/*
=====================================
TEST API-SPORTS MATCHES
=====================================
*/

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


/*
=====================================
TEST DSG RUGBY MATCHES
=====================================
*/

router.get("/test-dsg", async (req, res) => {

  try {

    const response = await axios.get(
      `${DSG_BASE_URL}/rugby/get_matches`,
      {
        params: {
          username: DSG_USERNAME,
          password: DSG_PASSWORD
        }
      }
    );

    res.json(response.data);

  } catch (error) {

    console.error("DSG error:");

    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }

    res.status(500).json({
      error: "Failed to fetch DSG rugby matches"
    });

  }

});


module.exports = router;