import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Users, Trophy, Zap } from 'lucide-react';
import socket from '../services/socket';
import toast from 'react-hot-toast';

const Home = () => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateRoom = () => {
    if (!username.trim()) {
      toast.error('Please enter your username!', {
        icon: '🎮',
        style: {
          background: '#1f2937',
          color: '#fff',
          border: '2px solid #8b5cf6',
        }
      });
      return;
    }
    
    // Connect socket
    if (!socket.connected) {
      socket.connect();
    }

    // Generate fake user ID (you can use Supabase auth later)
    const userId = 'user_' + Math.random().toString(36).substr(2, 9);
    
    socket.emit('create-room', { userId, username });
    
    socket.once('room-created', (data) => {
      if (data.success) {
        // Save to localStorage
        localStorage.setItem('bingo_room', data.roomCode);
        localStorage.setItem('bingo_username', username);
        localStorage.setItem('bingo_userId', userId);
        
        toast.success(`Room created: ${data.roomCode}`, {
          icon: '🎉',
          duration: 2000,
        });
        
        // Navigate to room
        navigate(`/room/${data.roomCode}`);
      }
    });

    socket.once('error', (data) => {
      toast.error(data.message);
    });
  };

  const handleJoinRoom = () => {
    if (!username.trim()) {
      toast.error('Please enter your username!');
      return;
    }
    
    if (!roomCode.trim()) {
      toast.error('Please enter room code!');
      return;
    }

    // Connect socket
    if (!socket.connected) {
      socket.connect();
    }

    const userId = 'user_' + Math.random().toString(36).substr(2, 9);
    
    socket.emit('join-room', { roomCode: roomCode.toUpperCase(), userId, username });
    
    socket.once('player-joined', (data) => {
      // Check if this event is for the current user joining
      if (data.player.userId === userId) {
        // Save to localStorage
        localStorage.setItem('bingo_room', roomCode.toUpperCase());
        localStorage.setItem('bingo_username', username);
        localStorage.setItem('bingo_userId', userId);
        
        toast.success('Joined successfully!', { icon: '🎊' });
        
        // Navigate to room
        navigate(`/room/${roomCode.toUpperCase()}`);
      }
    });

    socket.once('error', (data) => {
      toast.error(data.message);
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <div className="relative z-10 max-w-6xl w-full">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.h1
            className="text-8xl font-black mb-6"
          >
            <span className="text-blue-600 dark:text-blue-400">BINGO</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl text-gray-700 dark:text-gray-300 font-semibold flex items-center justify-center gap-2"
          >
            <Zap className="text-blue-500" />
            Strategic Turn-Based Multiplayer
            <Zap className="text-blue-500" />
          </motion.p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          <div className="glass p-6 rounded-2xl text-center shadow-lg">
            <Users className="w-12 h-12 mx-auto mb-3 text-blue-600" />
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">∞</h3>
            <p className="text-gray-600 dark:text-gray-300">Players Online</p>
          </div>
          
          <div className="glass p-6 rounded-2xl text-center shadow-lg">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-amber-500" />
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">LIVE</h3>
            <p className="text-gray-600 dark:text-gray-300">Active Games</p>
          </div>
          
          <div className="glass p-6 rounded-2xl text-center shadow-lg">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-cyan-500" />
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">100%</h3>
            <p className="text-gray-600 dark:text-gray-300">Fun Factor</p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col md:flex-row gap-6 justify-center items-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-2xl px-12 py-6 rounded-2xl font-bold flex items-center gap-3 shadow-xl"
          >
            <Sparkles className="w-8 h-8" />
            CREATE ROOM
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowJoinModal(true)}
            className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-2 border-blue-600 text-2xl px-12 py-6 rounded-2xl font-bold flex items-center gap-3 shadow-xl hover:bg-blue-50 dark:hover:bg-gray-700"
          >
            <Users className="w-8 h-8" />
            JOIN ROOM
          </motion.button>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="flex flex-wrap justify-center gap-4">
            {['Real-time Multiplayer', 'Instant Wins', 'Epic Animations', 'No Ads'].map((feature, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + i * 0.1 }}
                className="glass px-6 py-3 rounded-full text-sm font-semibold"
              >
                ✨ {feature}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass max-w-md w-full p-8 rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-4xl font-bold mb-6 text-center text-gray-900 dark:text-white">
              Create Room
            </h2>
            
            <input
              type="text"
              placeholder="Enter your username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-6 py-4 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-2 border-blue-300 dark:border-blue-600 text-lg mb-6 focus:outline-none focus:ring-4 focus:ring-blue-500"
              autoFocus
            />
            
            <div className="flex gap-4">
              <button
                onClick={handleCreateRoom}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold"
              >
                CREATE 🎮
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-bold"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Join Room Modal */}
      {showJoinModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowJoinModal(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass max-w-md w-full p-8 rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-4xl font-bold mb-6 text-center text-gray-900 dark:text-white">
              Join Room
            </h2>
            
            <input
              type="text"
              placeholder="Your username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-6 py-4 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-2 border-blue-300 dark:border-blue-600 text-lg mb-4 focus:outline-none focus:ring-4 focus:ring-blue-500"
            />
            
            <input
              type="text"
              placeholder="Room code (e.g., ABC123)..."
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full px-6 py-4 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 border-2 border-blue-300 dark:border-blue-600 text-lg mb-6 focus:outline-none focus:ring-4 focus:ring-blue-500 uppercase tracking-wider font-bold"
            />
            
            <div className="flex gap-4">
              <button
                onClick={handleJoinRoom}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold"
              >
                JOIN 🚀
              </button>
              <button
                onClick={() => setShowJoinModal(false)}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-bold"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Home;
