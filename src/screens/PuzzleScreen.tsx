import React, { useState, useEffect } from 'react';
import { ArrowLeft, Gamepad2, RotateCcw } from 'lucide-react';
import { useAppStore } from '../store';

let audioCtx: AudioContext | null = null;

export default function PuzzleScreen({ onBack }: { onBack: () => void }) {
  const [board, setBoard] = useState<number[]>([]);
  const [isWon, setIsWon] = useState(false);
  const [moves, setMoves] = useState(0);

  const { moods } = useAppStore();
  const today = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  const todayMood = moods.find(m => m.date === today)?.mood || 'neutral';

  const themeColors = {
    excellent: 'text-emerald-500 bg-emerald-500 hover:bg-emerald-600',
    good: 'text-teal-500 bg-teal-500 hover:bg-teal-600',
    neutral: 'text-indigo-500 bg-indigo-500 hover:bg-indigo-600',
    bad: 'text-orange-500 bg-orange-500 hover:bg-orange-600',
    terrible: 'text-rose-500 bg-rose-500 hover:bg-rose-600',
  }[todayMood] || 'text-indigo-500 bg-indigo-500 hover:bg-indigo-600';

  const playSound = (type: 'click' | 'win' | 'shuffle') => {
    try {
      const AudioContextDef = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextDef) return;
      if (!audioCtx) {
        audioCtx = new AudioContextDef();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      
      const ctx = audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(1.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(1.5, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'shuffle') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(1.0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch(e) {}
  };

  useEffect(() => {
    initGame();
  }, []);

  const isSolvable = (arr: number[]) => {
    let inversions = 0;
    for (let i = 0; i < arr.length - 1; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[i] && arr[j] && arr[i] > arr[j]) {
                inversions++;
            }
        }
    }
    return inversions % 2 === 0;
  };

  const initGame = () => {
    let shuffled: number[];
    do {
      shuffled = [1, 2, 3, 4, 5, 6, 7, 8, 0].sort(() => Math.random() - 0.5);
    } while (!isSolvable(shuffled) || isWinning(shuffled));
    setBoard(shuffled);
    setIsWon(false);
    setMoves(0);
    playSound('shuffle');
  };

  const isWinning = (arr: number[]) => {
    const winState = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    return arr.every((val, index) => val === winState[index]);
  };

  const handleTileClick = (index: number) => {
    if (isWon) return;

    const emptyIndex = board.indexOf(0);
    const row = Math.floor(index / 3);
    const col = index % 3;
    const emptyRow = Math.floor(emptyIndex / 3);
    const emptyCol = emptyIndex % 3;

    // Check if adjacent (not diagonal)
    const isAdjacent = Math.abs(row - emptyRow) + Math.abs(col - emptyCol) === 1;

    if (isAdjacent) {
      playSound('click');
      const newBoard = [...board];
      newBoard[emptyIndex] = board[index];
      newBoard[index] = 0;
      setBoard(newBoard);
      setMoves(moves + 1);

      if (isWinning(newBoard)) {
        setIsWon(true);
        setTimeout(() => playSound('win'), 100);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 shrink-0">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <h2 className="font-bold text-lg text-slate-100 flex items-center gap-2">
          <Gamepad2 className={themeColors.split(' ')[0]} /> Sliding Puzzle
        </h2>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[320px] flex flex-col items-center gap-8 pb-10">
          
          <div className="flex items-center justify-between w-full px-4 text-slate-400">
            <span className="font-bold uppercase tracking-wider text-sm">Moves: {moves}</span>
            <button 
              onClick={initGame}
              className="font-bold flex items-center gap-1 hover:text-slate-200 transition-colors"
            >
              <RotateCcw size={16} /> Acak
            </button>
          </div>

          <div className="bg-slate-800 p-2 rounded-3xl w-full aspect-square relative z-10 shadow-inner">
            <div className="grid grid-cols-3 gap-2 w-full h-full">
              {board.map((cell, index) => (
                <button
                  key={`cell-${cell}-${index}`} // force re-render when changing position
                  onClick={() => handleTileClick(index)}
                  disabled={isWon || cell === 0}
                  className={`flex flex-col items-center justify-center text-3xl font-black rounded-2xl transition-all aspect-square 
                    ${cell === 0 
                      ? 'invisible' 
                      : 'bg-slate-700 shadow-sm border border-slate-600 text-slate-200 hover:scale-[0.98] active:scale-95 cursor-pointer'
                    }`}
                >
                  {cell !== 0 && cell}
                </button>
              ))}
            </div>
          </div>

          {isWon && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex flex-col items-center justify-center z-20">
              <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center animate-in zoom-in duration-300 transform scale-100 border-[4px] border-emerald-100  min-w-[280px]">
                 <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 text-3xl bg-slate-700">
                    🎉
                 </div>
                 <h3 className="text-2xl font-black text-slate-100 mb-2 tracking-tight text-center">
                   Selesai!
                 </h3>
                 <p className="text-slate-400 font-medium mb-8 text-sm text-center">
                   Kamu berhasil dalam {moves} langkah.
                 </p>
                 <button 
                   onClick={initGame}
                   className="w-full text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 bg-emerald-500 hover:bg-emerald-600"
                 >
                   <RotateCcw size={20} /> Main Lagi
                 </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
