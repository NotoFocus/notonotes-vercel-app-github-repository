/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Home, CheckCircle2, Calendar as CalendarIcon, Settings, Lock, Layers } from 'lucide-react';
import HomeScreen from './screens/HomeScreen';
import TasksScreen from './screens/TasksScreen';
import CalendarScreen from './screens/CalendarScreen';
import NoteEditorScreen from './screens/NoteEditorScreen';
import SearchScreen from './screens/SearchScreen';
import SettingsScreen from './screens/SettingsScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import { Note } from './types';
import { useAppStore } from './store';
import { useTranslation } from './translations';

export type ScreenItem = 'home' | 'tasks' | 'search' | 'calendar' | 'settings' | 'note-editor';

export default function App() {
  const { 
    appPin, isUnlocked, setIsUnlocked, lang, tasks, 
    reminderActive, reminderTime, hasCompletedOnboarding, setHasCompletedOnboarding 
  } = useAppStore();
  const t = useTranslation(lang);
  const [currentScreen, setCurrentScreen] = useState<ScreenItem>('home');
  const [isDarkMode, setIsDarkMode] = useState(true); // Sleek interface defaults to dark mode
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  useEffect(() => {
    if (!reminderActive) return;

    const interval = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours().toString().padStart(2, '0');
      const currentMinute = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHour}:${currentMinute}`;
      
      const todayDate = now.toISOString().split('T')[0];
      const lastNotif = localStorage.getItem('noto_last_notif_date');
      
      if (currentTime === reminderTime && lastNotif !== todayDate) {
        localStorage.setItem('noto_last_notif_date', todayDate);
        
        const todayTasks = tasks.filter(t => {
            if (t.date === 'Hari ini' || t.date.toLowerCase() === 'today') return true;
            try {
              return new Date(t.date).toISOString().split('T')[0] === todayDate;
            } catch(e) { return false; }
        });
        
        const allCompleted = todayTasks.length > 0 && todayTasks.every(t => t.completed);
        const hasTasks = todayTasks.length > 0;
        
        let title = '';
        let body = '';
        
        // If there are no tasks for today, standard message from prompt doesn't cover this well, we use the "masih ada" rule.
        // Actually prompt says: "Jika semua tugas hari ini selesai ... jika masih ada .."
        if (hasTasks && allCompleted) {
          title = t('notifAllDoneTitle') || "Kerja Bagus! 🎉";
          body = t('notifAllDoneBody') || "Semua tugas hari ini telah selesai. Pertahankan streakmu.";
        } else {
          title = t('notifPendingTitle') || "Jangan Putus Streak Hari Ini 🔥";
          body = t('notifPendingBody') || "Masih ada tugas yang menunggu. Selesaikan targetmu hari ini di Noto.";
        }
        
        if ('Notification' in window && Notification.permission === 'granted') {
          navigator.serviceWorker.ready.then(reg => {
             reg.showNotification(title, {
                 body: body,
                 icon: '/pwa-192x192.png',
                 badge: '/pwa-192x192.png'
             });
          }).catch(() => {
             new Notification(title, {
               body: body
             });
          });
        }
      }
    }, 60000); 

    return () => clearInterval(interval);
  }, [reminderActive, reminderTime, tasks]);

  // Jika PIN ada tp belum diunlock, kita tampilkan layar kunci
  const isLocked = !!appPin && !isUnlocked;

  const openNote = (note: Note) => {
    setActiveNote(note);
    setCurrentScreen('note-editor');
  };

  const closeNote = () => {
    setActiveNote(null);
    setCurrentScreen('home');
  };

  if (!hasCompletedOnboarding) {
    return (
      <div className={`min-h-screen flex justify-center items-center ${!isDarkMode ? 'light-theme' : 'bg-slate-950'} sm:p-4 md:p-8 relative`}>
        <div className="w-full h-[100dvh] sm:h-[90vh] sm:max-h-[900px] sm:max-w-[420px] sm:rounded-3xl sm:border sm:border-slate-800 bg-slate-950 shadow-2xl relative flex flex-col overflow-hidden text-slate-200 font-sans">
          <OnboardingScreen onFinish={() => setHasCompletedOnboarding(true)} />
        </div>
      </div>
    );
  }

  if (isLocked) {
    return <PinScreen correctPin={appPin} onUnlock={() => setIsUnlocked(true)} isDarkMode={isDarkMode} lang={lang} />;
  }

  return (
    <div className={`min-h-screen flex justify-center items-center ${!isDarkMode ? 'light-theme' : 'bg-slate-950'} sm:p-4 md:p-8 relative`}>
      <div className="w-full h-[100dvh] sm:h-[90vh] sm:max-h-[900px] sm:max-w-[420px] sm:rounded-3xl sm:border sm:border-slate-800 bg-slate-950 shadow-2xl relative flex flex-col overflow-hidden text-slate-200 font-sans">
        
        <div className={`flex-1 relative flex flex-col overflow-hidden`}>
          {currentScreen === 'home' && <HomeScreen isDarkMode={isDarkMode} toggleDark={() => setIsDarkMode(!isDarkMode)} onOpenNote={openNote} onNavigate={(screen) => setCurrentScreen(screen)} />}
          {currentScreen === 'tasks' && <TasksScreen onNavigate={(screen) => setCurrentScreen(screen)} />}
          {currentScreen === 'calendar' && <CalendarScreen />}
          {currentScreen === 'note-editor' && activeNote && <NoteEditorScreen note={activeNote} onBack={closeNote} />}
          {currentScreen === 'search' && <SearchScreen onOpenNote={openNote} />}
          {currentScreen === 'settings' && <SettingsScreen isDarkMode={isDarkMode} toggleDark={() => setIsDarkMode(!isDarkMode)} />}
        </div>

        {currentScreen !== 'note-editor' && (
          <div className="flex-none bg-slate-900 border-t border-slate-800 px-4 sm:px-6 h-[72px] flex justify-between items-center z-50 relative pb-safe">
            <NavItem icon={<Home />} label={t('home')} active={currentScreen === 'home'} onClick={() => setCurrentScreen('home')} />
            <NavItem icon={<CheckCircle2 />} label={t('tasksMenu')} active={currentScreen === 'tasks'} onClick={() => setCurrentScreen('tasks')} />
            <NavItem icon={<Layers />} label={t('searchMenu')} active={currentScreen === 'search'} onClick={() => setCurrentScreen('search')} />
            <NavItem icon={<CalendarIcon />} label={t('calendar')} active={currentScreen === 'calendar'} onClick={() => setCurrentScreen('calendar')} />
            <NavItem icon={<Settings />} label={t('settingsMenu')} active={currentScreen === 'settings'} onClick={() => setCurrentScreen('settings')} />
          </div>
        )}
        
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[56px] group transition-colors ${
        active ? 'text-indigo-400' : 'text-slate-500 hover:text-indigo-300'
      }`}
    >
      <div className={`w-1 h-1 bg-indigo-500 rounded-full mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${active ? '!opacity-100' : ''}`}></div>
      <div className={`[&>svg]:w-[22px] [&>svg]:h-[22px] [&>svg]:stroke-[2] transition-colors ${active ? '[&>svg]:stroke-indigo-400' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest mt-0.5">{label}</span>
    </button>
  );
}

function PinScreen({ correctPin, onUnlock, isDarkMode, lang }: { correctPin: string, onUnlock: () => void, isDarkMode: boolean, lang: 'id' | 'en' }) {
  const t = useTranslation(lang);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const { user, setAppPin } = useAppStore();

  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotNameInput, setForgotNameInput] = useState('');

  const handleInput = (num: string) => {
    if (input.length < 4) {
      const newVal = input + num;
      setInput(newVal);
      setError(false);
      
      if (newVal.length === 4) {
        if (newVal === correctPin) {
          setTimeout(onUnlock, 200);
        } else {
          setError(true);
          setTimeout(() => setInput(''), 400);
        }
      }
    }
  };

  const handleDelete = () => {
    setInput(input.slice(0, -1));
    setError(false);
  };

  const handleForgotPinSubmit = () => {
    if (forgotNameInput.toLowerCase() === user.name.toLowerCase()) {
      setAppPin(null);
      setForgotModalVisible(false);
    } else {
      setError(true);
      setForgotNameInput('');
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <div className={`min-h-screen flex justify-center items-center ${!isDarkMode ? 'light-theme' : 'bg-slate-950'} sm:p-4 md:p-8 relative`}>
      <div className="w-full h-[100dvh] sm:h-[90vh] sm:max-h-[900px] sm:max-w-[420px] sm:rounded-3xl sm:border sm:border-slate-800 bg-slate-950 shadow-2xl relative flex flex-col items-center justify-center text-slate-200 font-sans p-8">
        <Lock className="w-12 h-12 text-indigo-500 mb-6" />
        <h2 className="text-xl font-bold tracking-tight mb-2">{t('pinLocked')}</h2>
        <p className="text-slate-500 text-sm mb-12">{t('enterPin')}</p>
        
        <div className={`flex gap-4 mb-20 ${error ? 'animate-pulse' : ''}`}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`w-4 h-4 rounded-full transition-colors ${error ? 'bg-red-500' : input.length > i ? 'bg-indigo-500' : 'bg-slate-800'}`} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6 w-full max-w-[280px] mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button 
              key={num} 
              onClick={() => handleInput(num.toString())}
              className="h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl font-bold hover:bg-slate-800 hover:border-indigo-500/30 transition-all font-mono"
            >
              {num}
            </button>
          ))}
          <div /> {/* Kosong */}
          <button 
            onClick={() => handleInput('0')}
            className="h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl font-bold hover:bg-slate-800 hover:border-indigo-500/30 transition-all font-mono"
          >
            0
          </button>
          <button 
            onClick={handleDelete}
            className="h-16 rounded-full bg-slate-900 flex items-center justify-center text-sm font-bold text-slate-500 hover:bg-slate-800 hover:text-slate-50 transition-all uppercase tracking-widest"
          >
            Del
          </button>
        </div>

        <button 
          onClick={() => setForgotModalVisible(true)}
          className="mt-8 text-sm text-slate-500 hover:text-indigo-400 transition-colors font-medium border-b border-transparent hover:border-indigo-400"
        >
          {t('forgotPin') || 'Lupa PIN?'}
        </button>

        {forgotModalVisible && (
          <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-6 z-50">
            <div className={`bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-sm ${error ? 'animate-pulse border-red-500/50' : ''}`}>
              <h3 className="text-lg font-bold text-slate-50 mb-2">{t('resetPin') || 'Reset PIN'}</h3>
              <p className="text-sm text-slate-400 mb-4">{t('resetPinDesc') || 'Masukkan nama profil Anda untuk memverifikasi dan menghapus PIN.'}</p>
              <input
                type="text"
                autoFocus
                value={forgotNameInput}
                onChange={e => setForgotNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleForgotPinSubmit()}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-50 mb-4 outline-none focus:border-indigo-500 transition-colors"
                placeholder={t('nickname') || "Nama profil Anda..."}
              />
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setForgotModalVisible(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-50 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={handleForgotPinSubmit}
                  className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
                >
                  {t('verify') || 'Verifikasi'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
