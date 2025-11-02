// ============================================
// TURN-BASED BINGO GAME LOGIC
// Players fill 1-25 in custom order, take turns clicking
// ============================================

/**
 * Create empty 5x5 board for setup phase
 */
export const createEmptyBoard = () => {
  return Array(5).fill(null).map(() => Array(5).fill(null));
};

/**
 * Validate player's submitted board (must have 1-25 exactly once)
 */
export const validateBoard = (board) => {
  if (!Array.isArray(board) || board.length !== 5) return false;
  
  const numbers = new Set();
  for (let row = 0; row < 5; row++) {
    if (!Array.isArray(board[row]) || board[row].length !== 5) return false;
    
    for (let col = 0; col < 5; col++) {
      const num = board[row][col];
      if (typeof num !== 'number' || num < 1 || num > 25) return false;
      if (numbers.has(num)) return false; // Duplicate
      numbers.add(num);
    }
  }
  
  return numbers.size === 25;
};

/**
 * Get next player in turn rotation
 */
export const getNextPlayer = (playerIds, currentPlayerId) => {
  const currentIndex = playerIds.indexOf(currentPlayerId);
  const nextIndex = (currentIndex + 1) % playerIds.length;
  return playerIds[nextIndex];
};

/**
 * Find all strikes (complete lines) on a board
 * Returns array: [{ type, index, cells }, ...]
 * crossedCells is now array of {crossed: bool, color: string}
 */
export const findStrikes = (crossedCells) => {
  const strikes = [];
  
  // Helper to check if cell is crossed
  const isCrossed = (cellIndex) => {
    return crossedCells[cellIndex] && crossedCells[cellIndex].crossed === true;
  };
  
  // Check rows
  for (let row = 0; row < 5; row++) {
    const cells = [];
    let complete = true;
    for (let col = 0; col < 5; col++) {
      const cellIndex = row * 5 + col;
      cells.push(cellIndex);
      if (!isCrossed(cellIndex)) {
        complete = false;
        break;
      }
    }
    if (complete) {
      strikes.push({ type: 'row', index: row, cells });
    }
  }
  
  // Check columns
  for (let col = 0; col < 5; col++) {
    const cells = [];
    let complete = true;
    for (let row = 0; row < 5; row++) {
      const cellIndex = row * 5 + col;
      cells.push(cellIndex);
      if (!isCrossed(cellIndex)) {
        complete = false;
        break;
      }
    }
    if (complete) {
      strikes.push({ type: 'column', index: col, cells });
    }
  }
  
  // Diagonal (top-left to bottom-right)
  let diag1Complete = true;
  const diag1Cells = [0, 6, 12, 18, 24];
  for (const cellIndex of diag1Cells) {
    if (!isCrossed(cellIndex)) {
      diag1Complete = false;
      break;
    }
  }
  if (diag1Complete) {
    strikes.push({ type: 'diagonal', index: 0, cells: diag1Cells });
  }
  
  // Diagonal (top-right to bottom-left)
  let diag2Complete = true;
  const diag2Cells = [4, 8, 12, 16, 20];
  for (const cellIndex of diag2Cells) {
    if (!isCrossed(cellIndex)) {
      diag2Complete = false;
      break;
    }
  }
  if (diag2Complete) {
    strikes.push({ type: 'diagonal', index: 1, cells: diag2Cells });
  }
  
  return strikes;
};

/**
 * Get BINGO letters based on strike count
 */
export const getBingoLetters = (strikeCount) => {
  const letters = ['B', 'I', 'N', 'G', 'O'];
  return letters.slice(0, Math.min(strikeCount, 5));
};

/**
 * Check if player won (5 strikes)
 */
export const checkWinner = (strikeCount) => {
  return strikeCount >= 5;
};

// Generate unique room code
export const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Assign colors to players
 */
const PLAYER_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
];

export const assignPlayerColor = (playerIndex) => {
  return PLAYER_COLORS[playerIndex % PLAYER_COLORS.length];
};
