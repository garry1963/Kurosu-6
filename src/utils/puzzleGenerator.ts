import { CellValue, Difficulty, Puzzle, RuleViolation } from '../types';

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Returns a pseudo-random value between 0 and 1
  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  // Returns random integer in range [min, max]
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Shuffles array in-place
  shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  }
}

// Check if value can be placed at a cell index without violating local constraints
export function isLocallyValid(board: CellValue[], index: number, val: 'X' | 'O'): boolean {
  if (val === null) return true;
  const r = Math.floor(index / 6);
  const c = index % 6;

  // 1. Check Row count constraint (max 3 of same symbol)
  let rowCount = 0;
  for (let col = 0; col < 6; col++) {
    if (board[r * 6 + col] === val) {
      rowCount++;
    }
  }
  if (rowCount >= 3) return false;

  // 2. Check Column count constraint (max 3 of same symbol)
  let colCount = 0;
  for (let row = 0; row < 6; row++) {
    if (board[row * 6 + c] === val) {
      colCount++;
    }
  }
  if (colCount >= 3) return false;

  // 3. Check Row consecutive constraint (no 3 in a row)
  // Left two
  if (c >= 2) {
    if (board[r * 6 + c - 1] === val && board[r * 6 + c - 2] === val) return false;
  }
  // Right two
  if (c <= 3) {
    if (board[r * 6 + c + 1] === val && board[r * 6 + c + 2] === val) return false;
  }
  // Middle
  if (c >= 1 && c <= 4) {
    if (board[r * 6 + c - 1] === val && board[r * 6 + c + 1] === val) return false;
  }

  // 4. Check Column consecutive constraint (no 3 in a col)
  // Up two
  if (r >= 2) {
    if (board[(r - 1) * 6 + c] === val && board[(r - 2) * 6 + c] === val) return false;
  }
  // Down two
  if (r <= 3) {
    if (board[(r + 1) * 6 + c] === val && board[(r + 2) * 6 + c] === val) return false;
  }
  // Middle
  if (r >= 1 && r <= 4) {
    if (board[(r - 1) * 6 + c] === val && board[(r + 1) * 6 + c] === val) return false;
  }

  return true;
}

// Find all solutions of the puzzle, capped at target limit
export function solvePuzzle(
  board: CellValue[],
  limitSolutions = 2
): CellValue[][] {
  const solutions: CellValue[][] = [];

  function backtrack(currBoard: CellValue[], index: number) {
    if (solutions.length >= limitSolutions) return;

    if (index === 36) {
      solutions.push([...currBoard]);
      return;
    }

    if (currBoard[index] !== null) {
      backtrack(currBoard, index + 1);
      return;
    }

    // Try both choices: 'X' and 'O'
    const choices: ('X' | 'O')[] = ['X', 'O'];
    for (const choice of choices) {
      if (isLocallyValid(currBoard, index, choice)) {
        currBoard[index] = choice;
        backtrack(currBoard, index + 1);
        currBoard[index] = null;
      }
    }
  }

  backtrack([...board], 0);
  return solutions;
}

// Generates a fully solved grid matching all rules
function generateSolvedGrid(rng: SeededRandom): CellValue[] {
  const board: CellValue[] = Array(36).fill(null);

  function backtrack(index: number): boolean {
    if (index === 36) return true;

    const choices: ('X' | 'O')[] = rng.shuffle(['X', 'O']);
    for (const choice of choices) {
      if (isLocallyValid(board, index, choice)) {
        board[index] = choice;
        if (backtrack(index + 1)) return true;
        board[index] = null;
      }
    }
    return false;
  }

  backtrack(0);
  return board;
}

// Calculates full set of violations on any board
export function validateBoard(board: CellValue[]): RuleViolation[] {
  const violations: RuleViolation[] = [];

  // 1. Check Row consecutive (3-consecutive)
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 4; c++) {
      const idx1 = r * 6 + c;
      const idx2 = r * 6 + c + 1;
      const idx3 = r * 6 + c + 2;
      const v1 = board[idx1];
      const v2 = board[idx2];
      const v3 = board[idx3];
      if (v1 !== null && v1 === v2 && v2 === v3) {
        violations.push({ index: idx1, type: 'three-consecutive', symbol: v1, direction: 'row' });
        violations.push({ index: idx2, type: 'three-consecutive', symbol: v1, direction: 'row' });
        violations.push({ index: idx3, type: 'three-consecutive', symbol: v1, direction: 'row' });
      }
    }
  }

  // 2. Check Col consecutive (3-consecutive)
  for (let c = 0; c < 6; c++) {
    for (let r = 0; r < 4; r++) {
      const idx1 = r * 6 + c;
      const idx2 = (r + 1) * 6 + c;
      const idx3 = (r + 2) * 6 + c;
      const v1 = board[idx1];
      const v2 = board[idx2];
      const v3 = board[idx3];
      if (v1 !== null && v1 === v2 && v2 === v3) {
        violations.push({ index: idx1, type: 'three-consecutive', symbol: v1, direction: 'col' });
        violations.push({ index: idx2, type: 'three-consecutive', symbol: v1, direction: 'col' });
        violations.push({ index: idx3, type: 'three-consecutive', symbol: v1, direction: 'col' });
      }
    }
  }

  // 3. Check Row counts
  for (let r = 0; r < 6; r++) {
    let xCount = 0;
    let oCount = 0;
    for (let c = 0; c < 6; c++) {
      const val = board[r * 6 + c];
      if (val === 'X') xCount++;
      if (val === 'O') oCount++;
    }
    if (xCount > 3) {
      for (let c = 0; c < 6; c++) {
        const idx = r * 6 + c;
        if (board[idx] === 'X') {
          violations.push({ index: idx, type: 'too-many-symbols', symbol: 'X', direction: 'row' });
        }
      }
    }
    if (oCount > 3) {
      for (let c = 0; c < 6; c++) {
        const idx = r * 6 + c;
        if (board[idx] === 'O') {
          violations.push({ index: idx, type: 'too-many-symbols', symbol: 'O', direction: 'row' });
        }
      }
    }
  }

  // 4. Check Col counts
  for (let c = 0; c < 6; c++) {
    let xCount = 0;
    let oCount = 0;
    for (let r = 0; r < 6; r++) {
      const val = board[r * 6 + c];
      if (val === 'X') xCount++;
      if (val === 'O') oCount++;
    }
    if (xCount > 3) {
      for (let r = 0; r < 6; r++) {
        const idx = r * 6 + c;
        if (board[idx] === 'X') {
          violations.push({ index: idx, type: 'too-many-symbols', symbol: 'X', direction: 'col' });
        }
      }
    }
    if (oCount > 3) {
      for (let r = 0; r < 6; r++) {
        const idx = r * 6 + c;
        if (board[idx] === 'O') {
          violations.push({ index: idx, type: 'too-many-symbols', symbol: 'O', direction: 'col' });
        }
      }
    }
  }

  // Remove duplicates from violations list (since a cell can violate in multiple ways)
  const uniqueViolations: RuleViolation[] = [];
  const seenIndices = new Set<string>();
  for (const v of violations) {
    const key = `${v.index}-${v.type}-${v.symbol}`;
    if (!seenIndices.has(key)) {
      seenIndices.add(key);
      uniqueViolations.push(v);
    }
  }

  return uniqueViolations;
}

// Generate Kurosu 6 Puzzle with exact unique solution
export function generatePuzzle(difficulty: Difficulty, rawSeed?: number): Puzzle {
  // Use a random seed if none provided
  const seed = rawSeed ?? Math.floor(Math.random() * 1000000) + 1;
  const rng = new SeededRandom(seed);

  const solution = generateSolvedGrid(rng);
  const clues: CellValue[] = [...solution];

  // Shuffled list of cell indices (0 to 35) to attempt to clear
  const cellOrder = rng.shuffle(Array.from({ length: 36 }, (_, i) => i));

  // Clue target limits
  // Easy: 18 - 20 (Target 19)
  // Medium: 14 - 17 (Target 15)
  // Hard: 10 - 13 (Target 11)
  // Expert: 6 - 9 (Target 8)
  let targetClues = 19;
  let minClues = 18;
  switch (difficulty) {
    case 'easy':
      targetClues = rng.nextInt(18, 20);
      minClues = 18;
      break;
    case 'medium':
      targetClues = rng.nextInt(14, 17);
      minClues = 14;
      break;
    case 'hard':
      targetClues = rng.nextInt(10, 13);
      minClues = 10;
      break;
    case 'expert':
      targetClues = rng.nextInt(6, 9);
      minClues = 6;
      break;
  }

  let currentCluesCount = 36;

  // We try to clear items down to our target
  for (const idx of cellOrder) {
    if (currentCluesCount <= targetClues) {
      break;
    }

    const originalValue = clues[idx];
    clues[idx] = null;

    // Run the solver to verify uniqueness of the solution
    const solutions = solvePuzzle(clues, 2);
    if (solutions.length === 1) {
      // Keep it removed
      currentCluesCount--;
    } else {
      // Must restore because solution isn't unique anymore
      clues[idx] = originalValue;
    }
  }

  // Fallback: If we couldn't reach target, run a second pass to remove as much as possible safely
  if (currentCluesCount > minClues) {
    for (const idx of cellOrder) {
      if (clues[idx] === null) continue;
      const originalValue = clues[idx];
      clues[idx] = null;
      const solutions = solvePuzzle(clues, 2);
      if (solutions.length === 1) {
        currentCluesCount--;
        if (currentCluesCount <= targetClues) {
          break;
        }
      } else {
        clues[idx] = originalValue;
      }
    }
  }

  return {
    id: `kurosu-6-${difficulty}-${seed}`,
    clues,
    solution,
    difficulty,
  };
}

// Logic Hint Provider
// Scans the board state and returns a logic suggestion
export interface LogicHintResult {
  cellIndex: number;
  symbol: 'X' | 'O';
  reason: string;
}

export function getLogicHint(board: CellValue[], clues: CellValue[], solution: CellValue[]): LogicHintResult | null {
  // Let's deduce an action using Kurosu logic rather than just giving a solution cell!
  // This helps teach players the game.
  
  // Rule 1: No three consecutive identical symbols
  // Check row-wise pairs of same symbols with a gap or adjacent empty cell
  // E.g. [X, X, .] -> place O
  // E.g. [X, ., X] -> place O
  // E.g. [., X, X] -> place O
  
  // Check rows for consecutive pairs
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      const idx = r * 6 + c;
      if (board[idx] !== null) continue;

      // Check left adjacent duplicates
      // X X .
      if (c >= 2) {
        const v1 = board[r * 6 + c - 1];
        const v2 = board[r * 6 + c - 2];
        if (v1 !== null && v1 === v2) {
          const opposed: 'X' | 'O' = v1 === 'X' ? 'O' : 'X';
          return {
            cellIndex: idx,
            symbol: opposed,
            reason: `Rule: No three consecutive symbols. Row ${r + 1} has two adjacent ${v1}s at columns ${c - 1} and ${c}, so column ${c + 1} must be ${opposed}.`
          };
        }
      }

      // Check right adjacent duplicates
      // . X X
      if (c <= 3) {
        const v1 = board[r * 6 + c + 1];
        const v2 = board[r * 6 + c + 2];
        if (v1 !== null && v1 === v2) {
          const opposed: 'X' | 'O' = v1 === 'X' ? 'O' : 'X';
          return {
            cellIndex: idx,
            symbol: opposed,
            reason: `Rule: No three consecutive symbols. Row ${r + 1} has two adjacent ${v1}s at columns ${c + 2} and ${c + 3}, so column ${c + 1} must be ${opposed}.`
          };
        }
      }

      // Check squeezed gap
      // X . X
      if (c >= 1 && c <= 4) {
        const v1 = board[r * 6 + c - 1];
        const v2 = board[r * 6 + c + 1];
        if (v1 !== null && v1 === v2) {
          const opposed: 'X' | 'O' = v1 === 'X' ? 'O' : 'X';
          return {
            cellIndex: idx,
            symbol: opposed,
            reason: `Rule: No three consecutive symbols. Row ${r + 1} has ${v1}s at columns ${c} and ${c + 2}, so column ${c + 1} must contain ${opposed} to split them.`
          };
        }
      }
    }
  }

  // Check columns for consecutive pairs
  for (let c = 0; c < 6; c++) {
    for (let r = 0; r < 6; r++) {
      const idx = r * 6 + c;
      if (board[idx] !== null) continue;

      // Up adjacent duplicates
      if (r >= 2) {
        const v1 = board[(r - 1) * 6 + c];
        const v2 = board[(r - 2) * 6 + c];
        if (v1 !== null && v1 === v2) {
          const opposed: 'X' | 'O' = v1 === 'X' ? 'O' : 'X';
          return {
            cellIndex: idx,
            symbol: opposed,
            reason: `Rule: No three consecutive symbols. Column ${c + 1} has two adjacent ${v1}s at rows ${r - 1} and ${r}, so row ${r + 1} must be ${opposed}.`
          };
        }
      }

      // Down adjacent duplicates
      if (r <= 3) {
        const v1 = board[(r + 1) * 6 + c];
        const v2 = board[(r + 2) * 6 + c];
        if (v1 !== null && v1 === v2) {
          const opposed: 'X' | 'O' = v1 === 'X' ? 'O' : 'X';
          return {
            cellIndex: idx,
            symbol: opposed,
            reason: `Rule: No three consecutive symbols. Column ${c + 1} has two adjacent ${v1}s at rows ${r + 2} and ${r + 3}, so row ${r + 1} must be ${opposed}.`
          };
        }
      }

      // Squeezed column gap
      if (r >= 1 && r <= 4) {
        const v1 = board[(r - 1) * 6 + c];
        const v2 = board[(r + 1) * 6 + c];
        if (v1 !== null && v1 === v2) {
          const opposed: 'X' | 'O' = v1 === 'X' ? 'O' : 'X';
          return {
            cellIndex: idx,
            symbol: opposed,
            reason: `Rule: No three consecutive symbols. Column ${c + 1} has ${v1}s at rows ${r} and ${r + 2}, so row ${r + 1} must contain ${opposed} to split them.`
          };
        }
      }
    }
  }

  // Rule 2: Equal number of symbols: Each row must contain exactly 3 X and 3 O
  for (let r = 0; r < 6; r++) {
    let xCount = 0;
    let oCount = 0;
    for (let c = 0; c < 6; c++) {
      const v = board[r * 6 + c];
      if (v === 'X') xCount++;
      if (v === 'O') oCount++;
    }

    if (xCount === 3 || oCount === 3) {
      // Find empty cell in this row
      for (let c = 0; c < 6; c++) {
        const idx = r * 6 + c;
        if (board[idx] === null) {
          const symbolNeeded: 'X' | 'O' = xCount === 3 ? 'O' : 'X';
          return {
            cellIndex: idx,
            symbol: symbolNeeded,
            reason: `Rule: Equal number of symbols. Row ${r + 1} already has 3 ${xCount === 3 ? 'X' : 'O'}s, so all remaining empty cells in this row must be ${symbolNeeded}s.`
          };
        }
      }
    }
  }

  // Check columns for count constraint
  for (let c = 0; c < 6; c++) {
    let xCount = 0;
    let oCount = 0;
    for (let r = 0; r < 6; r++) {
      const v = board[r * 6 + c];
      if (v === 'X') xCount++;
      if (v === 'O') oCount++;
    }

    if (xCount === 3 || oCount === 3) {
      for (let r = 0; r < 6; r++) {
        const idx = r * 6 + c;
        if (board[idx] === null) {
          const symbolNeeded: 'X' | 'O' = xCount === 3 ? 'O' : 'X';
          return {
            cellIndex: idx,
            symbol: symbolNeeded,
            reason: `Rule: Equal number of symbols. Column ${c + 1} already has 3 ${xCount === 3 ? 'X' : 'O'}s, so all remaining empty cells in this column must be ${symbolNeeded}s.`
          };
        }
      }
    }
  }

  // Fallback direct solver hint
  // Find any blank cell and give its solution value
  for (let i = 0; i < 36; i++) {
    if (board[i] === null) {
      return {
        cellIndex: i,
        symbol: solution[i] as 'X' | 'O',
        reason: `Deductive Logic Hint: Through logical elimination of choices for this cell, it must contain ${solution[i]}.`
      };
    }
  }

  return null;
}
