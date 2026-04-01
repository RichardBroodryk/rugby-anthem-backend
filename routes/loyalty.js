const express = require("express");
const router = express.Router();

const { getLoyalty, updateLoyalty } = require("../services/loyaltyService");

/* ================= GET ================= */

router.get("/:userId", async (req, res) => {
  const start = Date.now();
  const { userId } = req.params;

  console.log("🟢 [LOYALTY ROUTE] GET", userId);

  try {
    const data = await getLoyalty(userId);

    console.log(
      `🟢 [LOYALTY ROUTE] Success — ${Date.now() - start}ms`
    );

    return res.json(data);
  } catch (err) {
    console.error("🔴 [LOYALTY ROUTE] Failed");

    return res.json({
      user_id: userId,
      points: 0,
      tier: "bronze",
    });
  }
});

/* ================= POST ================= */

router.post("/", async (req, res) => {
  const start = Date.now();
  const { userId, points, tier } = req.body;

  console.log("🟢 [LOYALTY ROUTE] UPDATE", userId);

  try {
    const success = await updateLoyalty(userId, points, tier);

    return res.json({ success });
  } catch (err) {
    console.error("🔴 [LOYALTY ROUTE] Update failed");

    return res.json({ success: false });
  }
});

module.exports = router;