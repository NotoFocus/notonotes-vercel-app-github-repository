import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Activity, Flame, Repeat, Calendar, CheckCircle2, Smile, Clock, X, TrendingUp, Plus, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { useAppStore } from '../store';
import { generateId } from '../utils';
import { useTranslation } from '../translations';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const getLocalIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLocalDateFromStr = (dateStr: string) => {
  if (!dateStr) return new Date();
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
};

interface HabitStats {
  createdStr: string;
  diffDays: number;
  completedCount: number;
  missedCount: number;
  compRate: number;
  hStreak: number;
}

const getHabitStats = (task: any, todayStr: string, getTaskDateStr: (d: string) => string): HabitStats => {
  const rawCreated = task.createdAt || getTaskDateStr(task.date);
  let createdDateObj: Date;
  if (typeof rawCreated === 'number') {
    createdDateObj = new Date(rawCreated);
  } else {
    createdDateObj = getLocalDateFromStr(rawCreated);
  }
  const createdStr = getLocalIsoDate(createdDateObj);

  const start = getLocalDateFromStr(createdStr);
  const end = getLocalDateFromStr(todayStr);
  
  // reset hours to avoid DST anomalies during date difference calculations
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  let diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (diffDays < 1) diffDays = 1;

  const completedDatesArr = task.isDiscipline ? (task.disciplineData?.dailyCheckins || []) : (task.completedDates || []);
  // Only count completions that occurred between createdStr and todayStr (inclusive)
  const validCompletions = completedDatesArr.filter((d: string) => d >= createdStr && d <= todayStr);
  const completedCount = validCompletions.length;
  const missedCount = Math.max(0, diffDays - completedCount);
  const compRate = Math.round((completedCount / diffDays) * 100);

  // Calculate Streak
  let hStreak = 0;
  const datesSet = new Set(completedDatesArr);
  const isCompletedToday = datesSet.has(todayStr);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalIsoDate(yesterday);
  const isCompletedYesterday = datesSet.has(yesterdayStr);

  if (isCompletedToday) {
    hStreak = 1;
    const checkDate = new Date();
    while (true) {
      checkDate.setDate(checkDate.getDate() - 1);
      const checkStr = getLocalIsoDate(checkDate);
      if (datesSet.has(checkStr)) {
        hStreak++;
      } else {
        break;
      }
    }
  } else if (isCompletedYesterday) {
    hStreak = 1;
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - 1); // Yesterday
    while (true) {
      checkDate.setDate(checkDate.getDate() - 1);
      const checkStr = getLocalIsoDate(checkDate);
      if (datesSet.has(checkStr)) {
        hStreak++;
      } else {
        break;
      }
    }
  }

  return {
    createdStr,
    diffDays,
    completedCount,
    missedCount,
    compRate,
    hStreak
  };
};

export default function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'calendar' | 'stats'>('calendar');
  const [selectedDetailTaskId, setSelectedDetailTaskId] = useState<string | null>(null);
  const [selectedDetailModalTab, setSelectedDetailModalTab] = useState<'info' | 'analytics'>('info');
  const [habitCalendarDate, setHabitCalendarDate] = useState(new Date());
  const { tasks, moods, lang, streak, setMood, toggleTask, addTask } = useAppStore();
  const t = useTranslation(lang);

  // Quick task state
  const [isAddingQuickTask, setIsAddingQuickTask] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskPriority, setQuickTaskPriority] = useState<'Tinggi' | 'Sedang' | 'Rendah'>('Sedang');
  const [quickTaskRepeat, setQuickTaskRepeat] = useState<'once' | 'daily'>('once');
  const [quickTaskTime, setQuickTaskTime] = useState('09:00');

  const selectedDetailTask = useMemo(() => {
    return tasks.find(tk => tk.id === selectedDetailTaskId) || null;
  }, [tasks, selectedDetailTaskId]);

  const locale = lang === 'en' ? 'en-US' : 'id-ID';
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2023, 0, 1 + i); // 2023-01-01 is Sunday
    return d.toLocaleDateString(locale, { weekday: 'short' }).charAt(0).toUpperCase();
  });
  
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const [viewType, setViewType] = useState<'Harian' | 'Mingguan' | 'Bulanan' | 'Tahunan'>('Harian');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const getMonthlyAverageMood = () => {
    const monthMoods = (moods || []).filter(m => {
      if (!m || !m.date) return false;
      const d = new Date(m.date);
      return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    if (monthMoods.length === 0) return null;

    const weights: Record<string, number> = {
      'excellent': 5,
      'good': 4,
      'neutral': 3,
      'bad': 2,
      'terrible': 1
    };

    const reverseWeights: Record<number, string> = {
      5: 'excellent',
      4: 'good',
      3: 'neutral',
      2: 'bad',
      1: 'terrible'
    };

    const sum = monthMoods.reduce((acc, curr) => acc + (weights[curr.mood || ''] || 0), 0);
    const avg = Math.round(sum / monthMoods.length);
    return reverseWeights[avg] || null;
  };

  const avgMood = getMonthlyAverageMood();

  const getMoodIcon = (id: string, className = "w-6 h-6") => {
    switch (id) {
      case 'excellent': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>;
      case 'good': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 1 4 1 4-1 4-1"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>;
      case 'neutral': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>;
      case 'bad': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M8 16s1.5-1 4-1 4 1 4 1"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>;
      case 'terrible': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M8 16s1.5-2 4-2 4 2 4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>;
      default: return null;
    }
  };

  const getMoodLabel = (id: string | null) => {
    switch (id) {
       case 'excellent': return lang === 'id' ? 'Sangat Baik' : 'Excellent';
       case 'good': return lang === 'id' ? 'Baik' : 'Good';
       case 'neutral': return lang === 'id' ? 'Biasa' : 'Neutral';
       case 'bad': return lang === 'id' ? 'Buruk' : 'Bad';
       case 'terrible': return lang === 'id' ? 'Sangat Buruk' : 'Terrible';
       default: return lang === 'id' ? 'Tidak Ada Data' : 'No Data';
    }
  };

  const getMoodColorClass = (id: string | null) => {
    switch (id) {
       case 'excellent': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
       case 'good': return 'text-teal-400 bg-teal-500/10 border-teal-500/30';
       case 'neutral': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
       case 'bad': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
       case 'terrible': return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
       default: return 'text-slate-400 bg-slate-800/30 border-slate-700/30';
    }
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const blanks = Array(firstDayOfMonth).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handlePrevMonth = () => {
    const prev = new Date(currentYear, currentMonth - 1, 1);
    setCurrentDate(prev);
    setSelectedDate(prev);
  };
  const handleNextMonth = () => {
    const next = new Date(currentYear, currentMonth + 1, 1);
    setCurrentDate(next);
    setSelectedDate(next);
  };

  const isTodayDate = (day: number) => {
    const today = new Date();
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  const isSelectedDate = (day: number) => {
    return day === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear();
  };

  const handleSelectDay = (day: number) => {
    setSelectedDate(new Date(currentYear, currentMonth, day));
  };

  // Convert selected date to string comparable with task 'date'
  const selectedDateStr = getLocalIsoDate(selectedDate);
  const todayStr = getLocalIsoDate(new Date());
  
  const tmr = new Date();
  tmr.setDate(tmr.getDate() + 1);
  const tomorrowStr = getLocalIsoDate(tmr);

  const getTaskDateStr = (dateVal: string) => {
     if (dateVal === 'Hari ini' || dateVal === 'Hari Ini') return todayStr;
     if (dateVal === 'Besok') return tomorrowStr;
     return dateVal;
  };

  const dayTasks = useMemo(() => {
    return tasks.filter(t => {
      const tDateStr = getTaskDateStr(t.date);
      if (!tDateStr || !tDateStr.includes('-')) return false;
      
      const createdDateStr = t.createdAt || tDateStr;
      
      if (t.repeat === 'daily' || t.isDiscipline) {
        return selectedDateStr >= createdDateStr && selectedDateStr <= todayStr;
      }
      return tDateStr === selectedDateStr;
    });
  }, [tasks, selectedDateStr, todayStr]);

  const { selectedTasks, startOfWeek, endOfWeek } = useMemo(() => {
    const todayDate = new Date();
    const startOfWeek = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0, 0);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day; // Start on Sunday
    startOfWeek.setDate(diff);
    
    const endOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate(), 23, 59, 59, 999);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const sTasks = tasks.filter(t => {
       const tDateStr = getTaskDateStr(t.date);
       if (!tDateStr || !tDateStr.includes('-')) return false;
       
       const createdDateStr = t.createdAt || tDateStr;
       
       const [y, m, d] = tDateStr.split('-').map(Number);
       const tD = new Date(y, m - 1, d, 12, 0, 0, 0); // Noon to avoid timezone shifts
       const [cy, cm, cd] = createdDateStr.split('-').map(Number);
       const cD = new Date(cy, cm - 1, cd, 12, 0, 0, 0); // Noon to avoid timezone shifts

       if (viewType === 'Harian') {
         if ((t.repeat === 'daily' || t.isDiscipline) && selectedDateStr >= createdDateStr && selectedDateStr <= todayStr) return true;
         return tDateStr === selectedDateStr;
       } else if (viewType === 'Mingguan') {
         if (t.repeat === 'daily' || t.isDiscipline) return startOfWeek <= todayDate && endOfWeek >= cD;
         return tD >= startOfWeek && tD <= endOfWeek;
       } else if (viewType === 'Bulanan') {
         if (t.repeat === 'daily' || t.isDiscipline) {
           const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1, 0, 0, 0, 0);
           const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);
           return monthStart <= todayDate && monthEnd >= cD;
         }
         return tD.getMonth() === selectedDate.getMonth() && tD.getFullYear() === selectedDate.getFullYear();
       } else if (viewType === 'Tahunan') {
         if (t.repeat === 'daily' || t.isDiscipline) {
           const yearStart = new Date(selectedDate.getFullYear(), 0, 1, 0, 0, 0, 0);
           const yearEnd = new Date(selectedDate.getFullYear(), 11, 31, 23, 59, 59, 999);
           return yearStart <= todayDate && yearEnd >= cD;
         }
         return tD.getFullYear() === selectedDate.getFullYear();
       }
       return false;
    });
    
    return { selectedTasks: sTasks, startOfWeek, endOfWeek };
  }, [tasks, selectedDate, viewType, selectedDateStr, todayStr, tomorrowStr, getTaskDateStr]);

  const monthNames = Array.from({ length: 12 }, (_, i) => {
    return new Date(2023, i, 1).toLocaleDateString(locale, { month: 'long' });
  });

  const { completedCount, activeCount } = useMemo(() => {
    let completed = 0;
    let active = 0;

    // Helper to get local YYYY-MM-DD string for a Date object
    const getLocalDateStr = (dObj: Date) => {
      return new Date(dObj.getTime() - (dObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    };

    if (viewType === 'Harian') {
      selectedTasks.forEach(tk => {
        if (tk.repeat === 'daily') {
          const compDates = tk.completedDates || [];
          if (compDates.includes(selectedDateStr)) {
            completed++;
          } else {
            if (selectedDateStr === todayStr) {
               if (tk.completed) completed++;
               else active++;
            } else {
               active++;
            }
          }
        } else {
          if (tk.completed) {
            completed++;
          } else {
            active++;
          }
        }
      });
    } else {
      // Determine the range of dates for the period
      let startDate: Date;
      let endDate: Date;

      if (viewType === 'Mingguan') {
        startDate = new Date(startOfWeek);
        endDate = new Date(endOfWeek);
      } else if (viewType === 'Bulanan') {
        startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      } else { // Tahunan
        startDate = new Date(selectedDate.getFullYear(), 0, 1);
        endDate = new Date(selectedDate.getFullYear(), 11, 31);
      }

      // We will iterate through each day in the period (capped up to todayStr so we don't count future active/missed days)
      const currentIter = new Date(startDate);
      const capDateStr = todayStr; // do not calculate future days

      // Ensure we don't loop infinitely in case of timezone/DST edge cases
      const maxDays = viewType === 'Tahunan' ? 366 : (viewType === 'Bulanan' ? 31 : 7);
      let daysCounted = 0;

      while (currentIter <= endDate && daysCounted < maxDays) {
        const iterStr = getLocalDateStr(currentIter);
        
        // Only count up to today
        if (iterStr <= capDateStr) {
          selectedTasks.forEach(tk => {
            const tDateStr = getTaskDateStr(tk.date);
            const createdDateStr = tk.createdAt || tDateStr;

            // If the task wasn't created yet on this day, skip it
            if (iterStr < createdDateStr) {
              return;
            }

            if (tk.repeat === 'daily') {
              // Daily task/habit
              const compDates = tk.completedDates || [];
              if (compDates.includes(iterStr)) {
                completed++;
              } else {
                if (iterStr === todayStr) {
                  if (tk.completed) completed++;
                  else active++;
                } else {
                  active++;
                }
              }
            } else {
              // One-time task
              // It is only relevant on its specific due date (tDateStr)
              if (tDateStr === iterStr) {
                if (tk.completed) {
                  completed++;
                } else {
                  active++;
                }
              }
            }
          });
        }
        
        // Move to next day
        currentIter.setDate(currentIter.getDate() + 1);
        daysCounted++;
      }
    }

    return { completedCount: completed, activeCount: active };
  }, [selectedTasks, viewType, selectedDate, selectedDateStr, startOfWeek, endOfWeek, todayStr, getTaskDateStr]);
  
  // Prevent Recharts visual glitch by removing padding angle if only one data type exists
  const safePaddingAngle = (completedCount > 0 && activeCount > 0) ? 5 : 0;
  
  const pieData = [
    { name: t('completed') || 'Selesai', value: completedCount, color: '#34d399' },
    { name: t('active') || 'Aktif', value: activeCount, color: '#fb923c' }
  ].filter(d => d.value > 0);

  const totalCount = completedCount + activeCount;
  const completionPercentageNumber = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getFormattedSelectedDate = () => {
    try {
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      return selectedDate.toLocaleDateString(locale, options);
    } catch (e) {
      return selectedDateStr;
    }
  };

  return (
    <div className="flex flex-col h-full font-sans text-slate-200">
      {/* Top Bar */}
      <div className="flex-none pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-2 px-6 flex items-center justify-between border-b border-slate-800/50 bg-slate-900/80">
        <div className="flex items-center gap-4">
          <span className="font-bold text-2xl text-slate-50 tracking-tight">{t('calendar')}</span>
        </div>
      </div>

      {/* Mode Selector (Tabs switcher) */}
      <div className="px-4 py-3 flex-none">
        <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 relative shadow-inner">
          <div 
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-transform duration-300 ease-out bg-indigo-600 shadow-sm ${activeTab === 'stats' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'}`} 
          />
          <button 
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs md:text-sm font-bold transition-colors z-10 ${activeTab === 'calendar' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Calendar className="w-4 h-4" />
            {lang === 'id' ? 'Kalender & Tugas' : 'Calendar & Tasks'}
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs md:text-sm font-bold transition-colors z-10 ${activeTab === 'stats' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Activity className="w-4 h-4" />
            {lang === 'id' ? 'Statistik Produktivitas' : 'Productivity Stats'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 w-full">
        <div className="w-full px-4 sm:px-6 py-4 max-w-7xl mx-auto">
          
          {activeTab === 'calendar' ? (
            /* Calendar & Daily Tasks Section */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              
              {/* Left Column: Calendar Card */}
              <div className="lg:col-span-7 space-y-6 animate-fadeIn">
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-[2.5rem] shadow-xl p-6">
                  {/* Month Navigation inside Card */}
                  <div className="flex justify-between items-center mb-6">
                    <button className="p-2 text-slate-400 hover:text-slate-50 hover:bg-slate-800/60 rounded-full transition-all duration-200" onClick={handlePrevMonth}>
                      <ChevronLeft className="w-5 h-5 md:w-6 h-6" />
                    </button>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest mb-0.5">{lang === 'id' ? 'Penjelajah Waktu' : 'Time Explorer'}</span>
                      <h2 className="text-lg md:text-xl font-bold text-slate-50 tracking-tight">{monthNames[currentMonth]} {currentYear}</h2>
                    </div>
                    <button className="p-2 text-slate-400 hover:text-slate-50 hover:bg-slate-800/60 rounded-full transition-all duration-200" onClick={handleNextMonth}>
                      <ChevronRight className="w-5 h-5 md:w-6 h-6" />
                    </button>
                  </div>

                  {/* Days Header */}
                  <div className="grid grid-cols-7 mb-4">
                    {daysOfWeek.map((day, i) => (
                      <div key={i} className="text-center text-[10px] md:text-xs uppercase font-extrabold text-slate-400 tracking-widest py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-y-2 md:gap-y-3.5">
                    {blanks.map((_, i) => (
                      <div key={`blank-${i}`} className="flex items-center justify-center"></div>
                    ))}
                    {days.map((day) => {
                      const cellDateObj = new Date(currentYear, currentMonth, day);
                      const cellDateStr = getLocalIsoDate(cellDateObj);
                      const dayMood = (moods || []).find(m => m && m.date === cellDateStr)?.mood;

                      return (
                        <Day 
                          key={day} 
                          num={day.toString()} 
                          active={isSelectedDate(day)} 
                          isToday={isTodayDate(day)}
                          onClick={() => handleSelectDay(day)}
                          mood={dayMood}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Daily Tasks & Mood Logger */}
              <div className="lg:col-span-5 space-y-6 animate-fadeIn">
                {/* Dynamic Day Detail Panel */}
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-[2.5rem] shadow-xl p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-6 border-b border-slate-800/60">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest">{lang === 'id' ? 'Aktivitas Harian' : 'Daily Activity'}</span>
                      <h3 className="text-base md:text-lg font-extrabold text-slate-50 mt-0.5">{getFormattedSelectedDate()}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 self-start sm:self-center px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{selectedDateStr === todayStr ? (lang === 'id' ? 'Hari Ini' : 'Today') : selectedDateStr}</span>
                    </div>
                  </div>

                  {/* Daily Progress Capsule (Layer 1: simple, beautiful indicator) */}
                  {dayTasks.length > 0 && (
                    <div className="mb-6 bg-gradient-to-br from-indigo-950/20 to-slate-950/40 border border-slate-800/60 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                        <span className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{lang === 'id' ? 'Kemajuan Tugas' : 'Task Progress'}</span>
                        </span>
                        <span className="text-indigo-400 font-mono text-[11px] font-black">
                          {dayTasks.filter(t => t.repeat === 'daily' ? t.completedDates?.includes(selectedDateStr) : t.completed).length} / {dayTasks.length} {lang === 'id' ? 'Selesai' : 'Done'}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${Math.round(
                              (dayTasks.filter(t => t.repeat === 'daily' ? t.completedDates?.includes(selectedDateStr) : t.completed).length / dayTasks.length) * 100
                            )}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Mood Logger Block */}
                  {selectedDateStr <= todayStr && (
                    <div className="mb-6 bg-slate-950/40 border border-slate-800/40 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Smile className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                          {lang === 'id' ? 'Bagaimana perasaanmu?' : 'How are you feeling?'}
                        </h4>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-1.5">
                        {[
                          { id: 'excellent', label: 'Hebat', labelEn: 'Great', colors: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20', activeColors: 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' },
                          { id: 'good', label: 'Baik', labelEn: 'Good', colors: 'bg-teal-500/10 text-teal-400 border-teal-500/20 hover:bg-teal-500/20', activeColors: 'bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/20' },
                          { id: 'neutral', label: 'Biasa', labelEn: 'Neutral', colors: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20', activeColors: 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' },
                          { id: 'bad', label: 'Buruk', labelEn: 'Bad', colors: 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20', activeColors: 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/20' },
                          { id: 'terrible', label: 'Lelah', labelEn: 'Tired', colors: 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20', activeColors: 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' }
                        ].map(m => {
                          const selectedDayMood = (moods || []).find(x => x && x.date === selectedDateStr)?.mood;
                          const isSelected = selectedDayMood === m.id;
                          const notSelectedOpacity = selectedDayMood && !isSelected ? 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100' : '';
                          
                          return (
                            <button
                              key={m.id}
                              onClick={() => setMood(selectedDateStr, m.id as any)}
                              className={`group flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all border shrink-0 ${isSelected ? m.activeColors + ' border-transparent scale-[1.03]' : m.colors + ' ' + notSelectedOpacity}`}
                              title={lang === 'id' ? m.label : m.labelEn}
                            >
                              <div className={`transition-transform duration-200 ${isSelected ? 'scale-105 mb-1' : 'group-hover:scale-110 mb-1.5'}`}>
                                {getMoodIcon(m.id, isSelected ? "w-6 h-6 md:w-7 h-7" : "w-5 h-5 md:w-6 h-6")}
                              </div>
                              <span className="text-[9px] font-bold tracking-tight text-center block truncate w-full px-0.5">
                                {lang === 'id' ? m.label : m.labelEn}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tasks List Block */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                         {lang === 'id' ? 'Daftar Tugas' : 'Task List'}
                      </h4>
                    </div>

                    {dayTasks.length > 0 ? (
                      <div className="space-y-2.5">
                        {dayTasks.map(task => {
                           const isTaskCompleted = task.isDiscipline
                               ? (task.disciplineData?.dailyCheckins?.includes(selectedDateStr) || false)
                               : (task.repeat === 'daily' 
                                   ? (task.completedDates?.includes(selectedDateStr) || (selectedDateStr === todayStr && task.completed)) 
                                   : task.completed);
                            return (
                             <div 
                               key={task.id} 
                               onClick={() => { setSelectedDetailTaskId(task.id); setSelectedDetailModalTab('info'); setHabitCalendarDate(new Date()); }}
                               className="flex items-center justify-between gap-3.5 bg-slate-950/35 hover:bg-slate-950/65 p-3.5 rounded-2xl border border-slate-800/40 cursor-pointer hover:border-indigo-500/40 transition-all duration-200 group"
                             >
                               <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                 <div 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     toggleTask(task.id, selectedDateStr);
                                   }}
                                   className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${isTaskCompleted ? 'bg-emerald-500 border-emerald-500 scale-95' : 'bg-transparent border-slate-600 group-hover:border-indigo-500'}`}
                                 >
                                   {isTaskCompleted && (
                                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-slate-950">
                                       <polyline points="20 6 9 17 4 12" />
                                     </svg>
                                   )}
                                 </div>
                                 <span className={`text-sm font-medium transition-all truncate flex items-center gap-2 ${isTaskCompleted ? 'text-slate-500 line-through decoration-1' : 'text-slate-200'}`}>
                                   {task.isDiscipline && (
                                     <span className="bg-orange-500/10 border border-orange-500/25 text-orange-400 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase flex items-center gap-0.5 shrink-0">
                                       <span className="animate-pulse">🔥</span> {lang === 'id' ? 'Disiplin' : 'Discipline'}
                                     </span>
                                   )}
                                   <span className="truncate">{task.title}</span>
                                 </span>
                               </div>

                             </div>
                           );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-slate-950/20 border border-dashed border-slate-800/60 rounded-2xl text-slate-400 text-sm">
                        {t('emptyCalendar') || 'Tidak ada tugas atau catatan di tanggal ini.'}
                      </div>
                    )}

                    {/* Quick Add Task Trigger / Form */}
                    {!isAddingQuickTask ? (
                      <button
                        onClick={() => setIsAddingQuickTask(true)}
                        className="w-full py-3 px-4 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 rounded-2xl border border-indigo-500/15 border-dashed flex items-center justify-center gap-2 font-bold text-xs transition-all mt-4"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{lang === 'id' ? 'Tambah Tugas Baru' : 'Add New Task'}</span>
                      </button>
                    ) : (
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!quickTaskTitle.trim()) return;
                          
                          addTask({
                            id: generateId(),
                            title: quickTaskTitle.trim(),
                            completed: false,
                            priority: quickTaskPriority,
                            date: selectedDateStr,
                            createdAt: todayStr,
                            time: quickTaskTime || '09:00',
                            repeat: quickTaskRepeat,
                          });
                          
                          setQuickTaskTitle('');
                          setQuickTaskPriority('Sedang');
                          setQuickTaskRepeat('once');
                          setQuickTaskTime('09:00');
                          setIsAddingQuickTask(false);
                        }}
                        className="mt-4 bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 space-y-3.5"
                      >
                        <div className="flex justify-between items-center">
                          <h5 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                            {lang === 'id' ? 'Tugas Baru' : 'New Task'} ({selectedDateStr})
                          </h5>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingQuickTask(false);
                              setQuickTaskTitle('');
                            }}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-full transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div>
                          <input
                            type="text"
                            required
                            autoFocus
                            value={quickTaskTitle}
                            onChange={(e) => setQuickTaskTitle(e.target.value)}
                            placeholder={lang === 'id' ? 'Judul tugas...' : 'Task title...'}
                            className="w-full bg-slate-900 border border-slate-800/80 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs outline-none focus:border-indigo-500 transition-colors"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-1.5">
                              {lang === 'id' ? 'Waktu' : 'Time'}
                            </label>
                            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800/80 rounded-xl px-3 py-2 text-slate-100 text-xs">
                              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                              <input
                                type="time"
                                value={quickTaskTime}
                                onChange={(e) => setQuickTaskTime(e.target.value)}
                                className="bg-transparent w-full outline-none text-[11px] text-slate-200 font-bold [color-scheme:dark]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-1.5">
                              {lang === 'id' ? 'Pengulangan' : 'Repeat'}
                            </label>
                            <div className="grid grid-cols-2 bg-slate-900 border border-slate-800/80 rounded-xl p-0.5 h-[34px]">
                              <button
                                type="button"
                                onClick={() => setQuickTaskRepeat('once')}
                                className={`rounded-lg text-[10px] font-bold transition-all ${quickTaskRepeat === 'once' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                              >
                                {lang === 'id' ? 'Sekali' : 'Once'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setQuickTaskRepeat('daily')}
                                className={`rounded-lg text-[10px] font-bold transition-all ${quickTaskRepeat === 'daily' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                              >
                                {lang === 'id' ? 'Harian' : 'Daily'}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block mb-1.5">
                            {lang === 'id' ? 'Prioritas' : 'Priority'}
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { val: 'Rendah', label: lang === 'id' ? 'Rendah' : 'Low', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', activeBg: 'bg-emerald-600 text-white border-transparent' },
                              { val: 'Sedang', label: lang === 'id' ? 'Sedang' : 'Medium', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', activeBg: 'bg-amber-500 text-slate-950 border-transparent' },
                              { val: 'Tinggi', label: lang === 'id' ? 'Tinggi' : 'High', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20', activeBg: 'bg-rose-600 text-white border-transparent' },
                            ].map((p) => {
                              const isSel = quickTaskPriority === p.val;
                              return (
                                <button
                                  key={p.val}
                                  type="button"
                                  onClick={() => setQuickTaskPriority(p.val as any)}
                                  className={`py-1.5 rounded-lg text-[10px] font-extrabold border transition-all ${isSel ? p.activeBg + ' scale-[1.02]' : p.bg + ' border-transparent hover:bg-slate-900'}`}
                                >
                                  {p.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex gap-2.5 pt-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingQuickTask(false);
                              setQuickTaskTitle('');
                            }}
                            className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl font-bold text-[10px] border border-slate-800 transition-all"
                          >
                            {lang === 'id' ? 'Batal' : 'Cancel'}
                          </button>
                          <button
                            type="submit"
                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-[10px] shadow-md shadow-indigo-600/10 transition-all"
                          >
                            {lang === 'id' ? 'Simpan' : 'Save'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            /* Productivity Statistics & Habits Section */
            <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
              
              {/* Period Switcher */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1 flex gap-1 shadow-md">
                {['Harian', 'Mingguan', 'Bulanan', 'Tahunan'].map((type, idx) => {
                  const displayType = [t('daily') || 'Harian', t('weekly') || 'Mingguan', t('monthly') || 'Bulanan', t('yearly') || 'Tahunan'];
                  const isActive = viewType === type;
                  return (
                    <button 
                      key={type}
                      onClick={() => setViewType(type as any)}
                      className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'}`}
                    >
                      {displayType[idx]}
                    </button>
                  );
                })}
              </div>

              {/* Statistics Summary Card */}
              <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-[2.5rem] shadow-xl p-6">
                <div className="flex items-center gap-4 mb-5 pb-4 border-b border-slate-800/50">
                  <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-slate-50 font-bold text-sm tracking-tight">
                      {t('taskSummary') || 'Ringkasan Tugas'}
                    </h4>
                    <p className="text-[10px] text-slate-400 tracking-wide font-mono mt-0.5">
                      {viewType === 'Harian' ? `${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}` : 
                       viewType === 'Mingguan' ? `${startOfWeek.getDate()} ${monthNames[startOfWeek.getMonth()]} - ${endOfWeek.getDate()} ${monthNames[endOfWeek.getMonth()]}` : 
                       viewType === 'Bulanan' ? `${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}` : 
                       `${selectedDate.getFullYear()}`}
                    </p>
                  </div>
                </div>

                {/* Progress Mini Grid */}
                <div className="grid grid-cols-3 gap-2.5 mb-5">
                  <div className="bg-slate-950/40 border border-slate-800/40 rounded-xl p-2.5 text-center">
                    <div className="text-lg font-black text-slate-50">{totalCount}</div>
                    <div className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mt-0.5">{t('total') || 'Total'}</div>
                  </div>
                  <div className="bg-emerald-950/20 border border-emerald-900/20 rounded-xl p-2.5 text-center">
                    <div className="text-lg font-black text-emerald-400">{completedCount}</div>
                    <div className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-500 mt-0.5">{t('completed') || 'Selesai'}</div>
                  </div>
                  <div className="bg-orange-950/20 border border-orange-900/20 rounded-xl p-2.5 text-center">
                    <div className="text-lg font-black text-orange-400">{activeCount}</div>
                    <div className="text-[9px] uppercase tracking-wider font-extrabold text-orange-500 mt-0.5">{t('active') || 'Aktif'}</div>
                  </div>
                </div>

                {/* Recharts Pie Chart */}
                {totalCount > 0 ? (
                  <div className="pt-4 border-t border-slate-800/50">
                    <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4 text-center">
                      {t('completionPercentage') || 'Persentase Selesai'}
                    </h5>
                    <div className="h-36 w-full relative">
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-black text-slate-50 leading-none">{completionPercentageNumber}%</span>
                        <span className="text-[8px] uppercase tracking-widest text-slate-400 font-bold mt-1">{t('completed') || 'Selesai'}</span>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={68}
                            paddingAngle={safePaddingAngle}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                            itemStyle={{ color: '#f8fafc', fontSize: '12px', fontWeight: 'bold' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-800/60 rounded-xl">
                    {lang === 'id' ? 'Tidak ada data untuk periode ini' : 'No task data for this period'}
                  </div>
                )}
              </div>

              {/* Insights Mini Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Streak Counter Card */}
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-[2rem] shadow-xl p-5 flex flex-col justify-between">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 bg-orange-500/10 text-orange-400 rounded-lg flex items-center justify-center shrink-0">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{t('streak')}</h4>
                      <p className="text-[8px] text-slate-400 leading-tight truncate">{t('streakKeep')}</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 mt-auto">
                    <span className="text-2xl font-black text-orange-400 tracking-tight leading-none">{streak}</span>
                    <span className="text-[8px] uppercase font-bold text-orange-400/70 tracking-widest">{t('days')}</span>
                  </div>
                </div>

                {/* Monthly Average Mood Card */}
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-[2rem] shadow-xl p-5 flex flex-col justify-between">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${getMoodColorClass(avgMood)}`}>
                      {getMoodIcon(avgMood || 'neutral', "w-4 h-4")}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100 truncate">{lang === 'id' ? 'Rata Mood' : 'Average Mood'}</h4>
                      <p className="text-[8px] text-slate-400 leading-tight">{lang === 'id' ? 'Bulan Ini' : 'This Month'}</p>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <span className={`text-sm font-black tracking-tight ${avgMood ? getMoodColorClass(avgMood).split(' ')[0] : 'text-slate-400'}`}>
                      {getMoodLabel(avgMood)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Habits Section */}
              {tasks.filter(t => t.repeat === 'daily' || t.isDiscipline).length > 0 && (
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-[2.5rem] shadow-xl p-6">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800/50">
                    <div className="w-8 h-8 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center">
                      <Repeat className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-50 tracking-tight">
                       {lang === 'id' ? 'Statistik Kebiasaan' : 'Habit Statistics'}
                    </h3>
                  </div>

                  <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1 no-scrollbar">
                    {tasks.filter(t => t.repeat === 'daily' || t.isDiscipline).map(task => {
                      const { createdStr, diffDays, completedCount, missedCount, compRate, hStreak } = getHabitStats(task, todayStr, getTaskDateStr);
                      
                      return (
                        <div 
                          key={task.id} 
                          onClick={() => { setSelectedDetailTaskId(task.id); setSelectedDetailModalTab('info'); setHabitCalendarDate(new Date()); }}
                          className="bg-slate-950/45 border border-slate-800/50 hover:bg-slate-950/70 rounded-2xl p-4 flex items-center justify-between hover:border-indigo-500/40 transition-all cursor-pointer group"
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="font-extrabold text-slate-100 text-xs sm:text-sm group-hover:text-indigo-400 transition-colors truncate flex items-center gap-1.5" title={task.title}>
                              {task.isDiscipline && (
                                <span className="bg-orange-500/10 border border-orange-500/25 text-orange-400 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase flex items-center gap-0.5 shrink-0">
                                  <span>🔥</span> {lang === 'id' ? 'Disiplin' : 'Discipline'}
                                </span>
                              )}
                              <span className="truncate">{task.title}</span>
                            </h4>
                            <p className="text-[10px] text-slate-400 font-mono mt-1">
                              {lang === 'id' ? 'Aktif sejak' : 'Active since'}: {createdStr}
                            </p>
                          </div>
                          <div className="flex items-center gap-3.5 shrink-0 ml-4">
                            {hStreak > 0 && (
                              <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full text-[10px] font-black shrink-0">
                                <Flame size={11} className="fill-orange-400/20 animate-pulse text-orange-400" />
                                <span>{hStreak}d</span>
                              </div>
                            )}
                            <div className="flex flex-col items-end">
                              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">{lang === 'id' ? 'Konsistensi' : 'Consistency'}</span>
                              <span className="text-emerald-400 font-black text-xs sm:text-sm leading-none mt-0.5">{compRate}%</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all duration-200" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* 2nd Layer: Detailed Task/Habit Modal */}
      {selectedDetailTask && (() => {
        const isDaily = selectedDetailTask.repeat === 'daily' || selectedDetailTask.isDiscipline;
        
        // Calculate stats for daily habit
        const { createdStr, diffDays, completedCount, missedCount, compRate, hStreak } = getHabitStats(selectedDetailTask, todayStr, getTaskDateStr);

        const isDetailTaskCompleted = selectedDetailTask.isDiscipline
          ? (selectedDetailTask.disciplineData?.dailyCheckins?.includes(selectedDateStr) || false)
          : (selectedDetailTask.repeat === 'daily'
            ? (selectedDetailTask.completedDates?.includes(selectedDateStr) || false)
            : selectedDetailTask.completed);

        const pColor = selectedDetailTask.priority === 'Tinggi' 
          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
          : selectedDetailTask.priority === 'Sedang' 
          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';

        const getHabitCalendar = () => {
          const list = [];
          const year = habitCalendarDate.getFullYear();
          const month = habitCalendarDate.getMonth();
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const daysInMonth = getDaysInMonth(year, month);
          const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.

          // Add empty/dummy items for leading blanks of the month
          for (let i = 0; i < firstDayOfWeek; i++) {
            list.push({
              isDummy: true,
              dateStr: '',
              dayNum: null,
              isCompleted: false,
              isToday: false,
              isFuture: false,
              isBeforeCreation: false,
            });
          }

          // Add real days of the month
          for (let day = 1; day <= daysInMonth; day++) {
            const cur = new Date(year, month, day);
            const dateStr = getLocalIsoDate(cur);
            const isCompleted = selectedDetailTask.isDiscipline ? (selectedDetailTask.disciplineData?.dailyCheckins?.includes(dateStr) || false) : (selectedDetailTask.completedDates?.includes(dateStr) || false);
            const isTodayDate = cur.getDate() === today.getDate() && cur.getMonth() === today.getMonth() && cur.getFullYear() === today.getFullYear();
            const isFuture = cur > today;
            const isBeforeCreation = dateStr < createdStr;

            list.push({
              isDummy: false,
              dateStr,
              dayNum: day,
              isCompleted,
              isToday: isTodayDate,
              isFuture,
              isBeforeCreation,
              dayOfWeek: cur.getDay(),
            });
          }

          return list;
        };

        return (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 transition-all duration-300">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh]">
              
              {/* Header */}
              <div className="flex justify-between items-center px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-slate-800/60 flex-none">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest">
                    {lang === 'id' ? 'Detail Tugas' : 'Task Details'}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedDetailTaskId(null)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

               {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 sm:space-y-5 no-scrollbar">
                
                {/* Modal Tab Switcher (Layered details) */}
                {isDaily && (
                  <div className="flex bg-slate-950 border border-slate-800/80 rounded-xl p-0.5 mb-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedDetailModalTab('info')}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                        selectedDetailModalTab === 'info' 
                          ? 'bg-indigo-600 text-white shadow-sm' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lang === 'id' ? 'Informasi' : 'Information'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDetailModalTab('analytics')}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1 ${
                        selectedDetailModalTab === 'analytics' 
                          ? 'bg-indigo-600 text-white shadow-sm' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      {lang === 'id' ? 'Analisis & Riwayat' : 'Analytics & History'}
                    </button>
                  </div>
                )}

                {(!isDaily || selectedDetailModalTab === 'info') ? (
                  <div className="space-y-4 sm:space-y-5 animate-fadeIn">
                    {/* Title and Priority */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${pColor}`}>
                          {selectedDetailTask.priority}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-indigo-500/10 border-indigo-500/20 text-indigo-300">
                          {isDaily ? (lang === 'id' ? 'Kebiasaan Harian' : 'Daily Habit') : (lang === 'id' ? 'Tugas Sekali' : 'One-time Task')}
                        </span>
                      </div>
                      <h3 className="text-xl font-extrabold text-slate-50 tracking-tight leading-snug">
                        {selectedDetailTask.title}
                      </h3>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-950/40 border border-slate-800/40 rounded-xl p-3 flex items-center gap-3">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">{lang === 'id' ? 'Waktu' : 'Time'}</span>
                          <span className="text-xs font-bold text-slate-200 block truncate">{selectedDetailTask.time || '--:--'}</span>
                        </div>
                      </div>

                      <div className="bg-slate-950/40 border border-slate-800/40 rounded-xl p-3 flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">{lang === 'id' ? 'Dibuat' : 'Created'}</span>
                          <span className="text-xs font-bold text-slate-200 block truncate">{createdStr}</span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Status Block */}
                    <div className="bg-slate-950/40 border border-slate-800/40 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">
                          {lang === 'id' ? 'Status Tanggal' : 'Date Status'} ({selectedDateStr === todayStr ? (lang === 'id' ? 'Hari Ini' : 'Today') : selectedDateStr})
                        </span>
                        <span className={`text-sm font-extrabold ${isDetailTaskCompleted ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {isDetailTaskCompleted ? (lang === 'id' ? 'Selesai' : 'Completed') : (lang === 'id' ? 'Belum Selesai' : 'Active')}
                        </span>
                      </div>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                        isDetailTaskCompleted 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}>
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-5 animate-fadeIn">
                    {/* Habits Analytics */}
                    <div className="bg-slate-950/20 border border-slate-800/40 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                        <span>{lang === 'id' ? 'Tingkat Konsistensi' : 'Consistency Rate'}</span>
                        <span className="text-emerald-400">{compRate}%</span>
                      </div>
                      
                      {/* Custom progress bar */}
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/40">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-500" 
                          style={{ width: `${compRate}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-1.5 pt-1 text-center text-[9px] sm:text-[10px]">
                        <div className="bg-slate-900/60 rounded-xl p-1.5 border border-slate-800/20">
                          <span className="text-slate-400 block font-bold">{lang === 'id' ? 'Aktif' : 'Active'}</span>
                          <span className="text-slate-200 font-extrabold block mt-0.5 truncate">{diffDays} {lang === 'id' ? 'Hari' : 'Days'}</span>
                        </div>
                        <div className="bg-slate-900/60 rounded-xl p-1.5 border border-slate-800/20">
                          <span className="text-emerald-400 block font-bold">{lang === 'id' ? 'Selesai' : 'Done'}</span>
                          <span className="text-emerald-400 font-extrabold block mt-0.5 truncate">{completedCount} {lang === 'id' ? 'Kali' : 'Times'}</span>
                        </div>
                        <div className="bg-slate-900/60 rounded-xl p-1.5 border border-slate-800/20">
                          <span className="text-amber-500 block font-bold">{lang === 'id' ? 'Bolong' : 'Missed'}</span>
                          <span className="text-amber-500 font-extrabold block mt-0.5 truncate">{missedCount} {lang === 'id' ? 'Hari' : 'Days'}</span>
                        </div>
                        <div className="bg-slate-900/60 rounded-xl p-1.5 border border-slate-800/20">
                          <span className="text-orange-400 block font-bold">Streak</span>
                          <span className="text-orange-400 font-extrabold block mt-0.5 truncate">{hStreak} {lang === 'id' ? 'Hari' : 'Days'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Check-in History (Calendar Grid) */}
                    <div>
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/40">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{lang === 'id' ? 'Riwayat Kebiasaan' : 'Habit History'}</span>
                        </h4>
                        
                        {/* Mini month navigator */}
                        <div className="flex items-center gap-2 bg-slate-950/60 px-2 py-0.5 rounded-xl border border-slate-800/50">
                          <button
                            type="button"
                            onClick={() => {
                              const prev = new Date(habitCalendarDate.getFullYear(), habitCalendarDate.getMonth() - 1, 1);
                              setHabitCalendarDate(prev);
                            }}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-lg transition-all"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[9px] font-bold text-slate-300 font-mono min-w-[70px] text-center uppercase tracking-wider">
                            {habitCalendarDate.toLocaleDateString(locale, { month: 'short', year: 'numeric' })}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = new Date(habitCalendarDate.getFullYear(), habitCalendarDate.getMonth() + 1, 1);
                              setHabitCalendarDate(next);
                            }}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-lg transition-all"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Weekday Initials Row */}
                      <div className="grid grid-cols-7 mb-2 text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        {daysOfWeek.map((day, i) => (
                          <div key={i} className="py-0.5">{day}</div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-y-2 gap-x-1.5">
                        {getHabitCalendar().map((day, idx) => {
                          if (day.isDummy) {
                            return (
                              <div key={idx} className="w-8 h-8 sm:w-9 sm:h-9" />
                            );
                          }

                          const getDayStyles = () => {
                            if (day.isFuture) return 'bg-transparent border border-dashed border-slate-800/40 text-slate-700';
                            if (day.isBeforeCreation) return 'bg-slate-950/20 text-slate-600 border border-slate-900/40';
                            if (day.isCompleted) return 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400';
                            // Missed day
                            return 'bg-amber-500/10 border border-amber-500/25 text-amber-500/80';
                          };
                          
                          return (
                            <div 
                              key={idx} 
                              className="flex flex-col items-center justify-center"
                            >
                              <div 
                                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex flex-col items-center justify-center text-[10px] sm:text-xs font-black transition-all relative ${getDayStyles()} ${day.isToday ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900' : ''}`}
                                title={day.dateStr}
                              >
                                <span>{day.dayNum}</span>
                                {day.isCompleted && (
                                  <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 w-3.5 h-3.5 rounded-full flex items-center justify-center border border-slate-900 shadow-sm">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-2 h-2">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Footer Actions */}
              <div className="p-4 sm:p-5 border-t border-slate-800/60 bg-slate-950/20 flex gap-3 flex-none">
                <button
                  onClick={() => {
                    toggleTask(selectedDetailTask.id, selectedDateStr);
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                    isDetailTaskCompleted 
                      ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isDetailTaskCompleted 
                      ? (lang === 'id' ? 'Batalkan Selesai' : 'Undo Complete') 
                      : (lang === 'id' ? 'Tandai Selesai' : 'Mark Complete')}
                  </span>
                </button>
                <button
                  onClick={() => setSelectedDetailTaskId(null)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all"
                >
                  {lang === 'id' ? 'Tutup' : 'Close'}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}

const Day: React.FC<{ num: string, mute?: boolean, active?: boolean, isToday?: boolean, onClick?: () => void, mood?: string | null }> = ({ num, mute = false, active = false, isToday = false, onClick, mood }) => {
  const getMoodColor = () => {
    switch(mood) {
      case 'excellent': return 'bg-emerald-500';
      case 'good': return 'bg-teal-400';
      case 'neutral': return 'bg-indigo-400';
      case 'bad': return 'bg-orange-400';
      case 'terrible': return 'bg-rose-500';
      default: return 'bg-transparent';
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div onClick={onClick} className={`w-8 h-8 md:w-12 md:h-12 flex flex-col items-center justify-center rounded-xl md:rounded-2xl transition-all relative ${
        active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 
        mute ? 'text-slate-700' : 
        'text-slate-300 hover:bg-slate-800 hover:text-slate-50 cursor-pointer'
      }`}>
        <span className="text-xs md:text-sm font-bold">{num}</span>
        {mood && !active && (
          <div className={`w-1.5 h-1.5 md:w-2 md:h-2 mt-0.5 md:mt-1 rounded-full ${getMoodColor()}`}></div>
        )}
        {active && mood && (
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-slate-950 rounded-full flex items-center justify-center">
             <div className={`w-1.5 h-1.5 rounded-full ${getMoodColor()}`}></div>
          </div>
        )}
        {isToday && !active && !mood && <div className="absolute -bottom-1 md:-bottom-2 w-1 h-1 md:w-1.5 md:h-1.5 bg-indigo-500 rounded-full"></div>}
      </div>
    </div>
  );
}
