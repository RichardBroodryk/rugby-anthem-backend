const express = require("express");
const axios = require("axios");

const router = express.Router();

/*
=====================================
CONFIG
=====================================
*/

const API_SPORTS_KEY = process.env.API_SPORTS_KEY;

const DSG_CLIENT = "rugbyanthem";
const DSG_AUTH_KEY = process.env.DSG_AUTH_KEY;

const DSG_BASE_URL = "https://dsg-api.com/clients";

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
          "x-apisports-key": API_SPORTS_KEY
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
          "x-apisports-key": API_SPORTS_KEY
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
TEST DSG MATCH (KNOWN WORKING EXAMPLE)
=====================================
*/

router.get("/test-dsg", async (req, res) => {

  try {

    const response = await axios.get(
      "https://dsg-api.com/clients/rugbyanthem/rugby/get_matches",
      {
        params: {
          type: "match",
          id: "3748401",
          client: "rugbyanthem",
          authkey: process.env.DSG_AUTH_KEY
        },
        headers: {
          "Accept": "application/json"
        }
      }
    );

    res.json(response.data);

  } catch (error) {

    console.error("DSG ERROR:", error.response?.data || error.message);

    res.status(500).json({
      error: "DSG request failed",
      axiosError: error.message,
      dsgStatus: error.response?.status,
      dsgResponse: error.response?.data
    });

  }

});
module.exports = router;