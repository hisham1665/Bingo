import { motion } from 'framer-motion';
import { Crown, Check, Clock, User } from 'lucide-react';

const PlayersList = ({ players, currentUserId, hostId, status }) => {
  // Convert players object to array
  const playersArray = Object.values(players || {});
  
  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="glass p-6 rounded-3xl h-full"
    >
      <h3 className="text-2xl font-bold mb-4 text-center">
        <span className="text-blue-600 dark:text-blue-400">
          Players ({playersArray.length})
        </span>
      </h3>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {playersArray.map((player, index) => {
          const isMe = player.userId === currentUserId;
          const isHost = player.userId === hostId;
          const isReady = player.ready;

          return (
            <motion.div
              key={player.userId}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className={`
                p-4 rounded-xl relative overflow-hidden glass
                ${isMe ? 'border-2 border-blue-500' : ''}
              `}
            >

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      ${isMe ? 'bg-blue-600' : 'bg-blue-500'}
                    `}
                  >
                    <User className="w-6 h-6 text-white" />
                  </motion.div>

                  {/* Player Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${isMe ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>
                        {player.username}
                        {isMe && ' (You)'}
                      </span>
                      
                      {/* Host Badge */}
                      {isHost && (
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Crown className="w-4 h-4 text-yellow-400" />
                        </motion.div>
                      )}
                    </div>

                    {/* Ready Status */}
                    {status === 'waiting' && (
                      <div className="flex items-center gap-1 text-sm mt-1">
                        {isReady ? (
                          <>
                            <Check className="w-4 h-4 text-green-400" />
                            <span className="text-green-400">Ready</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />
                            <span className="text-yellow-400">Waiting...</span>
                          </>
                        )}
                      </div>
                    )}

                    {status === 'playing' && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        🎮 Playing
                      </div>
                    )}
                  </div>
                </div>

                {/* Ready Indicator Animation */}
                {status === 'waiting' && isReady && (
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 360]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-2xl"
                  >
                    ✅
                  </motion.div>
                )}

                {status === 'playing' && (
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-2xl"
                  >
                    🎯
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 pt-4 border-t border-white/20"
      >
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="glass p-3 rounded-xl">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {playersArray.filter(p => p.ready).length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Ready</div>
          </div>
          
          <div className="glass p-3 rounded-xl">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {playersArray.filter(p => !p.ready).length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Waiting</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PlayersList;
