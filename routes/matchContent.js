const express = require("express");
const router = express.Router();

const db = require("../db");
const { authMiddleware } = require("../middleware/authMiddleware");

/*
==================================================
RAZ MATCH CONTENT
==================================================

Purpose:

Stores administrator-maintained content for an
individual RAZ match.

This is deliberately independent of Highlightly.

The database stores:

- Match Highlights URL
- Home metres made
- Home carries
- Home defenders beaten
- Home clean breaks
- Home offloads
- Home tackles made
- Home tackles missed
- Home turnovers won
- Home penalties conceded
- Away equivalents

The match_id is the RAZ match ID.

Example:

GET
/api/match-content/7003
==================================================
*/

/*
==================================================
GET MATCH CONTENT

Public read access.

The MatchPage does not require the user to be
logged in simply to view match statistics.
==================================================
*/

router.get("/:matchId", async (req, res) => {
  try {
    const matchId = Number(req.params.matchId);

    if (!Number.isInteger(matchId) || matchId <= 0) {
      return res.status(400).json({
        error: "Invalid match ID",
      });
    }

    const result = await db.query(
      `
      SELECT
        id,
        match_id,
        highlight_url,

        home_metres_made,
        home_carries,
        home_defenders_beaten,
        home_clean_breaks,
        home_offloads,
        home_tackles_made,
        home_tackles_missed,
        home_turnovers_won,
        home_penalties_conceded,

        away_metres_made,
        away_carries,
        away_defenders_beaten,
        away_clean_breaks,
        away_offloads,
        away_tackles_made,
        away_tackles_missed,
        away_turnovers_won,
        away_penalties_conceded,

        updated_at

      FROM match_content
      WHERE match_id = $1
      LIMIT 1
      `,
      [matchId]
    );

    if (result.rows.length === 0) {
      return res.json(null);
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error(
      "❌ MATCH CONTENT GET ERROR:",
      error.message
    );

    return res.status(500).json({
      error: "Failed to fetch match content",
    });
  }
});

/*
==================================================
UPDATE MATCH CONTENT

Administrator-only write endpoint.

Authentication is required.

The administrator account is identified by:

ADMIN_EMAIL

in the backend environment.

This prevents an ordinary authenticated RAZ user
from changing match statistics.
==================================================
*/

router.put(
  "/:matchId",
  authMiddleware,
  async (req, res) => {
    try {
      const matchId = Number(req.params.matchId);

      if (
        !Number.isInteger(matchId) ||
        matchId <= 0
      ) {
        return res.status(400).json({
          error: "Invalid match ID",
        });
      }

      const adminEmail = String(
        process.env.ADMIN_EMAIL || ""
      )
        .trim()
        .toLowerCase();

      if (
        !adminEmail ||
        req.userEmail !== adminEmail
      ) {
        return res.status(403).json({
          error: "Administrator access required",
        });
      }

      const {
        highlight_url,

        home_metres_made,
        home_carries,
        home_defenders_beaten,
        home_clean_breaks,
        home_offloads,
        home_tackles_made,
        home_tackles_missed,
        home_turnovers_won,
        home_penalties_conceded,

        away_metres_made,
        away_carries,
        away_defenders_beaten,
        away_clean_breaks,
        away_offloads,
        away_tackles_made,
        away_tackles_missed,
        away_turnovers_won,
        away_penalties_conceded,
      } = req.body || {};

      const result = await db.query(
        `
        INSERT INTO match_content (
          match_id,
          highlight_url,

          home_metres_made,
          home_carries,
          home_defenders_beaten,
          home_clean_breaks,
          home_offloads,
          home_tackles_made,
          home_tackles_missed,
          home_turnovers_won,
          home_penalties_conceded,

          away_metres_made,
          away_carries,
          away_defenders_beaten,
          away_clean_breaks,
          away_offloads,
          away_tackles_made,
          away_tackles_missed,
          away_turnovers_won,
          away_penalties_conceded,

          updated_at
        )

        VALUES (
          $1,
          $2,

          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,

          $12,
          $13,
          $14,
          $15,
          $16,
          $17,
          $18,
          $19,
          $20,

          NOW()
        )

        ON CONFLICT (match_id)
        DO UPDATE SET

          highlight_url =
            EXCLUDED.highlight_url,

          home_metres_made =
            EXCLUDED.home_metres_made,

          home_carries =
            EXCLUDED.home_carries,

          home_defenders_beaten =
            EXCLUDED.home_defenders_beaten,

          home_clean_breaks =
            EXCLUDED.home_clean_breaks,

          home_offloads =
            EXCLUDED.home_offloads,

          home_tackles_made =
            EXCLUDED.home_tackles_made,

          home_tackles_missed =
            EXCLUDED.home_tackles_missed,

          home_turnovers_won =
            EXCLUDED.home_turnovers_won,

          home_penalties_conceded =
            EXCLUDED.home_penalties_conceded,

          away_metres_made =
            EXCLUDED.away_metres_made,

          away_carries =
            EXCLUDED.away_carries,

          away_defenders_beaten =
            EXCLUDED.away_defenders_beaten,

          away_clean_breaks =
            EXCLUDED.away_clean_breaks,

          away_offloads =
            EXCLUDED.away_offloads,

          away_tackles_made =
            EXCLUDED.away_tackles_made,

          away_tackles_missed =
            EXCLUDED.away_tackles_missed,

          away_turnovers_won =
            EXCLUDED.away_turnovers_won,

          away_penalties_conceded =
            EXCLUDED.away_penalties_conceded,

          updated_at =
            NOW()

        RETURNING *
        `,
        [
          matchId,
          highlight_url ?? null,

          home_metres_made ?? null,
          home_carries ?? null,
          home_defenders_beaten ?? null,
          home_clean_breaks ?? null,
          home_offloads ?? null,
          home_tackles_made ?? null,
          home_tackles_missed ?? null,
          home_turnovers_won ?? null,
          home_penalties_conceded ?? null,

          away_metres_made ?? null,
          away_carries ?? null,
          away_defenders_beaten ?? null,
          away_clean_breaks ?? null,
          away_offloads ?? null,
          away_tackles_made ?? null,
          away_tackles_missed ?? null,
          away_turnovers_won ?? null,
          away_penalties_conceded ?? null,
        ]
      );

      console.log(
        "✅ MATCH CONTENT UPDATED:",
        {
          matchId,
          updatedBy: req.userEmail,
        }
      );

      return res.json(result.rows[0]);
    } catch (error) {
      console.error(
        "❌ MATCH CONTENT UPDATE ERROR:",
        error.message
      );

      return res.status(500).json({
        error: "Failed to update match content",
      });
    }
  }
);

module.exports = router;