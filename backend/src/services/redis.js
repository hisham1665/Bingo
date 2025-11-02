import Redis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from ROOT .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

let redis = null;

// Initialize Redis connection
export const initRedis = () => {
  try {
    const redisUrl = process.env.UPSTASH_REDIS_URL;
    
    if (!redisUrl) {
      console.warn('⚠️  Redis URL not found in .env file');
      return null;
    }

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redis.on('error', (err) => {
      console.error('❌ Redis connection error:', err.message);
    });

    return redis;
  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error.message);
    return null;
  }
};

// Get Redis instance
export const getRedis = () => {
  if (!redis) {
    redis = initRedis();
  }
  return redis;
};

// Redis helper functions for game state
export const redisHelpers = {
  // Save game state
  async saveGameState(roomCode, gameData) {
    const redisClient = getRedis();
    if (!redisClient) return false;
    
    try {
      await redisClient.setex(
        `game:${roomCode}`,
        3600, // Expire after 1 hour
        JSON.stringify(gameData)
      );
      return true;
    } catch (error) {
      console.error('Error saving game state:', error);
      return false;
    }
  },

  // Get game state
  async getGameState(roomCode) {
    const redisClient = getRedis();
    if (!redisClient) return null;
    
    try {
      const data = await redisClient.get(`game:${roomCode}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting game state:', error);
      return null;
    }
  },

  // Delete game state
  async deleteGameState(roomCode) {
    const redisClient = getRedis();
    if (!redisClient) return false;
    
    try {
      await redisClient.del(`game:${roomCode}`);
      return true;
    } catch (error) {
      console.error('Error deleting game state:', error);
      return false;
    }
  },

  // Update specific field in game state
  async updateGameState(roomCode, updates) {
    const gameState = await this.getGameState(roomCode);
    if (!gameState) return false;

    const updatedState = { ...gameState, ...updates };
    return await this.saveGameState(roomCode, updatedState);
  }
};

export default redis;
