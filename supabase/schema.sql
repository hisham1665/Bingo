-- ============================================
-- BINGO GAME DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Users Table (stores player profiles)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  username TEXT UNIQUE NOT NULL,
  total_games INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Games Table (stores completed game history)
CREATE TABLE IF NOT EXISTS games (
  id BIGSERIAL PRIMARY KEY,
  room_code TEXT NOT NULL,
  winner_id TEXT,
  winner_username TEXT,
  total_strikes INTEGER, -- NEW: How many strikes winner had (should be 5)
  total_players INTEGER,
  total_turns INTEGER, -- NEW: How many turns were played
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Game Players Table (stores player participation in each game)
CREATE TABLE IF NOT EXISTS game_players (
  id BIGSERIAL PRIMARY KEY,
  game_id BIGINT REFERENCES games(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  player_color TEXT, -- NEW: Player's assigned color
  board JSONB NOT NULL, -- Player's custom 1-25 board layout
  crossed_cells JSONB NOT NULL, -- Array of {crossed: bool, color: string}
  strikes JSONB, -- NEW: Array of strike objects [{type, index, cells}]
  bingo_letters JSONB, -- NEW: Array of earned letters ['B', 'I', 'N', 'G', 'O']
  final_strikes_count INTEGER DEFAULT 0, -- NEW: Final strikes count
  is_winner BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_games_room_code ON games(room_code);
CREATE INDEX IF NOT EXISTS idx_games_winner_id ON games(winner_id);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_players_game_id ON game_players(game_id);
CREATE INDEX IF NOT EXISTS idx_game_players_user_id ON game_players(user_id);

-- Function to update user stats when they win
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.winner_id IS NOT NULL THEN
    UPDATE users 
    SET 
      total_wins = total_wins + 1,
      total_games = total_games + 1,
      updated_at = NOW()
    WHERE username = NEW.winner_username;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update user stats on game completion
CREATE TRIGGER trigger_update_user_stats
AFTER INSERT ON games
FOR EACH ROW
EXECUTE FUNCTION update_user_stats();

-- ============================================
-- OPTIONAL: Enable Row Level Security (RLS)
-- ============================================

-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read users
CREATE POLICY "Public users are viewable by everyone"
ON users FOR SELECT
USING (true);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid()::text = id::text);

-- Policy: Anyone can read games
CREATE POLICY "Games are viewable by everyone"
ON games FOR SELECT
USING (true);

-- Policy: Server can insert games (using service role key)
CREATE POLICY "Service role can insert games"
ON games FOR INSERT
WITH CHECK (true);

-- Policy: Anyone can read game players
CREATE POLICY "Game players are viewable by everyone"
ON game_players FOR SELECT
USING (true);

-- ============================================
-- SUCCESS! Your database is ready! 🎉
-- ============================================
