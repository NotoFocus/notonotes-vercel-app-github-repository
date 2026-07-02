import React from 'react';
import { ArrowLeft, Gamepad2, Grid3X3, Joystick, LayoutGrid } from 'lucide-react';
import { useAppStore } from '../store';
import { useTranslation } from '../translations';

export default function GamesHubScreen({ onSelectGame, onBack }: { onSelectGame: (game: 'game' | 'tictactoe' | 'puzzle' | 'tetris') => void, onBack: () => void }) {
  const { lang } = useAppStore();
  const t = useTranslation(lang);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      <div className="flex items-center justify-between p-4 pt-[calc(env(safe-area-inset-top)+1rem)] bg-slate-900 border-b border-slate-800 shrink-0 transition-colors">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </button>
        <h2 className="font-bold text-lg text-slate-100 flex items-center gap-2">
          <Joystick className="text-indigo-500" /> {t('gamesHubTitle')}
        </h2>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 content-start space-y-4 max-w-sm mx-auto w-full pt-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
        <p className="text-slate-400 text-sm text-center mb-6">{t('gamesHubDesc')}</p>
        
        <button 
          onClick={() => onSelectGame('tetris')}
          className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 flex items-center gap-4 hover:shadow-md transition-all active:scale-95"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <LayoutGrid size={24} />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-slate-200">{t('tetrisTitle')}</span>
            <span className="text-xs text-slate-400 mt-0.5">{t('tetrisDesc')}</span>
          </div>
        </button>

        <button 
          onClick={() => onSelectGame('game')}
          className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 flex items-center gap-4 hover:shadow-md transition-all active:scale-95"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Gamepad2 size={24} />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-slate-200">{t('snakeTitle')}</span>
            <span className="text-xs text-slate-400 mt-0.5">{t('snakeDesc')}</span>
          </div>
        </button>

        <button 
          onClick={() => onSelectGame('tictactoe')}
          className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 flex items-center gap-4 hover:shadow-md transition-all active:scale-95"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Grid3X3 size={24} />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-slate-200">{t('tictactoeTitle')}</span>
            <span className="text-xs text-slate-400 mt-0.5">{t('tictactoeDesc')}</span>
          </div>
        </button>

        <button 
          onClick={() => onSelectGame('puzzle')}
          className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 flex items-center gap-4 hover:shadow-md transition-all active:scale-95"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <LayoutGrid size={24} />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-slate-200">{t('slidingPuzzleTitle')}</span>
            <span className="text-xs text-slate-400 mt-0.5">{t('slidingPuzzleDesc')}</span>
          </div>
        </button>
      </div>
    </div>
  );
}
