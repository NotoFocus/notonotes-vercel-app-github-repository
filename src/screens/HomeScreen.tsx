import React, { useState, useEffect, useMemo } from 'react';
import { Plus, CheckSquare, Bell, Clock, Play, Pause, RotateCcw, X, Pin, FileText, Trash2, Flame, Sparkles, ChevronRight, Repeat, Wallet, Target } from 'lucide-react';
import { Note, Task } from '../types';
import { useAppStore } from '../store';
import { useTranslation } from '../translations';
import { motion, AnimatePresence } from 'motion/react';
import { generateId, formatReminderDate } from '../utils';
import { getLargeItem, getLargeItemSync } from '../utils/db';

interface HomeProps {
  appTheme: string;
  setAppTheme: (theme: any) => void;
  onOpenNote: (note: Note) => void;
  onNavigate: (screen: 'home' | 'tasks' | 'search' | 'calendar' | 'settings' | 'finance') => void;
}

const getMoodIcon = (id: string, className = "w-6 h-6") => {
  switch (id) {
    case 'excellent':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>;
    case 'good':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 1 4 1 4-1 4-1"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>;
    case 'neutral':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>;
    case 'bad':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M8 16s1.5-1 4-1 4 1 4 1"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>;
    case 'terrible':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M8 16s1.5-2 4-2 4 2 4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>;
    default:
      return null;
  }
};

export default function HomeScreen({ appTheme, setAppTheme, onOpenNote, onNavigate }: HomeProps) {
  const { notes, tasks, moods, setMood, user, updateUser, toggleTask, deleteTask, deleteNote, setSearchQuery, streak, lang, updateTask, checkInDaily } = useAppStore();
  const t = useTranslation(lang);
  
  // Use the current user from the store instead of static data
  const currentUser = user;
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = '';
    let icon = '';
    if (hour < 11) { timeGreeting = lang === 'id' ? 'Selamat Pagi' : 'Good Morning'; icon = '🌅'; }
    else if (hour < 15) { timeGreeting = lang === 'id' ? 'Selamat Siang' : 'Good Afternoon'; icon = '☀️'; }
    else if (hour < 18) { timeGreeting = lang === 'id' ? 'Selamat Sore' : 'Good Afternoon'; icon = '🌤️'; }
    else { timeGreeting = lang === 'id' ? 'Selamat Malam' : 'Good Evening'; icon = '🌙'; }
    return `${timeGreeting}, ${currentUser.name || (lang === 'id' ? 'Kawan' : 'Friend')} ${icon}`;
  };

  const [showStreakSplash, setShowStreakSplash] = useState(() => {
    try {
      const today = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      const lastSeen = localStorage.getItem('streak_splash_seen_date');
      return lastSeen !== today;
    } catch(e) {
      return false;
    }
  });
  const [splashAnim, setSplashAnim] = useState(false);
  const [bannerWallpaper, setBannerWallpaper] = useState<string | null>(() => getLargeItemSync("noto_banner_wallpaper"));

  useEffect(() => {
    getLargeItem('noto_banner_wallpaper').then(setBannerWallpaper);
  }, []);

  useEffect(() => {
    const handleBannerWallpaperChange = () => {
      getLargeItem('noto_banner_wallpaper').then(setBannerWallpaper);
    };
    window.addEventListener('noto_banner_wallpaper_changed', handleBannerWallpaperChange);
    return () => window.removeEventListener('noto_banner_wallpaper_changed', handleBannerWallpaperChange);
  }, []);

  useEffect(() => {
    if (showStreakSplash) {
      try {
        const today = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        localStorage.setItem('streak_splash_seen_date', today);
      } catch(e) {}
      const enterTimer = setTimeout(() => setSplashAnim(true), 50);
      return () => {
        clearTimeout(enterTimer);
      };
    }
  }, [showStreakSplash]);
  
  const [showTimer, setShowTimer] = useState(false);
  const [timerDuration, setTimerDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [hideChallenge, setHideChallenge] = useState(() => {
    try {
      const today = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      const hideDate = localStorage.getItem('noto_hide_challenge_date');
      return hideDate === today;
    } catch (e) {
      return false;
    }
  });

  const handleHideChallenge = () => {
    setHideChallenge(true);
    try {
      const today = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      localStorage.setItem('noto_hide_challenge_date', today);
    } catch (e) {}
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(timerDuration);
  };
  
  const handleSetDuration = (mins: number) => {
    if (!isTimerRunning) {
      const newDuration = mins * 60;
      setTimerDuration(newDuration);
      setTimeLeft(newDuration);
    }
  };
  
  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];

  const { pinnedNotes, pinnedTasks, disciplineTask, todayTasks, activeTasksCount, totalTodayCount, progressPercent } = useMemo(() => {
    const pNotes = (notes || []).filter(n => n && n.pinned && !n.isArchived);
    const pTasks = (tasks || []).filter(t => t && t.pinned && !t.isDiscipline && !t.deleted);
    const dTask = (tasks || []).find(t => t && t.isDiscipline && !t.completed && !t.deleted);

    const isToday = (t: any) => t?.date === todayStr || t?.date === 'Hari ini' || t?.date === 'Hari Ini' || t?.repeat === 'daily';
    
    const tTasks = (tasks || []).filter(t => t && isToday(t) && !t.isDiscipline && !t.deleted);
    const activeCount = tTasks.filter(t => !t.completed).length;
    const totalCount = tTasks.length;
    const pPercent = totalCount === 0 ? 0 : Math.round(((totalCount - activeCount) / totalCount) * 100);

    return {
      pinnedNotes: pNotes,
      pinnedTasks: pTasks,
      disciplineTask: dTask,
      todayTasks: tTasks.slice(0, 3),
      activeTasksCount: activeCount,
      totalTodayCount: totalCount,
      progressPercent: pPercent
    };
  }, [tasks, notes]);

  const handleCreateNote = () => {
    const locale = lang === 'en' ? 'en-US' : 'id-ID';
    onOpenNote({
      id: generateId(),
      title: '',
      content: '',
      date: new Date().toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }),
      tags: []
    });
  };

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [hasSeenUpdate300, setHasSeenUpdate121] = useState(() => {
    try {
      return localStorage.getItem('noto_update_3_0_0') === 'true';
    } catch(e) {
      return true; // Skip if fails
    }
  });
  const [showDailyAd, setShowDailyAd] = useState(() => {
    try {
      const today = new Date().toDateString();
      const lastDate = localStorage.getItem('noto_ad_date');
      const adCount = parseInt(localStorage.getItem('noto_ad_count') || '0', 10);
      
      if (lastDate !== today) {
        return true;
      }
      return adCount < 2;
    } catch(e) {
      return false; // Skip ad if errors out
    }
  });

  const handleCloseAd = () => {
    try {
      const today = new Date().toDateString();
      const lastDate = localStorage.getItem('noto_ad_date');
      let currentCount = parseInt(localStorage.getItem('noto_ad_count') || '0', 10);
      
      if (lastDate !== today) {
         localStorage.setItem('noto_ad_date', today);
         localStorage.setItem('noto_ad_count', '1');
      } else {
         localStorage.setItem('noto_ad_count', (currentCount + 1).toString());
      }
    } catch(e) {}
    
    setShowDailyAd(false);
  };

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);



  return (
    <div className="flex flex-col h-full font-sans text-slate-200 relative">
      {/* Streak Splash Overlay */}
      <AnimatePresence>
        {showStreakSplash && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md cursor-pointer p-4"
            onClick={() => {
              setSplashAnim(false);
              setTimeout(() => setShowStreakSplash(false), 200);
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-[2.5rem] p-10 flex flex-col items-center justify-center relative shadow-2xl w-full max-w-sm overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Background Glow */}
              <div className="absolute top-0 left-0 right-0 h-40 bg-orange-500/20 blur-[50px] pointer-events-none" />

              {/* Flame Icon */}
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-24 h-24 bg-gradient-to-br from-orange-400/20 to-red-500/10 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner ring-1 ring-orange-500/30 relative z-10"
              >
                <Flame className="w-12 h-12 text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.6)]" />
              </motion.div>
              
              {/* Streak Number */}
              <h1 className="text-[5rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-orange-200 leading-none tracking-tighter mb-2 z-10 drop-shadow-sm">
                {streak}
              </h1>
              
              <div className="text-orange-400 font-black uppercase tracking-[0.2em] text-sm mb-6 z-10 bg-orange-500/10 px-5 py-2 rounded-full ring-1 ring-orange-500/20 shadow-sm">
                {t('streak')}
              </div>
              
              <div className="text-slate-300 font-medium text-[15px] text-center mb-10 px-4 z-10 leading-relaxed">
                {t('streakKeep')}
              </div>
              
              <button 
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white shadow-lg shadow-orange-500/25 rounded-2xl py-4 font-bold transition-all hover:scale-[1.02] active:scale-95 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setSplashAnim(false);
                  setTimeout(() => setShowStreakSplash(false), 200);
                }}
              >
                {t('close')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="flex-none min-h-[4rem] pt-[env(safe-area-inset-top)] border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer group p-2 -ml-2"
          onClick={() => onNavigate('settings')}
        >
           <img src="/icon.png" alt="Noto Logo" className="w-6 h-6 rounded-md opacity-90 group-hover:opacity-100 transition-opacity" />
           <span className="font-black text-2xl tracking-tighter text-slate-50 group-hover:text-indigo-300 transition-colors">
              NOTO
           </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button className="p-3 text-slate-400 hover:text-emerald-400 transition-colors relative" onClick={() => onNavigate('finance')} title={t('financeMenu') as string}>
            <Wallet className="w-5 h-5" />
          </button>
          <button className="p-3 text-slate-400 hover:text-indigo-400 transition-colors" onClick={() => setShowTimer(true)}>
            <Clock className="w-5 h-5" />
          </button>
          <button className="p-3 -mr-2 text-slate-400 hover:text-slate-50 transition-colors relative" onClick={() => setShowNotificationModal(true)}>
            <Bell className="w-5 h-5" />
            {!hasSeenUpdate300 && <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border border-slate-900"></span>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar pb-32 w-full max-w-lg mx-auto">
        {/* Greeting & Focus Card */}
        <div 
          style={bannerWallpaper ? { backgroundImage: `url(${bannerWallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
          className="relative w-full rounded-[2rem] bg-gradient-to-br from-indigo-500 to-violet-600 p-6 sm:p-8 flex flex-col justify-between mb-8 text-white shadow-lg shadow-indigo-500/20 overflow-hidden"
        >
          {bannerWallpaper && (
            <div className="absolute inset-0 bg-slate-950/35 backdrop-blur-[0.5px] z-0 pointer-events-none" />
          )}
          {/* Subtle decoration elements */}
          {!bannerWallpaper && (
            <>
              <div className="absolute -top-16 -right-16 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />
            </>
          )}
          
          <div className="relative z-10 flex justify-between items-center mb-6 gap-2 sm:gap-3">
            <div className="flex gap-2 sm:gap-4 items-center flex-1 min-w-0">
              {currentUser.avatarUrl === 'indexeddb:user_avatar' ? (
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 border-white/30 shadow-md shrink-0 bg-slate-800/50 animate-pulse">
                </div>
              ) : currentUser.avatarUrl ? (
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 border-white/30 shadow-md shrink-0">
                  <img src={currentUser.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                </div>
              ) : null}

              <div className="flex-1 min-w-0">
                <p className="text-indigo-100 text-[10px] sm:text-[11px] font-bold tracking-widest uppercase mb-0.5 sm:mb-1 drop-shadow-sm truncate">{getGreeting()}</p>
                <h2 className="text-xl sm:text-3xl font-black mb-0.5 sm:mb-1 tracking-tight text-white drop-shadow-sm truncate">{t('focusToday')}</h2>
                <p className="text-indigo-50 text-xs sm:text-sm font-medium mt-1 sm:mt-2 flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 shadow-[0_0_8px_rgba(253,224,71,0.8)]"></span>
                  <span className="truncate">{activeTasksCount} {t('remainingTask')}</span>
                </p>
              </div>
            </div>
            
            {/* Streak Badge */}
            <div 
              onClick={() => setShowStreakSplash(true)}
              className="flex-none flex flex-col items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl px-3 py-2 sm:px-5 sm:py-4 cursor-pointer transition-all hover:scale-105 shadow-sm" 
              title={`${streak} hari berturut-turut!`}
            >
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 fill-orange-400 drop-shadow-sm mb-1" />
              <span className="text-lg sm:text-xl font-black text-white leading-none mb-0.5 sm:mb-1">{streak}</span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-indigo-100 opacity-90">Streak</span>
            </div>
          </div>
          
          <div className="relative z-10 w-full">
            <div className="flex justify-between items-end mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-100">Progress</span>
              <span className="text-xs font-black text-white">{progressPercent}%</span>
            </div>
            <div className="h-2.5 w-full bg-black/20 rounded-full overflow-hidden shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" 
              />
            </div>
          </div>
        </div>

        {/* Challenge Card */}
        {!hideChallenge && (
          <div className="mb-8 pl-4 border-l-2 border-indigo-500/40 relative group py-1">
            <p className="text-slate-400 text-xs italic leading-relaxed pr-8">
              {lang === 'id' 
                ? '"Riset menunjukkan sekitar 85–90% pengguna berhenti menggunakan aplikasi produktivitas setelah minggu pertama. Mari kita lihat... apakah kamu akan menjadi bagian dari mereka?"' 
                : '"Research shows around 85–90% of users stop using productivity apps after the first week. Let\'s see... will you be part of them?"'}
            </p>
            <button 
              onClick={handleHideChallenge}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded-full hover:bg-slate-850"
              title={lang === 'id' ? 'Sembunyikan' : 'Hide'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Mood Tracker */}
        <div className="mb-8 rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              {t('dailyMood') || 'Mood Hari Ini'}
            </h3>
          </div>
          <div className="flex items-center justify-between gap-1 xs:gap-1.5 sm:gap-2">
            {[
              { id: 'excellent', label: 'Sangat Baik', colors: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20' },
              { id: 'good', label: 'Baik', colors: 'bg-teal-500/10 text-teal-400 border-teal-500/30 hover:bg-teal-500/20' },
              { id: 'neutral', label: 'Biasa', colors: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20' },
              { id: 'bad', label: 'Buruk', colors: 'bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20' },
              { id: 'terrible', label: 'Sangat Buruk', colors: 'bg-rose-500/10 text-rose-500 border-rose-500/30 hover:bg-rose-500/20' }
            ].map(m => {
              const currentMood = (moods || []).find(x => x && x.date === todayStr)?.mood;
              const isSelected = currentMood === m.id;
              const notSelectedOpacity = currentMood && !isSelected ? 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100' : '';
              
              return (
                <button
                  key={m.id}
                  onClick={() => setMood(todayStr, m.id as any)}
                  className={`flex-1 flex flex-col items-center justify-center py-2 px-0.5 xs:py-2.5 xs:px-1 sm:p-3 rounded-2xl border-2 font-bold transition-all disabled:opacity-50 ${m.colors} ${isSelected ? 'scale-105 shadow-md border-current bg-opacity-20' : 'border-transparent'} ${notSelectedOpacity}`}
                  title={m.label}
                >
                  <div className={`${isSelected ? 'mb-1.5' : ''} transition-all`}>{getMoodIcon(m.id, isSelected ? "w-7 h-7" : "w-6 h-6")}</div>
                  {isSelected && <span className="text-[8px] xs:text-[9px] whitespace-nowrap text-current uppercase tracking-wider truncate max-w-full px-0.5">{m.label}</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Target Disiplin */}
        {disciplineTask && disciplineTask.pinned && (
          <section className="mb-5 bg-gradient-to-br from-indigo-500/10 via-slate-900 to-slate-900 border border-indigo-500/20 p-5 rounded-3xl shadow-sm relative overflow-hidden group cursor-pointer" onClick={() => onNavigate('tasks')}>
            <div className="absolute -top-10 -right-10 p-6 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity rotate-12 pointer-events-none">
              <Target className="w-40 h-40 text-indigo-400" />
            </div>
            
            <div className="flex justify-between items-center mb-4 relative z-10">
               <h3 className="text-lg font-black text-slate-50 flex items-center gap-2">
                  <Target className={`w-5 h-5 text-indigo-400 drop-shadow-sm`} />
                  {lang === 'id' ? 'Target Disiplin' : 'Discipline Target'}
               </h3>
               <span className="text-[10px] font-bold uppercase tracking-widest bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/20">
                 {lang === 'id' ? 'Fokus' : 'Focus'}
               </span>
            </div>
            
            <div className="relative z-10 bg-slate-950/40 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
               <div className={`flex-1 ${disciplineTask.completed ? 'opacity-50' : ''}`}>
                  <h4 className={`text-base font-bold ${disciplineTask.completed ? 'text-slate-400 line-through' : 'text-slate-100'} leading-snug`}>
                    {disciplineTask.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-400" /> 
                      {disciplineTask.disciplineData?.dailyCheckins?.length || 0} {lang === 'id' ? 'Hari' : 'Days'}
                    </span>
                    {disciplineTask.disciplineData?.targetDate && (
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                         • Target: {disciplineTask.disciplineData.targetDate}
                      </span>
                    )}
                  </div>
               </div>
               
               <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const d = disciplineTask.disciplineData || {};
                    const today = new Date().toISOString().split('T')[0];
                    const checkins = d.dailyCheckins || [];
                    if (!checkins.includes(today)) {
                      updateTask({ ...disciplineTask, disciplineData: { ...d, dailyCheckins: [...checkins, today] } });
                      checkInDaily();
                    }
                  }}
                  disabled={disciplineTask.disciplineData?.dailyCheckins?.includes(new Date().toISOString().split('T')[0])}
                  className={`flex-none px-3 py-2 rounded-xl font-bold text-[11px] transition-all ${
                    disciplineTask.disciplineData?.dailyCheckins?.includes(new Date().toISOString().split('T')[0])
                      ? 'bg-slate-800/80 text-slate-400 cursor-not-allowed border border-slate-800'
                      : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 active:scale-95'
                  }`}
                >
                  {disciplineTask.disciplineData?.dailyCheckins?.includes(new Date().toISOString().split('T')[0]) 
                    ? (lang === 'id' ? 'Selesai' : 'Done') 
                    : (lang === 'id' ? 'Check-in' : 'Check-in')}
               </button>
            </div>
          </section>
        )}

        {/* Prioritas Utama */}
        <section className="mb-5 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-black text-slate-50 flex items-center gap-2">
                <Pin className={`w-5 h-5 text-orange-400 fill-orange-400 drop-shadow-sm`} />
                {t('topPriority')}
             </h3>
             <button onClick={() => { onNavigate('tasks'); }} className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-full transition-colors">{t('allTasks') || 'Semua'}</button>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {pinnedNotes.length === 0 && pinnedTasks.length === 0 && (
              <p className="text-[11px] text-slate-400 font-medium p-4 text-center">
                {t('noPriority')}
              </p>
            )}

            {pinnedTasks.length > 0 && (
              <div className="bg-slate-800/30 border border-slate-800/60 rounded-2xl p-4 flex flex-col gap-2 mb-2">
                 <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1"><CheckSquare className="w-2.5 h-2.5" /> {t('priorityTasks')}</h4>
                 {pinnedTasks.map((task, i) => (
                   <div key={task.id} className={`flex items-start gap-2.5 group border-slate-800 pb-2 cursor-pointer ${i === pinnedTasks.length - 1 ? '' : 'border-b mt-1.5 -mb-1'}`} onClick={() => toggleTask(task.id)}>
                     <div className="p-3 -ml-3 rounded-full flex-none flex items-center justify-center transition-colors">
                       <button className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center flex-none transition-colors ${task.completed ? 'border-indigo-500 bg-indigo-500' : 'border-slate-700 group-hover:border-indigo-500'}`}>
                         {task.completed && <div className="w-2 h-2 rounded-[2px] bg-white" />}
                       </button>
                     </div>
                     <div className={`flex-1 ${task.completed ? 'opacity-50' : ''}`}>
                        <h4 className={`text-sm font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-50'}`}>{task.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <span>{task.date && task.date.includes('-') && task.date !== new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0] ? `${task.date} • ` : ''}{task.time}</span>
                            {task.alarmTime && (
                              <span className="flex items-center gap-0.5 ml-1 text-slate-400 bg-slate-800/80 px-1 py-0.5 rounded font-bold">
                                <Bell className="w-2.5 h-2.5" />
                                {task.alarmTime}
                              </span>
                            )}
                          </p>
                          {task.repeat === 'daily' && (
                            <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 text-indigo-400 bg-indigo-500/10 flex items-center gap-1">
                              <Repeat className="w-2.5 h-2.5" />
                              {lang === 'id' ? 'Tiap Hari' : 'Daily'}
                            </span>
                          )}
                        </div>
                     </div>
                     <button 
                       onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} 
                       className="p-3 -mr-2 flex-shrink-0 text-slate-400 hover:text-red-400 transition-colors flex items-center justify-center"
                     >
                       <X className="w-5 h-5" />
                     </button>
                   </div>
                 ))}
              </div>
            )}

            {pinnedNotes.length > 0 && (
              <div className="flex flex-col gap-3 mt-1">
                 <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1"><FileText className="w-3 h-3" /> {t('priorityNotes')}</h4>
                {pinnedNotes.map((note) => (
                  <div 
                    key={note.id} 
                    onClick={() => onOpenNote(note)}
                    role="button"
                    className="w-full text-left flex flex-col items-start gap-4 p-4 bg-slate-800/30 border border-slate-800/60 rounded-2xl hover:bg-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer group"
                  >
                    <div className="flex-1 overflow-hidden w-full min-w-0 flex flex-col">
                       <div className="flex justify-between items-start mb-2">
                          <div className="flex gap-1 overflow-x-hidden min-w-0" onClick={(e) => e.stopPropagation()}>
                            {(note.tags || []).slice(0,2).map(tag => (
                              <span key={tag} onClick={(e) => {
                                 e.stopPropagation();
                                 setSearchQuery(tag);
                                 onNavigate('search');
                              }} className="px-2 py-1 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-colors text-[9px] font-bold rounded uppercase tracking-wider cursor-pointer truncate max-w-full">{tag.replace('#', '')}</span>
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono flex-shrink-0 ml-2">{note.date}</span>
                       </div>
                       <h4 className="font-bold text-slate-50 leading-tight mb-1 truncate w-full">{note.title || 'Untitled Note'}</h4>
                       <p className="text-xs text-slate-400 line-clamp-2 break-words">{note.content ? note.content.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>?/gm, '').replace(/&nbsp;?/gi, ' ').replace(/&bnsp;?/gi, ' ').replace(/\s+/g, ' ').trim() : '...'}</p>
                       {note.reminder && (
                         <div className="flex items-center gap-1.5 mt-2.5 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/10 rounded-md w-fit text-indigo-400 text-[10px] font-bold">
                           <Bell className="w-3 h-3 text-indigo-400 animate-pulse" />
                           <span>{formatReminderDate(note.reminder, lang)}</span>
                         </div>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* FAB Add */}
      <button onClick={handleCreateNote} className="absolute bottom-8 right-6 w-12 h-12 sm:w-16 sm:h-16 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-indigo-600/30 transition-transform active:scale-95 z-50">
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* Timer Modal */}
      <AnimatePresence>
        {showTimer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
          >
             <motion.div 
               initial={{ scale: 0.95, y: 10, opacity: 0 }}
               animate={{ scale: 1, y: 0, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0, y: 10 }}
               className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl relative overflow-hidden"
             >
                {/* Subtle gradient bg */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50 to-transparent pointer-events-none" />

                <button 
                  onClick={() => setShowTimer(false)}
                  className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 z-10"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="flex flex-col items-center mb-8 relative z-10">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-indigo-500/10 text-indigo-400 rounded-3xl mb-4 border border-indigo-500/20 shadow-sm">
                    <Clock className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-slate-50">{t('focusTimer')}</h3>
                </div>

                <div className="text-6xl font-mono font-black text-center text-slate-100 tracking-tighter mb-8 relative z-10">
                  {formatTime(timeLeft)}
                </div>
                
                <div className="flex flex-col gap-4 relative z-10">
                  {!isTimerRunning ? (
                    <div className="flex justify-center gap-2 w-full">
                      {[15, 25, 45, 60].map(mins => (
                        <button
                          key={mins}
                          onClick={() => handleSetDuration(mins)}
                          className={`flex-1 py-3 rounded-2xl text-xs font-bold transition-all ${
                            timerDuration === mins * 60 
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                              : 'bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="h-10 w-full"></div>
                  )}

                  <div className="flex gap-2 w-full mt-2">
                    <button 
                      onClick={toggleTimer} 
                      className={`flex-1 py-4 rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        isTimerRunning 
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/30'
                      }`}
                    >
                      {isTimerRunning ? <><Pause className="w-5 h-5" /> {t('pause')}</> : <><Play className="w-5 h-5 ml-1" /> {t('start')}</>}
                    </button>
                    <button 
                      onClick={resetTimer} 
                      className="w-14 py-4 rounded-2xl bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200 font-bold transition-colors flex items-center justify-center active:scale-95"
                      title="Reset"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily Ad Modal */}
      {/* Daily Ad Modal */}
      <AnimatePresence>
        {showDailyAd && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-[110] flex flex-col items-center justify-center p-4" 
            onClick={handleCloseAd}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 w-full max-w-sm flex flex-col items-center text-center shadow-2xl relative overflow-hidden" 
              onClick={e => e.stopPropagation()}
            >
              {/* Subtle ambient light */}
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
            
              <button 
                onClick={handleCloseAd}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 transition-colors z-10 bg-slate-800 hover:bg-slate-700 rounded-full p-1.5"
                title={t('close') as string}
              >
                <X className="w-5 h-5" />
              </button>
              
              {currentUser.avatarUrl === 'indexeddb:user_avatar' ? (
                <div className="w-20 h-20 bg-slate-800/50 rounded-3xl mb-6 z-10 shadow-sm border border-indigo-500/20 animate-pulse">
                </div>
              ) : currentUser.avatarUrl ? (
                <div className="w-20 h-20 rounded-3xl overflow-hidden mb-6 z-10 shadow-sm border border-indigo-500/20 relative">
                  <img src={currentUser.avatarUrl} alt="Welcome Avatar" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-indigo-500/10 text-indigo-400 rounded-3xl flex items-center justify-center mb-6 z-10 shadow-sm border border-indigo-500/20">
                   <Sparkles className="w-10 h-10" />
                </div>
              )}
              
              <h3 className="text-2xl font-black text-slate-50 mb-3 tracking-tight z-10">
                {lang === 'id' ? 'Selamat Datang' : 'Welcome'}
              </h3>
              
              <p className="text-[15px] text-slate-400 mb-8 leading-relaxed font-medium z-10 px-2">
                {lang === 'id' ? 'Mari mulai hari dengan niat yang baik. Fokus, selesaikan tugasmu, dan nikmati prosesnya.' : 'Let\'s start the day with good intentions. Focus, complete your tasks, and enjoy the process.'}
              </p>
              
              <div className="bg-indigo-500/10 rounded-2xl p-5 w-full mb-8 relative border border-indigo-500/20 z-10">
                 <p className="text-indigo-300 font-medium text-[14px] leading-relaxed italic">
                   {lang === 'id' ? '"Ini hanyalah sebuah aplikasi. yang bisa merubah mu hanyalah dirimu sendiri"' : '"This is just an app. The only one who can change you is yourself."'}
                 </p>
              </div>
              
              <button 
                onClick={handleCloseAd}
                className="w-full py-4 rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-lg shadow-indigo-600/30 active:scale-95 flex justify-center items-center gap-2 z-10"
              >
                <span className="tracking-wide">{lang === 'id' ? 'Mulai Sekarang' : 'Start Now'}</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Modal */}
      <AnimatePresence>
        {showNotificationModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4" 
            onClick={() => {
              setShowNotificationModal(false);
              if (!hasSeenUpdate300) {
                try { localStorage.setItem('noto_update_3_0_0', 'true'); } catch(e){}
                setHasSeenUpdate121(true);
              }
            }}
          >
             <motion.div 
               initial={{ scale: 0.95, y: 10, opacity: 0 }}
               animate={{ scale: 1, y: 0, opacity: 1 }}
               exit={{ scale: 0.95, opacity: 0, y: 10 }}
               className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 w-full max-w-sm flex flex-col shadow-2xl relative items-center text-center overflow-hidden" 
               onClick={e => e.stopPropagation()}
             >
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
                
                <button 
                  onClick={() => {
                    setShowNotificationModal(false);
                    if (!hasSeenUpdate300) {
                      try { localStorage.setItem('noto_update_3_0_0', 'true'); } catch(e){}
                      setHasSeenUpdate121(true);
                    }
                  }}
                  className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 transition-colors z-10 bg-slate-800 hover:bg-slate-700 rounded-full p-1.5"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className={`w-12 h-12 sm:w-16 sm:h-16 ${!hasSeenUpdate300 ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'} rounded-3xl flex items-center justify-center mb-6 z-10 shadow-sm`}>
                  <Bell className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-50 mb-3 z-10 tracking-tight">{!hasSeenUpdate300 ? t('appUpdateTitle') : t('noNotification')}</h3>
                <p className="text-[15px] text-slate-400 mb-8 font-medium z-10 leading-relaxed px-2">{!hasSeenUpdate300 ? t('appUpdateBody') : t('allNotificationRead')}</p>
                <button 
                  onClick={() => {
                    setShowNotificationModal(false);
                    if (!hasSeenUpdate300) {
                      try { localStorage.setItem('noto_update_3_0_0', 'true'); } catch(e){}
                      setHasSeenUpdate121(true);
                    }
                  }}
                  className="w-full py-4 rounded-2xl font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors active:scale-95 shadow-lg shadow-indigo-600/20 z-10"
                >
                  {t('close')}
                </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
