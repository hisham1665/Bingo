import { redisHelpers } from '../services/redis.js';
import {
  createEmptyBoard,
  validateBoard,
  getNextPlayer,
  findStrikes,
  getBingoLetters,
  checkWinner,
  generateRoomCode,
  assignPlayerColor
} from '../utils/gameLogic.js';
import { saveGameResult, saveGamePlayers } from '../../../supabase/helpers.js';

// ============================================
// TURN-BASED MULTIPLAYER BINGO
// Socket Event Handlers
// ============================================

const activeSockets = new Map();

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    activeSockets.set(socket.id, socket);

    // ==================== CREATE ROOM ====================
    socket.on('create-room', async (data) => {
      try {
        const { userId, username } = data;
        const roomCode = generateRoomCode();

        const gameState = {
          roomCode,
          hostId: userId,
          phase: 'waiting', // waiting, setup, playing, finished
          players: {
            [userId]: {
              userId,
              username,
              socketId: socket.id,
              color: assignPlayerColor(0),
              board: null, // Will be filled by player
              crossedCells: Array(25).fill(null).map(() => ({ crossed: false, color: null })),
              strikes: [], // Array of strike objects
              bingoLetters: [], // ['B', 'I', ...]
              ready: false
            }
          },
          playerOrder: [userId], // Turn rotation order
          currentTurn: null,
          turnCount: 0,
          clickedNumbers: [], // Numbers already clicked (1-25)
          winner: null,
          createdAt: Date.now()
        };

        await redisHelpers.saveGameState(roomCode, gameState);
        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.userId = userId;

        socket.emit('room-created', { success: true, roomCode, gameState });
        console.log(`✅ Room created: ${roomCode} by ${username}`);
      } catch (error) {
        console.error('❌ Error creating room:', error);
        socket.emit('error', { message: 'Failed to create room' });
      }
    });

    // ==================== JOIN ROOM ====================
    socket.on('join-room', async (data) => {
      try {
        const { roomCode, userId, username } = data;
        const gameState = await redisHelpers.getGameState(roomCode);

        if (!gameState) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        if (gameState.phase !== 'waiting') {
          socket.emit('error', { message: 'Game already started' });
          return;
        }

        // Check if player already in room (reconnection)
        if (gameState.players[userId]) {
          // Player is reconnecting - update socket ID
          gameState.players[userId].socketId = socket.id;
          await redisHelpers.saveGameState(roomCode, gameState);
          
          socket.join(roomCode);
          socket.roomCode = roomCode;
          socket.userId = userId;
          
          // Send current game state to reconnecting player
          socket.emit('player-joined', {
            player: gameState.players[userId],
            gameState
          });
          
          console.log(`🔄 ${username} reconnected to room: ${roomCode}`);
          return;
        }

        // New player joining
        const playerIndex = Object.keys(gameState.players).length;
        gameState.players[userId] = {
          userId,
          username,
          socketId: socket.id,
          color: assignPlayerColor(playerIndex),
          board: null,
          crossedCells: Array(25).fill(null).map(() => ({ crossed: false, color: null })),
          strikes: [],
          bingoLetters: [],
          ready: false
        };
        gameState.playerOrder.push(userId);

        await redisHelpers.saveGameState(roomCode, gameState);
        socket.join(roomCode);
        socket.roomCode = roomCode;
        socket.userId = userId;

        io.to(roomCode).emit('player-joined', {
          player: gameState.players[userId],
          gameState
        });

        console.log(`👤 ${username} joined room: ${roomCode}`);
      } catch (error) {
        console.error('❌ Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // ==================== SUBMIT BOARD (Setup Phase) ====================
    socket.on('submit-board', async (data) => {
      try {
        const { roomCode, userId, board } = data;
        const gameState = await redisHelpers.getGameState(roomCode);

        if (!gameState) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        if (gameState.phase !== 'waiting' && gameState.phase !== 'setup') {
          socket.emit('error', { message: 'Board setup phase has ended' });
          return;
        }

        if (!validateBoard(board)) {
          socket.emit('error', { message: 'Invalid board. Must have 1-25 exactly once.' });
          return;
        }

        gameState.players[userId].board = board;
        gameState.players[userId].ready = true;

        // Switch to setup phase if not already
        if (gameState.phase === 'waiting') {
          gameState.phase = 'setup';
        }

        // Check if all players ready
        const allReady = Object.values(gameState.players).every(p => p.ready);

        if (allReady && Object.keys(gameState.players).length >= 2) {
          // Start game - set first player's turn
          gameState.phase = 'playing';
          gameState.currentTurn = gameState.playerOrder[0]; // FIXED: Use currentTurn not currentTurnUserId
          gameState.turnCount = 0;
          gameState.startedAt = new Date().toISOString();
        }

        await redisHelpers.saveGameState(roomCode, gameState);

        io.to(roomCode).emit('board-submitted', {
          userId,
          username: gameState.players[userId].username,
          allReady,
          gameState
        });

        if (allReady) {
          io.to(roomCode).emit('game-started', { gameState });
          
          // Notify whose turn it is
          io.to(roomCode).emit('turn-changed', {
            currentTurnUserId: gameState.currentTurn,
            currentTurnUsername: gameState.players[gameState.currentTurn].username
          });
          
          console.log(`🎮 Game started in room: ${roomCode}. First turn: ${gameState.players[gameState.currentTurn].username}`);
        }
      } catch (error) {
        console.error('❌ Error submitting board:', error);
        socket.emit('error', { message: 'Failed to submit board' });
      }
    });

    // ==================== CLICK NUMBER (Turn-Based Action) ====================
    socket.on('click-number', async (data) => {
      try {
        const { roomCode, userId, number } = data;
        const gameState = await redisHelpers.getGameState(roomCode);

        if (!gameState) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        if (gameState.phase !== 'playing') {
          socket.emit('error', { message: 'Game not in progress' });
          return;
        }

        // Validate turn
        if (gameState.currentTurn !== userId) {
          socket.emit('error', { message: 'Not your turn!' });
          return;
        }

        // Validate number
        if (typeof number !== 'number' || number < 1 || number > 25) {
          socket.emit('error', { message: 'Invalid number' });
          return;
        }

        // Check if already clicked
        if (gameState.clickedNumbers.includes(number)) {
          socket.emit('error', { message: 'Number already clicked' });
          return;
        }

        // Check if number exists on player's board
        const player = gameState.players[userId];
        let numberExists = false;
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 5; col++) {
            if (player.board[row][col] === number) {
              numberExists = true;
              break;
            }
          }
          if (numberExists) break;
        }

        if (!numberExists) {
          socket.emit('error', { message: 'Number not on your board' });
          return;
        }

        // Mark clicked
        gameState.clickedNumbers.push(number);

        // Cross the number on ALL players' boards
        for (const playerId in gameState.players) {
          const p = gameState.players[playerId];
          for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
              if (p.board[row][col] === number) {
                const cellIndex = row * 5 + col;
                // Store as object with crossed flag and color
                p.crossedCells[cellIndex] = {
                  crossed: true,
                  color: player.color
                };
              }
            }
          }
        }

        // Check for new strikes for ALL players
        const newStrikes = {};
        for (const playerId in gameState.players) {
          const p = gameState.players[playerId];
          const strikes = findStrikes(p.crossedCells);
          const newStrikeCount = strikes.length;
          const oldStrikeCount = p.strikes.length;

          if (newStrikeCount > oldStrikeCount) {
            p.strikes = strikes;
            p.bingoLetters = getBingoLetters(newStrikeCount);
            newStrikes[playerId] = {
              username: p.username,
              strikeCount: newStrikeCount,
              letters: p.bingoLetters
            };

            // Check for winner
            if (checkWinner(newStrikeCount)) {
              gameState.phase = 'finished';
              gameState.winner = playerId;

              // Save to Supabase
              try {
                const winner = gameState.players[playerId];
                const gameResult = await saveGameResult({
                  roomCode: roomCode,
                  winnerId: playerId,
                  winnerUsername: winner.username,
                  winningPattern: 'BINGO (5 strikes)',
                  totalPlayers: Object.keys(gameState.players).length,
                  numbersCalledCount: gameState.clickedNumbers.length,
                  totalStrikes: 5,
                  totalTurns: gameState.turnCount || 0,
                  startedAt: gameState.startedAt || new Date().toISOString(),
                  endedAt: new Date().toISOString()
                });

                if (gameResult) {
                  await saveGamePlayers(
                    gameResult.id,
                    Object.values(gameState.players).map(p => ({
                      userId: p.userId,
                      username: p.username,
                      board: p.board,
                      markedCells: p.crossedCells,
                      playerColor: p.color,
                      strikes: p.strikes,
                      bingoLetters: p.bingoLetters,
                      finalStrikesCount: p.strikes.length,
                      isWinner: p.userId === playerId
                    }))
                  );
                }
              } catch (dbError) {
                console.error('❌ DB save error:', dbError);
              }

              break; // Stop checking other players
            }
          }
        }

        // Move to next turn
        const nextUserId = getNextPlayer(gameState.playerOrder, userId);
        gameState.currentTurn = nextUserId;
        gameState.turnCount++;

        await redisHelpers.saveGameState(roomCode, gameState);

        // Broadcast number clicked
        io.to(roomCode).emit('number-clicked', {
          number,
          clickedBy: {
            userId,
            username: player.username,
            color: player.color
          },
          gameState
        });

        // Broadcast new strikes
        for (const playerId in newStrikes) {
          io.to(roomCode).emit('player-scored-strike', {
            ...newStrikes[playerId],
            userId: playerId
          });
        }

        // Broadcast winner
        if (gameState.winner) {
          io.to(roomCode).emit('game-over', {
            winner: {
              userId: gameState.winner,
              username: gameState.players[gameState.winner].username
            },
            gameState
          });
          console.log(`🏆 Winner: ${gameState.players[gameState.winner].username} in room ${roomCode}`);
        } else {
          // Broadcast turn change
          io.to(roomCode).emit('turn-changed', {
            currentTurnUserId: nextUserId,
            currentTurnUsername: gameState.players[nextUserId].username
          });
        }
      } catch (error) {
        console.error('❌ Error clicking number:', error);
        socket.emit('error', { message: 'Failed to process click' });
      }
    });

    // ==================== START GAME (Host only) ====================
    socket.on('start-game', async (data) => {
      try {
        const { roomCode, userId } = data;
        const gameState = await redisHelpers.getGameState(roomCode);

        if (!gameState) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        if (gameState.hostId !== userId) {
          socket.emit('error', { message: 'Only host can start game' });
          return;
        }

        if (Object.keys(gameState.players).length < 2) {
          socket.emit('error', { message: 'Need at least 2 players' });
          return;
        }

        gameState.phase = 'setup';
        await redisHelpers.saveGameState(roomCode, gameState);

        io.to(roomCode).emit('setup-phase-started', { gameState });
        console.log(`📝 Setup phase started in room: ${roomCode}`);
      } catch (error) {
        console.error('❌ Error starting game:', error);
        socket.emit('error', { message: 'Failed to start game' });
      }
    });

    // ==================== DISCONNECT ====================
    socket.on('disconnect', async () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
      activeSockets.delete(socket.id);

      if (socket.roomCode && socket.userId) {
        try {
          const gameState = await redisHelpers.getGameState(socket.roomCode);
          if (gameState) {
            delete gameState.players[socket.userId];
            gameState.playerOrder = gameState.playerOrder.filter(id => id !== socket.userId);

            if (Object.keys(gameState.players).length === 0) {
              // Delete room if empty
              await redisHelpers.deleteGameState(socket.roomCode);
              console.log(`🗑️ Room deleted: ${socket.roomCode}`);
            } else {
              // Reassign host if needed
              if (gameState.hostId === socket.userId) {
                gameState.hostId = gameState.playerOrder[0];
              }

              // Adjust turn if current player left
              if (gameState.currentTurn === socket.userId && gameState.phase === 'playing') {
                gameState.currentTurn = getNextPlayer(gameState.playerOrder, socket.userId);
              }

              await redisHelpers.saveGameState(socket.roomCode, gameState);
              io.to(socket.roomCode).emit('player-left', {
                userId: socket.userId,
                gameState
              });
            }
          }
        } catch (error) {
          console.error('❌ Error handling disconnect:', error);
        }
      }
    });
  });
};
