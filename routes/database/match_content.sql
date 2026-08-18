-- =====================================================
-- RAZ MATCH CONTENT
-- Administrator-controlled match highlights + statistics
-- =====================================================

CREATE TABLE IF NOT EXISTS match_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Existing RAZ match ID from the frontend match catalogue
  match_id INTEGER UNIQUE NOT NULL,

  -- Administrator-approved video URL
  highlight_url TEXT,

  -- ===================================================
  -- HOME TEAM STATISTICS
  -- ===================================================

  home_metres_made INTEGER,
  home_carries INTEGER,
  home_defenders_beaten INTEGER,
  home_clean_breaks INTEGER,
  home_offloads INTEGER,
  home_tackles_made INTEGER,
  home_tackles_missed INTEGER,
  home_turnovers_won INTEGER,
  home_penalties_conceded INTEGER,

  -- ===================================================
  -- AWAY TEAM STATISTICS
  -- ===================================================

  away_metres_made INTEGER,
  away_carries INTEGER,
  away_defenders_beaten INTEGER,
  away_clean_breaks INTEGER,
  away_offloads INTEGER,
  away_tackles_made INTEGER,
  away_tackles_missed INTEGER,
  away_turnovers_won INTEGER,
  away_penalties_conceded INTEGER,

  -- ===================================================
  -- TIMESTAMP
  -- ===================================================

  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_content_match_id
  ON match_content(match_id);