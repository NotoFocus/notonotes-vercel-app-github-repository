import React, { useState, useEffect } from 'react';
import { Plus, Feather, CheckSquare, Bell, Clock, Play, Pause, RotateCcw, X, Pin, FileText, Trash2, Flame, Sparkles, ChevronRight } from 'lucide-react';
import { Note, Task } from '../types';
import { useAppStore } from '../store';
import { useTranslation } from '../translations';
import { motion, AnimatePresence } from 'motion/react';

interface HomeProps {
  isDarkMode: boolean;
  toggleDark: () => void;
  onOpenNote: (note: Note) => void;
  onNavigate: (screen: 'home' | 'tasks' | 'search' | 'calendar' | 'settings') => void;
}

export default function HomeScreen({ isDarkMode, toggleDark, onOpenNote, onNavigate }: HomeProps) {
  const { notes, tasks, user, updateUser, toggleTask, deleteTask, deleteNote, setSearchQuery, streak, lang } = useAppStore();
  const t = useTranslation(lang);
  
  // Use the current user from the store instead of static data
  const currentUser = user;
  
  const getGreeting = () => {
    return `${t('hello')} ${currentUser.name || 'Kawan'}`;
  };

  const [showStreakSplash, setShowStreakSplash] = useState(() => !sessionStorage.getItem('streak_splash_seen'));
  const [splashAnim, setSplashAnim] = useState(false);

  useEffect(() => {
    if (showStreakSplash) {
      sessionStorage.setItem('streak_splash_seen', 'true');
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

  const pinnedNotes = notes.filter(n => n.pinned);
  const pinnedTasks = tasks.filter(t => t.pinned);

  const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  const isToday = (d: string) => d === todayStr || d === 'Hari ini' || d === 'Hari Ini';
  
  const todayTasks = tasks.filter(t => isToday(t.date)).slice(0, 3);
  const activeTasksCount = tasks.filter(t => isToday(t.date) && !t.completed).length;
  const totalTodayCount = tasks.filter(t => isToday(t.date)).length;
  const progressPercent = totalTodayCount === 0 ? 0 : Math.round(((totalTodayCount - activeTasksCount) / totalTodayCount) * 100);

  const handleCreateNote = () => {
    const locale = lang === 'en' ? 'en-US' : 'id-ID';
    onOpenNote({
      id: crypto.randomUUID(),
      title: '',
      content: '',
      date: new Date().toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }),
      tags: []
    });
  };

  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const particleData = React.useMemo(() => {
    return [...Array(15)].map((_, i) => ({
      id: i,
      left: 10 + Math.random() * 80,
      top: 10 + Math.random() * 80,
      dur: 3 + Math.random() * 4,
      del: Math.random() * 2,
      xOffset: (Math.random() - 0.5) * 40,
      size: [2, 3, 4, 1.5, 2.5][i % 5],
      color: ['bg-yellow-400', 'bg-orange-400', 'bg-orange-500', 'bg-indigo-300', 'bg-pink-400'][i % 5]
    }));
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-950 font-sans text-slate-200 relative">
      {/* Streak Splash Overlay */}
      <AnimatePresence>
        {showStreakSplash && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-[200] flex items-center justify-center bg-slate-950/95 cursor-pointer overflow-hidden"
            onClick={() => {
              setSplashAnim(false);
              setTimeout(() => setShowStreakSplash(false), 300);
            }}
          >
            {/* Background Particles */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 1 }}
              className="absolute inset-0 pointer-events-none"
            >
              {particleData.map((p) => (
                <motion.div
                  key={p.id}
                  animate={{ 
                    y: [0, -40, 0],
                    x: [0, p.xOffset, 0],
                    opacity: [0.1, 0.6, 0.1],
                    scale: [1, 1.5, 1]
                  }}
                  transition={{ 
                    duration: p.dur, 
                    repeat: Infinity,
                    delay: p.del,
                    ease: "easeInOut"
                  }}
                  className={`absolute rounded-full ${p.color}`}
                  style={{
                    top: `${p.top}%`,
                    left: `${p.left}%`,
                    width: `${p.size * 4}px`,
                    height: `${p.size * 4}px`,
                    filter: 'blur(2px)'
                  }}
                />
              ))}
            </motion.div>

            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="flex flex-col items-center justify-center relative z-10"
            >
              {/* Glowing orbs */}
              <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] bg-orange-500/20 blur-[50px] rounded-full pointer-events-none"
              />
              
              {/* Flame Icon Container */}
              <div className="relative group">
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10"
                >
                  <Flame className="w-16 h-16 text-orange-500 fill-orange-500 drop-shadow-[0_0_20px_rgba(249,115,22,0.5)]" />
                  <motion.div
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0"
                  >
                    <Flame className="w-16 h-16 text-yellow-300 fill-yellow-300 mix-blend-screen drop-shadow-[0_0_10px_rgba(253,224,71,0.4)]" />
                  </motion.div>
                </motion.div>
                
                {/* Sprinkles around Flame */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-6 pointer-events-none z-0"
                >
                  <Sparkles className="absolute top-2 right-2 w-4 h-4 text-yellow-200 fill-yellow-200 opacity-60 drop-shadow-[0_0_5px_rgba(253,224,71,0.5)]" />
                  <Sparkles className="absolute bottom-4 left-0 w-3 h-3 text-orange-300 fill-orange-300 opacity-60 drop-shadow-[0_0_5px_rgba(249,115,22,0.5)]" />
                </motion.div>
              </div>
              
              {/* Streak Number */}
              <motion.h1 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
                className="text-[64px] font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-orange-100 to-orange-500 leading-none tracking-tighter drop-shadow-[0_5px_15px_rgba(249,115,22,0.3)] mt-2 mb-1"
              >
                {streak}
              </motion.h1>
              
              {/* Text content */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="mt-4 flex flex-col items-center"
              >
                <div className="relative">
                  <div className="relative bg-gradient-to-br from-orange-400 to-orange-600 px-8 py-2.5 rounded-full border border-orange-300/40 shadow-lg overflow-hidden">
                    <motion.div 
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
                      className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg]"
                    />
                    <p className="text-white font-black uppercase tracking-[0.2em] text-lg drop-shadow-md">
                      {t('streak')}!
                    </p>
                  </div>
                </div>
                
                <div className="mt-8 text-center flex flex-col items-center">
                  <div className="text-indigo-50 font-medium text-sm mb-2 flex items-center gap-2 bg-slate-900/60 px-5 py-2 rounded-xl border border-slate-700/50  shadow-lg">
                    <motion.div animate={{ rotate: [0, 20, -20, 0] }} transition={{ duration: 2, repeat: Infinity }}><Sparkles className="w-4 h-4 text-yellow-400" /></motion.div>
                    {t('streakKeep')}
                    <motion.div animate={{ rotate: [0, -20, 20, 0] }} transition={{ duration: 2, repeat: Infinity }}><Sparkles className="w-4 h-4 text-yellow-400" /></motion.div>
                  </div>
                  
                  <motion.button 
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(30, 41, 59, 1)" }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-slate-800/80  border border-slate-700/80 rounded-full px-8 py-3.5 mt-8 flex items-center gap-2 group/btn cursor-pointer shadow-xl hover:shadow-indigo-500/20 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSplashAnim(false);
                      setTimeout(() => setShowStreakSplash(false), 400);
                    }}
                  >
                    <span className="text-slate-300 text-sm uppercase tracking-[0.2em] font-bold">
                      {t('close')}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover/btn:text-white group-hover/btn:translate-x-1 transition-all" />
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="flex-none h-16 border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer group p-2 -ml-2"
          onClick={() => onNavigate('settings')}
        >
           <Feather className="w-6 h-6 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
           <span className="font-black text-2xl tracking-tighter text-slate-50 group-hover:text-indigo-300 transition-colors">
              NOTO
           </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-3 text-slate-400 hover:text-indigo-400 transition-colors" onClick={() => setShowTimer(true)}>
            <Clock className="w-5 h-5" />
          </button>
          <button className="p-3 -mr-2 text-slate-400 hover:text-slate-50 transition-colors relative" onClick={() => setShowNotificationModal(true)}>
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full border border-slate-900"></span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar pb-6">
        {/* Greeting & Focus Card */}
        <div className="relative w-full rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 overflow-hidden shadow-lg mb-8 text-white">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6 gap-4">
              <div className="flex-1">
                <p className="text-indigo-100 text-sm font-medium opacity-90 leading-relaxed mb-2">{getGreeting()}</p>
                <h2 className="text-3xl font-black mb-1 tracking-tight">{t('focusToday')}</h2>
                <p className="text-indigo-200 text-sm font-medium">{activeTasksCount} {t('remainingTask')}</p>
              </div>
              
              {/* Streak Badge */}
              <div 
                onClick={() => setShowStreakSplash(true)}
                className="relative flex-shrink-0 flex flex-col items-center justify-center bg-gradient-to-b from-orange-500/20 to-orange-600/20  border border-orange-400/30 rounded-2xl px-5 py-4 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:scale-105 hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-all cursor-pointer group" 
                title={`${streak} hari berturut-turut!`}
              >
                <Flame className="w-8 h-8 text-orange-400 fill-orange-400 drop-shadow-[0_0_12px_rgba(249,115,22,0.8)] mb-2 group-hover:animate-pulse" />
                <span className="text-4xl font-black text-white leading-none relative z-10 drop-shadow-lg tracking-tighter">{streak}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-orange-200 relative z-10 mt-1 opacity-90">Streak</span>
              </div>
            </div>
            
            <div className="w-full max-w-[200px]">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-100">Progress</span>
                <span className="text-xl font-bold">{progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.6)]" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Prioritas Utama */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold text-slate-50 flex items-center gap-2">
                <Pin className="w-5 h-5 text-orange-400 fill-orange-400" />
                {t('topPriority')}
             </h3>
             <button onClick={() => { setSearchQuery(''); onNavigate('search'); }} className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">{t('allTasks') || 'Semua'}</button>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {pinnedNotes.length === 0 && pinnedTasks.length === 0 && (
              <p className="text-xs text-slate-500 font-medium bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
                {t('noPriority')}
              </p>
            )}

            {pinnedTasks.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-3">
                 <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-1"><CheckSquare className="w-3 h-3" /> {t('priorityTasks')}</h4>
                 {pinnedTasks.map((task, i) => (
                   <div key={task.id} className={`flex items-center gap-3 group border-slate-800 pb-3 cursor-pointer ${i === pinnedTasks.length - 1 ? '' : 'border-b pt-1'}`} onClick={() => toggleTask(task.id)}>
                     <div className="p-2 -ml-2 rounded-full flex-none flex items-center justify-center transition-colors">
                       <button className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-none transition-colors ${task.completed ? 'border-indigo-500 bg-indigo-500' : 'border-slate-700 group-hover:border-indigo-500'}`}>
                         {task.completed && <div className="w-2 h-2 rounded-sm bg-white" />}
                       </button>
                     </div>
                     <div className={`flex-1 ${task.completed ? 'opacity-50' : ''}`}>
                        <h4 className={`text-sm font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-50'}`}>{task.title}</h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">
                          {task.date && task.date.includes('-') && task.date !== new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0] ? `${task.date} • ` : ''}{task.time}
                        </p>
                     </div>
                     <button 
                       onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} 
                       className="opacity-100 p-3 -mr-2 flex-shrink-0 text-slate-500 hover:text-red-400 transition-colors"
                     >
                       <Trash2 className="w-5 h-5" />
                     </button>
                   </div>
                 ))}
              </div>
            )}

            {pinnedNotes.length > 0 && (
              <div className="flex flex-col gap-3 mt-2">
                 <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1"><FileText className="w-3 h-3" /> {t('priorityNotes')}</h4>
                {pinnedNotes.map((note) => (
                  <div 
                    key={note.id} 
                    onClick={() => onOpenNote(note)}
                    role="button"
                    className="w-full text-left flex items-start gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer group"
                  >
                    <div className="flex-1 overflow-hidden">
                       <div className="flex justify-between items-start mb-2">
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            {(note.tags || []).slice(0,2).map(tag => (
                              <span key={tag} onClick={(e) => {
                                 e.stopPropagation();
                                 setSearchQuery(tag);
                                 onNavigate('search');
                              }} className="px-2 py-1 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-colors text-[9px] font-bold rounded uppercase tracking-wider cursor-pointer">{tag.replace('#', '')}</span>
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono flex-shrink-0 ml-2">{note.date}</span>
                       </div>
                       <h4 className="font-bold text-slate-50 leading-tight mb-1 truncate">{note.title || 'Untitled Note'}</h4>
                       <p className="text-xs text-slate-500 line-clamp-1">{note.content ? note.content.replace(/<[^>]*>?/gm, '') : '...'}</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }} 
                      className="p-3 -mr-2 opacity-100 text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                       <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>

      {/* FAB Add */}
      <button onClick={handleCreateNote} className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 transition-transform active:scale-95 z-50">
        <Plus className="w-6 h-6 stroke-[2]" />
      </button>

      {/* Timer Modal */}
      {showTimer && (
        <div className="absolute inset-0 bg-slate-950/60  z-[100] flex items-center justify-center p-4">
           <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-xs shadow-2xl relative">
              <button 
                onClick={() => setShowTimer(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-300">{t('focusTimer')}</h3>
              </div>

              <div className="text-5xl font-mono font-bold text-center text-slate-50 tracking-tight mb-6 mt-2">
                {formatTime(timeLeft)}
              </div>
              
              <div className="flex flex-col gap-4">
                {!isTimerRunning ? (
                  <div className="flex justify-center gap-2 w-full">
                    {[15, 25, 45, 60].map(mins => (
                      <button
                        key={mins}
                        onClick={() => handleSetDuration(mins)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          timerDuration === mins * 60 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-50'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="h-7 w-full"></div>
                )}

                <div className="flex gap-2 w-full">
                  <button 
                    onClick={toggleTimer} 
                    className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                      isTimerRunning 
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-500'
                    }`}
                  >
                    {isTimerRunning ? <><Pause className="w-4 h-4" /> {t('pause')}</> : <><Play className="w-4 h-4" /> {t('start')}</>}
                  </button>
                  <button 
                    onClick={resetTimer} 
                    className="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 hover:text-slate-50 font-bold hover:bg-slate-700 transition-colors flex items-center justify-center"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="absolute inset-0 bg-slate-950/95 z-[100] flex flex-col items-center justify-center animate-in fade-in duration-200 p-6" onClick={() => setShowNotificationModal(false)}>
           <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-sm flex flex-col shadow-2xl relative items-center text-center" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setShowNotificationModal(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-50 mb-2">{t('noNotification')}</h3>
              <p className="text-sm text-slate-400 mb-6">{t('allNotificationRead')}</p>
              <button 
                onClick={() => setShowNotificationModal(false)}
                className="w-full py-4 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
              >
                {t('close')}
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
