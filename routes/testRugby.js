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
// ================= MATCHES ENDPOINT =================
app.get('/api/matches', async (req, res) => {
  try {
    const response = await axios.get(
      'https://v1.rugby.api-sports.io/fixtures',
      {
        headers: {
          'x-apisports-key': process.env.API_SPORTS_KEY,
        },
        params: {
          next: 20, // next 20 fixtures
        },
      }
    );

    const fixtures = response.data.response || [];

    // Clean and simplify the data
    const matches = fixtures.map((fixture) => ({
      id: fixture.fixture.id,
      league: fixture.league.name,
      homeTeam: fixture.teams.home.name,
      awayTeam: fixture.teams.away.name,
      homeScore: fixture.scores.home,
      awayScore: fixture.scores.away,
      status: fixture.fixture.status.long,
      kickoff: fixture.fixture.date,
    }));

    res.json(matches);
  } catch (error) {
    console.error('Match fetch error:', error.message);

    res.status(500).json({
      error: 'Failed to fetch match data',
    });
  }
});
