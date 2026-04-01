const db = require("../db");

/* ================= GET LOYALTY ================= */

async function getLoyalty(userId) {
  console.log("🟡 [LOYALTY] Fetching user:", userId);

  try {
    const result = await db.query(
      "SELECT * FROM user_loyalty WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      console.warn("⚠️ [LOYALTY] No record → returning default");

      return {
        user_id: userId,
        points: 0,
        tier: "bronze",
      };
    }

    return result.rows[0];
  } catch (err) {
    console.error("🔴 [LOYALTY] Fetch failed:", err);

    return {
      user_id: userId,
      points: 0,
      tier: "bronze",
    };
  }
}

/* ================= UPDATE LOYALTY ================= */

async function updateLoyalty(userId, points, tier) {
  console.log("🟡 [LOYALTY] Updating:", userId);

  try {
    await db.query(
      `
      INSERT INTO user_loyalty (user_id, points, tier)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id)
      DO UPDATE SET
        points = EXCLUDED.points,
        tier = EXCLUDED.tier,
        updated_at = CURRENT_TIMESTAMP
    `,
      [userId, points, tier]
    );

    return true;
  } catch (err) {
    console.error("🔴 [LOYALTY] Update failed:", err);
    return false;
  }
}

module.exports = { getLoyalty, updateLoyalty };