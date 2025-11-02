// v3.0.0 - FIXED: Variables moved after loading check
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, Zap, Star, Crown, LogOut } from 'lucide-react';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';
import socket from '../services/socket';
import BingoBoard from '../components/BingoBoard';
import NumberDisplay from '../components/NumberDisplay';
import PlayersList from '../components/PlayersList';
import BoardBuilder from '../components/BoardBuilder';

console.log('🎮 Game.jsx v3.0.0 loaded - Variables after loading check');

const Game = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  
  // Get from localStorage
  const [username, setUsername] = useState(localStorage.getItem('bingo_username') || '');
  const [userId, setUserId] = useState(localStorage.getItem('bingo_userId') || '');
  
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myBoard, setMyBoard] = useState(null);
  const [markedCells, setMarkedCells] = useState(Array(25).fill(false));
  const [isReady, setIsReady] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [winner, setWinner] = useState(null);

  // Reconnect to room on mount/refresh
  useEffect(() => {
    if (!username || !userId || !roomCode) {
      toast.error('Session expired. Redirecting...');
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    // Connect socket if not connected
    if (!socket.connected) {
      socket.connect();
    }

    // Join the room only if we don't have gameState yet
    if (!gameState) {
      socket.emit('join-room', { roomCode, userId, username });
    }

    const handlePlayerJoined = (data) => {
      if (data.player.userId === userId) {
        setGameState(data.gameState);
        setLoading(false);
        toast.success('Connected to room!', { icon: '🎮' });
      }
    };

    const handleError = (data) => {
      toast.error(data.message);
      setLoading(false);
      setTimeout(() => navigate('/'), 2000);
    };

    socket.on('player-joined', handlePlayerJoined);
    socket.on('error', handleError);

    return () => {
      socket.off('player-joined', handlePlayerJoined);
      socket.off('error', handleError);
    };
  }, [roomCode, username, userId, navigate, gameState]);

  // Initialize board when gameState updates
  useEffect(() => {
    const player = gameState?.players?.[userId];
    if (player && !myBoard && player.board) {
      setMyBoard(player.board);
      
      // Initialize marked cells (no FREE space in turn-based)
      const initialMarked = player.crossedCells || Array(25).fill(false);
      setMarkedCells(initialMarked);
    }
  }, [gameState, userId, myBoard]);

  // Socket event listeners for turn-based game
  useEffect(() => {
    socket.on('player-joined', (data) => {
      toast.success(`${data.player.username} joined!`, { icon: '👋' });
      setGameState(data.gameState);
    });

    socket.on('setup-phase-started', (data) => {
      toast.success('Setup your board!', { icon: '📝' });
      setGameState(data.gameState);
    });

    socket.on('board-submitted', (data) => {
      toast.success(`${data.username} is ready!`, { icon: '✅' });
      setGameState(data.gameState);
    });

    socket.on('game-started', (data) => {
      toast.success('Game Started! 🎮', { icon: '🔥' });
      setGameState(data.gameState);
    });

    socket.on('number-clicked', (data) => {
      toast.success(`${data.clickedBy.username} clicked ${data.number}`, {
        icon: '🎯',
        duration: 2000,
        style: {
          background: data.clickedBy.color,
          color: '#fff',
        }
      });
      setGameState(data.gameState);
      
      // Update my marked cells from server state
      const myPlayer = data.gameState?.players?.[userId];
      if (myPlayer) {
        setMarkedCells(myPlayer.crossedCells);
      }
    });

    socket.on('player-scored-strike', (data) => {
      const letters = data.letters.join('');
      toast.success(`${data.username} earned ${letters}!`, {
        icon: '⭐',
        duration: 3000
      });
    });

    socket.on('turn-changed', (data) => {
      if (data.currentTurnUserId === userId) {
        toast('Your turn!', { icon: '👉', duration: 2000 });
      }
    });

    socket.on('game-over', (data) => {
      setWinner(data.winner);
      setShowWinner(true);
      setGameState(data.gameState);
      toast.success(`${data.winner.username} wins!`, { icon: '🏆' });
    });

    socket.on('player-left', (data) => {
      setGameState(data.gameState);
      toast('A player left', { icon: '👋' });
    });

    socket.on('error', (data) => {
      toast.error(data.message, { icon: '❌' });
    });

    return () => {
      socket.off('player-joined');
      socket.off('setup-phase-started');
      socket.off('board-submitted');
      socket.off('game-started');
      socket.off('number-clicked');
      socket.off('player-scored-strike');
      socket.off('turn-changed');
      socket.off('game-over');
      socket.off('player-left');
      socket.off('error');
    };
  }, [userId]); // Only depend on userId

  const handleReady = () => {
    setIsReady(true);
    socket.emit('player-ready', {
      roomCode: gameState.roomCode,
      userId
    });
    toast.success('You are ready!', { icon: '✅' });
  };

  const handleStartGame = () => {
    socket.emit('start-game', {
      roomCode: gameState.roomCode,
      userId
    });
  };

  const handleBoardSubmit = (board2D) => {
    socket.emit('submit-board', {
      roomCode: gameState.roomCode,
      userId,
      board: board2D
    });
    toast.success('Board submitted! ✅');
  };

  const handleCallNumber = () => {
    socket.emit('call-number', {
      roomCode: gameState.roomCode,
      userId
    });
  };

  const handleClaimBingo = () => {
    socket.emit('claim-bingo', {
      roomCode: gameState.roomCode,
      userId
    });
  };

  const handleNumberClick = (number, index) => {
    // Only allow clicking on your turn
    if (gameState.currentTurn !== userId) {
      toast.error('Not your turn!');
      return;
    }

    // Check if already crossed
    const crossedCell = currentPlayer?.crossedCells?.[index];
    if (crossedCell?.crossed) {
      toast.error('Already crossed!');
      return;
    }

    // Emit click-number event
    socket.emit('click-number', {
      roomCode: gameState.roomCode,
      userId,
      number,
      cellIndex: index
    });

    toast.success(`You clicked ${number}!`, { icon: '🎯' });
  };

  const handleLeave = () => {
    // Clear localStorage
    localStorage.removeItem('bingo_room');
    localStorage.removeItem('bingo_username');
    localStorage.removeItem('bingo_userId');
    
    // Disconnect socket
    socket.disconnect();
    
    // Navigate home
    navigate('/');
    
    toast('Left the game', { icon: '👋' });
  };

  // Show loading state while reconnecting
  if (!gameState || loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="glass p-8 rounded-2xl text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {loading ? 'Reconnecting to game...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Only compute these AFTER we know gameState exists
  const isHost = gameState.hostId === userId;
  const currentPlayer = gameState.players[userId] || null;
  const playersArray = Object.values(gameState.players);

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Confetti on Win */}
      {showWinner && <Confetti recycle={true} numberOfPieces={500} />}

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex justify-between items-center mb-6"
        >
          <div className="glass px-6 py-4 rounded-2xl">
            <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
              <Star className="text-blue-600" />
              BINGO GAME
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Room: <span className="font-bold text-blue-600 text-lg">{gameState.roomCode}</span></p>
          </div>

          <button
            onClick={handleLeave}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Leave
          </button>
        </motion.div>

        {/* Game Status */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="glass p-6 rounded-2xl mb-6 text-center shadow-xl"
        >
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="flex items-center gap-2">
              <Users className="text-blue-600 w-6 h-6" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">{playersArray.length} Players</span>
            </div>
            
            <div className="text-3xl font-black text-gray-900 dark:text-white">
              {gameState.phase === 'waiting' && '⏳ Waiting...'}
              {gameState.phase === 'setup' && '📝 Setup Boards'}
              {gameState.phase === 'playing' && '🎮 PLAYING'}
              {gameState.phase === 'finished' && '🏆 FINISHED'}
            </div>

            {isHost && <div className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-full">
              <Crown className="w-5 h-5" />
              <span className="font-bold">HOST</span>
            </div>}
          </div>
        </motion.div>

        {/* START GAME BUTTON - PROMINENT AT TOP */}
        {gameState.phase === 'waiting' && isHost && playersArray.length >= 2 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mb-6 flex justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartGame}
              className="bg-green-600 hover:bg-green-700 text-white px-12 py-6 rounded-2xl font-black text-3xl flex items-center gap-4 shadow-2xl"
            >
              <Trophy className="w-10 h-10" />
              START GAME
            </motion.button>
          </motion.div>
        )}

        {gameState.phase === 'waiting' && playersArray.length < 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass p-6 rounded-2xl mb-6 text-center"
          >
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">
              Waiting for more players to join... (Need 2+ players)
            </p>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* SETUP PHASE: Board Builder */}
            {gameState.phase === 'setup' && !currentPlayer?.ready && (
              <BoardBuilder
                onSubmit={handleBoardSubmit}
                username={username}
              />
            )}

            {/* SETUP PHASE: Waiting for others */}
            {gameState.phase === 'setup' && currentPlayer?.ready && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="glass p-8 rounded-3xl text-center"
              >
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Board Submitted!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Waiting for other players to finish their boards...
                </p>
              </motion.div>
            )}

            {/* PLAYING PHASE: Board */}
            {gameState.phase === 'playing' && currentPlayer?.board && (
              <BingoBoard
                board={currentPlayer.board}
                crossedCells={currentPlayer.crossedCells || Array(25).fill({ crossed: false, color: null })}
                onCellClick={handleNumberClick}
                isMyTurn={gameState.currentTurn === userId}
                currentTurnPlayer={gameState.players?.[gameState.currentTurn]?.username || 'Unknown'}
                strikes={currentPlayer.strikes || []}
                bingoLetters={currentPlayer.bingoLetters || []}
              />
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">

              {gameState.status === 'playing' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClaimBingo}
                  className="btn-primary bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500 flex items-center gap-2 text-2xl px-8 py-4"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(236, 72, 153, 0.5)',
                      '0 0 40px rgba(236, 72, 153, 0.8)',
                      '0 0 20px rgba(236, 72, 153, 0.5)',
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Trophy className="w-8 h-8 animate-bounce" />
                  BINGO!
                </motion.button>
              )}
            </div>
          </div>

          {/* Sidebar - Players List */}
          <div className="lg:col-span-1">
            <PlayersList
              players={gameState.players}
              currentUserId={userId}
              hostId={gameState.hostId}
              status={gameState.phase}
            />
          </div>
        </div>
      </div>

      {/* Winner Modal */}
      <AnimatePresence>
        {showWinner && winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', duration: 0.8 }}
              className="text-center"
            >
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 10, 0],
                  scale: [1, 1.1, 1, 1.1, 1]
                }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
              >
                <Trophy className="w-40 h-40 mx-auto mb-6 text-yellow-500" />
              </motion.div>
              
              <h2 className="text-7xl font-black mb-4">
                <span className="text-blue-600 dark:text-blue-400">
                  {winner.userId === userId ? 'YOU WON!' : `${winner.username} WINS!`}
                </span>
              </h2>
              
              <p className="text-2xl text-gray-700 dark:text-gray-300 mb-8">
                Achieved 5 strikes to spell <span className="text-green-600 dark:text-green-400 font-bold">B-I-N-G-O</span>!
              </p>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLeave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 rounded-xl font-bold text-2xl"
              >
                Back to Home
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};

export default Game;
