/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Home, CheckCircle2, Calendar as CalendarIcon, Settings, Lock, Layers, Bell, X, Wallet } from 'lucide-react';
import HomeScreen from './screens/HomeScreen';
import TasksScreen from './screens/TasksScreen';
import CalendarScreen from './screens/CalendarScreen';
import NoteEditorScreen from './screens/NoteEditorScreen';
import SearchScreen from './screens/SearchScreen';
import SettingsScreen from './screens/SettingsScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import FinanceScreen from './screens/FinanceScreen';
import { Note } from './types';
import { useAppStore } from './store';
import { useTranslation } from './translations';

export type ScreenItem = 'home' | 'tasks' | 'search' | 'calendar' | 'finance' | 'settings' | 'note-editor';

let activeAudio: HTMLAudioElement | null = null;

export const stopGlobalAudio = () => {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
  }
};

export default function App() {
  const { 
    appPin, isUnlocked, setIsUnlocked, lang, tasks, 
    reminderActive, reminderTime, hasCompletedOnboarding, setHasCompletedOnboarding 
  } = useAppStore();
  const t = useTranslation(lang);
  const [currentScreen, setCurrentScreen] = useState<ScreenItem>('home');
  const [appTheme, setAppTheme] = useState<'dark' | 'light' | 'pink'>(() => (localStorage.getItem('noto_theme') as 'dark' | 'light' | 'pink') || 'dark');
  
  useEffect(() => {
    localStorage.setItem('noto_theme', appTheme);
  }, [appTheme]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [inAppAlarm, setInAppAlarm] = useState<{id: number, title: string, body: string, isAlarm?: boolean} | null>(null);

  useEffect(() => {
    // We remove the return block here since we still might want to trigger individual task alarms
    const interval = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours().toString().padStart(2, '0');
      const currentMinute = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHour}:${currentMinute}`;
      
      const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
      const todayDate = localDate.toISOString().split('T')[0];
      const lastNotif = localStorage.getItem('noto_last_notif_date_time');
      
      const sendNotification = (title: string, body: string, isAlarm: boolean = false) => {
        const id = Date.now();
        setInAppAlarm({title, body, id, isAlarm});
        if (!isAlarm) {
          setTimeout(() => setInAppAlarm(prev => prev && prev.id === id ? null : prev), 10000);
        }
        
        stopGlobalAudio();
        try {
          // Play a native sound via HTML Audio for maximum compatibility
          activeAudio = new Audio('/alarm.mp3');
          if (isAlarm) {
            activeAudio.loop = true;
          }
          activeAudio.play().catch(() => {
             if ("vibrate" in navigator) navigator.vibrate([500, 250, 500, 250, 500]);
          });
        } catch(e) {}
        
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
          
          osc.start();
          osc.stop(ctx.currentTime + 0.5);
        } catch(e) {}
        
        if ('Notification' in window && Notification.permission === 'granted') {
          const options: any = { 
            body: body, 
            icon: '/icon.png', 
            badge: '/icon.png',
            vibrate: [500, 250, 500, 250, 500, 250, 500, 250, 500],
            requireInteraction: isAlarm,
            silent: false
          };
          
          if (navigator.serviceWorker) {
            navigator.serviceWorker.ready.then(reg => {
              reg.showNotification(title, options);
            }).catch(() => {
              new Notification(title, options);
            });
          } else {
            new Notification(title, options);
          }
        }
      };

      // 1. Global Daily Reminder
      if (reminderActive && currentTime >= reminderTime && lastNotif !== `${todayDate}_${reminderTime}`) {
        localStorage.setItem('noto_last_notif_date_time', `${todayDate}_${reminderTime}`);
        const todayTasks = tasks.filter(t => {
            if (t.date === 'Hari ini' || t.date.toLowerCase() === 'today' || t.repeat === 'daily') return true;
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

      // 2. Individual Task Alarms
      tasks.forEach(task => {
        // Skip completed tasks or tasks with no alarm
        if (task.completed || !task.alarmTime) return;

        // Check if the task is scheduled for today
        let isToday = false;
        if (task.date === 'Hari ini' || task.date.toLowerCase() === 'today' || task.date === todayDate || task.repeat === 'daily') {
          isToday = true;
        }

        if (isToday) {
           // Fire if currentTime is past the alarmTime, so we don't miss it due to interval throttling
           if (currentTime >= task.alarmTime) {
             const alarmKey = `noto_alarm_${task.id}_${todayDate}`;
             if (!localStorage.getItem(alarmKey)) {
               localStorage.setItem(alarmKey, 'true');
               const message = lang === 'id' ? `Ayo lakukan tugas ${task.title} kamu!` : `Time to do your task: ${task.title}!`;
               sendNotification(task.title, message, true);
             }
           }
        }
      });
      
    }, 10000); // interval is every 10s to ensure we don't miss the 1-minute window
    
    return () => clearInterval(interval);
  }, [reminderActive, reminderTime, tasks, t]);

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
    if (appTheme === 'light') return 'light-theme bg-slate-950';
    if (appTheme === 'pink') return 'pink-theme bg-slate-950';
    return 'bg-slate-950';
  };

  if (!hasCompletedOnboarding) {
    return (
      <div className={`w-full h-[100dvh] flex flex-col md:flex-row ${getThemeClass()} text-slate-200 font-sans relative overflow-hidden`}>
        <div className="flex-1 w-full mx-auto max-w-[1920px]">
          <OnboardingScreen onFinish={() => setHasCompletedOnboarding(true)} />
        </div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className={`w-full h-[100dvh] flex flex-col md:flex-row ${getThemeClass()} text-slate-200 font-sans relative overflow-hidden`}>
        <div className="flex-1 w-full mx-auto max-w-[1920px]">
          <PinScreen correctPin={appPin} onUnlock={() => setIsUnlocked(true)} appTheme={appTheme} lang={lang} />
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-[100dvh] flex flex-col md:flex-row ${getThemeClass()} text-slate-200 font-sans relative overflow-hidden`}>
      
      {inAppAlarm && inAppAlarm.isAlarm && (
        <div className="absolute inset-0 z-[999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full flex flex-col items-center text-center shadow-2xl shadow-indigo-600/20">
             <div className="w-20 h-20 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mb-6 animate-pulse shadow-[0_0_40px_rgba(99,102,241,0.4)]">
               <Bell className="w-10 h-10 animate-bounce" />
             </div>
             <h3 className="text-2xl font-bold text-white mb-2">{inAppAlarm.title}</h3>
             <p className="text-slate-400 font-medium mb-8">{inAppAlarm.body}</p>
             <button onClick={() => { setInAppAlarm(null); stopGlobalAudio(); }} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg transition-transform active:scale-95 shadow-lg shadow-indigo-600/20">
               {lang === 'id' ? 'Tutup Pengingat' : 'Dismiss Alarm'}
             </button>
           </div>
        </div>
      )}

      {inAppAlarm && !inAppAlarm.isAlarm && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[200] max-w-sm w-[90%] md:w-full bg-indigo-600 shadow-xl shadow-indigo-600/20 rounded-2xl p-4 flex items-start gap-4 animate-in slide-in-from-top-4 fade-in duration-300">
           <Bell className="w-6 h-6 text-white shrink-0 mt-0.5" />
           <div className="flex-1">
             <h4 className="font-bold text-white text-sm mb-1">{inAppAlarm.title}</h4>
             <p className="text-white/80 text-xs leading-relaxed">{inAppAlarm.body}</p>
           </div>
           <button onClick={() => { setInAppAlarm(null); stopGlobalAudio(); }} className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white">
             <X className="w-4 h-4" />
           </button>
        </div>
      )}

      {/* Desktop Sidebar / Mobile Bottom Nav */}
      {currentScreen !== 'note-editor' && (
        <nav className="flex-none order-last md:order-first w-full md:w-[240px] lg:w-[280px] bg-slate-900/95 border-t md:border-t-0 md:border-r border-slate-800 flex md:flex-col justify-between md:justify-start z-50 relative pb-safe md:pb-0 h-[72px] md:h-screen md:pt-8 md:px-4">
          
          {/* Logo only visible on Desktop */}
          <div className="hidden md:flex items-center gap-3 px-4 mb-8">
             <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center overflow-hidden">
                 <img src="/icon.png" alt="Noto Logo" className="w-full h-full object-cover" />
             </div>
             <span className="font-black text-2xl tracking-tighter text-slate-50">
                NOTO
             </span>
          </div>

          <div className="flex flex-row md:flex-col justify-evenly md:justify-start w-full px-2 sm:px-6 md:px-0 gap-1 md:gap-2 h-full md:h-auto items-center md:items-stretch">
            <NavItem icon={<Home />} label={t('home')} active={currentScreen === 'home'} onClick={() => setCurrentScreen('home')} />
            <NavItem icon={<CheckCircle2 />} label={t('tasksMenu')} active={currentScreen === 'tasks'} onClick={() => setCurrentScreen('tasks')} />
            <NavItem icon={<Layers />} label={t('searchMenu')} active={currentScreen === 'search'} onClick={() => setCurrentScreen('search')} />
            <NavItem icon={<CalendarIcon />} label={t('calendar')} active={currentScreen === 'calendar'} onClick={() => setCurrentScreen('calendar')} />
            <NavItem icon={<Settings />} label={t('settingsMenu')} active={currentScreen === 'settings'} onClick={() => setCurrentScreen('settings')} />
          </div>
        </nav>
      )}

      <div className="flex-1 relative flex flex-col overflow-hidden w-full max-w-[1920px] mx-auto">
        {currentScreen === 'home' && <HomeScreen appTheme={appTheme} setAppTheme={setAppTheme} onOpenNote={openNote} onNavigate={(screen) => setCurrentScreen(screen)} />}
        {currentScreen === 'tasks' && <TasksScreen onNavigate={(screen) => setCurrentScreen(screen)} />}
        {currentScreen === 'calendar' && <CalendarScreen />}
        {currentScreen === 'finance' && <FinanceScreen appTheme={appTheme} onBack={() => setCurrentScreen('home')} />}
        {currentScreen === 'note-editor' && activeNote && <NoteEditorScreen note={activeNote} onBack={closeNote} />}
        {currentScreen === 'search' && <SearchScreen onOpenNote={openNote} />}
        {currentScreen === 'settings' && <SettingsScreen appTheme={appTheme} setAppTheme={setAppTheme} />}
      </div>

    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`relative flex items-center group transition-colors rounded-2xl md:w-full md:px-4 md:py-3.5 md:justify-start flex-col md:flex-row justify-center min-w-[64px] min-h-[56px] md:min-h-0 md:min-w-0 ${
        active ? 'text-indigo-400 md:bg-indigo-500/10 md:text-indigo-400' : 'text-slate-500 hover:text-indigo-300 md:hover:bg-slate-800/50'
      }`}
    >
      <div className={`md:hidden w-1 h-1 bg-indigo-500 rounded-full mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${active ? '!opacity-100' : ''}`}></div>
      <div className={`[&>svg]:w-[22px] [&>svg]:h-[22px] [&>svg]:stroke-[2] transition-colors md:mr-4 ${active ? '[&>svg]:stroke-indigo-400' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] md:text-sm md:font-bold font-bold uppercase md:tracking-wider md:normal-case tracking-widest mt-0.5 md:mt-0">{label}</span>
      {active && <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full"></div>}
    </button>
  );
}

function PinScreen({ correctPin, onUnlock, appTheme, lang }: { correctPin: string, onUnlock: () => void, appTheme: string, lang: 'id' | 'en' }) {
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

  const getThemeClass = () => {
    if (appTheme === 'light') return 'light-theme bg-slate-950';
    if (appTheme === 'pink') return 'pink-theme bg-slate-950';
    return 'bg-slate-950';
  };

  return (
    <div className={`min-h-screen flex justify-center items-center ${getThemeClass()} relative`}>
      <div className="w-full max-w-[480px] min-h-[100dvh] relative flex flex-col items-center justify-center text-slate-200 font-sans p-8 shadow-2xl sm:border-x border-slate-800 bg-slate-950">
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
