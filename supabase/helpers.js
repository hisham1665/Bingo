import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load ROOT .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env');
}

/**
 * Public Supabase Client (respects RLS)
 * Use for frontend and authenticated operations
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  }
});

/**
 * Admin Supabase Client (bypasses RLS)
 * Use ONLY on backend for server operations
 */
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// ============================================
// GAME HISTORY FUNCTIONS
// ============================================

/**
 * Save completed game to database
 * @param {Object} gameData - Game information
 * @returns {Promise<Object>} Saved game record
 */
export const saveGameResult = async (gameData) => {
  try {
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('games')
      .insert({
        room_code: gameData.roomCode,
        winner_id: gameData.winnerId,
        winner_username: gameData.winnerUsername,
        winning_pattern: gameData.winningPattern,
        total_players: gameData.totalPlayers,
        numbers_called: gameData.numbersCalledCount,
        total_strikes: gameData.totalStrikes || 5,
        total_turns: gameData.totalTurns || 0,
        started_at: gameData.startedAt,
        ended_at: gameData.endedAt
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Game saved: ${gameData.roomCode} - Winner: ${gameData.winnerUsername}`);
    return data;
  } catch (error) {
    console.error('❌ Error saving game:', error.message);
    return null;
  }
};

/**
 * Save all players who participated in a game
 * @param {Number} gameId - ID of the game
 * @param {Array} players - Array of player objects
 */
export const saveGamePlayers = async (gameId, players) => {
  try {
    const client = supabaseAdmin || supabase;
    
    const playerRecords = players.map(player => ({
      game_id: gameId,
      user_id: player.userId,
      username: player.username,
      board: player.board,
      marked_cells: player.markedCells,
      player_color: player.playerColor || null,
      strikes: player.strikes || [],
      bingo_letters: player.bingoLetters || [],
      final_strikes_count: player.finalStrikesCount || 0,
      is_winner: player.isWinner || false
    }));

    const { error } = await client
      .from('game_players')
      .insert(playerRecords);

    if (error) throw error;

    console.log(`✅ Saved ${players.length} players for game ${gameId}`);
  } catch (error) {
    console.error('❌ Error saving game players:', error.message);
  }
};

/**
 * Get game history for a specific user
 * @param {String} username - Username to lookup
 * @param {Number} limit - Number of games to return
 */
export const getUserGameHistory = async (username, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .or(`winner_username.eq.${username}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Error fetching game history:', error.message);
    return [];
  }
};

// ============================================
// USER PROFILE FUNCTIONS
// ============================================

/**
 * Get user profile by username
 * @param {String} username - Username to find
 */
export const getUserProfile = async (username) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('❌ Error fetching user:', error.message);
    return null;
  }
};

/**
 * Create new user profile
 * @param {String} username - Username
 * @param {String} email - Email (optional)
 */
export const createUserProfile = async (username, email = null) => {
  try {
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('users')
      .insert({
        username,
        email,
        total_games: 0,
        total_wins: 0
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ User created: ${username}`);
    return data;
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    return null;
  }
};

/**
 * Update user statistics
 * @param {String} username - Username
 * @param {Object} stats - Stats to update
 */
export const updateUserStats = async (username, stats) => {
  try {
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('users')
      .update({
        total_games: stats.totalGames,
        total_wins: stats.totalWins,
        updated_at: new Date().toISOString()
      })
      .eq('username', username)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Error updating user stats:', error.message);
    return null;
  }
};

/**
 * Get leaderboard (top players by wins)
 * @param {Number} limit - Number of players to return
 */
export const getLeaderboard = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('username, total_games, total_wins')
      .order('total_wins', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Error fetching leaderboard:', error.message);
    return [];
  }
};

// ============================================
// TEST CONNECTION
// ============================================

export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') throw error;

    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
};

export default {
  supabase,
  supabaseAdmin,
  saveGameResult,
  saveGamePlayers,
  getUserGameHistory,
  getUserProfile,
  createUserProfile,
  updateUserStats,
  getLeaderboard,
  testConnection
};
