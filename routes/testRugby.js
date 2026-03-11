const express = require("express");
const axios = require("axios");

const router = express.Router();

/*
=====================================
CONFIG
=====================================
*/

const DSG_BASE_URL = "https://dsg-api.com";

const DSG_USERNAME = process.env.DSG_USERNAME;
const DSG_PASSWORD = process.env.DSG_PASSWORD;
const DSG_AUTH_KEY = process.env.DSG_AUTH_KEY;


/*
=====================================
API SPORTS TEST
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

    res.status(500).json({
      error: "API-Sports failed",
      details: error.message
    });

  }

});


/*
=====================================
DSG DEBUG ENDPOINT
=====================================
*/

router.get("/test-dsg", async (req, res) => {

  try {

    const response = await axios.get(
      `${DSG_BASE_URL}/rugby/get_matches`,
      {
        params: {
          username: DSG_USERNAME,
          password: DSG_PASSWORD,
          authkey: DSG_AUTH_KEY
        }
      }
    );

    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "DSG request failed",
      axiosError: error.message,
      dsgResponse: error.response ? error.response.data : null
    });

  }

});


module.exports = router;