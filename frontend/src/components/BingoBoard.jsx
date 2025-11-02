import { motion } from 'framer-motion';

const BingoBoard = ({ 
  board, 
  crossedCells = [], 
  onCellClick, 
  isMyTurn, 
  currentTurnPlayer,
  strikes = [],
  bingoLetters = []
}) => {
  const letters = ['B', 'I', 'N', 'G', 'O'];

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="glass p-6 rounded-3xl"
    >
      {/* Turn Indicator */}
      {isMyTurn !== undefined && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`text-center mb-4 px-6 py-3 rounded-xl font-bold text-lg ${
            isMyTurn 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-500 text-white'
          }`}
        >
          {isMyTurn ? (
            <motion.span
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              🎯 YOUR TURN - Click a number!
            </motion.span>
          ) : (
            `⏳ ${currentTurnPlayer}'s turn...`
          )}
        </motion.div>
      )}

      {/* BINGO Letters Progress */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {letters.map((letter, i) => {
          const isEarned = bingoLetters.includes(letter);
          return (
            <motion.div
              key={letter}
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <motion.h2
                className={`text-5xl font-black ${
                  isEarned 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-gray-300 dark:text-gray-600'
                }`}
                animate={isEarned ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5, repeat: isEarned ? Infinity : 0 }}
              >
                {letter}
              </motion.h2>
            </motion.div>
          );
        })}
      </div>

      {/* Strikes Count */}
      {strikes.length > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center mb-4 glass px-4 py-2 rounded-xl"
        >
          <span className="text-gray-900 dark:text-white font-bold">
            🎯 Strikes: {strikes.length}/5
          </span>
        </motion.div>
      )}

      {/* Bingo Grid */}
      <div className="grid grid-cols-5 gap-2">
        {board && board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const index = rowIndex * 5 + colIndex;
            const crossedCell = crossedCells[index];
            const isCrossed = crossedCell?.crossed;
            const crossColor = crossedCell?.color || '#6B7280';

            return (
              <motion.button
                key={index}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: (rowIndex * 5 + colIndex) * 0.02 }}
                whileHover={isMyTurn && !isCrossed ? { scale: 1.1 } : {}}
                whileTap={isMyTurn && !isCrossed ? { scale: 0.95 } : {}}
                onClick={() => isMyTurn && !isCrossed && onCellClick(cell, index)}
                disabled={!isMyTurn || isCrossed}
                className={`
                  aspect-square rounded-xl text-2xl font-black
                  transition-all duration-200 relative overflow-hidden
                  ${isCrossed
                    ? 'opacity-70'
                    : 'bg-white dark:bg-gray-800'
                  }
                  ${isMyTurn && !isCrossed 
                    ? 'cursor-pointer hover:border-blue-500 border-2 border-gray-300 dark:border-gray-600' 
                    : 'cursor-not-allowed border-2 border-gray-300 dark:border-gray-600'
                  }
                `}
                style={isCrossed ? { 
                  backgroundColor: crossColor + '40',
                  borderColor: crossColor
                } : {}}
              >
                {/* Cell Number */}
                <span className={`relative z-10 ${isCrossed ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                  {cell}
                </span>

                {/* Cross Mark with Player Color */}
                {isCrossed && (
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ color: crossColor }}
                  >
                    <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="4" y1="4" x2="20" y2="20" />
                      <line x1="20" y1="4" x2="4" y2="20" />
                    </svg>
                  </motion.div>
                )}

                {/* Hover Effect */}
                {isMyTurn && !isCrossed && (
                  <motion.div
                    className="absolute inset-0 bg-blue-500 opacity-0 hover:opacity-20 transition-opacity rounded-xl"
                  />
                )}
              </motion.button>
            );
          })
        )}
      </div>

      {/* Info Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center mt-6 text-gray-600 dark:text-gray-400"
      >
        {isMyTurn ? (
          <span className="flex items-center justify-center gap-2 font-bold text-green-600 dark:text-green-400">
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              👆
            </motion.span>
            Click any uncrossed number on your board!
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            ⏳ Wait for your turn...
          </span>
        )}
      </motion.p>
    </motion.div>
  );
};

export default BingoBoard;
