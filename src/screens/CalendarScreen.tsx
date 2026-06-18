import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Activity, Flame } from 'lucide-react';
import { useAppStore } from '../store';
import { useTranslation } from '../translations';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { tasks, moods, lang, streak } = useAppStore();
  const t = useTranslation(lang);

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
       case 'excellent': return 'Sangat Baik';
       case 'good': return 'Baik';
       case 'neutral': return 'Biasa';
       case 'bad': return 'Buruk';
       case 'terrible': return 'Sangat Buruk';
       default: return 'Tidak Ada Data';
    }
  };

  const getMoodColorClass = (id: string | null) => {
    switch (id) {
       case 'excellent': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
       case 'good': return 'text-teal-400 bg-teal-500/10 border-teal-500/30';
       case 'neutral': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
       case 'bad': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
       case 'terrible': return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
       default: return 'text-slate-500 bg-slate-800/30 border-slate-700/30';
    }
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const blanks = Array(firstDayOfMonth).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handlePrevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));

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
  const selectedDateStr = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  const todayDate = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000));
  const todayStr = todayDate.toISOString().split('T')[0];
  
  const tmr = new Date(todayDate);
  tmr.setDate(tmr.getDate() + 1);
  const tomorrowStr = tmr.toISOString().split('T')[0];

  const getTaskDateStr = (dateVal: string) => {
     if (dateVal === 'Hari ini' || dateVal === 'Hari Ini') return todayStr;
     if (dateVal === 'Besok') return tomorrowStr;
     return dateVal;
  };

  const startOfWeek = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day; // Start on Sunday
  startOfWeek.setDate(diff);
  
  const endOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 6);

  const selectedTasks = tasks.filter(t => {
     const tDateStr = getTaskDateStr(t.date);
     if (!tDateStr || !tDateStr.includes('-')) return false;
     
     const [y, m, d] = tDateStr.split('-').map(Number);
     const tD = new Date(y, m - 1, d);

     if (viewType === 'Harian') {
       return tDateStr === selectedDateStr;
     } else if (viewType === 'Mingguan') {
       return tD >= startOfWeek && tD <= endOfWeek;
     } else if (viewType === 'Bulanan') {
       return tD.getMonth() === selectedDate.getMonth() && tD.getFullYear() === selectedDate.getFullYear();
     } else if (viewType === 'Tahunan') {
       return tD.getFullYear() === selectedDate.getFullYear();
     }
     return false;
  });

  const monthNames = Array.from({ length: 12 }, (_, i) => {
    return new Date(2023, i, 1).toLocaleDateString(locale, { month: 'long' });
  });

  const completedCount = selectedTasks.filter(t => t.completed).length;
  const activeCount = selectedTasks.filter(t => !t.completed).length;
  // Prevent Recharts visual glitch by removing padding angle if only one data type exists
  const safePaddingAngle = (completedCount > 0 && activeCount > 0) ? 5 : 0;
  
  const pieData = [
    { name: t('completed') || 'Selesai', value: completedCount, color: '#34d399' },
    { name: t('active') || 'Aktif', value: activeCount, color: '#fb923c' }
  ].filter(d => d.value > 0);



  const completionPercentageNumber = selectedTasks.length > 0 ? Math.round((completedCount / selectedTasks.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-slate-950 font-sans text-slate-200">
      {/* Top Bar */}
      <div className="flex-none h-16 border-b border-slate-800 bg-slate-900 px-6 flex items-center gap-4">
        <span className="font-bold text-2xl text-slate-50 tracking-tight flex-1">{t('calendar')}</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 w-full">
        <div className="w-full px-6 py-6 space-y-6">
          
          {/* Month Navigation */}
          <div className="flex justify-between items-center mb-6 px-1">
            <button className="p-2 -ml-2 text-slate-400 hover:text-slate-50 transition-colors" onClick={handlePrevMonth}>
              <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
            </button>
            <h2 className="text-xl md:text-2xl font-bold text-slate-50 tracking-tight">{monthNames[currentMonth]} {currentYear}</h2>
            <button className="p-2 -mr-2 text-slate-400 hover:text-slate-50 transition-colors" onClick={handleNextMonth}>
              <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:p-4 lg:gap-4 sm:p-4 md:p-5">
            <div className="flex flex-col gap-4 md:p-5">
              {/* Calendar Grid */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-4 md:p-4 mb-6">
                {/* Days Header */}
                <div className="grid grid-cols-7 mb-4">
                  {daysOfWeek.map((day, i) => (
                    <div key={i} className="text-center text-[10px] md:text-xs uppercase font-bold text-slate-500 tracking-widest">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-4 md:gap-y-6 lg:gap-y-8">
                  {blanks.map((_, i) => (
                    <div key={`blank-${i}`} className="flex items-center justify-center"></div>
                  ))}
                  {days.map((day) => {
                    const cellDateObj = new Date(currentYear, currentMonth, day);
                    const cellDateStr = new Date(cellDateObj.getTime() - (cellDateObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
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

              {/* Streak Info */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-4 md:p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 md:w-16 md:h-16 bg-orange-500/10 text-orange-400 rounded-2xl flex items-center justify-center">
                     <Flame className="w-6 h-6 md:w-8 md:h-8" />
                   </div>
                   <div>
                     <h4 className="text-slate-50 font-bold md:text-xl">{t('streak')}</h4>
                     <p className="text-xs md:text-sm text-slate-400">{t('streakKeep')}</p>
                   </div>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-3xl md:text-4xl font-black text-orange-400 tracking-tighter">{streak}</span>
                   <span className="text-[10px] md:text-xs uppercase font-bold text-orange-400/70 tracking-widest">{t('days')}</span>
                </div>
              </div>

              {/* Monthly Average Mood */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-4 md:p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center border border-transparent ${getMoodColorClass(avgMood)}`}>
                     {getMoodIcon(avgMood || 'neutral', "w-6 h-6 md:w-8 md:h-8")}
                   </div>
                   <div>
                     <h4 className="text-slate-50 font-bold md:text-xl">Rata-rata Mood</h4>
                     <p className="text-xs md:text-sm text-slate-400">Dalam bulan ini</p>
                   </div>
                </div>
                <div className="flex flex-col items-end">
                   <span className={`text-xl md:text-2xl font-black tracking-tighter text-right ${avgMood ? getMoodColorClass(avgMood).split(' ')[0] : 'text-slate-500'}`}>
                     {getMoodLabel(avgMood)}
                   </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              {/* Stats Section */}
              <div className="mb-4">
                {/* View Toggle */}
                <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 mb-6">
                  {['Harian', 'Mingguan', 'Bulanan', 'Tahunan'].map((type, idx) => {
                    const displayType = [t('daily') || 'Harian', t('weekly') || 'Mingguan', t('monthly') || 'Bulanan', t('yearly') || 'Tahunan'];
                    return (
                    <button 
                      key={type}
                      onClick={() => setViewType(type as any)}
                      className={`flex-1 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${viewType === type ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
                    >
                      {displayType[idx]}
                    </button>
                  )})}
                </div>

                <h3 className="text-sm md:text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">
                  {t('statistics') || 'Statistik'} {viewType === 'Harian' ? `- ${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}` : 
                            viewType === 'Mingguan' ? `- ${startOfWeek.getDate()} ${monthNames[startOfWeek.getMonth()]} - ${endOfWeek.getDate()} ${monthNames[endOfWeek.getMonth()]} ${endOfWeek.getFullYear()}` : 
                            viewType === 'Bulanan' ? `- ${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}` : 
                            `- ${selectedDate.getFullYear()}`}
                </h3>
                
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-4 sm:p-4 md:p-4 mb-6">
                  <div className="flex items-center gap-4 mb-6 md:mb-8">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center">
                      <Activity className="w-6 h-6 md:w-7 md:h-7" />
                    </div>
                    <div>
                      <h4 className="text-slate-50 font-bold md:text-xl">{t('taskSummary') || 'Ringkasan Tugas'}</h4>
                      <p className="text-xs md:text-sm text-slate-400">{t('todayAchievement') || 'Pencapaian hari ini'}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center">
                      <div className="text-2xl md:text-3xl font-bold text-slate-50 mb-1">{selectedTasks.length}</div>
                      <div className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-slate-500">{t('total') || 'Total'}</div>
                    </div>
                    <div className="flex-1 bg-slate-950 border border-emerald-900/50 rounded-2xl p-4 text-center">
                      <div className="text-2xl md:text-3xl font-bold text-emerald-400 mb-1">{completedCount}</div>
                      <div className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-emerald-600">{t('completed') || 'Selesai'}</div>
                    </div>
                    <div className="flex-1 bg-slate-950 border border-orange-900/50 rounded-2xl p-4 text-center">
                      <div className="text-2xl md:text-3xl font-bold text-orange-400 mb-1">{activeCount}</div>
                      <div className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-orange-600">{t('active') || 'Aktif'}</div>
                    </div>
                  </div>

                  {selectedTasks.length > 0 && (
                    <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-slate-800">
                      <h5 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 md:mb-6 text-center">{t('completionPercentage') || 'Persentase Selesai'}</h5>
                      <div className="h-40 md:h-56 w-full relative">
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-3xl md:text-4xl font-bold text-slate-50">{completionPercentageNumber}%</span>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={85}
                              paddingAngle={safePaddingAngle}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                              itemStyle={{ color: '#f8fafc', fontSize: '14px', fontWeight: 'bold' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
                
              </div>
            </div>
          </div>
        </div>
      </div>

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
