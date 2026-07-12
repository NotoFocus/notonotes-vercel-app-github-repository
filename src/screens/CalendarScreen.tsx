import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Activity, Flame, Repeat, Calendar, CheckCircle2, Smile, Clock, X, TrendingUp, Plus, Trash2, ChevronRight as ChevronRightIcon, Edit2, Check, Sparkles, Heart } from 'lucide-react';
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
  const { tasks, moods, lang, streak, setMood, toggleTask, addTask, deleteTask, updateTask, isLiteMode } = useAppStore();
  const t = useTranslation(lang);

  useEffect(() => {
    if (isLiteMode && activeTab !== 'calendar') {
      setActiveTab('calendar');
    }
  }, [isLiteMode, activeTab]);

  // Calendar task editing state
  const [isEditingCalendarTask, setIsEditingCalendarTask] = useState(false);
  const [editCalTaskTitle, setEditCalTaskTitle] = useState('');
  const [editCalTaskTime, setEditCalTaskTime] = useState('09:00');
  const [editCalTaskPriority, setEditCalTaskPriority] = useState<'Tinggi' | 'Sedang' | 'Rendah'>('Sedang');

  // Quick task state
  const [isAddingQuickTask, setIsAddingQuickTask] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskPriority, setQuickTaskPriority] = useState<'Tinggi' | 'Sedang' | 'Rendah'>('Sedang');
  const [quickTaskRepeat, setQuickTaskRepeat] = useState<'once' | 'daily'>('once');
  const [quickTaskTime, setQuickTaskTime] = useState('09:00');

  const selectedDetailTask = useMemo(() => {
    return tasks.find(tk => tk.id === selectedDetailTaskId) || null;
  }, [tasks, selectedDetailTaskId]);

  const monthlyMoodStats = useMemo(() => {
    const targetMonth = selectedDate.getMonth();
    const targetYear = selectedDate.getFullYear();
    
    const monthlyMoods = (moods || []).filter(m => {
      if (!m || !m.date || !m.mood) return false;
      const d = getLocalDateFromStr(m.date);
      return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });

    if (monthlyMoods.length === 0) {
      return null;
    }

    const counts = {
      excellent: 0,
      good: 0,
      neutral: 0,
      bad: 0,
      terrible: 0
    };

    monthlyMoods.forEach(m => {
      if (m.mood && m.mood in counts) {
        counts[m.mood as keyof typeof counts]++;
      }
    });

    const totalMoodDays = monthlyMoods.length;

    const moodScores: Record<string, number> = {
      excellent: 5,
      good: 4,
      neutral: 3,
      bad: 2,
      terrible: 1
    };

    const totalScore = monthlyMoods.reduce((sum, m) => sum + (moodScores[m.mood as string] || 3), 0);
    const averageScore = totalScore / totalMoodDays;

    let averageDetails;
    if (averageScore >= 4.5) {
      averageDetails = { 
        label: lang === 'id' ? 'Sangat Baik' : 'Excellent', 
        id: 'excellent', 
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        advice: lang === 'id' 
          ? 'Luar biasa! Bulan ini dipenuhi energi positif. Pertahankan kebiasaan baikmu!' 
          : 'Outstanding! This month has been filled with positive energy. Keep up your great habits!'
      };
    } else if (averageScore >= 3.5) {
      averageDetails = { 
        label: lang === 'id' ? 'Baik' : 'Good', 
        id: 'good', 
        color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
        advice: lang === 'id' 
          ? 'Bulan yang cukup menyenangkan dan damai. Jaga keseimbangan ini!' 
          : 'A pleasant and peaceful month. Keep up this healthy balance!'
      };
    } else if (averageScore >= 2.5) {
      averageDetails = { 
        label: lang === 'id' ? 'Biasa' : 'Neutral', 
        id: 'neutral', 
        color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        advice: lang === 'id' 
          ? 'Mood stabil, namun terasa datar. Luangkan waktu untuk melakukan hobi baru atau istirahat sejenak.' 
          : 'Stable mood, but feels a bit flat. Take some time for a new hobby or a brief, refreshing break.'
      };
    } else if (averageScore >= 1.5) {
      averageDetails = { 
        label: lang === 'id' ? 'Buruk' : 'Bad', 
        id: 'bad', 
        color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
        advice: lang === 'id' 
          ? 'Sepertinya kamu sedang banyak pikiran. Jangan memaksakan diri, ambil jeda kecil dan bicarakan dengan orang terdekat.' 
          : 'Seems like you have a lot on your mind. Don\'t push yourself too hard, take a micro-break and talk to close ones.'
      };
    } else {
      averageDetails = { 
        label: lang === 'id' ? 'Sangat Buruk' : 'Terrible', 
        id: 'terrible', 
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        advice: lang === 'id' 
          ? 'Kamu melewati masa-masa yang sangat berat. Utamakan kesehatan mentalmu, ambil libur sejenak, dan cari bantuan jika perlu.' 
          : 'You are going through a very tough time. Prioritize your mental health, take a complete rest, and seek help if needed.'
      };
    }

    return {
      totalMoodDays,
      counts,
      averageScore,
      averageDetails
    };
  }, [moods, selectedDate, lang]);

  useEffect(() => {
    if (selectedDetailTask) {
      setEditCalTaskTitle(selectedDetailTask.title);
      setEditCalTaskTime(selectedDetailTask.time || '09:00');
      setEditCalTaskPriority(selectedDetailTask.priority);
      setIsEditingCalendarTask(false);
    }
  }, [selectedDetailTask]);

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
      const d = getLocalDateFromStr(m.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
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

  const handlePrevPeriod = () => {
    if (viewType === 'Harian') {
      const prev = new Date(selectedDate);
      prev.setDate(prev.getDate() - 1);
      setSelectedDate(prev);
      setCurrentDate(prev);
    } else if (viewType === 'Mingguan') {
      const prev = new Date(selectedDate);
      prev.setDate(prev.getDate() - 7);
      setSelectedDate(prev);
      setCurrentDate(prev);
    } else if (viewType === 'Bulanan') {
      const prev = new Date(selectedDate);
      prev.setMonth(prev.getMonth() - 1);
      setSelectedDate(prev);
      setCurrentDate(prev);
    } else if (viewType === 'Tahunan') {
      const prev = new Date(selectedDate);
      prev.setFullYear(prev.getFullYear() - 1);
      setSelectedDate(prev);
      setCurrentDate(prev);
    }
  };

  const handleNextPeriod = () => {
    if (viewType === 'Harian') {
      const next = new Date(selectedDate);
      next.setDate(next.getDate() + 1);
      setSelectedDate(next);
      setCurrentDate(next);
    } else if (viewType === 'Mingguan') {
      const next = new Date(selectedDate);
      next.setDate(next.getDate() + 7);
      setSelectedDate(next);
      setCurrentDate(next);
    } else if (viewType === 'Bulanan') {
      const next = new Date(selectedDate);
      next.setMonth(next.getMonth() + 1);
      setSelectedDate(next);
      setCurrentDate(next);
    } else if (viewType === 'Tahunan') {
      const next = new Date(selectedDate);
      next.setFullYear(next.getFullYear() + 1);
      setSelectedDate(next);
      setCurrentDate(next);
    }
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
      
      if (t.deleted) {
        const deletedAtStr = t.deletedAt || todayStr;
        if (t.isDiscipline) {
          return (selectedDateStr >= createdDateStr && selectedDateStr <= deletedAtStr) || t.disciplineData?.dailyCheckins?.includes(selectedDateStr) || false;
        }
        if (t.repeat === 'daily') {
          return (selectedDateStr >= createdDateStr && selectedDateStr <= deletedAtStr) || t.completedDates?.includes(selectedDateStr) || false;
        }
        return tDateStr === selectedDateStr;
      }
      
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

       if (t.deleted) {
         const deletedAtStr = t.deletedAt || todayStr;
         const [dly, dlm, dld] = deletedAtStr.split('-').map(Number);
         const delD = new Date(dly, dlm - 1, dld, 12, 0, 0, 0);

         if (viewType === 'Harian') {
           if (t.repeat === 'daily' || t.isDiscipline) {
             return selectedDateStr >= createdDateStr && selectedDateStr <= deletedAtStr;
           }
           return tDateStr === selectedDateStr;
         } else if (viewType === 'Mingguan') {
           if (t.repeat === 'daily' || t.isDiscipline) return startOfWeek <= delD && endOfWeek >= cD;
           return tD >= startOfWeek && tD <= endOfWeek;
         } else if (viewType === 'Bulanan') {
           if (t.repeat === 'daily' || t.isDiscipline) {
             const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1, 0, 0, 0, 0);
             const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);
             return monthStart <= delD && monthEnd >= cD;
           }
           return tD.getMonth() === selectedDate.getMonth() && tD.getFullYear() === selectedDate.getFullYear();
         } else if (viewType === 'Tahunan') {
           if (t.repeat === 'daily' || t.isDiscipline) {
             const yearStart = new Date(selectedDate.getFullYear(), 0, 1, 0, 0, 0, 0);
             const yearEnd = new Date(selectedDate.getFullYear(), 11, 31, 23, 59, 59, 999);
             return yearStart <= delD && yearEnd >= cD;
           }
           return tD.getFullYear() === selectedDate.getFullYear();
         }
         return false;
       }

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

    if (viewType === 'Harian') {
      selectedTasks.forEach(tk => {
        if (tk.isDiscipline) {
          const checkins = tk.disciplineData?.dailyCheckins || [];
          if (checkins.includes(selectedDateStr)) {
            completed++;
          } else {
            if (!tk.deleted) active++;
          }
        } else if (tk.repeat === 'daily') {
          const compDates = tk.completedDates || [];
          if (compDates.includes(selectedDateStr)) {
            completed++;
          } else {
            if (selectedDateStr === todayStr) {
               if (tk.completed) completed++;
               else { if (!tk.deleted) active++; }
            } else {
               if (!tk.deleted) active++;
            }
          }
        } else {
          if (tk.completed) {
            completed++;
          } else {
            if (!tk.deleted) active++;
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
        const iterStr = getLocalIsoDate(currentIter);
        
        // Only count up to today
        if (iterStr <= capDateStr) {
          selectedTasks.forEach(tk => {
            const tDateStr = getTaskDateStr(tk.date);
            const createdDateStr = tk.createdAt || tDateStr;

            // If the task wasn't created yet on this day, skip it
            if (iterStr < createdDateStr) {
              return;
            }

            const isDeletedNow = tk.deleted && tk.deletedAt && iterStr > tk.deletedAt;

            if (tk.isDiscipline) {
              const checkins = tk.disciplineData?.dailyCheckins || [];
              if (checkins.includes(iterStr)) {
                completed++;
              } else {
                if (!isDeletedNow) active++;
              }
            } else if (tk.repeat === 'daily') {
              // Daily task/habit
              const compDates = tk.completedDates || [];
              if (compDates.includes(iterStr)) {
                completed++;
              } else {
                if (iterStr === todayStr) {
                  if (tk.completed) completed++;
                  else { if (!isDeletedNow) active++; }
                } else {
                  if (!isDeletedNow) active++;
                }
              }
            } else {
              // One-time task
              // It is only relevant on its specific due date (tDateStr)
              if (tDateStr === iterStr) {
                if (tk.completed) {
                  completed++;
                } else {
                  if (!isDeletedNow) active++;
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

  const priorityStats = useMemo(() => {
    let highCompleted = 0, highTotal = 0;
    let medCompleted = 0, medTotal = 0;
    let lowCompleted = 0, lowTotal = 0;

    if (viewType === 'Harian') {
      selectedTasks.forEach(tk => {
        const prio = tk.priority || 'Sedang';
        let isCompleted = false;
        let isActive = false;

        if (tk.isDiscipline) {
          const checkins = tk.disciplineData?.dailyCheckins || [];
          if (checkins.includes(selectedDateStr)) {
            isCompleted = true;
          } else {
            if (!tk.deleted) isActive = true;
          }
        } else if (tk.repeat === 'daily') {
          const compDates = tk.completedDates || [];
          if (compDates.includes(selectedDateStr)) {
            isCompleted = true;
          } else {
            if (selectedDateStr === todayStr) {
              if (tk.completed) isCompleted = true;
              else { if (!tk.deleted) isActive = true; }
            } else {
              if (!tk.deleted) isActive = true;
            }
          }
        } else {
          if (tk.completed) {
            isCompleted = true;
          } else {
            if (!tk.deleted) isActive = true;
          }
        }

        if (isCompleted) {
          if (prio === 'Tinggi') highCompleted++;
          else if (prio === 'Sedang') medCompleted++;
          else lowCompleted++;
        }
        if (isCompleted || isActive) {
          if (prio === 'Tinggi') highTotal++;
          else if (prio === 'Sedang') medTotal++;
          else lowTotal++;
        }
      });
    } else {
      let startDate: Date;
      let endDate: Date;

      if (viewType === 'Mingguan') {
        startDate = new Date(startOfWeek);
        endDate = new Date(endOfWeek);
      } else if (viewType === 'Bulanan') {
        startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      } else {
        startDate = new Date(selectedDate.getFullYear(), 0, 1);
        endDate = new Date(selectedDate.getFullYear(), 11, 31);
      }

      const currentIter = new Date(startDate);
      const capDateStr = todayStr;
      const maxDays = viewType === 'Tahunan' ? 366 : (viewType === 'Bulanan' ? 31 : 7);
      let daysCounted = 0;

      while (currentIter <= endDate && daysCounted < maxDays) {
        const iterStr = getLocalIsoDate(currentIter);
        if (iterStr <= capDateStr) {
          selectedTasks.forEach(tk => {
            const tDateStr = getTaskDateStr(tk.date);
            const createdDateStr = tk.createdAt || tDateStr;
            if (iterStr >= createdDateStr) {
              const isDeletedNow = tk.deleted && tk.deletedAt && iterStr > tk.deletedAt;
              const prio = tk.priority || 'Sedang';
              
              let isCompleted = false;
              let isActive = false;

              if (tk.isDiscipline) {
                const checkins = tk.disciplineData?.dailyCheckins || [];
                if (checkins.includes(iterStr)) {
                  isCompleted = true;
                } else {
                  if (!isDeletedNow) isActive = true;
                }
              } else if (tk.repeat === 'daily') {
                const compDates = tk.completedDates || [];
                if (compDates.includes(iterStr)) {
                  isCompleted = true;
                } else {
                  if (iterStr === todayStr) {
                    if (tk.completed) isCompleted = true;
                    else { if (!isDeletedNow) isActive = true; }
                  } else {
                    if (!isDeletedNow) isActive = true;
                  }
                }
              } else {
                if (tDateStr === iterStr) {
                  if (tk.completed) {
                    isCompleted = true;
                  } else {
                    if (!isDeletedNow) isActive = true;
                  }
                }
              }

              if (isCompleted) {
                if (prio === 'Tinggi') highCompleted++;
                else if (prio === 'Sedang') medCompleted++;
                else lowCompleted++;
              }
              if (isCompleted || isActive) {
                if (prio === 'Tinggi') highTotal++;
                else if (prio === 'Sedang') medTotal++;
                else lowTotal++;
              }
            }
          });
        }
        currentIter.setDate(currentIter.getDate() + 1);
        daysCounted++;
      }
    }

    return {
      high: { completed: highCompleted, total: highTotal, rate: highTotal > 0 ? Math.round((highCompleted / highTotal) * 100) : 0 },
      medium: { completed: medCompleted, total: medTotal, rate: medTotal > 0 ? Math.round((medCompleted / medTotal) * 100) : 0 },
      low: { completed: lowCompleted, total: lowTotal, rate: lowTotal > 0 ? Math.round((lowCompleted / lowTotal) * 100) : 0 },
    };
  }, [selectedTasks, viewType, selectedDate, selectedDateStr, startOfWeek, endOfWeek, todayStr, getTaskDateStr]);

  const completedTasksInPeriod = useMemo(() => {
    const list: { id: string; title: string; dateStr: string; priority: string; isDiscipline: boolean }[] = [];
    
    let startDate: Date;
    let endDate: Date;
    if (viewType === 'Harian') {
      startDate = new Date(selectedDate);
      endDate = new Date(selectedDate);
    } else if (viewType === 'Mingguan') {
      startDate = new Date(startOfWeek);
      endDate = new Date(endOfWeek);
    } else if (viewType === 'Bulanan') {
      startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    } else {
      startDate = new Date(selectedDate.getFullYear(), 0, 1);
      endDate = new Date(selectedDate.getFullYear(), 11, 31);
    }

    const startStr = getLocalIsoDate(startDate);
    const endStr = getLocalIsoDate(endDate);

    selectedTasks.forEach(tk => {
      const tDateStr = getTaskDateStr(tk.date);
      
      if (tk.isDiscipline) {
        const checkins = tk.disciplineData?.dailyCheckins || [];
        checkins.forEach(cDate => {
          if (cDate >= startStr && cDate <= endStr) {
            list.push({
              id: `${tk.id}-${cDate}`,
              title: tk.title,
              dateStr: cDate,
              priority: tk.priority || 'Sedang',
              isDiscipline: true
            });
          }
        });
      } else if (tk.repeat === 'daily') {
        const compDates = tk.completedDates || [];
        compDates.forEach(cDate => {
          if (cDate >= startStr && cDate <= endStr) {
            list.push({
              id: `${tk.id}-${cDate}`,
              title: tk.title,
              dateStr: cDate,
              priority: tk.priority || 'Sedang',
              isDiscipline: false
            });
          }
        });
        if (tk.completed && !compDates.includes(todayStr) && todayStr >= startStr && todayStr <= endStr) {
          const createdDateStr = tk.createdAt || tDateStr;
          if (todayStr >= createdDateStr) {
            list.push({
              id: `${tk.id}-${todayStr}`,
              title: tk.title,
              dateStr: todayStr,
              priority: tk.priority || 'Sedang',
              isDiscipline: false
            });
          }
        }
      } else {
        if (tk.completed && tDateStr >= startStr && tDateStr <= endStr) {
          list.push({
            id: tk.id,
            title: tk.title,
            dateStr: tDateStr,
            priority: tk.priority || 'Sedang',
            isDiscipline: false
          });
        }
      }
    });

    return list.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  }, [selectedTasks, viewType, selectedDate, startOfWeek, endOfWeek, todayStr, getTaskDateStr]);
  
  // Prevent Recharts visual glitch by removing padding angle if only one data type exists
  const safePaddingAngle = (completedCount > 0 && activeCount > 0) ? 5 : 0;
  
  const pieData = [
    { name: t('completed') || 'Selesai', value: completedCount, color: '#34d399' },
    { name: lang === 'id' ? 'Belum Selesai' : 'Uncompleted', value: activeCount, color: '#fb923c' }
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
      {/* Tab Switcher - Only show in Full Mode */}
      {!isLiteMode && (
        <div className="px-4 py-3 flex-none w-full max-w-xl mx-auto">
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
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 w-full">
        <div className="w-full px-4 sm:px-6 py-4 max-w-7xl mx-auto">
          
          {activeTab === 'calendar' ? (
            /* Calendar & Daily Tasks Section */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              
              {/* Left Column: Calendar Card */}
              <div className="lg:col-span-7 space-y-6 animate-fadeIn">
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl shadow-xl p-6">
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
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl shadow-xl p-6">
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
                          {dayTasks.filter(t => t.isDiscipline 
                            ? (t.disciplineData?.dailyCheckins?.includes(selectedDateStr) || false)
                            : (t.repeat === 'daily' 
                              ? (t.completedDates?.includes(selectedDateStr) || (selectedDateStr === todayStr && t.completed))
                              : t.completed)
                          ).length} / {dayTasks.length} {lang === 'id' ? 'Selesai' : 'Done'}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-850">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${Math.round(
                              (dayTasks.filter(t => t.isDiscipline 
                                ? (t.disciplineData?.dailyCheckins?.includes(selectedDateStr) || false)
                                : (t.repeat === 'daily' 
                                  ? (t.completedDates?.includes(selectedDateStr) || (selectedDateStr === todayStr && t.completed))
                                  : t.completed)
                              ).length / dayTasks.length) * 100
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
                          { id: 'excellent', label: 'Sangat Baik', labelEn: 'Excellent', colors: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20', activeColors: 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' },
                          { id: 'good', label: 'Baik', labelEn: 'Good', colors: 'bg-teal-500/10 text-teal-400 border-teal-500/20 hover:bg-teal-500/20', activeColors: 'bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/20' },
                          { id: 'neutral', label: 'Biasa', labelEn: 'Neutral', colors: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20', activeColors: 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' },
                          { id: 'bad', label: 'Buruk', labelEn: 'Bad', colors: 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20', activeColors: 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/20' },
                          { id: 'terrible', label: 'Sangat Buruk', labelEn: 'Terrible', colors: 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20', activeColors: 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' }
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
                               className={`flex items-center justify-between gap-3.5 p-3.5 rounded-2xl border transition-all duration-200 group ${task.deleted ? 'bg-slate-950/10 border-slate-900/40 opacity-45 italic' : 'bg-slate-950/35 hover:bg-slate-950/65 border-slate-800/40 hover:border-emerald-500/30 cursor-pointer'}`}
                             >
                               <button 
                                 disabled={task.deleted}
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   toggleTask(task.id, selectedDateStr);
                                 }}
                                 className={`p-1 rounded-lg flex-none flex items-center justify-center transition-colors ${task.deleted ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                               >
                                 <div 
                                   className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${isTaskCompleted ? 'bg-emerald-500 border-emerald-500 scale-95' : 'bg-transparent border-slate-600'}`}
                                 >
                                   {isTaskCompleted && (
                                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-slate-950">
                                       <polyline points="20 6 9 17 4 12" />
                                     </svg>
                                   )}
                                 </div>
                               </button>

                               <div 
                                 onClick={() => {
                                   setActiveTab('stats');
                                   setSelectedDetailTaskId(task.id);
                                   setSelectedDetailModalTab('analytics');
                                   setHabitCalendarDate(new Date());
                                 }} 
                                 className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                               >
                                 <span className={`text-sm font-medium transition-all truncate flex items-center gap-2 ${isTaskCompleted ? 'text-slate-500 line-through decoration-1' : 'text-slate-200'}`}>
                                   {task.isDiscipline && (
                                     <span className="bg-orange-500/10 border border-orange-500/25 text-orange-400 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase flex items-center gap-0.5 shrink-0">
                                       {lang === 'id' ? 'Disiplin' : 'Discipline'}
                                     </span>
                                   )}
                                   {task.deleted && (
                                     <span className="bg-rose-500/10 border border-rose-500/25 text-rose-400 px-1 py-0.5 rounded text-[8px] font-black tracking-wider uppercase shrink-0">
                                       {lang === 'id' ? 'Terhapus' : 'Deleted'}
                                     </span>
                                   )}
                                   <span className="truncate">{task.title}</span>
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {task.deleted ? (
                                    <button 
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        updateTask({ ...task, deleted: false }); 
                                      }}
                                      className="p-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
                                      title={lang === 'id' ? 'Pulihkan' : 'Restore'}
                                    >
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                        <polyline points="23 4 23 10 17 10" />
                                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                                      </svg>
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        deleteTask(task.id); 
                                      }}
                                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                      title={lang === 'id' ? 'Hapus' : 'Delete'}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
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
            <div className="space-y-6 animate-fadeIn">
              
              {/* Period Switcher - Centered and elegant */}
              <div className="max-w-xl mx-auto w-full">
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
              </div>

              {/* Bento Grid layout for Statistics on desktop, single column on mobile */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                
                {/* Left Column: Summary and Priority Stats (Col span 5) */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Statistics Summary Card */}
                  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl shadow-xl p-6">
                    <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800/50">
                      <div className="flex items-center gap-4">
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

                      {/* Navigation Arrows for Stats Period */}
                      <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1 shrink-0">
                        <button 
                          onClick={handlePrevPeriod}
                          className="p-1.5 hover:bg-slate-850 text-slate-400 hover:text-slate-100 rounded-lg transition-all"
                          title={lang === 'id' ? 'Sebelumnya' : 'Previous'}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={handleNextPeriod}
                          className="p-1.5 hover:bg-slate-850 text-slate-400 hover:text-slate-100 rounded-lg transition-all"
                          title={lang === 'id' ? 'Berikutnya' : 'Next'}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
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
                        <div className="text-[9px] uppercase tracking-wider font-extrabold text-orange-500 mt-0.5">{lang === 'id' ? 'Belum Selesai' : 'Uncompleted'}</div>
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
                          <ResponsiveContainer key={`${viewType}-${activeTab}-${completedCount}-${activeCount}`} width="100%" height={144}>
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

                  {/* Priority Analysis Card */}
                  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl shadow-xl p-6">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800/50">
                      <div className="w-8 h-8 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-50 tracking-tight">
                        {lang === 'id' ? 'Analisis Tingkat Prioritas' : 'Priority Level Analysis'}
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {/* High Priority */}
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                          <span className="text-rose-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            {lang === 'id' ? 'Tinggi' : 'High'}
                          </span>
                          <span className="text-slate-300">
                            {priorityStats.high.completed} / {priorityStats.high.total} {lang === 'id' ? 'Selesai' : 'Completed'} ({priorityStats.high.rate}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/40">
                          <div 
                            className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                            style={{ width: `${priorityStats.high.rate}%` }}
                          />
                        </div>
                      </div>

                      {/* Medium Priority */}
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                          <span className="text-amber-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            {lang === 'id' ? 'Sedang' : 'Medium'}
                          </span>
                          <span className="text-slate-300">
                            {priorityStats.medium.completed} / {priorityStats.medium.total} {lang === 'id' ? 'Selesai' : 'Completed'} ({priorityStats.medium.rate}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/40">
                          <div 
                            className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                            style={{ width: `${priorityStats.medium.rate}%` }}
                          />
                        </div>
                      </div>

                      {/* Low Priority */}
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                          <span className="text-emerald-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            {lang === 'id' ? 'Rendah' : 'Low'}
                          </span>
                          <span className="text-slate-300">
                            {priorityStats.low.completed} / {priorityStats.low.total} {lang === 'id' ? 'Selesai' : 'Completed'} ({priorityStats.low.rate}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/40">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                            style={{ width: `${priorityStats.low.rate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Column: Habit Analytics / Calendar Directory & Completed History (Col span 7) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Task Directory / Detail Statistics Selector */}
                  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl shadow-xl p-6">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800/50">
                      <div className="w-8 h-8 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-50 tracking-tight">
                          {lang === 'id' ? 'Detail Statistik & Kalender Tugas' : 'Task Stats & Calendar Directory'}
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                          {lang === 'id' ? 'Pilih tugas untuk melihat grafik & kalender penyelesaian lengkap' : 'Select a task to view its detailed chart & full completion calendar'}
                        </p>
                      </div>
                    </div>

                    {selectedTasks.filter(t => !t.deleted).length > 0 ? (
                      <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
                        {selectedTasks.filter(t => !t.deleted).map(task => {
                          const { createdStr, diffDays, completedCount, missedCount, compRate, hStreak } = getHabitStats(task, todayStr, getTaskDateStr);
                          const isDaily = task.repeat === 'daily' || task.isDiscipline;
                          
                          return (
                            <div 
                              key={task.id} 
                              onClick={() => { 
                                setSelectedDetailTaskId(task.id); 
                                setSelectedDetailModalTab('analytics'); 
                                setHabitCalendarDate(new Date()); 
                              }}
                              className="bg-slate-950/45 border border-slate-800/50 hover:bg-slate-950/70 rounded-2xl p-4 flex items-center justify-between hover:border-indigo-500/40 transition-all cursor-pointer group"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {task.isDiscipline && (
                                    <span className="bg-orange-500/10 border border-orange-500/25 text-orange-400 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase shrink-0">
                                      {lang === 'id' ? 'Disiplin' : 'Discipline'}
                                    </span>
                                  )}
                                  {isDaily && !task.isDiscipline && (
                                    <span className="bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase shrink-0">
                                      {lang === 'id' ? 'Harian' : 'Daily'}
                                    </span>
                                  )}
                                  {!isDaily && (
                                    <span className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase shrink-0">
                                      {lang === 'id' ? 'Sekali' : 'Once'}
                                    </span>
                                  )}
                                  <span className="font-extrabold text-slate-100 text-xs sm:text-sm group-hover:text-indigo-400 transition-colors truncate" title={task.title}>
                                    {task.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1.5 font-mono text-[9px] text-slate-400">
                                  <span>{lang === 'id' ? 'Dibuat' : 'Created'}: {createdStr}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3.5 shrink-0 ml-4">
                                <div className="flex flex-col items-end">
                                  <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                                    {isDaily ? (lang === 'id' ? 'Konsistensi' : 'Consistency') : (lang === 'id' ? 'Status' : 'Status')}
                                  </span>
                                  <span className={`font-black text-xs sm:text-sm mt-0.5 ${isDaily ? 'text-indigo-400' : (task.completed ? 'text-emerald-400' : 'text-amber-400')}`}>
                                    {isDaily ? `${compRate}%` : (task.completed ? (lang === 'id' ? 'Selesai' : 'Completed') : (lang === 'id' ? 'Aktif' : 'Active'))}
                                  </span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all duration-200" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-800/60 rounded-xl font-mono">
                        {lang === 'id' ? 'Tidak ada tugas terdaftar di periode ini' : 'No tasks listed in this period'}
                      </div>
                    )}
                  </div>

                  {/* Monthly Mood & Evaluation Card */}
                  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl shadow-xl p-6">
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800/50">
                      <div className="w-8 h-8 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center">
                        <Smile className="w-4 h-4 text-indigo-400" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-50 tracking-tight">
                        {lang === 'id' ? 'Evaluasi & Analisis Mood Bulanan' : 'Monthly Mood & Evaluation'}
                      </h3>
                    </div>

                    {monthlyMoodStats ? (
                      <div className="space-y-4">
                        {/* Average Banner */}
                        <div className="flex items-center justify-between bg-slate-950/40 border border-slate-800/80 rounded-2xl p-3.5">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                              {lang === 'id' ? 'Rata-rata Mood Bulanan' : 'Monthly Average Mood'}
                            </span>
                            <span className="text-sm font-black text-slate-200 flex items-center gap-2">
                              <span className={monthlyMoodStats.averageDetails.color.split(' ')[0]}>
                                {getMoodIcon(monthlyMoodStats.averageDetails.id, "w-5 h-5")}
                              </span>
                              <span className={monthlyMoodStats.averageDetails.color.split(' ')[0]}>{monthlyMoodStats.averageDetails.label}</span>
                              <span className="text-xs text-slate-500 font-mono">({monthlyMoodStats.averageScore.toFixed(1)}/5)</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-slate-850 px-2.5 py-1.5 rounded-xl border border-slate-800/60">
                            <span className="text-xs font-black text-indigo-400">{monthlyMoodStats.totalMoodDays}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{lang === 'id' ? 'hari' : 'days'}</span>
                          </div>
                        </div>

                        {/* Segmented Mood Distribution Bar */}
                        <div className="space-y-2">
                          <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-850/40">
                            {[
                              { id: 'excellent', color: 'bg-emerald-500', count: monthlyMoodStats.counts.excellent },
                              { id: 'good', color: 'bg-teal-400', count: monthlyMoodStats.counts.good },
                              { id: 'neutral', color: 'bg-indigo-400', count: monthlyMoodStats.counts.neutral },
                              { id: 'bad', color: 'bg-orange-400', count: monthlyMoodStats.counts.bad },
                              { id: 'terrible', color: 'bg-rose-500', count: monthlyMoodStats.counts.terrible }
                            ].map(m => {
                              const percent = monthlyMoodStats.totalMoodDays > 0 ? (m.count / monthlyMoodStats.totalMoodDays) * 100 : 0;
                              if (percent === 0) return null;
                              return (
                                <div 
                                  key={m.id} 
                                  className={`h-full ${m.color} transition-all duration-500`}
                                  style={{ width: `${percent}%` }}
                                  title={`${m.id}: ${m.count}`}
                                />
                              );
                            })}
                          </div>
                        </div>

                        {/* Compact Horizontal Grid for Frequencies */}
                        <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-slate-800/40">
                          {[
                            { id: 'excellent', label: lang === 'id' ? 'Sangat Baik' : 'Excellent', textColor: 'text-emerald-400', count: monthlyMoodStats.counts.excellent },
                            { id: 'good', label: lang === 'id' ? 'Baik' : 'Good', textColor: 'text-teal-400', count: monthlyMoodStats.counts.good },
                            { id: 'neutral', label: lang === 'id' ? 'Biasa' : 'Neutral', textColor: 'text-indigo-400', count: monthlyMoodStats.counts.neutral },
                            { id: 'bad', label: lang === 'id' ? 'Buruk' : 'Bad', textColor: 'text-orange-400', count: monthlyMoodStats.counts.bad },
                            { id: 'terrible', label: lang === 'id' ? 'Sangat Buruk' : 'Terrible', textColor: 'text-rose-400', count: monthlyMoodStats.counts.terrible }
                          ].map(m => {
                            const percent = monthlyMoodStats.totalMoodDays > 0 ? Math.round((m.count / monthlyMoodStats.totalMoodDays) * 100) : 0;
                            return (
                              <div key={m.id} className="flex flex-col items-center text-center">
                                <span className={`${m.textColor} transition-transform duration-200 hover:scale-110 mb-1`}>
                                  {getMoodIcon(m.id, "w-4 h-4")}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 truncate w-full" title={m.label}>
                                  {m.label}
                                </span>
                                <span className="text-[10px] font-black text-slate-200 mt-0.5 font-mono">
                                  {percent}%
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Self Evaluation Insight Card */}
                        <div className="bg-slate-950/30 border border-slate-850/30 rounded-2xl p-3.5 mt-2">
                          <h4 className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-indigo-400" />
                            {lang === 'id' ? 'Evaluasi Diri' : 'Self Evaluation'}
                          </h4>
                          <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            {monthlyMoodStats.averageDetails.advice}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 px-4 text-xs text-slate-400 border border-dashed border-slate-800/60 rounded-xl italic">
                        {lang === 'id' 
                          ? 'Belum ada catatan mood untuk bulan ini. Log mood harianmu di atas untuk melihat analisis lengkap!' 
                          : 'No mood records logged for this month. Log your daily mood above to see full analysis!'}
                      </div>
                    )}
                  </div>
                </div>

              </div>

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

                {(selectedDetailModalTab === 'info') ? (
                  isEditingCalendarTask ? (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      if (!editCalTaskTitle.trim()) return;
                      updateTask({
                        ...selectedDetailTask,
                        title: editCalTaskTitle.trim(),
                        time: editCalTaskTime,
                        priority: editCalTaskPriority,
                      });
                      setIsEditingCalendarTask(false);
                    }} className="space-y-4 animate-fadeIn">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                          {lang === 'id' ? 'Judul Tugas' : 'Task Title'}
                        </label>
                        <input
                          type="text"
                          required
                          value={editCalTaskTitle}
                          onChange={(e) => setEditCalTaskTitle(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                            {lang === 'id' ? 'Waktu' : 'Time'}
                          </label>
                          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs">
                            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                            <input
                              type="time"
                              value={editCalTaskTime}
                              onChange={(e) => setEditCalTaskTime(e.target.value)}
                              className="bg-transparent w-full outline-none text-[11px] text-slate-200 font-bold [color-scheme:dark]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                            {lang === 'id' ? 'Prioritas' : 'Priority'}
                          </label>
                          <div className="grid grid-cols-3 gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1 h-[38px]">
                            {[
                              { val: 'Rendah', label: lang === 'id' ? 'Rndh' : 'Low', activeBg: 'bg-emerald-600 text-white' },
                              { val: 'Sedang', label: lang === 'id' ? 'Sdng' : 'Med', activeBg: 'bg-amber-500 text-slate-950' },
                              { val: 'Tinggi', label: lang === 'id' ? 'Tggi' : 'High', activeBg: 'bg-rose-600 text-white' },
                            ].map((p) => {
                              const isSel = editCalTaskPriority === p.val;
                              return (
                                <button
                                  key={p.val}
                                  type="button"
                                  onClick={() => setEditCalTaskPriority(p.val as any)}
                                  className={`rounded-lg text-[10px] font-extrabold transition-all ${isSel ? p.activeBg + ' scale-[1.02]' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                  {p.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2.5 pt-3">
                        <button
                          type="button"
                          onClick={() => setIsEditingCalendarTask(false)}
                          className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs border border-slate-700 transition-all"
                        >
                          {lang === 'id' ? 'Batal' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/10 transition-all"
                        >
                          {lang === 'id' ? 'Simpan' : 'Save'}
                        </button>
                      </div>
                    </form>
                  ) : (
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
                  )
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

                    {selectedDetailTask.isDiscipline && selectedDetailTask.disciplineData?.punishment && (
                      <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-3.5 flex items-center justify-between text-left animate-in fade-in duration-200">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-rose-400 uppercase font-black tracking-wider block">
                            {lang === 'id' ? 'Penyelesaian Hukuman' : 'Consequence Cleared'}
                          </span>
                          <span className="text-xs text-slate-300 block">
                            {selectedDetailTask.disciplineData.punishment}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xl font-black text-rose-400 block">
                            {(selectedDetailTask.disciplineData.punishmentCompletedDates || []).length}
                          </span>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                            {lang === 'id' ? 'kali dilakukan' : 'times done'}
                          </span>
                        </div>
                      </div>
                    )}

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
                              <button 
                                type="button"
                                disabled={day.isFuture}
                                onClick={() => {
                                  toggleTask(selectedDetailTask.id, day.dateStr);
                                }}
                                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex flex-col items-center justify-center text-[10px] sm:text-xs font-black transition-all relative ${getDayStyles()} ${
                                  day.isToday ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900' : ''
                                } ${
                                  day.isFuture 
                                    ? 'cursor-not-allowed opacity-40' 
                                    : 'cursor-pointer hover:scale-110 hover:brightness-125 active:scale-95 shadow-[0_0_8px_rgba(99,102,241,0.1)]'
                                }`}
                                title={
                                  day.isFuture 
                                    ? `${day.dateStr} (${lang === 'id' ? 'Mendatang' : 'Upcoming'})` 
                                    : `${day.dateStr} (${lang === 'id' ? 'Klik untuk ubah status' : 'Click to toggle status'})`
                                }
                              >
                                <span>{day.dayNum}</span>
                                {day.isCompleted && (
                                  <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 w-3.5 h-3.5 rounded-full flex items-center justify-center border border-slate-900 shadow-sm">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-2 h-2">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  </div>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Footer Actions */}
              <div className="p-4 sm:p-5 border-t border-slate-800/60 bg-slate-950/20 flex items-center justify-center gap-3.5 flex-none">
                {!isEditingCalendarTask && (
                  <>
                    {selectedDetailTask.deleted ? (
                      <div className="flex items-center justify-center gap-3.5 w-full">
                        {/* Restore Button */}
                        <button
                          onClick={() => {
                            updateTask({ ...selectedDetailTask, deleted: false });
                            setSelectedDetailTaskId(null);
                          }}
                          className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center shadow-lg shadow-emerald-500/5"
                          title={lang === 'id' ? 'Pulihkan Tugas' : 'Restore Task'}
                        >
                          <Check className="w-4.5 h-4.5" />
                        </button>

                        {/* Delete Permanently Button */}
                        <button
                          onClick={() => {
                            deleteTask(selectedDetailTask.id);
                            setSelectedDetailTaskId(null);
                          }}
                          className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center shadow-lg shadow-rose-500/5"
                          title={lang === 'id' ? 'Hapus Permanen' : 'Delete Permanently'}
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>

                        {/* Close Button */}
                        <button
                          onClick={() => setSelectedDetailTaskId(null)}
                          className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center"
                          title={lang === 'id' ? 'Tutup' : 'Close'}
                        >
                          <X className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3.5 w-full">
                        {/* Toggle Checkmark Button */}
                        <button
                          onClick={() => {
                            toggleTask(selectedDetailTask.id, selectedDateStr);
                          }}
                          className={`w-10 h-10 rounded-xl hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center ${
                            isDetailTaskCompleted 
                              ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/25 shadow-lg shadow-rose-500/5' 
                              : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/25'
                          }`}
                          title={
                            isDetailTaskCompleted 
                              ? (lang === 'id' ? 'Batalkan Selesai' : 'Undo Complete') 
                              : (lang === 'id' ? 'Tandai Selesai' : 'Mark Complete')
                          }
                        >
                          <CheckCircle2 className="w-4.5 h-4.5" />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => setIsEditingCalendarTask(true)}
                          className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 hover:border-indigo-500/40 hover:text-indigo-400 hover:scale-[1.03] active:scale-[0.97] text-slate-300 transition-all flex items-center justify-center"
                          title={lang === 'id' ? 'Edit Tugas' : 'Edit Task'}
                        >
                          <Edit2 className="w-4.5 h-4.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            deleteTask(selectedDetailTask.id);
                            setSelectedDetailTaskId(null);
                          }}
                          className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 hover:border-rose-500/40 hover:text-rose-400 hover:scale-[1.03] active:scale-[0.97] text-slate-300 transition-all flex items-center justify-center"
                          title={lang === 'id' ? 'Hapus' : 'Delete'}
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>

                        {/* Close Button */}
                        <button
                          onClick={() => setSelectedDetailTaskId(null)}
                          className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center"
                          title={lang === 'id' ? 'Tutup' : 'Close'}
                        >
                          <X className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    )}
                  </>
                )}
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
