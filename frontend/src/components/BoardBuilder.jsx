import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';

const BoardBuilder = ({ onSubmit, username }) => {
  const [board, setBoard] = useState(Array(25).fill(null));
  const [nextNumber, setNextNumber] = useState(1);
  const [error, setError] = useState('');

  const handleCellClick = (index) => {
    if (board[index] !== null) {
      // Cell already has a number, remove it and adjust nextNumber
      const removedNum = board[index];
      const newBoard = [...board];
      newBoard[index] = null;
      setBoard(newBoard);
      
      // Find the highest number in the board
      const maxNum = Math.max(0, ...newBoard.filter(n => n !== null));
      setNextNumber(maxNum + 1);
      setError('');
    } else {
      // Place the next number
      if (nextNumber <= 25) {
        const newBoard = [...board];
        newBoard[index] = nextNumber;
        setBoard(newBoard);
        setNextNumber(nextNumber + 1);
        setError('');
      }
    }
  };

  const handleSubmit = () => {
    // Check if all cells are filled
    const filled = board.filter(n => n !== null).length;
    if (filled !== 25) {
      setError(`Please fill all cells! (${filled}/25 filled)`);
      return;
    }

    // Validate that we have all numbers 1-25
    const sortedBoard = [...board].sort((a, b) => a - b);
    const isValid = sortedBoard.every((num, idx) => num === idx + 1);
    
    if (!isValid) {
      setError('Invalid board! Must contain all numbers 1-25');
      return;
    }

    // Convert 1D array to 2D 5x5 array
    const board2D = [];
    for (let i = 0; i < 5; i++) {
      board2D.push(board.slice(i * 5, (i + 1) * 5));
    }

    onSubmit(board2D);
  };

  const handleReset = () => {
    setBoard(Array(25).fill(null));
    setNextNumber(1);
    setError('');
  };

  const filledCount = board.filter(n => n !== null).length;

  return (
    <div className="glass p-6 rounded-3xl">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🎯 Build Your Board
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Click cells to place numbers 1-25 in any order
        </p>
        
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="glass px-6 py-3 rounded-xl">
            <div className="text-sm text-gray-600 dark:text-gray-400">Next Number</div>
            <div className="text-4xl font-black text-blue-600 dark:text-blue-400">
              {nextNumber <= 25 ? nextNumber : '✓'}
            </div>
          </div>
          
          <div className="glass px-6 py-3 rounded-xl">
            <div className="text-sm text-gray-600 dark:text-gray-400">Progress</div>
            <div className="text-4xl font-black text-green-600 dark:text-green-400">
              {filledCount}/25
            </div>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-red-500/20 border border-red-500 rounded-xl p-3 flex items-center gap-2 justify-center text-red-600 dark:text-red-400 font-bold"
          >
            <AlertCircle className="w-5 h-5" />
            {error}
          </motion.div>
        )}
      </div>

      {/* Board Grid */}
      <div className="grid grid-cols-5 gap-2 mb-6 max-w-md mx-auto">
        {board.map((number, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCellClick(index)}
            className={`
              aspect-square rounded-xl font-bold text-2xl
              transition-all duration-200
              ${number !== null
                ? 'bg-blue-600 text-white shadow-lg border-2 border-blue-400'
                : 'bg-white dark:bg-gray-800 text-gray-400 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500'
              }
            `}
          >
            {number !== null ? number : '?'}
          </motion.button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleReset}
          className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-bold"
        >
          Reset
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={filledCount !== 25}
          className={`
            px-8 py-3 rounded-xl font-bold flex items-center gap-2
            ${filledCount === 25
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
            }
          `}
        >
          <Check className="w-5 h-5" />
          Submit Board
        </motion.button>
      </div>

      <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        💡 Tip: Click filled cells to remove and change their position
      </div>
    </div>
  );
};

export default BoardBuilder;
