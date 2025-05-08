import './App.css';
import { useState } from 'react';

const BOARD_SIZE = 8;

function App() {
  const [turn, setTurn] = useState('R'); // R goes first
  const [board, setBoard] = useState(createInitialBoard());
  const [selected, setSelected] = useState(null); // stores { row, col }
  const [capturedRed, setCapturedRed] = useState([]);
  const [capturedBlack, setCapturedBlack] = useState([]);
  const [mustContinueJump, setMustContinueJump] = useState(null);

  function createInitialBoard() {
    const newBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if ((row + col) % 2 === 1) newBoard[row][col] = 'R';
      }
    }
    for (let row = BOARD_SIZE - 3; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if ((row + col) % 2 === 1) newBoard[row][col] = 'B';
      }
    }
    return newBoard;
  }

  function movePiece(fromRow, fromCol, toRow, toCol) {
    const newBoard = board.map(row => row.slice());
    let piece = newBoard[fromRow][fromCol];

    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;

    // King the piece if it reaches the end
    if (piece === 'R' && toRow === BOARD_SIZE - 1) {
      newBoard[toRow][toCol] = 'RK';
    } else if (piece === 'B' && toRow === 0) {
      newBoard[toRow][toCol] = 'BK';
    }

    setBoard(newBoard);
  }

  function handleClick(row, col) {
    const cell = board[row][col];

    if (selected) {
      const [fromRow, fromCol] = [selected.row, selected.col];
      const piece = board[fromRow][fromCol];

      const isRed = piece[0] === 'R';
      const isBlack = piece[0] === 'B';
      const isKing = piece.length === 2;

      const rowDiff = row - fromRow;
      const colDiff = col - fromCol;

      if (!cell && (row + col) % 2 === 1) {
        const isNormalMove =
          Math.abs(rowDiff) === 1 &&
          Math.abs(colDiff) === 1 &&
          (isKing || (isRed && rowDiff === 1) || (isBlack && rowDiff === -1));

        const isJumpMove =
          Math.abs(rowDiff) === 2 &&
          Math.abs(colDiff) === 2 &&
          (isKing || (isRed && rowDiff === 2) || (isBlack && rowDiff === -2));

        if (isNormalMove) {
          movePiece(fromRow, fromCol, row, col);
          setSelected(null);
          setTurn(turn === 'R' ? 'B' : 'R');
        } else if (isJumpMove) {
          const midRow = fromRow + rowDiff / 2;
          const midCol = fromCol + colDiff / 2;
          const middlePiece = board[midRow][midCol];

          const isOpponent = middlePiece && middlePiece[0] !== piece[0];

          if (isOpponent) {
            const newBoard = board.map(row => row.slice());
            newBoard[row][col] = piece;
            newBoard[fromRow][fromCol] = null;
            newBoard[midRow][midCol] = null;

            if (middlePiece[0] === 'R') {
              setCapturedRed(prev => [...prev, 'R']);
            } else {
              setCapturedBlack(prev => [...prev, 'B']);
            }

            // King if needed
            if (piece === 'R' && row === 7) newBoard[row][col] = 'RK';
            if (piece === 'B' && row === 0) newBoard[row][col] = 'BK';

            setBoard(newBoard);

            if (hasAnotherJump(newBoard, row, col, newBoard[row][col])) {
              setMustContinueJump({ row, col });
              setSelected({ row, col });
            } else {
              setMustContinueJump(null);
              setSelected(null);
              setTurn(turn === 'R' ? 'B' : 'R');
            }
            return;
          }
        }
      }

      setSelected(null);
    } else {
      if (mustContinueJump) return;
      if (cell && cell[0] === turn) setSelected({ row, col });
    }
  }

  function hasAnotherJump(board, row, col, piece) {
    const directions = piece.length === 2
      ? [[2, 2], [2, -2], [-2, 2], [-2, -2]]
      : piece[0] === 'R'
        ? [[2, 2], [2, -2]]
        : [[-2, 2], [-2, -2]];

    for (const [dr, dc] of directions) {
      const [newRow, newCol] = [row + dr, col + dc];
      const [midRow, midCol] = [row + dr / 2, col + dc / 2];

      if (
        newRow >= 0 && newRow < 8 &&
        newCol >= 0 && newCol < 8 &&
        board[newRow][newCol] === null &&
        board[midRow][midCol] &&
        board[midRow][midCol][0] !== piece[0]
      ) {
        return true;
      }
    }

    return false;
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '40px' }}>
      {/* Captured Black Pieces (left) */}
      <div className="captured-panel">
        <h4>Black Captured</h4>
        <div className="captured-list">
          {capturedBlack.map((_, index) => (
            <div key={index} className="piece black small" />
          ))}
        </div>
      </div>

      {/* Game Board */}
      <div>
        <p className="turn-indicator">
          Turn: {turn === 'R' ? 'White' : 'Black'}
        </p>
        <div className="checkers-board">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isDark = (rowIndex + colIndex) % 2 === 1;
              const isSelected =
                selected && selected.row === rowIndex && selected.col === colIndex;

              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`square ${isDark ? 'dark' : 'light'} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleClick(rowIndex, colIndex)}
                >
                  {cell && (
                    <div className={`piece ${cell[0] === 'R' ? 'red' : 'black'}`}>
                      {cell.length === 2 && <span className="king">♔</span>}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Captured Red Pieces (right) */}
      <div className="captured-panel">
        <h4>White Captured</h4>
        <div className="captured-list">
          {capturedRed.map((_, index) => (
            <div key={index} className="piece red small" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
