"use client";
import React, { useState, useEffect, useRef } from 'react';
import { RotateCw, Undo2, RefreshCw, ChevronRight, Clock, Trophy, AlertCircle } from 'lucide-react';


type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
type PieceColor = 'white' | 'black';
type Position = { row: number; col: number };


interface Piece {
  type: PieceType;
  color: PieceColor;
  position: Position;
  hasMoved: boolean;
}


interface Move {
  piece: Piece;
  from: Position;
  to: Position;
  captured: Piece | null;
  notation: string;
}


interface PlayerInfo {
  color: PieceColor;
  capturedPieces: Piece[];
  timeRemaining: number;
}


const INITIAL_TIME = 10 * 60;


const ChessGame = () => {
  const [board, setBoard] = useState<(Piece | null)[][]>(initializeBoard());
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Position[]>([]);
  const [currentTurn, setCurrentTurn] = useState<PieceColor>('white');
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<PieceColor | null>(null);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [boardRotated, setBoardRotated] = useState<boolean>(false);
  const [isCheck, setIsCheck] = useState<boolean>(false);
  const [lastMove, setLastMove] = useState<{from: Position; to: Position} | null>(null);
  const [players, setPlayers] = useState<{white: PlayerInfo; black: PlayerInfo}>({
    white: { color: 'white', capturedPieces: [], timeRemaining: INITIAL_TIME },
    black: { color: 'black', capturedPieces: [], timeRemaining: INITIAL_TIME }
  });
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    if (timerActive && !gameOver) {
      timerRef.current = setInterval(() => {
        setPlayers(prev => {
          const currentPlayer = currentTurn === 'white' ? prev.white : prev.black;
          if (currentPlayer.timeRemaining <= 0) {
            clearInterval(timerRef.current!);
            setGameOver(true);
            setWinner(currentTurn === 'white' ? 'black' : 'white');
            return prev;
          }
          
          return {
            ...prev,
            [currentTurn]: {
              ...currentPlayer,
              timeRemaining: currentPlayer.timeRemaining - 1
            }
          };
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive, currentTurn, gameOver]);


  function initializeBoard(): (Piece | null)[][] {
    const newBoard: (Piece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    
    for (let col = 0; col < 8; col++) {
      newBoard[1][col] = { type: 'pawn', color: 'black', position: { row: 1, col }, hasMoved: false };
      newBoard[6][col] = { type: 'pawn', color: 'white', position: { row: 6, col }, hasMoved: false };
    }
    
    newBoard[0][0] = { type: 'rook', color: 'black', position: { row: 0, col: 0 }, hasMoved: false };
    newBoard[0][7] = { type: 'rook', color: 'black', position: { row: 0, col: 7 }, hasMoved: false };
    newBoard[7][0] = { type: 'rook', color: 'white', position: { row: 7, col: 0 }, hasMoved: false };
    newBoard[7][7] = { type: 'rook', color: 'white', position: { row: 7, col: 7 }, hasMoved: false };
    
    newBoard[0][1] = { type: 'knight', color: 'black', position: { row: 0, col: 1 }, hasMoved: false };
    newBoard[0][6] = { type: 'knight', color: 'black', position: { row: 0, col: 6 }, hasMoved: false };
    newBoard[7][1] = { type: 'knight', color: 'white', position: { row: 7, col: 1 }, hasMoved: false };
    newBoard[7][6] = { type: 'knight', color: 'white', position: { row: 7, col: 6 }, hasMoved: false };
    
    newBoard[0][2] = { type: 'bishop', color: 'black', position: { row: 0, col: 2 }, hasMoved: false };
    newBoard[0][5] = { type: 'bishop', color: 'black', position: { row: 0, col: 5 }, hasMoved: false };
    newBoard[7][2] = { type: 'bishop', color: 'white', position: { row: 7, col: 2 }, hasMoved: false };
    newBoard[7][5] = { type: 'bishop', color: 'white', position: { row: 7, col: 5 }, hasMoved: false };
    
    newBoard[0][3] = { type: 'queen', color: 'black', position: { row: 0, col: 3 }, hasMoved: false };
    newBoard[7][3] = { type: 'queen', color: 'white', position: { row: 7, col: 3 }, hasMoved: false };
    
    newBoard[0][4] = { type: 'king', color: 'black', position: { row: 0, col: 4 }, hasMoved: false };
    newBoard[7][4] = { type: 'king', color: 'white', position: { row: 7, col: 4 }, hasMoved: false };
    
    return newBoard;
  }


  function getPossibleMoves(piece: Piece, checkForCheck: boolean = true): Position[] {
    const moves: Position[] = [];
    const { row, col } = piece.position;
    
    switch (piece.type) {
      case 'pawn':
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;
        
        if (isInBounds(row + direction, col) && !board[row + direction][col]) {
          moves.push({ row: row + direction, col });
          
          if (row === startRow && !board[row + 2 * direction][col]) {
            moves.push({ row: row + 2 * direction, col });
          }
        }
        
        for (const colOffset of [-1, 1]) {
          const newCol = col + colOffset;
          const newRow = row + direction;
          
          if (isInBounds(newRow, newCol) && 
              board[newRow][newCol] && 
              board[newRow][newCol]?.color !== piece.color) {
            moves.push({ row: newRow, col: newCol });
          }
        }
        break;
        
      case 'rook':
        for (const [rowOffset, colOffset] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
          let newRow = row + rowOffset;
          let newCol = col + colOffset;
          
          while (isInBounds(newRow, newCol)) {
            if (!board[newRow][newCol]) {
              moves.push({ row: newRow, col: newCol });
            } else {
              if (board[newRow][newCol]?.color !== piece.color) {
                moves.push({ row: newRow, col: newCol });
              }
              break;
            }
            
            newRow += rowOffset;
            newCol += colOffset;
          }
        }
        break;
        
      case 'knight':
        for (const [rowOffset, colOffset] of [
          [2, 1], [2, -1], [-2, 1], [-2, -1],
          [1, 2], [1, -2], [-1, 2], [-1, -2]
        ]) {
          const newRow = row + rowOffset;
          const newCol = col + colOffset;
          
          if (isInBounds(newRow, newCol) && 
              (!board[newRow][newCol] || board[newRow][newCol]?.color !== piece.color)) {
            moves.push({ row: newRow, col: newCol });
          }
        }
        break;
        
      case 'bishop':
        for (const [rowOffset, colOffset] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          let newRow = row + rowOffset;
          let newCol = col + colOffset;
          
          while (isInBounds(newRow, newCol)) {
            if (!board[newRow][newCol]) {
              moves.push({ row: newRow, col: newCol });
            } else {
              if (board[newRow][newCol]?.color !== piece.color) {
                moves.push({ row: newRow, col: newCol });
              }
              break;
            }
            
            newRow += rowOffset;
            newCol += colOffset;
          }
        }
        break;
        
      case 'queen':
        for (const [rowOffset, colOffset] of [
          [1, 0], [0, 1], [-1, 0], [0, -1], 
          [1, 1], [1, -1], [-1, 1], [-1, -1]
        ]) {
          let newRow = row + rowOffset;
          let newCol = col + colOffset;
          
          while (isInBounds(newRow, newCol)) {
            if (!board[newRow][newCol]) {
              moves.push({ row: newRow, col: newCol });
            } else {
              if (board[newRow][newCol]?.color !== piece.color) {
                moves.push({ row: newRow, col: newCol });
              }
              break;
            }
            
            newRow += rowOffset;
            newCol += colOffset;
          }
        }
        break;
        
      case 'king':
        for (const rowOffset of [-1, 0, 1]) {
          for (const colOffset of [-1, 0, 1]) {
            if (rowOffset === 0 && colOffset === 0) continue;
            
            const newRow = row + rowOffset;
            const newCol = col + colOffset;
            
            if (isInBounds(newRow, newCol) && 
                (!board[newRow][newCol] || board[newRow][newCol]?.color !== piece.color)) {
              moves.push({ row: newRow, col: newCol });
            }
          }
        }
        break;
    }
    
    if (checkForCheck) {
      return moves.filter(move => !wouldBeInCheck(piece, move));
    }
    
    return moves;
  }


  function isInBounds(row: number, col: number): boolean {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }


  function wouldBeInCheck(piece: Piece, targetPosition: Position): boolean {
    const simulatedBoard = board.map(row => [...row]);
    const { row: fromRow, col: fromCol } = piece.position;
    const { row: toRow, col: toCol } = targetPosition;
    
    simulatedBoard[fromRow][fromCol] = null;
    simulatedBoard[toRow][toCol] = { ...piece, position: targetPosition };
    
    let kingPosition: Position | null = null;
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const currentPiece = simulatedBoard[r][c];
        if (currentPiece?.type === 'king' && currentPiece.color === piece.color) {
          kingPosition = { row: r, col: c };
          break;
        }
      }
      if (kingPosition) break;
    }
    
    if (!kingPosition) return false;
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const currentPiece = simulatedBoard[r][c];
        if (currentPiece && currentPiece.color !== piece.color) {
          const tempPiece = { ...currentPiece, position: { row: r, col: c } };
          const opponentMoves = getPossibleMoves(tempPiece, false);
          
          if (opponentMoves.some(move => move.row === kingPosition?.row && move.col === kingPosition?.col)) {
            return true;
          }
        }
      }
    }
    
    return false;
  }


  function isInCheck(color: PieceColor): boolean {
    let kingPosition: Position | null = null;
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece?.type === 'king' && piece.color === color) {
          kingPosition = { row: r, col: c };
          break;
        }
      }
      if (kingPosition) break;
    }
    
    if (!kingPosition) return false;
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.color !== color) {
          const moves = getPossibleMoves(piece, false);
          if (moves.some(move => move.row === kingPosition?.row && move.col === kingPosition?.col)) {
            return true;
          }
        }
      }
    }
    
    return false;
  }


  function isCheckmate(color: PieceColor): boolean {
    if (!isInCheck(color)) return false;
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.color === color) {
          const moves = getPossibleMoves(piece, true);
          if (moves.length > 0) {
            return false;
          }
        }
      }
    }
    
    return true;
  }


  function generateMoveNotation(piece: Piece, from: Position, to: Position, capturedPiece: Piece | null): string {
    const pieceSymbols: Record<PieceType, string> = {
      pawn: '',
      knight: 'N',
      bishop: 'B',
      rook: 'R',
      queen: 'Q',
      king: 'K'
    };
    
    const fromFile = String.fromCharCode(97 + from.col);
    const fromRank = 8 - from.row;
    const toFile = String.fromCharCode(97 + to.col);
    const toRank = 8 - to.row;
    
    let notation = pieceSymbols[piece.type];
    
    if (piece.type === 'pawn' && capturedPiece) {
      notation += fromFile;
    }
    
    if (capturedPiece) {
      notation += 'x';
    }
    
    notation += toFile + toRank;
    
    const simulatedBoard = board.map(row => [...row]);
    simulatedBoard[from.row][from.col] = null;
    simulatedBoard[to.row][to.col] = { ...piece, position: to };
    
    setTimeout(() => {
      const inCheck = isInCheck(currentTurn === 'white' ? 'black' : 'white');
      const inCheckmate = inCheck && isCheckmate(currentTurn === 'white' ? 'black' : 'white');
      
      setIsCheck(inCheck);
      
      if (inCheckmate) {
        setGameOver(true);
        setWinner(currentTurn);
      }
    }, 0);
    
    return notation;
  }


  function handleSquareClick(row: number, col: number) {
    if (gameOver) return;
    
    const clickedPiece = board[row][col];
    
    if (!selectedPiece && clickedPiece && clickedPiece.color === currentTurn) {
      setSelectedPiece(clickedPiece);
      setPossibleMoves(getPossibleMoves(clickedPiece));
      return;
    }
    
    if (selectedPiece) {
      const isValidMove = possibleMoves.some(move => move.row === row && move.col === col);
      
      if (isValidMove) {
        if (!timerActive && moveHistory.length === 0) {
          setTimerActive(true);
        }
        
        movePiece(selectedPiece, { row, col });
      } else if (clickedPiece && clickedPiece.color === currentTurn) {
        setSelectedPiece(clickedPiece);
        setPossibleMoves(getPossibleMoves(clickedPiece));
      } else {
        setSelectedPiece(null);
        setPossibleMoves([]);
      }
    }
  }


  function movePiece(piece: Piece, targetPosition: Position) {
    const { row: fromRow, col: fromCol } = piece.position;
    const { row: toRow, col: toCol } = targetPosition;
    
    const newBoard = board.map(row => [...row]);
    const capturedPiece = newBoard[toRow][toCol];
    
    newBoard[fromRow][fromCol] = null;
    newBoard[toRow][toCol] = {
      ...piece,
      position: targetPosition,
      hasMoved: true
    };
    
    if (capturedPiece) {
      const capturingPlayer = piece.color === 'white' ? 'white' : 'black';
      setPlayers(prev => ({
        ...prev,
        [capturingPlayer]: {
          ...prev[capturingPlayer],
          capturedPieces: [...prev[capturingPlayer].capturedPieces, capturedPiece]
        }
      }));
    }
    
    if (capturedPiece && capturedPiece.type === 'king') {
      setGameOver(true);
      setWinner(piece.color);
    }
    
    if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
      newBoard[toRow][toCol] = {
        ...newBoard[toRow][toCol]!,
        type: 'queen'
      };
    }
    
    const notation = generateMoveNotation(piece, piece.position, targetPosition, capturedPiece);
    
    setLastMove({
      from: { row: fromRow, col: fromCol },
      to: targetPosition
    });
    
    setBoard(newBoard);
    
    const move = {
      piece,
      from: { row: fromRow, col: fromCol },
      to: targetPosition,
      captured: capturedPiece || null,
      notation
    };
    
    setMoveHistory([...moveHistory, move]);
    setCurrentTurn(currentTurn === 'white' ? 'black' : 'white');
    setSelectedPiece(null);
    setPossibleMoves([]);
  }


  function undoLastMove() {
    if (moveHistory.length === 0) return;
    
    const lastMove = moveHistory[moveHistory.length - 1];
    const newBoard = board.map(row => [...row]);
    
    newBoard[lastMove.to.row][lastMove.to.col] = null;
    newBoard[lastMove.from.row][lastMove.from.col] = {
      ...lastMove.piece,
      position: lastMove.from
    };
    
    if (lastMove.captured) {
      newBoard[lastMove.to.row][lastMove.to.col] = lastMove.captured;
      
      const capturingPlayer = lastMove.piece.color;
      setPlayers(prev => ({
        ...prev,
        [capturingPlayer]: {
          ...prev[capturingPlayer],
          capturedPieces: prev[capturingPlayer].capturedPieces.slice(0, -1)
        }
      }));
    }
    
    setBoard(newBoard);
    setMoveHistory(moveHistory.slice(0, -1));
    setCurrentTurn(currentTurn === 'white' ? 'black' : 'white');
    setLastMove(null);
    setIsCheck(false);
    
    if (gameOver) {
      setGameOver(false);
      setWinner(null);
    }
  }


  function resetGame() {
    setBoard(initializeBoard());
    setSelectedPiece(null);
    setPossibleMoves([]);
    setCurrentTurn('white');
    setGameOver(false);
    setWinner(null);
    setMoveHistory([]);
    setLastMove(null);
    setIsCheck(false);
    setTimerActive(false);
    setPlayers({
      white: { color: 'white', capturedPieces: [], timeRemaining: INITIAL_TIME },
      black: { color: 'black', capturedPieces: [], timeRemaining: INITIAL_TIME }
    });
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }


  function rotateBoard() {
    setBoardRotated(!boardRotated);
  }


  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }


  function renderPiece(piece: Piece | null) {
    if (!piece) return null;
    
    const colorStyles = {
      white: {
        fill: "#EAEAEA",
        stroke: "#222222",
        strokeWidth: 1,
        filter: "drop-shadow(1px 1px 1px rgba(0,0,0,0.7))"
      },
      black: {
        fill: "#222222",
        stroke: "#000000",
        strokeWidth: 0.5,
        filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.8))"
      }
    };
    
    const gradientId = piece.color === 'white' ? 'metalGradient' : 'blackGradient';
    
    const renderPieceSvg = () => {
      if (piece.type === 'pawn') {
        return (
          <svg viewBox="0 0 45 45" width="75%" height="75%" style={{ filter: colorStyles[piece.color].filter }}>
            <defs>
              <radialGradient id={gradientId} cx="30%" cy="30%" r="70%" fx="30%" fy="30%">
                <stop offset="0%" stopColor={piece.color === 'white' ? "#FFFFFF" : "#555555"} />
                <stop offset="100%" stopColor={colorStyles[piece.color].fill} />
              </radialGradient>
            </defs>
            <path 
              d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" 
              fill={`url(#${gradientId})`}
              stroke={colorStyles[piece.color].stroke} 
              strokeWidth={colorStyles[piece.color].strokeWidth} 
            />
          </svg>
        );
      } else if (piece.type === 'rook') {
        return (
          <svg viewBox="0 0 45 45" width="80%" height="80%" style={{ filter: colorStyles[piece.color].filter }}>
            <defs>
              <radialGradient id={gradientId} cx="30%" cy="30%" r="70%" fx="30%" fy="30%">
                <stop offset="0%" stopColor={piece.color === 'white' ? "#FFFFFF" : "#555555"} />
                <stop offset="100%" stopColor={colorStyles[piece.color].fill} />
              </radialGradient>
            </defs>
            <g fill={`url(#${gradientId})`} stroke={colorStyles[piece.color].stroke} strokeWidth={colorStyles[piece.color].strokeWidth}>
              <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" strokeLinecap="butt" />
              <path d="M34 14l-3 3H14l-3-3" />
              <path d="M31 17v12.5H14V17" strokeLinecap="butt" strokeLinejoin="miter" />
              <path d="M31 29.5l1.5 2.5h-20l1.5-2.5" />
            </g>
          </svg>
        );
      } else if (piece.type === 'knight') {
        return (
          <svg viewBox="0 0 45 45" width="85%" height="85%" style={{ filter: colorStyles[piece.color].filter }}>
            <defs>
              <radialGradient id={gradientId} cx="30%" cy="30%" r="70%" fx="30%" fy="30%">
                <stop offset="0%" stopColor={piece.color === 'white' ? "#FFFFFF" : "#555555"} />
                <stop offset="100%" stopColor={colorStyles[piece.color].fill} />
              </radialGradient>
            </defs>
            <g fill={`url(#${gradientId})`} stroke={colorStyles[piece.color].stroke} strokeWidth={colorStyles[piece.color].strokeWidth}>
              <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" />
              <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3" />
            </g>
          </svg>
        );
      } else if (piece.type === 'bishop') {
        return (
          <svg viewBox="0 0 45 45" width="85%" height="85%" style={{ filter: colorStyles[piece.color].filter }}>
            <defs>
              <radialGradient id={gradientId} cx="30%" cy="30%" r="70%" fx="30%" fy="30%">
                <stop offset="0%" stopColor={piece.color === 'white' ? "#FFFFFF" : "#555555"} />
                <stop offset="100%" stopColor={colorStyles[piece.color].fill} />
              </radialGradient>
            </defs>
            <g fill={`url(#${gradientId})`} stroke={colorStyles[piece.color].stroke} strokeWidth={colorStyles[piece.color].strokeWidth}>
              <g fillRule="evenodd" strokeLinecap="butt">
                <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z" />
                <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
                <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" />
              </g>
              <path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" strokeLinejoin="miter" />
            </g>
          </svg>
        );
      } else if (piece.type === 'queen') {
        return (
          <svg viewBox="0 0 45 45" width="85%" height="85%" style={{ filter: colorStyles[piece.color].filter }}>
            <defs>
              <radialGradient id={gradientId} cx="30%" cy="30%" r="70%" fx="30%" fy="30%">
                <stop offset="0%" stopColor={piece.color === 'white' ? "#FFFFFF" : "#555555"} />
                <stop offset="100%" stopColor={colorStyles[piece.color].fill} />
              </radialGradient>
            </defs>
            <g fill={`url(#${gradientId})`} stroke={colorStyles[piece.color].stroke} strokeWidth={colorStyles[piece.color].strokeWidth}>
              <circle cx="22.5" cy="8" r="2.2" />
              <circle cx="10" cy="12" r="2.2" />
              <circle cx="35" cy="12" r="2.2" />
              <circle cx="16" cy="10" r="2.2" />
              <circle cx="29" cy="10" r="2.2" />
              
              <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-14V25L7 14l2 12zM9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" strokeLinecap="butt" />
              <path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0" fill="none" />
            </g>
          </svg>
        );
      } else if (piece.type === 'king') {
        return (
          <svg viewBox="0 0 45 45" width="85%" height="85%" style={{ filter: colorStyles[piece.color].filter }}>
            <defs>
              <radialGradient id={gradientId} cx="30%" cy="30%" r="70%" fx="30%" fy="30%">
                <stop offset="0%" stopColor={piece.color === 'white' ? "#FFFFFF" : "#555555"} />
                <stop offset="100%" stopColor={colorStyles[piece.color].fill} />
              </radialGradient>
            </defs>
            <g fill={`url(#${gradientId})`} stroke={colorStyles[piece.color].stroke} strokeWidth={colorStyles[piece.color].strokeWidth}>
              <path d="M22.5 11.63V6M20 8h5" strokeLinejoin="miter" />
              <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" />
              <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10V37z" />
              <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" stroke={piece.color === 'white' ? "#222" : "#fff"} />
            </g>
          </svg>
        );
      }
      
      return null;
    };
    
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        {renderPieceSvg()}
      </div>
    );
  }


  function renderMiniPiece(piece: Piece) {
    return (
      <div key={`${piece.type}-${piece.position.row}-${piece.position.col}`} className="w-6 h-6 inline-block mx-0.5">
        {renderPiece({...piece, position: piece.position})}
      </div>
    );
  }


  const lightSquareColor = "bg-amber-50";
  const darkSquareColor = "bg-amber-800";
  const selectedColor = "ring-4 ring-yellow-400 ring-inset";
  const possibleMoveColor = "ring-4 ring-emerald-400 ring-inset";
  const captureColor = "ring-4 ring-red-500 ring-inset";
  const lastMoveColor = "bg-yellow-200";
  const lastMoveDarkColor = "bg-yellow-700";
  const checkColor = "bg-red-200";
  const checkDarkColor = "bg-red-700";


  const boardArray = boardRotated 
    ? [...Array(8)].map((_, i) => [...Array(8)].map((_, j) => [7-i, 7-j])) 
    : [...Array(8)].map((_, i) => [...Array(8)].map((_, j) => [i, j]));


  let kingInCheckPosition: Position | null = null;
  if (isCheck) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece?.type === 'king' && piece.color === currentTurn) {
          kingInCheckPosition = { row: r, col: c };
          break;
        }
      }
      if (kingInCheckPosition) break;
    }
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 font-sans py-8 px-4">
      <div className="w-full max-w-5xl">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white rounded-t-xl shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold font-serif tracking-wide">Elegant Chess</h1>
              <p className="text-blue-100 mt-1 font-light">A classic game reimagined</p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={undoLastMove}
                disabled={moveHistory.length === 0}
                className="flex items-center justify-center px-4 py-2 bg-blue-800 text-blue-50 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium text-sm"
                title="Undo last move"
              >
                <Undo2 className="w-5 h-5 mr-2" />
                <span>Undo</span>
              </button>
              
              <button 
                onClick={rotateBoard}
                className="flex items-center justify-center px-4 py-2 bg-indigo-800 text-blue-50 rounded-md hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm"
                title="Rotate board"
              >
                <RotateCw className="w-5 h-5 mr-2" />
                <span>Rotate</span>
              </button>
              
              <button 
                onClick={resetGame}
                className="flex items-center justify-center px-4 py-2 bg-red-700 text-blue-50 rounded-md hover:bg-red-600 transition-colors shadow-sm font-medium text-sm"
                title="Reset game"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800 p-6 md:p-8 rounded-b-xl shadow-lg">
          <div className="flex flex-col lg:flex-row items-start gap-6">
            <div className="w-full lg:w-1/4 order-2 lg:order-1">
              <div className="bg-slate-900 rounded-lg p-4 mb-4 border border-slate-700">
                <div className={`flex items-center justify-between ${currentTurn === 'black' ? 'text-white' : 'text-slate-400'}`}>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full bg-slate-300 mr-2 ${currentTurn === 'black' ? 'animate-pulse' : ''}`}></div>
                    <span className="font-medium">Black</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="font-mono">{formatTime(players.black.timeRemaining)}</span>
                  </div>
                </div>
                
                <div className="mt-3 flex flex-wrap">
                  {players.black.capturedPieces.map((piece, index) => (
                    renderMiniPiece(piece)
                  ))}
                </div>
              </div>
              
              <div className="bg-slate-900 rounded-lg p-4 mb-4 border border-slate-700">
                <h3 className="text-blue-300 font-medium mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Game Status
                </h3>
                
                {gameOver ? (
                  <div className="flex items-center text-yellow-400">
                    <Trophy className="w-5 h-5 mr-2" />
                    <span className="font-medium">{winner?.charAt(0).toUpperCase() + winner?.slice(1)} wins!</span>
                  </div>
                ) : isCheck ? (
                  <p className="text-red-400 font-medium">Check!</p>
                ) : (
                  <p className="text-slate-300">
                    {currentTurn.charAt(0).toUpperCase() + currentTurn.slice(1)}'s turn
                  </p>
                )}
                
                <p className="text-slate-400 text-sm mt-2">
                  Moves: {moveHistory.length}
                </p>
              </div>
              
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                <div className={`flex items-center justify-between ${currentTurn === 'white' ? 'text-white' : 'text-slate-400'}`}>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full bg-white mr-2 ${currentTurn === 'white' ? 'animate-pulse' : ''}`}></div>
                    <span className="font-medium">White</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="font-mono">{formatTime(players.white.timeRemaining)}</span>
                  </div>
                </div>
                
                <div className="mt-3 flex flex-wrap">
                  {players.white.capturedPieces.map((piece, index) => (
                    renderMiniPiece(piece)
                  ))}
                </div>
              </div>
            </div>
            
            <div className="w-full lg:w-1/2 order-1 lg:order-2">
              <div className="rounded-xl overflow-hidden border-4 border-slate-700 shadow-2xl">
                <div className="bg-slate-900 py-2 px-4">
                  <div className="grid grid-cols-8 w-full text-center text-sm font-medium text-blue-300">
                    {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((letter, index) => (
                      <div key={index} className="px-2">
                        {boardRotated ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'][index] : letter}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-8 w-full" style={{ boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4)' }}>
                  {boardArray.map((row, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                      {row.map(([actualRow, actualCol], colIndex) => {
                        const isWhiteSquare = (actualRow + actualCol) % 2 === 0;
                        const isSelected = selectedPiece?.position.row === actualRow && selectedPiece?.position.col === actualCol;
                        const isPossibleMove = possibleMoves.some(move => move.row === actualRow && move.col === actualCol);
                        const isLastMoveFrom = lastMove && lastMove.from.row === actualRow && lastMove.from.col === actualCol;
                        const isLastMoveTo = lastMove && lastMove.to.row === actualRow && lastMove.to.col === actualCol;
                        const isKingInCheck = kingInCheckPosition && kingInCheckPosition.row === actualRow && kingInCheckPosition.col === actualCol;
                        const piece = board[actualRow][actualCol];
                        
                        let cellBgColor = isWhiteSquare ? lightSquareColor : darkSquareColor;
                        let cellExtraClasses = "";
                        
                        if (isKingInCheck) {
                          cellBgColor = isWhiteSquare ? checkColor : checkDarkColor;
                        } else if (isLastMoveTo) {
                          cellBgColor = isWhiteSquare ? lastMoveColor : lastMoveDarkColor;
                        } else if (isLastMoveFrom) {
                          cellExtraClasses = "after:absolute after:inset-0 after:bg-yellow-400 after:opacity-20";
                        }
                        
                        if (isSelected) {
                          cellExtraClasses += " " + selectedColor;
                        } else if (isPossibleMove) {
                          cellExtraClasses += " " + (piece ? captureColor : possibleMoveColor);
                        }
                        
                        return (
                          <div 
                            key={`${rowIndex}-${colIndex}`}
                            className={`
                              relative cursor-pointer transition-all duration-200
                              ${cellBgColor} ${cellExtraClasses}
                              hover:brightness-110 group
                            `}
                            style={{ 
                              aspectRatio: '1/1',
                              boxShadow: isWhiteSquare 
                                ? 'inset 0 0 10px rgba(0,0,0,0.05)' 
                                : 'inset 0 0 10px rgba(0,0,0,0.2)'
                            }}
                            onClick={() => handleSquareClick(actualRow, actualCol)}
                          >
                            {colIndex === 0 && (
                              <div className={`absolute left-2 top-1 text-xs font-semibold ${isWhiteSquare ? 'text-slate-700' : 'text-slate-300'}`}>
                                {boardRotated ? actualRow + 1 : 8 - actualRow}
                              </div>
                            )}
                            
                            {renderPiece(piece)}
                            
                            {isPossibleMove && !piece && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-3 h-3 rounded-full bg-emerald-400 opacity-70 group-hover:opacity-90"></div>
                              </div>
                            )}
                            
                            <div className="absolute bottom-1 right-1 text-xs opacity-0 group-hover:opacity-75 bg-black bg-opacity-50 text-white px-1 rounded">
                              {String.fromCharCode(97 + actualCol)}{8 - actualRow}
                            </div>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="w-full lg:w-1/4 order-3">
              <div className="bg-slate-900 rounded-lg p-4 h-full border border-slate-700">
                <h2 className="text-lg font-bold text-blue-300 mb-3 flex items-center">
                  <ChevronRight className="w-5 h-5 mr-1" />
                  Move History
                </h2>
                
                {moveHistory.length > 0 ? (
                  <div className="overflow-auto max-h-96 pr-2 custom-scrollbar">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-400">
                          <th className="w-10 text-left pb-2">#</th>
                          <th className="text-left pb-2">White</th>
                          <th className="text-left pb-2">Black</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, index) => {
                          const whiteMove = moveHistory[index * 2];
                          const blackMove = moveHistory[index * 2 + 1];
                          
                          return (
                            <tr key={index} className="border-b border-slate-800">
                              <td className="py-2 text-slate-500">{index + 1}</td>
                              <td className="py-2">
                                <span className="inline-block py-1 px-2 bg-blue-900 bg-opacity-50 rounded text-blue-100">
                                  {whiteMove.notation}
                                </span>
                              </td>
                              <td className="py-2">
                                {blackMove && (
                                  <span className="inline-block py-1 px-2 bg-slate-800 rounded text-slate-300">
                                    {blackMove.notation}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">No moves yet</p>
                )}
              </div>
            </div>
          </div>
          
          {gameOver && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 rounded-lg max-w-md w-full p-6 border-2 border-blue-500 shadow-2xl">
                <div className="text-center">
                  <Trophy className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Game Over!
                  </h2>
                  <p className="text-xl text-blue-300 mb-6">
                    {winner?.charAt(0).toUpperCase() + winner?.slice(1)} wins the game
                  </p>
                  <div className="flex space-x-4 justify-center">
                    <button 
                      onClick={resetGame}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                    >
                      New Game
                    </button>
                    <button 
                      onClick={() => setGameOver(false)}
                      className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Review Board
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 text-center text-slate-400 text-sm">
          <p>Created with React + TypeScript • Elegant Chess UI</p>
        </div>
      </div>
    </div>
  );
};


export default ChessGame;


