/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Home, CheckCircle2, Calendar as CalendarIcon, Settings, Lock, Layers, Bell, X, Wallet, WifiOff, FileText } from 'lucide-react';
import HomeScreen from './screens/HomeScreen';
import TasksScreen from './screens/TasksScreen';
import CalendarScreen from './screens/CalendarScreen';
import NoteEditorScreen from './screens/NoteEditorScreen';
import SearchScreen from './screens/SearchScreen';
import SettingsScreen from './screens/SettingsScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import FinanceScreen from './screens/FinanceScreen';
import GameScreen from './screens/GameScreen';
import TicTacToeScreen from './screens/TicTacToeScreen';
import PuzzleScreen from './screens/PuzzleScreen';
import TetrisScreen from './screens/TetrisScreen';
import GamesHubScreen from './screens/GamesHubScreen';
import MemoryGameScreen from './screens/MemoryGameScreen';
import SpaceInvadersScreen from './screens/SpaceInvadersScreen';
import { Note } from './types';
import { useAppStore } from './store';
import { useTranslation } from './translations';
import { getLargeItem, getLargeItemSync } from './utils/db';

export type ScreenItem = 'home' | 'tasks' | 'search' | 'calendar' | 'finance' | 'settings' | 'note-editor' | 'game' | 'tictactoe' | 'puzzle' | 'tetris' | 'games-hub' | 'memory' | 'space-invaders';

let activeAudioCtx: AudioContext | null = null;
let activeInterval: NodeJS.Timeout | null = null;

export const stopGlobalAudio = () => {
  if (activeAudioCtx) {
    activeAudioCtx.close().catch(() => {});
    activeAudioCtx = null;
  }
  if (activeInterval) {
    clearInterval(activeInterval);
    activeInterval = null;
  }
};

export default function App() {
  const { 
    appPin, isUnlocked, setIsUnlocked, lang, tasks, notes, 
    reminderActive, reminderTime, hasCompletedOnboarding, setHasCompletedOnboarding,
    isRefreshing, refreshStep, isLiteMode
  } = useAppStore();
  const t = useTranslation(lang);
  const [currentScreen, _setCurrentScreen] = useState<ScreenItem>('home');

  const setCurrentScreen = useCallback((screen: ScreenItem) => {
    if (isLiteMode && ['game', 'tictactoe', 'puzzle', 'tetris', 'memory', 'space-invaders', 'games-hub'].includes(screen)) {
      screen = 'home';
    }
    if (screen !== currentScreen) {
      window.history.pushState({ screen }, '');
      _setCurrentScreen(screen);
    }
  }, [currentScreen, isLiteMode]);

  useEffect(() => {
    window.history.replaceState({ screen: 'home' }, '');
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.screen) {
        _setCurrentScreen(e.state.screen);
      } else {
        _setCurrentScreen('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [appTheme, setAppTheme] = useState<'dark' | 'light' | 'pink' | 'cool' | 'cute' | 'wallpaper'>(() => {
    try {
      return (localStorage.getItem('noto_theme') as 'dark' | 'light' | 'pink' | 'cool' | 'cute' | 'wallpaper') || 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  const [customWallpaper, setCustomWallpaper] = useState<string | null>(() => getLargeItemSync("noto_custom_wallpaper"));
  
  useEffect(() => {
    getLargeItem('noto_custom_wallpaper').then(setCustomWallpaper);
  }, []);
  
  useEffect(() => {
    try {
      localStorage.setItem('noto_theme', appTheme);
    } catch (e) {}
  }, [appTheme]);

  useEffect(() => {
    const handleWallpaperChange = () => {
      getLargeItem('noto_custom_wallpaper').then(setCustomWallpaper);
    };
    window.addEventListener('noto_wallpaper_changed', handleWallpaperChange);
    return () => window.removeEventListener('noto_wallpaper_changed', handleWallpaperChange);
  }, []);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [inAppAlarm, setInAppAlarm] = useState<{id: number, title: string, body: string, isAlarm?: boolean, noteId?: string} | null>(null);

  useEffect(() => {
    // Schedule future notifications if supported by the browser (Experimental Web API)
    if ('serviceWorker' in navigator && typeof window !== 'undefined' && 'Notification' in window && window.Notification && window.Notification.prototype && 'showTrigger' in window.Notification.prototype && window.Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(async (reg) => {
        try {
          // Attempt to schedule notifications for the next 24 hours
          const now = new Date();
          const todayDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
          
          // 1. Task scheduling
          tasks.forEach(task => {
            if (task.completed || !task.alarmTime) return;
            
            let isToday = false;
            if (task.date === 'Hari ini' || (task.date && task.date.toLowerCase() === 'today') || task.date === todayDate || task.repeat === 'daily' || task.isDiscipline) {
              isToday = true;
            }

            if (isToday) {
              const [alarmHour, alarmMinute] = task.alarmTime.split(':').map(Number);
              const targetTime = new Date();
              targetTime.setHours(alarmHour, alarmMinute, 0, 0);
              
              if (targetTime.getTime() > now.getTime() && targetTime.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
                const message = lang === 'id' ? `Ayo lakukan tugas "${task.title}" kamu!` : `Time to do your task: "${task.title}"!`;
                // @ts-ignore
                reg.showNotification(lang === 'id' ? "Waktunya Tugas!" : "Task Due!", {
                  tag: `noto_task_${task.id}_${todayDate}`,
                  body: message,
                  icon: '/icon.png',
                  badge: '/icon.png',
                  // @ts-ignore
                  showTrigger: new TimestampTrigger(targetTime.getTime())
                }).catch(() => {});
              }
            }
          });

          // 2. Note scheduling
          notes.forEach(note => {
            if (note.isArchived || !note.reminder) return;
            try {
              const targetTime = new Date(note.reminder);
              if (targetTime.getTime() > now.getTime() && targetTime.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
                const message = t('notifNoteBody')
                  ? t('notifNoteBody').replace('{title}', note.title || (lang === 'id' ? 'Catatan Tanpa Judul' : 'Untitled Note'))
                  : `Ketuk untuk membuka catatan: "${note.title || 'Catatan'}"`;
                // @ts-ignore
                reg.showNotification(t('noteReminderTitle') || "Catatan Pengingat! 🔔", {
                  tag: `noto_note_${note.id}`,
                  body: message,
                  icon: '/icon.png',
                  badge: '/icon.png',
                  // @ts-ignore
                  showTrigger: new TimestampTrigger(targetTime.getTime())
                }).catch(() => {});
              }
            } catch(e) {}
          });
        } catch(e) {}
      });
    }
  }, [tasks, notes, lang, t]);

  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date();
      const currentHour = now.getHours().toString().padStart(2, '0');
      const currentMinute = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHour}:${currentMinute}`;
      
      const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
      const todayDate = localDate.toISOString().split('T')[0];
      let lastNotif = '';
      try { lastNotif = localStorage.getItem('noto_last_notif_date_time') || ''; } catch(e) {}
      
      const sendNotification = (title: string, body: string, isImportant: boolean = false, noteId?: string) => {
        const id = Date.now();
        const isVisible = document.visibilityState === 'visible';
        
        // Selalu tampilkan In-App Notification agar saat dibuka ada modalnya
        setInAppAlarm({title, body, id, isAlarm: isImportant, noteId});
        if (!isImportant) {
          setTimeout(() => setInAppAlarm(prev => prev && prev.id === id ? null : prev), 10000);
        }

        if (isVisible) {
          // App terbuka: Bunyikan suara notifikasi + Vibrate
          stopGlobalAudio();
          
          if ("vibrate" in navigator) {
            try { navigator.vibrate([200, 100, 200]); } catch(e) {}
          }
          
          try {
             activeAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
             const playBeep = () => {
               if (!activeAudioCtx) return;
               const osc = activeAudioCtx.createOscillator();
               const gain = activeAudioCtx.createGain();
               osc.connect(gain);
               gain.connect(activeAudioCtx.destination);
               osc.type = 'sine';
               osc.frequency.setValueAtTime(isImportant ? 880 : 660, activeAudioCtx.currentTime);
               osc.frequency.exponentialRampToValueAtTime(440, activeAudioCtx.currentTime + 0.1);
               gain.gain.setValueAtTime(0.5, activeAudioCtx.currentTime);
               gain.gain.exponentialRampToValueAtTime(0.01, activeAudioCtx.currentTime + 0.5);
               osc.start(activeAudioCtx.currentTime);
               osc.stop(activeAudioCtx.currentTime + 0.5);
             };
             playBeep();
          } catch(e) {}

        } else {
          // App tertutup/minimize: Gunakan Notifikasi System, jangan play sound via audioCtx karena mungkin di-block
          if (typeof window !== 'undefined' && 'Notification' in window && window.Notification && window.Notification.permission === 'granted') {
            const options: any = { 
              body: body, 
              icon: '/icon.png', 
              badge: '/icon.png',
              vibrate: [200, 100, 200],
              requireInteraction: isImportant,
              silent: false
            };
            
            if (navigator.serviceWorker) {
              navigator.serviceWorker.ready.then(reg => {
                reg.showNotification(title, options);
              }).catch(() => {
                new window.Notification(title, options);
              });
            } else {
              new window.Notification(title, options);
            }
          }
        }
      };

      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

      // 1. Global Daily Reminder
      const [remHour, remMin] = (reminderTime || '00:00').split(':').map(Number);
      const remTotalMinutes = remHour * 60 + remMin;

      if (reminderActive && reminderTime && currentTotalMinutes >= remTotalMinutes && lastNotif !== `${todayDate}_${reminderTime}`) {
        try { localStorage.setItem('noto_last_notif_date_time', `${todayDate}_${reminderTime}`); } catch(e){}
        const todayTasks = tasks.filter(t => {
            if (t.date === 'Hari ini' || (t.date && t.date.toLowerCase() === 'today') || t.repeat === 'daily') return true;
            return t.date === todayDate;
        });
        const allCompleted = todayTasks.length > 0 && todayTasks.every(t => t.completed);
        const hasTasks = todayTasks.length > 0;
        
        let title = '';
        let body = '';
        if (hasTasks && allCompleted) {
          title = t('notifAllDoneTitle') || "Kerja Bagus! 🎉";
          body = t('notifAllDoneBody') || "Semua tugas hari ini telah selesai. Pertahankan streakmu.";
        } else {
          title = t('notifPendingTitle') || "Jangan Putus Streak Hari Ini 🔥";
          body = t('notifPendingBody') || "Masih ada tugas yang menunggu. Selesaikan targetmu hari ini di Noto.";
        }
        sendNotification(title, body, false);
      }

      // 2. Individual Task Notifications
      tasks.forEach(task => {
        // Skip completed tasks or tasks with no notification time
        if (task.completed || !task.alarmTime) return;

        // Check if the task is scheduled for today
        let isToday = false;
        if (task.date === 'Hari ini' || (task.date && task.date.toLowerCase() === 'today') || task.date === todayDate || task.repeat === 'daily' || task.isDiscipline) {
          isToday = true;
        }

        if (isToday) {
           const [alarmHour, alarmMinute] = task.alarmTime.split(':').map(Number);
           const alarmTotalMinutes = alarmHour * 60 + alarmMinute;

           if (currentTotalMinutes >= alarmTotalMinutes) {
             const alarmKey = `noto_alarm_${task.id}_${todayDate}`;
             try {
               if (!localStorage.getItem(alarmKey)) {
                 localStorage.setItem(alarmKey, 'true');
                 const message = lang === 'id' ? `Ayo lakukan tugas "${task.title}" kamu!` : `Time to do your task: "${task.title}"!`;
                 sendNotification(t('alarmDue') || "Waktunya Tugas!", message, true);
               }
             } catch(e) {}
           }
        }
      });

      // 3. Note Reminders
      notes.forEach(note => {
        if (note.isArchived || !note.reminder) return;

        try {
          const reminderTimeMs = new Date(note.reminder).getTime();
          const nowMs = now.getTime();
          
          // Check if reminder is due
          if (nowMs >= reminderTimeMs) {
            const reminderKey = `noto_note_reminder_${note.id}`;
            if (!localStorage.getItem(reminderKey)) {
              localStorage.setItem(reminderKey, 'true');
              
              const bodyText = t('notifNoteBody')
                ? t('notifNoteBody').replace('{title}', note.title || (lang === 'id' ? 'Catatan Tanpa Judul' : 'Untitled Note'))
                : `Ketuk untuk membuka catatan: "${note.title || 'Catatan'}"`;
              
              sendNotification(
                t('noteReminderTitle') || "Catatan Pengingat!",
                bodyText,
                true,
                note.id
              );
            }
          }
        } catch (e) {}
      });
      
    }; // End of checkNotifications

    checkNotifications();
    const interval = setInterval(checkNotifications, 10000); // interval is every 10s
    
    return () => clearInterval(interval);
  }, [reminderActive, reminderTime, tasks, notes, t, lang]);

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

  const getThemeClass = () => {
    let base = '';
    const activeTheme = isLiteMode ? 'dark' : appTheme;
    if (activeTheme === 'light') base = 'light-theme bg-slate-950';
    else if (activeTheme === 'pink') base = 'pink-theme bg-slate-950';
    else if (activeTheme === 'cool') base = 'cool-theme';
    else if (activeTheme === 'cute') base = 'cute-theme';
    else if (activeTheme === 'wallpaper') base = 'wallpaper-theme bg-transparent';
    else base = 'bg-slate-950';
    
    return base;
  };

  const getBackgroundImageUrl = () => {
    if (isLiteMode) return undefined;
    if (appTheme === 'wallpaper' && customWallpaper) {
      return customWallpaper;
    }
    return undefined;
  };

  if (isRefreshing) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-300">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_30px_rgba(99,102,241,0.3)]"></div>
        <h2 className="text-2xl font-black text-slate-50 tracking-tight mb-2">
          {t('refreshingTitle')}
        </h2>
        <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden mb-8 shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"
            style={{ width: `${(refreshStep / 5) * 100}%` }}
          ></div>
        </div>
        <div className="h-6 flex items-center justify-center">
          <span className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-wide">
            {refreshStep === 1 && t('refreshStep1')}
            {refreshStep === 2 && t('refreshStep2')}
            {refreshStep === 3 && t('refreshStep3')}
            {refreshStep === 4 && t('refreshStep4')}
            {refreshStep === 5 && t('refreshStep5')}
          </span>
        </div>
      </div>
    );
  }

  const activeTheme = isLiteMode ? 'dark' : appTheme;

  if (!hasCompletedOnboarding) {
    return (
      <div className={`w-full h-[100dvh] flex flex-col md:flex-row ${getThemeClass()} text-slate-200 font-sans relative overflow-hidden`}>
        {getBackgroundImageUrl() && <img src={getBackgroundImageUrl()} alt="Background" className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none" referrerPolicy="no-referrer" />}
        {(activeTheme === 'cool' || activeTheme === 'cute' || activeTheme === 'wallpaper') && (
          <div className="absolute inset-0 bg-slate-950/40 z-0 pointer-events-none" />
        )}
        <div className="flex-1 w-full mx-auto max-w-[1920px] relative z-10">
          <OnboardingScreen onFinish={() => setHasCompletedOnboarding(true)} />
        </div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className={`w-full h-[100dvh] flex flex-col md:flex-row ${getThemeClass()} text-slate-200 font-sans relative overflow-hidden`}>
        {getBackgroundImageUrl() && <img src={getBackgroundImageUrl()} alt="Background" className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none" referrerPolicy="no-referrer" />}
        {(activeTheme === 'cool' || activeTheme === 'cute' || activeTheme === 'wallpaper') && (
          <div className="absolute inset-0 bg-slate-950/40 z-0 pointer-events-none" />
        )}
        <div className="flex-1 w-full mx-auto max-w-[1920px] relative z-10">
          <PinScreen correctPin={appPin} onUnlock={() => setIsUnlocked(true)} appTheme={activeTheme} lang={lang} />
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-[100dvh] flex flex-col md:flex-row ${getThemeClass()} text-slate-200 font-sans relative overflow-hidden`}>
      {getBackgroundImageUrl() && <img src={getBackgroundImageUrl()} alt="Background" className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none" referrerPolicy="no-referrer" />}
      {(activeTheme === 'cool' || activeTheme === 'cute' || activeTheme === 'wallpaper') && (
        <div className="absolute inset-0 bg-slate-950/40 z-0 pointer-events-none" />
      )}
      <OfflineIndicator lang={lang} />
      
      {inAppAlarm && inAppAlarm.isAlarm && (
        <div className="absolute inset-0 z-[999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full flex flex-col items-center text-center shadow-2xl shadow-indigo-600/20">
             <div className="w-20 h-20 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mb-6 animate-pulse shadow-[0_0_40px_rgba(99,102,241,0.4)]">
               <Bell className="w-10 h-10 animate-bounce" />
             </div>
             <h3 className="text-2xl font-bold text-slate-50 mb-2">{inAppAlarm.title}</h3>
             <p className="text-slate-400 font-medium mb-8">{inAppAlarm.body}</p>
             <div className="flex flex-col gap-3 w-full">
               <button 
                 onClick={() => { 
                   const targetNoteId = inAppAlarm.noteId;
                   setInAppAlarm(null); 
                   stopGlobalAudio(); 
                   if (targetNoteId) {
                     const targetNote = notes.find(n => n.id === targetNoteId);
                     if (targetNote) openNote(targetNote);
                   }
                 }} 
                 className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg transition-transform active:scale-95 shadow-lg shadow-indigo-600/20"
               >
                 {inAppAlarm.noteId ? (lang === 'id' ? 'Buka Catatan' : 'Open Note') : (lang === 'id' ? 'Tutup Notifikasi' : 'Dismiss Notification')}
               </button>
               {inAppAlarm.noteId && (
                 <button 
                   onClick={() => { 
                     setInAppAlarm(null); 
                     stopGlobalAudio(); 
                   }} 
                   className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl font-semibold text-xs transition-colors"
                 >
                   {lang === 'id' ? 'Tutup Saja' : 'Dismiss Only'}
                 </button>
               )}
             </div>
           </div>
        </div>
      )}

      {inAppAlarm && !inAppAlarm.isAlarm && (
        <div 
          onClick={() => {
            if (inAppAlarm.noteId) {
              const targetNoteId = inAppAlarm.noteId;
              setInAppAlarm(null);
              stopGlobalAudio();
              const targetNote = notes.find(n => n.id === targetNoteId);
              if (targetNote) openNote(targetNote);
            }
          }}
          className={`absolute top-4 left-1/2 -translate-x-1/2 z-[200] max-w-sm w-[90%] md:w-full bg-indigo-600 shadow-xl shadow-indigo-600/20 rounded-2xl p-4 flex items-start gap-4 animate-in slide-in-from-top-4 fade-in duration-300 ${inAppAlarm.noteId ? 'cursor-pointer hover:bg-indigo-500' : ''}`}
        >
           <Bell className="w-6 h-6 text-white shrink-0 mt-0.5" />
           <div className="flex-1">
             <h4 className="font-bold text-white text-sm mb-1">{inAppAlarm.title}</h4>
             <p className="text-white/80 text-xs leading-relaxed">{inAppAlarm.body}</p>
           </div>
           <button 
             onClick={(e) => { 
               e.stopPropagation();
               setInAppAlarm(null); 
               stopGlobalAudio(); 
             }} 
             className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
           >
             <X className="w-4 h-4" />
           </button>
        </div>
      )}

      {/* Desktop Sidebar / Mobile Bottom Nav */}
      {currentScreen !== 'note-editor' && currentScreen !== 'game' && currentScreen !== 'tictactoe' && currentScreen !== 'puzzle' && currentScreen !== 'tetris' && currentScreen !== 'memory' && currentScreen !== 'space-invaders' && currentScreen !== 'games-hub' && currentScreen !== 'finance' && (
        <nav className="flex-none order-last md:order-first w-full md:w-[240px] lg:w-[280px] bg-slate-900/95 md:bg-slate-900/80 md:backdrop-blur-md border-t md:border-t-0 md:border-r border-slate-800 flex md:flex-col justify-between md:justify-start z-50 relative pb-[calc(env(safe-area-inset-bottom)+4px)] pt-1 md:pb-0 min-h-[72px] md:min-h-screen md:pt-8 md:px-4 shadow-[0_-10px_30px_rgba(0,0,0,0.2)] md:shadow-[10px_0_30px_rgba(0,0,0,0.2)]">
          
          {/* Logo only visible on Desktop */}
          <div className="hidden md:flex items-center gap-3 px-4 mb-8">
             <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center overflow-hidden shadow-inner">
                  <img src="/icon.png" alt="Noto Logo" className="w-full h-full object-cover" />
             </div>
             <span className="font-extrabold text-2xl tracking-tighter text-slate-50">
                NOTO
             </span>
          </div>

          <div className="flex flex-row md:flex-col justify-evenly md:justify-start w-full px-1 sm:px-4 md:px-0 gap-1 md:gap-3 items-center md:items-stretch overflow-x-auto no-scrollbar relative z-10 py-1 md:py-0">
            <NavItem icon={<Home />} label={t('home')} active={currentScreen === 'home'} onClick={() => setCurrentScreen('home')} />
            <NavItem icon={<CheckCircle2 />} label={t('tasksMenu')} active={currentScreen === 'tasks'} onClick={() => setCurrentScreen('tasks')} />
            <NavItem icon={<FileText />} label={t('searchMenu')} active={currentScreen === 'search'} onClick={() => setCurrentScreen('search')} />
            <NavItem icon={<CalendarIcon />} label={t('calendar')} active={currentScreen === 'calendar'} onClick={() => setCurrentScreen('calendar')} />
            <NavItem icon={<Settings />} label={t('settingsMenu')} active={currentScreen === 'settings'} onClick={() => setCurrentScreen('settings')} />
          </div>
        </nav>
      )}

      <div className="flex-1 relative flex flex-col overflow-hidden w-full max-w-[1920px] mx-auto">
        {currentScreen === 'home' && <HomeScreen appTheme={activeTheme} setAppTheme={setAppTheme} onOpenNote={openNote} onNavigate={(screen) => setCurrentScreen(screen)} />}
        {currentScreen === 'tasks' && <TasksScreen onNavigate={(screen) => setCurrentScreen(screen)} />}
        {currentScreen === 'calendar' && <CalendarScreen />}
        {currentScreen === 'finance' && <FinanceScreen appTheme={activeTheme} onBack={() => setCurrentScreen('home')} />}
        {currentScreen === 'note-editor' && activeNote && <NoteEditorScreen note={activeNote} onBack={closeNote} />}
        {currentScreen === 'search' && <SearchScreen onOpenNote={openNote} />}
        {currentScreen === 'settings' && (
          <SettingsScreen 
            appTheme={activeTheme} 
            setAppTheme={setAppTheme} 
            onNavigate={(screen) => setCurrentScreen(screen)} 
          />
        )}
        {currentScreen === 'games-hub' && <GamesHubScreen onSelectGame={(g) => setCurrentScreen(g)} onBack={() => setCurrentScreen('settings')} />}
        {currentScreen === 'game' && <GameScreen onBack={() => setCurrentScreen('games-hub')} />}
        {currentScreen === 'tictactoe' && <TicTacToeScreen onBack={() => setCurrentScreen('games-hub')} />}
        {currentScreen === 'puzzle' && <PuzzleScreen onBack={() => setCurrentScreen('games-hub')} />}
        {currentScreen === 'tetris' && <TetrisScreen onBack={() => setCurrentScreen('games-hub')} />}
        {currentScreen === 'memory' && <MemoryGameScreen onBack={() => setCurrentScreen('games-hub')} />}
        {currentScreen === 'space-invaders' && <SpaceInvadersScreen onBack={() => setCurrentScreen('games-hub')} />}
      </div>

    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`relative flex items-center group transition-all rounded-2xl flex-1 md:w-full md:flex-none md:px-5 md:py-4 md:justify-start flex-col md:flex-row justify-center min-h-[56px] md:min-h-0 md:min-w-0 md:mb-1 py-1.5 px-0.5 ${
        active ? 'text-indigo-400 bg-transparent md:bg-indigo-500/10 md:text-indigo-400 md:shadow-inner md:border md:border-indigo-500/20' : 'text-slate-400 hover:text-indigo-300 md:hover:bg-slate-800/40 md:border md:border-transparent'
      }`}
    >
      <div className={`md:hidden absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-500 rounded-b-full opacity-0 transition-all ${active ? '!opacity-100 top-0' : ''}`}></div>
      <div className={`[&>svg]:w-[22px] [&>svg]:h-[22px] md:[&>svg]:w-[24px] md:[&>svg]:h-[24px] [&>svg]:stroke-[2] transition-colors md:mr-4 ${active ? '[&>svg]:stroke-indigo-400 drop-shadow-sm' : ''}`}>
        {icon}
      </div>
      <span className={`text-[9px] xs:text-[10px] md:text-sm font-bold uppercase md:tracking-wide md:normal-case mt-1 md:mt-0 transition-opacity truncate max-w-full px-1 ${active ? 'opacity-100' : 'opacity-80'}`}>{label}</span>
      {active && <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>}
    </button>
  );
}

function PinScreen({ correctPin, onUnlock, appTheme, lang }: { correctPin: string, onUnlock: () => void, appTheme: string, lang: 'id' | 'en' }) {
  const t = useTranslation(lang);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const { user, setAppPin, pinRecoveryQuestion, pinRecoveryAnswer, setPinRecoveryQuestion, setPinRecoveryAnswer } = useAppStore();

  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotNameInput, setForgotNameInput] = useState('');

  const handleInput = async (num: string) => {
    if (input.length < 4) {
      const newVal = input + num;
      setInput(newVal);
      setError(false);
      
      if (newVal.length === 4) {
        const { hashPin } = await import('./utils');
        const hashed = await hashPin(newVal);
        if (hashed === correctPin || newVal === correctPin) { // support legacy plaintext pin
          if (newVal === correctPin && newVal !== hashed) {
            setAppPin(hashed); // seamlessly upgrade to hash
          }
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
    const isCorrect = pinRecoveryAnswer 
      ? forgotNameInput.trim().toLowerCase() === pinRecoveryAnswer.trim().toLowerCase()
      : forgotNameInput.trim().toLowerCase() === (user?.name || '').trim().toLowerCase();

    if (isCorrect) {
      setAppPin(null);
      setPinRecoveryQuestion(null);
      setPinRecoveryAnswer(null);
      setForgotModalVisible(false);
    } else {
      setError(true);
      setForgotNameInput('');
      setTimeout(() => setError(false), 500);
    }
  };

  const getThemeClass = () => {
    let base = '';
    if (appTheme === 'light') base = 'light-theme bg-slate-950';
    else if (appTheme === 'pink') base = 'pink-theme bg-slate-950';
    else if (appTheme === 'cool') base = 'cool-theme';
    else if (appTheme === 'cute') base = 'cute-theme';
    else if (appTheme === 'wallpaper') base = 'wallpaper-theme bg-transparent';
    else base = 'bg-slate-950';
    
    return base;
  };

  return (
    <div className={`min-h-screen flex justify-center items-center ${getThemeClass()} relative`}>
      <OfflineIndicator lang={lang} />
      <div className="w-full max-w-[480px] min-h-[100dvh] relative flex flex-col items-center justify-center text-slate-200 font-sans p-8 shadow-2xl sm:border-x border-slate-800 bg-slate-950 backdrop-blur-md">
        <Lock className="w-12 h-12 text-indigo-500 mb-6" />
        <h2 className="text-xl font-bold tracking-tight mb-2">{t('pinLocked')}</h2>
        <p className="text-slate-400 text-sm mb-12">{t('enterPin')}</p>
        
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
            className="h-16 rounded-full bg-slate-900 flex items-center justify-center text-sm font-bold text-slate-400 hover:bg-slate-800 hover:text-slate-50 transition-all uppercase tracking-widest"
          >
            Del
          </button>
        </div>

        <button 
          onClick={() => setForgotModalVisible(true)}
          className="mt-8 text-sm text-slate-400 hover:text-indigo-400 transition-colors font-medium border-b border-transparent hover:border-indigo-400"
        >
          {t('forgotPin') || 'Lupa PIN?'}
        </button>

        {forgotModalVisible && (
          <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-6 z-50">
            <div className={`bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-sm ${error ? 'animate-pulse border-red-500/50' : ''}`}>
              <h3 className="text-lg font-bold text-slate-50 mb-2">{t('resetPin') || 'Reset PIN'}</h3>
              <p className="text-sm text-slate-400 mb-2">{t('resetPinDesc') || 'Jawab pertanyaan keamanan Anda untuk memverifikasi dan menghapus PIN.'}</p>
              {pinRecoveryQuestion && (
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl mb-4">
                  <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-1 block">
                    {lang === 'id' ? 'Pertanyaan' : 'Question'}
                  </span>
                  <p className="text-sm text-slate-200">{pinRecoveryQuestion}</p>
                </div>
              )}
              <input
                type="text"
                autoFocus
                value={forgotNameInput}
                onChange={e => setForgotNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleForgotPinSubmit()}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-50 mb-4 outline-none focus:border-indigo-500 transition-colors"
                placeholder={pinRecoveryQuestion ? (lang === 'id' ? "Jawaban Anda..." : "Your Answer...") : (lang === 'id' ? "Nama profil Anda..." : "Your profile name...")}
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
                  {t('verify') || (lang === 'id' ? 'Verifikasi' : 'Verify')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OfflineIndicator({ lang }: { lang: 'id' | 'en' }) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] bg-slate-900 border border-slate-800 shadow-xl shadow-slate-950/50 rounded-full px-4 py-2 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      <WifiOff className="w-3.5 h-3.5 text-slate-400" />
      <span className="text-xs font-bold tracking-wide text-slate-300">
        {lang === 'id' ? 'OFFLINE' : 'OFFLINE'}
      </span>
    </div>
  );
}
