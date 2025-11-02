import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initRedis } from './services/redis.js';
import { testSupabaseConnection } from './services/supabase.js';
import { setupSocketHandlers } from './sockets/gameSocket.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from ROOT .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Bingo Backend Server is running!',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working!',
    version: '1.0.0'
  });
});

// Setup WebSocket handlers
setupSocketHandlers(io);

// Initialize services and start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    console.log('🚀 Starting Bingo Backend Server...\n');

    // Initialize Redis
    console.log('📡 Connecting to Redis...');
    initRedis();

    // Test Supabase connection
    console.log('📡 Testing Supabase connection...');
    await testSupabaseConnection();

    // Start server
    httpServer.listen(PORT, () => {
      console.log('\n✅ Server is running!');
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket ready for connections\n`);
      console.log('⏳ Waiting for client connections...\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

startServer();
