const express = require("express");
const router = express.Router();

const { getMatches } = require("../providers/highlightly/matches");

router.get("/test", async (req, res) => {
  try {
    const data = await getMatches({
      homeTeamName: "South Africa",
    });

    res.json({
      success: true,
      provider: "Highlightly",
      count: Array.isArray(data?.data)
        ? data.data.length
        : Array.isArray(data)
        ? data.length
        : 0,
      data,
    });
  } catch (error) {
    console.error("❌ Highlightly test failed:", error.message);

    res.status(500).json({
      success: false,
      provider: "Highlightly",
      error: error.message,
    });
  }
});

module.exports = router;