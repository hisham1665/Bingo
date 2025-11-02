import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';

const NumberDisplay = ({ currentNumber, calledNumbers = [], status }) => {
  return (
    <div className="glass p-8 rounded-3xl">
      {/* Current Number Display */}
      <div className="text-center mb-6">
        <motion.h3
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl text-gray-900 dark:text-white font-bold mb-3 flex items-center justify-center gap-2"
        >
          <Zap className="text-yellow-500" />
          CURRENT NUMBER
          <Zap className="text-yellow-500" />
        </motion.h3>
        
        <AnimatePresence mode="wait">
          {currentNumber ? (
            <motion.div
              key={currentNumber}
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, rotate: 180, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="relative inline-block"
            >
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 20px #ec4899, 0 0 40px #ec4899, 0 0 60px #ec4899',
                    '0 0 30px #8b5cf6, 0 0 60px #8b5cf6, 0 0 90px #8b5cf6',
                    '0 0 20px #ec4899, 0 0 40px #ec4899, 0 0 60px #ec4899',
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-40 h-40 rounded-full bg-blue-600 flex items-center justify-center shadow-2xl"
              >
                <motion.span
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.5 }}
                  className="text-8xl font-black text-white glow-text"
                >
                  {currentNumber}
                </motion.span>
              </motion.div>

              {/* Sparkle Effects */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 1.5, 0],
                    opacity: [1, 0.5, 0],
                    x: Math.cos((i * Math.PI * 2) / 6) * 100,
                    y: Math.sin((i * Math.PI * 2) / 6) * 100,
                  }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                  className="absolute top-1/2 left-1/2 w-4 h-4 bg-yellow-400 rounded-full"
                  style={{ transform: 'translate(-50%, -50%)' }}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-40 h-40 mx-auto rounded-full glass flex items-center justify-center"
            >
              <span className="text-4xl">
                {status === 'playing' ? '⏳' : '🎮'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Called Numbers History */}
      <div>
        <h4 className="text-lg text-gray-900 dark:text-white mb-3 text-center font-semibold">
          Called Numbers ({calledNumbers.length}/75)
        </h4>
        
        <div className="flex flex-wrap gap-2 justify-center max-h-32 overflow-y-auto p-2">
          {calledNumbers.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-sm">No numbers called yet...</p>
          ) : (
            calledNumbers.map((num, index) => (
              <motion.span
                key={`${num}-${index}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  font-bold text-sm text-white
                  ${index === calledNumbers.length - 1
                    ? 'bg-yellow-500 animate-pulse scale-110'
                    : 'bg-blue-500/50'
                  }
                `}
              >
                {num}
              </motion.span>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NumberDisplay;
