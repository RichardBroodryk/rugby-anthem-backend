const express = require("express");
const axios = require("axios");

const router = express.Router();

/*
==============================
CONFIG
==============================
*/

const DSG_BASE_URL = "https://dsg-api.com/clients";

const DSG_CLIENT = "rugbyanthem";
const DSG_AUTH_KEY = process.env.DSG_AUTH_KEY;


/*
==============================
API SPORTS TEST
==============================
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
==============================
DSG MATCH TEST
==============================
*/

router.get("/test-dsg", async (req, res) => {

  try {

    const response = await axios.get(
      `${DSG_BASE_URL}/${DSG_CLIENT}/rugby/get_matches`,
      {
        params: {
          client: DSG_CLIENT,
          authkey: DSG_AUTH_KEY
        }
      }
    );

    res.json(response.data);

  } catch (error) {

    res.status(500).json({
      error: "DSG request failed",
      axiosError: error.message,
      dsgResponse: error.response ? error.response.data : null
    });

  }

});

module.exports = router;