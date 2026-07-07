import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus, Trash2, ClipboardList, Repeat, Bell, X, Target, Image as ImageIcon, Calendar, CheckSquare, Pencil, Camera, ChevronRight, Flame, Gift, AlertTriangle, Pin, Check } from 'lucide-react';
import { useAppStore } from '../store';
import { useTranslation } from '../translations';
import { Task } from '../types';
import { generateId } from '../utils';

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

export default function TasksScreen({ onNavigate }: { onNavigate?: (s: any) => void }) {
  const [activeTab, setActiveTab] = useState<'Biasa' | 'Disiplin'>('Biasa');
  const [sortBy, setSortBy] = useState<'waktu' | 'level'>(() => {
    try {
      return (localStorage.getItem('noto_tasks_sort') as 'waktu' | 'level') || 'waktu';
    } catch(e) {
      return 'waktu';
    }
  });
  const [showCompleted, setShowCompleted] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'Tinggi' | 'Sedang' | 'Rendah'>('Sedang');
  const [newTaskRepeat, setNewTaskRepeat] = useState<'once' | 'daily'>('once');
  const [newTaskDate, setNewTaskDate] = useState<string>(getLocalIsoDate(new Date()));
  const [newTaskAlarm, setNewTaskAlarm] = useState<string>('');
  const [newTaskIsDiscipline, setNewTaskIsDiscipline] = useState<boolean>(false);
  const { tasks, addTask, updateTask, toggleTask, lang, checkInDaily } = useAppStore();
  const t = useTranslation(lang);

  const openEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskPriority(task.priority);
    setNewTaskRepeat(task.repeat || 'once');
    setNewTaskDate(task.date || getLocalIsoDate(new Date()));
    setNewTaskAlarm(task.alarmTime || '');
    setNewTaskIsDiscipline(!!task.isDiscipline);
    setIsAddingTask(true);
  }, []);

  const handleAddTaskSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newTaskTitle.trim()) {
       if (newTaskAlarm && 'Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
         Notification.requestPermission().catch(() => {});
       }
       
       const now = new Date();
       const currentHour = now.getHours().toString().padStart(2, '0');
       const currentMinute = now.getMinutes().toString().padStart(2, '0');
       const currentTime = `${currentHour}:${currentMinute}`;
       const localDate = now;
       const todayDate = getLocalIsoDate(localDate);

       // Prevent immediate notification if user schedules an alarm in the past
       const isTodayTask = newTaskDate === 'Hari ini' || newTaskDate.toLowerCase() === 'today' || newTaskDate === todayDate || newTaskRepeat === 'daily';

       if (newTaskIsDiscipline) {
         // remove discipline flag from all other tasks
         tasks.forEach(t => {
           if (t.isDiscipline && t.id !== editingTask?.id) {
             updateTask({ ...t, isDiscipline: false });
           }
         });
       }

       if (editingTask) {
         updateTask({
           ...editingTask,
           title: newTaskTitle.trim(),
           priority: newTaskPriority,
           repeat: newTaskRepeat,
           date: newTaskDate,
           alarmTime: newTaskAlarm || undefined,
           isDiscipline: newTaskIsDiscipline,
           disciplineData: newTaskIsDiscipline ? (editingTask.disciplineData || {}) : undefined
         });
         if (newTaskAlarm && isTodayTask && newTaskAlarm <= currentTime) {
           try { localStorage.setItem(`noto_alarm_${editingTask.id}_${todayDate}`, 'true'); } catch(e){}
         }
       } else {
         const locale = lang === 'en' ? 'en-US' : 'id-ID';
         const newId = generateId();
         addTask({
           id: newId,
           title: newTaskTitle.trim(),
           completed: false,
           priority: newTaskPriority,
           date: newTaskDate,
           createdAt: todayDate,
           time: new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
           repeat: newTaskRepeat,
           alarmTime: newTaskAlarm || undefined,
           isDiscipline: newTaskIsDiscipline,
           disciplineData: newTaskIsDiscipline ? {} : undefined
         });
         if (newTaskAlarm && isTodayTask && newTaskAlarm <= currentTime) {
           try { localStorage.setItem(`noto_alarm_${newId}_${todayDate}`, 'true'); } catch(e){}
         }
       }
    }
    setNewTaskTitle('');
    setNewTaskPriority('Sedang');
    setNewTaskRepeat('once');
    setNewTaskDate(getLocalIsoDate(new Date()));
    setNewTaskAlarm('');
    setNewTaskIsDiscipline(false);
    setIsAddingTask(false);
    setEditingTask(null);
  };

  const { todayTasks, overdueTasks, upcomingTasks, noDateTasks, completedTasks, disciplineTask, filteredTasks, deletedTasks } = useMemo(() => {
    const todayStr = getLocalIsoDate(new Date());

    const getTaskDateStr = (t: any) => {
        if (t.date === 'Hari ini' || t.date === 'Hari Ini') return todayStr;
        if (t.date === 'Besok') {
            const tmr = getLocalDateFromStr(todayStr);
            tmr.setDate(tmr.getDate() + 1);
            return getLocalIsoDate(tmr);
        }
        return t.date;
    };

    let allTasks = [...(tasks || [])].filter(t => t !== null && t !== undefined);
    let activeTasks = allTasks.filter(t => !t.deleted);
    let delTasks = allTasks.filter(t => t.deleted);
    
    // For Biasa view, we only partition tasks
    const uncompleted = activeTasks.filter(t => !t.completed && !t.isDiscipline);
    const completed = activeTasks.filter(t => t.completed);

    const isTodayTask = (t: any) => getTaskDateStr(t) === todayStr || t?.repeat === 'daily';
    const isOverdueTask = (t: any) => {
        const d = getTaskDateStr(t);
        return d && d < todayStr && t?.repeat !== 'daily';
    };
    const isUpcomingTask = (t: any) => {
        const d = getTaskDateStr(t);
        return d && d > todayStr && t?.repeat !== 'daily';
    };
    const isNoDateTask = (t: any) => !t.date && t?.repeat !== 'daily';

    const sortTasks = (taskList: any[]) => {
      return [...taskList].sort((a, b) => {
        if (sortBy === 'level') {
          const priorityMap: Record<string, number> = {
            'Tinggi': 3,
            'Sedang': 2,
            'Rendah': 1
          };
          const aPriority = priorityMap[a.priority] || 2;
          const bPriority = priorityMap[b.priority] || 2;
          if (bPriority !== aPriority) {
            return bPriority - aPriority;
          }
        }
        
        const aDate = getTaskDateStr(a) || '';
        const bDate = getTaskDateStr(b) || '';
        if (aDate !== bDate) {
          return aDate.localeCompare(bDate);
        }

        if (a.alarmTime && b.alarmTime) {
          return a.alarmTime.localeCompare(b.alarmTime);
        }
        if (a.alarmTime) return -1;
        if (b.alarmTime) return 1;

        const aTime = a.time || '';
        const bTime = b.time || '';
        return aTime.localeCompare(bTime);
      });
    };

    const todayTasks = sortTasks(uncompleted.filter(isTodayTask));
    const overdueTasks = sortTasks(uncompleted.filter(isOverdueTask));
    const upcomingTasks = sortTasks(uncompleted.filter(isUpcomingTask));
    const noDateTasks = sortTasks(uncompleted.filter(isNoDateTask));
    const sortedCompleted = sortTasks(completed);
    const sortedDeleted = sortTasks(delTasks);

    const disciplineTask = tasks.find(t => t.isDiscipline && !t.completed && !t.deleted);

    return { 
      todayTasks, 
      overdueTasks, 
      upcomingTasks, 
      noDateTasks, 
      completedTasks: sortedCompleted, 
      disciplineTask, 
      filteredTasks: uncompleted, 
      deletedTasks: sortedDeleted 
    };
  }, [tasks, sortBy]);

  const handleSelectExisting = useCallback(() => { 
    setNewTaskIsDiscipline(true); 
    setNewTaskPriority('Tinggi');
    setNewTaskRepeat('daily');
    setNewTaskDate(getLocalIsoDate(new Date()));
    setIsAddingTask(true); 
  }, []);

  return (
    <div className="flex flex-col h-full font-sans text-slate-200">
      {/* Top Bar */}
      <div className="flex-none pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-2 px-6 flex items-center justify-between border-b border-slate-800/50 bg-slate-900/80">
        <div className="flex items-center gap-4">
          <span className="font-bold text-2xl text-slate-50 tracking-tight">{t('tasksMenu')}</span>
        </div>
        {activeTab === 'Biasa' && (
          <div className="flex items-center gap-0.5 bg-slate-950/80 border border-slate-800/60 rounded-xl p-0.5 text-[10px]">
            <button
              onClick={() => {
                setSortBy('waktu');
                try { localStorage.setItem('noto_tasks_sort', 'waktu'); } catch(e){}
              }}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all duration-200 cursor-pointer ${sortBy === 'waktu' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {lang === 'id' ? 'Waktu' : 'Time'}
            </button>
            <button
              onClick={() => {
                setSortBy('level');
                try { localStorage.setItem('noto_tasks_sort', 'level'); } catch(e){}
              }}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all duration-200 cursor-pointer ${sortBy === 'level' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {lang === 'id' ? 'Level' : 'Level'}
            </button>
          </div>
        )}
      </div>

      {/* Mode Selector */}
      <div className="px-4 py-3">
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 relative shadow-inner">
          <div 
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-transform duration-300 ease-out ${activeTab === 'Disiplin' ? 'bg-gradient-to-r from-orange-500 to-rose-500 shadow-sm translate-x-[calc(100%+4px)]' : 'bg-indigo-600 shadow-sm translate-x-0'}`} 
          />
          <button 
            onClick={() => setActiveTab('Biasa')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors z-10 ${activeTab !== 'Disiplin' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <ClipboardList className="w-4 h-4" />
            {lang === 'id' ? 'Tugas Biasa' : 'Normal Tasks'}
          </button>
          <button 
            onClick={() => setActiveTab('Disiplin')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors z-10 ${activeTab === 'Disiplin' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Target className="w-4 h-4" />
            {lang === 'id' ? 'Fokus Disiplin' : 'Discipline Focus'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 w-full">
        <div className="w-full px-4 md:px-6 py-6 space-y-6">
          
          {activeTab === 'Disiplin' ? (
            <DisciplineView task={disciplineTask} onSelectExisting={handleSelectExisting} lang={lang} />
          ) : (
            <>
              {filteredTasks.length === 0 && completedTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                  <ClipboardList className="w-12 h-12 mb-4 text-slate-800" />
                  <div className="text-center font-medium text-sm md:text-base">
                    {lang === 'id' ? 'Belum ada tugas.' : 'No tasks.'}
                  </div>
                </div>
              )}

              {/* Group: Terlewat (Overdue) */}
              {overdueTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3 ml-2 mt-2">
                  <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest">{t('overdue')}</h3>
                  <span className="text-[10px] text-rose-500 font-medium bg-rose-500/10 px-2 py-0.5 rounded-md">{overdueTasks.length}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800/80 rounded-3xl flex flex-col overflow-hidden shadow-sm">
                   {overdueTasks.map((task, i) => (
                     <TaskCard key={task.id} task={task} last={i === overdueTasks.length - 1} onToggle={toggleTask} onEdit={openEditTask} />
                   ))}
                </div>
              </div>
              )}

              {/* Group: Hari Ini (Today) */}
              {todayTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3 ml-2 mt-4">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{t('today')}</h3>
                  <span className="text-[10px] text-indigo-400 font-medium bg-indigo-500/10 px-2 py-0.5 rounded-md">{todayTasks.length}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800/80 rounded-3xl flex flex-col overflow-hidden shadow-sm">
                   {todayTasks.map((task, i) => (
                     <TaskCard key={task.id} task={task} last={i === todayTasks.length - 1} onToggle={toggleTask} onEdit={openEditTask} />
                   ))}
                </div>
              </div>
              )}

              {/* Group: Akan Datang (Upcoming) */}
              {upcomingTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3 ml-2 mt-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('upcoming')}</h3>
                  <span className="text-[10px] text-slate-400 font-medium bg-slate-800/80 px-2 py-0.5 rounded-md">{upcomingTasks.length}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800/80 rounded-3xl flex flex-col overflow-hidden shadow-sm">
                   {upcomingTasks.map((task, i) => (
                     <TaskCard key={task.id} task={task} last={i === upcomingTasks.length - 1} onToggle={toggleTask} onEdit={openEditTask} />
                   ))}
                </div>
              </div>
              )}

              {/* Group: Tanpa Tanggal (No Date) */}
              {noDateTasks.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3 ml-2 mt-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('noDate')}</h3>
                  <span className="text-[10px] text-slate-400 font-medium bg-slate-800/80 px-2 py-0.5 rounded-md">{noDateTasks.length}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800/80 rounded-3xl flex flex-col overflow-hidden shadow-sm">
                   {noDateTasks.map((task, i) => (
                     <TaskCard key={task.id} task={task} last={i === noDateTasks.length - 1} onToggle={toggleTask} onEdit={openEditTask} />
                   ))}
                </div>
              </div>
              )}

              {/* Group: Selesai */}
              {completedTasks.length > 0 && (
              <div className="mt-8">
                <button 
                  onClick={() => setShowCompleted(!showCompleted)} 
                  className="w-full flex items-center justify-between p-4 bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CheckSquare className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-sm font-bold text-slate-300">{lang === 'id' ? 'Tugas Selesai' : 'Completed Tasks'}</h3>
                    <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md">{completedTasks.length}</span>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${showCompleted ? 'rotate-90' : ''}`} />
                </button>
                {showCompleted && (
                  <div className="bg-slate-900 border border-slate-800/80 rounded-3xl flex flex-col overflow-hidden shadow-sm mt-3">
                      {completedTasks.map((task, i) => (
                        <TaskCard key={task.id} task={task} last={i === completedTasks.length - 1} onToggle={toggleTask} onEdit={openEditTask} />
                      ))}
                  </div>
                )}
              </div>
              )}

              {/* Group: Terhapus / Arsip (Trash / Archive) */}
              {deletedTasks.length > 0 && (
              <div className="mt-4">
                <button 
                  onClick={() => setShowDeleted(!showDeleted)} 
                  className="w-full flex items-center justify-between p-4 bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 rounded-2xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5 text-slate-500" />
                    <h3 className="text-sm font-bold text-slate-300">{lang === 'id' ? 'Riwayat & Arsip Tugas (Terhapus)' : 'History & Task Archive (Deleted)'}</h3>
                    <span className="text-[10px] text-slate-400 font-medium bg-slate-800/80 px-2 py-0.5 rounded-md">{deletedTasks.length}</span>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${showDeleted ? 'rotate-90' : ''}`} />
                </button>
                {showDeleted && (
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl flex flex-col overflow-hidden shadow-sm mt-3">
                      {deletedTasks.map((task, i) => (
                        <TaskCard key={task.id} task={task} last={i === deletedTasks.length - 1} onToggle={toggleTask} onEdit={openEditTask} />
                      ))}
                  </div>
                )}
              </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* FAB Add */}
      {!isAddingTask && activeTab !== 'Disiplin' && (
        <button onClick={() => { setNewTaskIsDiscipline(false); setIsAddingTask(true); }} className="absolute bottom-8 right-6 w-16 h-16 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-indigo-600/30 transition-transform active:scale-95 z-50">
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      )}

      {isAddingTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex flex-col pt-8 sm:p-4 animate-in fade-in duration-200 overflow-y-auto overscroll-none">
           <div className="bg-slate-900 border-t sm:border border-slate-800 p-4 sm:p-4 md:p-4 rounded-t-3xl sm:rounded-3xl w-full max-w-[480px] mx-auto mt-auto sm:my-auto animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 shadow-2xl relative">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-slate-200">{editingTask ? (lang === 'id' ? 'Edit Tugas' : 'Edit Task') : (lang === 'id' ? 'Tugas Baru' : 'New Task')}</h3>
                <button onClick={() => { setIsAddingTask(false); setEditingTask(null); setNewTaskTitle(''); setNewTaskIsDiscipline(false); }} className="p-2 bg-slate-800/80 hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-200 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddTaskSubmit}>
                 <textarea 
                   autoFocus
                   value={newTaskTitle}
                   onChange={e => setNewTaskTitle(e.target.value)}
                   placeholder={t('taskPlaceholder') || "Contoh: Belajar UI/UX..."}
                   className="w-full min-h-[80px] bg-slate-950/80 border border-slate-800/80 rounded-2xl px-4 py-4 text-xl text-slate-50 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500/50 focus:bg-slate-950 mb-5 resize-none transition-all"
                 />
                 
                 <div className="space-y-4 mb-6">
                   {/* Priority */}
                   {!newTaskIsDiscipline && (
                   <div>
                     <span className="text-[10px] text-slate-400 font-medium mb-1.5 ml-1 block">{lang === 'id' ? 'Prioritas' : 'Priority'}</span>
                     <div className="flex gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800/50">
                       {(['Rendah', 'Sedang', 'Tinggi'] as const).map(p => {
                         const pLabel = p === 'Tinggi' ? t('high') || p : p === 'Sedang' ? t('medium') || p : t('low') || p;
                         const activeClass = 
                            p === 'Tinggi' ? 'bg-orange-500/20 text-orange-400 font-bold shadow-sm' : 
                            p === 'Sedang' ? 'bg-blue-500/20 text-blue-400 font-bold shadow-sm' : 
                            'bg-slate-700/50 text-slate-300 font-bold shadow-sm';
                         return (
                         <button
                           key={p}
                           type="button"
                           onClick={() => setNewTaskPriority(p)}
                           className={`flex-1 py-1.5 text-xs rounded-lg transition-all ${newTaskPriority === p ? activeClass : 'text-slate-400 hover:text-slate-400 hover:bg-slate-800/80'}`}
                         >
                           {pLabel}
                         </button>
                       )})}
                     </div>
                   </div>
                   )}

                   {/* Date & Time */}
                   <div className="flex gap-3">
                     {!newTaskIsDiscipline && (
                     <div className="flex-1">
                       <span className="text-[10px] text-slate-400 font-medium mb-1.5 ml-1 block">{lang === 'id' ? 'Tanggal' : 'Date'}</span>
                       <input
                         type="date"
                         value={newTaskDate}
                         onChange={e => setNewTaskDate(e.target.value)}
                         className="w-full bg-slate-950/80 border border-slate-800/50 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                         
                       />
                     </div>
                     )}
                     <div className="flex-1">
                       <span className="text-[10px] text-slate-400 font-medium mb-1.5 ml-1 flex items-center gap-1">
                         <Bell className="w-3 h-3 text-indigo-400" />
                         {lang === 'id' ? 'Pengingat' : 'Reminder'}
                       </span>
                       <div className="relative">
                         <input
                           type="time"
                           value={newTaskAlarm}
                           onChange={e => setNewTaskAlarm(e.target.value)}
                           className="w-full bg-slate-950/80 border border-slate-800/50 rounded-xl pl-3 pr-8 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                           
                         />
                         {newTaskAlarm && (
                           <button 
                             type="button" 
                             onClick={() => setNewTaskAlarm('')}
                             className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors bg-slate-800 rounded-full p-0.5"
                           >
                             <X className="w-3 h-3" />
                           </button>
                         )}
                       </div>
                     </div>
                   </div>

                   {/* Repeat */}
                   {!newTaskIsDiscipline && (
                   <div>
                     <span className="text-[10px] text-slate-400 font-medium mb-1.5 ml-1 block">{lang === 'id' ? 'Perulangan' : 'Repeat'}</span>
                     <div className="flex gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800/50">
                       <button
                         type="button"
                         onClick={() => setNewTaskRepeat('once')}
                         className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-lg transition-all ${newTaskRepeat === 'once' ? 'bg-slate-700/50 text-slate-200 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-400 hover:bg-slate-800/80'}`}
                       >
                         {lang === 'id' ? 'Sekali Aja' : 'Once'}
                       </button>
                       <button
                         type="button"
                         onClick={() => setNewTaskRepeat('daily')}
                         className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-lg transition-all ${newTaskRepeat === 'daily' ? 'bg-indigo-500/20 text-indigo-400 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-400 hover:bg-slate-800/80'}`}
                       >
                         <Repeat className="w-3 h-3" />
                         {lang === 'id' ? 'Tiap Hari' : 'Daily'}
                       </button>
                     </div>
                   </div>
                   )}

                   {/* Discipline Indicator */}
                   {newTaskIsDiscipline && (
                     <div className="flex items-center justify-between p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mt-4">
                       <div className="flex flex-col">
                         <span className="text-sm font-bold text-indigo-400">{lang === 'id' ? '🔥 Fokus Disiplin' : '🔥 Discipline Focus'}</span>
                         <span className="text-[10px] text-slate-400">{lang === 'id' ? 'Tugas ini akan disetel sebagai target utama Anda.' : 'This task will be set as your main target.'}</span>
                       </div>
                     </div>
                   )}
                 </div>

                  {editingTask?.deleted && (
                    <button 
                      type="button" 
                      onClick={() => {
                        updateTask({ ...editingTask, deleted: false });
                        setIsAddingTask(false);
                        setEditingTask(null);
                        setNewTaskTitle('');
                      }} 
                      className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors mb-3 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10"
                    >
                      <Check className="w-4 h-4" />
                      <span>{lang === 'id' ? 'Pulihkan Tugas Ini' : 'Restore This Task'}</span>
                    </button>
                  )}
                 <button type="submit" className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20">{t('save')}</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

const TaskCard = React.memo<{ task: Task, last?: boolean, onToggle: (id: string) => void, onEdit: (task: Task) => void }>(({ task, last, onToggle, onEdit }) => {
  const isHigh = task.priority === 'Tinggi';
  const isMed = task.priority === 'Sedang';
  const { updateTask, deleteTask, lang } = useAppStore();
  const t = useTranslation(lang);

  let dailyStats = null;
  if (task.repeat === 'daily' && task.createdAt) {
    const today = getLocalIsoDate(new Date());
    const createdDate = task.createdAt.split('T')[0];
    const start = getLocalDateFromStr(createdDate);
    const end = getLocalDateFromStr(today);
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    
    let diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays < 1) diffDays = 1;
    
    const allCompletedDates = new Set(task.completedDates || []);
    if (task.completed) allCompletedDates.add(today);
    
    const completedDays = Array.from(allCompletedDates).filter(d => d >= createdDate && d <= today).length;
    const missedDays = Math.max(0, diffDays - completedDays);
    
    dailyStats = { completed: completedDays, missed: missedDays };
  }

  return (
    <div className={`flex items-start gap-4 group border-slate-800/60 cursor-pointer px-4 ${!last ? 'border-b py-4' : 'pt-4 pb-4'} ${task.deleted ? 'bg-slate-950/20' : ''}`}>
      {task.deleted ? (
        <div className="p-4 -ml-4 flex-none flex items-center justify-center mt-0" title={lang === 'id' ? 'Terhapus / Arsip' : 'Deleted / Archive'}>
          <div className="w-5 h-5 rounded-md border border-slate-800 flex items-center justify-center bg-slate-900 text-slate-500 text-[10px]">
            🗑️
          </div>
        </div>
      ) : (
        <button onClick={() => onToggle(task.id)} className="p-4 -ml-4 rounded-full flex-none flex items-center justify-center transition-colors mt-0">
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
            task.completed 
              ? 'border-indigo-500 bg-indigo-500' 
              : 'border-slate-700 group-hover:border-indigo-500'
          }`}>
            {task.completed && <div className="w-2 h-2 rounded-sm bg-white" />}
          </div>
        </button>
      )}
      <div onClick={() => onEdit(task)} className={`flex-1 ${task.completed ? 'opacity-50' : ''} ${task.deleted ? 'opacity-40 italic' : ''}`}>
         <h4 className={`text-sm font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-50'} flex items-center gap-2`}>
           <span>{task.title}</span>
           {task.deleted && (
             <span className="text-[8px] font-bold uppercase tracking-widest px-1 py-0.5 rounded text-rose-400 bg-rose-500/10 border border-rose-500/10 shrink-0">
               {lang === 'id' ? 'Terhapus' : 'Deleted'}
             </span>
           )}
         </h4>
         <div className="flex items-center gap-2 mt-1 flex-wrap">
           <span className="text-[10px] text-slate-400 font-mono">
             {task.date && task.date.includes('-') && task.date !== new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0] ? `${task.date} • ` : ''}{task.time}
           </span>
           {task.alarmTime && (
             <span className="text-[10px] flex gap-1 items-center font-bold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
               <Bell className="w-3 h-3" />
               {task.alarmTime}
             </span>
           )}
           {task.repeat === 'daily' && (
             <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 text-indigo-400 bg-indigo-500/10 flex items-center gap-1">
               <Repeat className="w-2.5 h-2.5" />
               {lang === 'id' ? 'Tiap Hari' : 'Daily'}
             </span>
           )}
           <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 ${
             isHigh ? 'text-orange-400 bg-orange-500/10' : 
             isMed ? 'text-blue-400 bg-blue-500/10' : 
             'text-emerald-400 bg-emerald-500/10'
           }`}>
             {(isHigh ? t('high') : isMed ? t('medium') : t('low')) || task.priority}
           </span>
         </div>
         {dailyStats && !task.deleted && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {lang === 'id' ? `Selesai: ${dailyStats.completed} hari` : `Done: ${dailyStats.completed} days`}
              </span>
              <span className="text-[10px] font-medium text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                {lang === 'id' ? `Bolong: ${dailyStats.missed} hari` : `Missed: ${dailyStats.missed} days`}
              </span>
            </div>
         )}
      </div>
      <div className="flex gap-1 flex-shrink-0">
        {task.deleted ? (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); updateTask({ ...task, deleted: false }); }} 
              className="p-3 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center justify-center gap-1 font-bold"
              title={lang === 'id' ? 'Pulihkan' : 'Restore'}
            >
               <Check className="w-4 h-4 shrink-0" />
               <span className="text-[10px] uppercase tracking-wider font-extrabold hidden sm:inline">{lang === 'id' ? 'Pulihkan' : 'Restore'}</span>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} 
              className="p-3 -mr-2 text-slate-500 hover:text-red-500 transition-colors flex items-center justify-center"
              title={lang === 'id' ? 'Hapus Permanen' : 'Delete Permanently'}
            >
               <Trash2 className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); updateTask({ ...task, pinned: !task.pinned }); }} 
              className="p-3 text-slate-400 hover:text-orange-400 transition-colors flex items-center justify-center"
            >
               <Pin className={`w-5 h-5 ${task.pinned ? 'fill-orange-400 text-orange-400' : ''}`} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} 
              className="p-3 -mr-2 text-slate-400 hover:text-red-400 transition-colors flex items-center justify-center"
            >
               <Trash2 className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
});

const DisciplineView = React.memo<{ task?: Task, onSelectExisting: () => void, lang: string }>(({ task, onSelectExisting, lang }) => {
  const { updateTask, checkInDaily, deleteTask } = useAppStore();
  const t = useTranslation(lang as 'id' | 'en');
  const [fullScreenImage, setFullScreenImage] = useState<{ url: string, type: 'beforePhotoUrl' | 'afterPhotoUrl' | 'after1MonthPhotoUrl' | 'after6MonthsPhotoUrl' | 'after1YearPhotoUrl' } | null>(null);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [activeTab, setActiveTab] = useState<'Aksi' | 'Jurnal' | 'Galeri'>('Aksi');
  
  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 border border-indigo-500/20">
          <Target className="w-10 h-10 text-indigo-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-200 mb-2">{lang === 'id' ? 'Fokus Disiplin' : 'Discipline Focus'}</h3>
        <p className="text-sm text-slate-400 mb-8 max-w-[280px] leading-relaxed">
          {lang === 'id' 
            ? 'Pilih 1 tugas utama yang ingin Anda ubah menjadi kebiasaan kuat. Pantau transformasi Anda di sini.' 
            : 'Select 1 main task you want to turn into a strong habit. Track your transformation here.'}
        </p>
        <button 
          onClick={onSelectExisting}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-xl shadow-indigo-600/20"
        >
          {lang === 'id' ? 'Buat Tugas Disiplin' : 'Create Discipline Task'}
        </button>
      </div>
    );
  }

  const today = getLocalIsoDate(new Date());
  const yesterdayObj = new Date();
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayDate = getLocalIsoDate(yesterdayObj);
  
  const d = task.disciplineData || {};
  const checkins = d.dailyCheckins || [];
  const rests = d.usedRestDates || [];
  
  let missedDatesCount = 0;
  const actualStartDate = d.startDate || (task.date && task.date.includes('-') ? task.date : (task.createdAt ? task.createdAt.split('T')[0] : today));
  if (actualStartDate) {
    let curr = getLocalDateFromStr(actualStartDate);
    const todayObj = getLocalDateFromStr(today);
    
    curr.setHours(0,0,0,0);
    todayObj.setHours(0,0,0,0);
    
    while (curr < todayObj) {
      const currStr = getLocalIsoDate(curr);
      if (!checkins.includes(currStr) && !rests.includes(currStr)) {
        missedDatesCount++;
      }
      curr.setDate(curr.getDate() + 1);
    }
  }
  const isPunishmentClearedToday = (d.punishmentCompletedDates || []).includes(today);
  const isMissedDay = missedDatesCount > 0;
  
  const hasStarted = checkins.length > 0;
  
  const handlePhotoUpload = (type: 'beforePhotoUrl' | 'afterPhotoUrl' | 'after1MonthPhotoUrl' | 'after6MonthsPhotoUrl' | 'after1YearPhotoUrl') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          updateTask({
            ...task,
            disciplineData: {
              ...d,
              [type]: event.target?.result as string
            }
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleRemovePhoto = (e: React.MouseEvent, type: 'beforePhotoUrl' | 'afterPhotoUrl' | 'after1MonthPhotoUrl' | 'after6MonthsPhotoUrl' | 'after1YearPhotoUrl') => {
    e.stopPropagation();
    updateTask({
      ...task,
      disciplineData: {
        ...d,
        [type]: undefined
      }
    });
  };

  const getDaysDiff = (startStr: string, endStr: string) => {
    const start = getLocalDateFromStr(startStr);
    const end = getLocalDateFromStr(endStr);
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    return Math.round((end.getTime() - start.getTime()) / 86400000);
  };

  const daysSinceStart = Math.max(1, getDaysDiff(actualStartDate, today) + 1);
  const pastDays = daysSinceStart - 1;
  const pastCheckins = checkins.includes(today) ? checkins.length - 1 : checkins.length;
  const pastRests = (d.usedRestDates || []).includes(today) ? (d.usedRestDates || []).length - 1 : (d.usedRestDates || []).length;
  const daysMissed = missedDatesCount;
  
  const daysDone = checkins.length;
  
  let daysLeftText = lang === 'id' ? 'Tanpa target' : 'No target';
  let totalTargetDays = 0;
  let isTargetReached = task.completed;
  if (d.targetDate) {
    const daysLeft = Math.max(0, getDaysDiff(today, d.targetDate));
    
    if (today >= d.targetDate) {
      isTargetReached = true;
    }
    
    if (isTargetReached) {
      daysLeftText = lang === 'id' ? 'Selesai' : 'Completed';
    } else {
      daysLeftText = `${daysLeft} ${lang === 'id' ? 'hari' : 'days'}`;
    }
    
    totalTargetDays = Math.max(daysDone + daysMissed + daysLeft, getDaysDiff(actualStartDate, d.targetDate) + 1);
  }

  return (
    <div className="animate-in fade-in duration-300 pb-8 px-1 space-y-6">
      {/* Header Profile */}
      <div className="bg-gradient-to-br from-indigo-500/10 via-slate-900/80 to-slate-900 border border-indigo-500/10 rounded-3xl p-6 relative overflow-hidden shadow-lg shadow-black/20 backdrop-blur-sm">
        <div className="absolute -top-10 -right-10 p-6 opacity-5 rotate-12">
          <Target className="w-48 h-48 text-indigo-400" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 bg-indigo-500/20 border border-indigo-500/20 px-3 py-1 rounded-full">
              {lang === 'id' ? 'Tujuan Utama' : 'Main Goal'}
            </span>
            {hasStarted && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                <Flame className="w-3 h-3" /> {d.dailyCheckins?.length || 0} {lang === 'id' ? 'Hari Streak' : 'Day Streak'}
              </span>
            )}
          </div>
          <div className="flex flex-col md:flex-row md:justify-between items-start gap-4 mb-5">
            <h2 className="text-2xl font-bold text-slate-50 pr-4 leading-tight tracking-tight">{task.title}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => updateTask({ ...task, pinned: !task.pinned })}
                className={`p-2 rounded-xl border transition-all ${task.pinned ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-slate-800/80 border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30'}`}
                title={lang === 'id' ? 'Sematkan di Beranda' : 'Pin to Home'}
              >
                <Pin className={`w-5 h-5 ${task.pinned ? 'fill-indigo-400' : ''}`} />
              </button>
              {!task.completed && (
                <button
                  onClick={() => updateTask({ ...task, completed: true })}
                  className="px-3 py-2 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 text-xs font-bold"
                  title={lang === 'id' ? 'Selesaikan Fokus' : 'Finish Focus'}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>{lang === 'id' ? 'Selesai' : 'Done'}</span>
                </button>
              )}
              <button
                onClick={() => deleteTask(task.id)}
                className="px-3 py-2 rounded-xl border bg-slate-800/80 border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all flex items-center gap-1.5 text-xs font-bold"
                title={lang === 'id' ? 'Hapus' : 'Delete'}
              >
                <Trash2 className="w-4 h-4" />
                <span>{lang === 'id' ? 'Hapus' : 'Delete'}</span>
              </button>
            </div>
          </div>
          
          {/* Progress Stats */}
          <div className="space-y-3 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
             <div className="flex items-center justify-between text-xs font-medium">
               <div className="flex flex-col">
                 <span className="text-slate-400 mb-1">{lang === 'id' ? 'Selesai' : 'Done'}</span>
                 <span className="text-emerald-400 font-bold text-sm">{daysDone} <span className="text-xs font-normal opacity-80">{lang === 'id' ? 'hari' : 'days'}</span></span>
               </div>
               <div className="flex flex-col text-center">
                 <span className="text-slate-400 mb-1">{lang === 'id' ? 'Bolong' : 'Missed'}</span>
                 <span className="text-rose-400 font-bold text-sm">{daysMissed} <span className="text-xs font-normal opacity-80">{lang === 'id' ? 'hari' : 'days'}</span></span>
               </div>
               {d.punishment && (
                 <div className="flex flex-col text-center animate-in fade-in duration-200">
                   <span className="text-slate-400 mb-1">{lang === 'id' ? 'Hukuman' : 'Consequence'}</span>
                   <span className="text-amber-500 font-bold text-sm">{(d.punishmentCompletedDates || []).length} <span className="text-xs font-normal opacity-80">{lang === 'id' ? 'kali' : 'times'}</span></span>
                 </div>
               )}
               <div className="flex flex-col text-right">
                 <span className="text-slate-400 mb-1">{lang === 'id' ? 'Sisa' : 'Left'}</span>
                 <span className="text-indigo-400 font-bold text-sm">{daysLeftText}</span>
               </div>
             </div>
             
             {/* Progress Bar */}
             {totalTargetDays > 0 ? (
               <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden flex">
                 <div style={{ width: `${(daysDone / totalTargetDays) * 100}%` }} className="bg-emerald-500 h-full transition-all duration-500"></div>
                 <div style={{ width: `${(daysMissed / totalTargetDays) * 100}%` }} className="bg-rose-500 h-full transition-all duration-500"></div>
               </div>
             ) : (
               <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden flex">
                 <div style={{ width: `${(daysDone / (daysDone + daysMissed || 1)) * 100}%` }} className="bg-emerald-500 h-full transition-all duration-500"></div>
                 <div style={{ width: `${(daysMissed / (daysDone + daysMissed || 1)) * 100}%` }} className="bg-rose-500 h-full transition-all duration-500"></div>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Custom Tabs */}
      <div className="flex gap-2 p-1 bg-slate-900/50 border border-slate-800/80 rounded-2xl">
        {(['Aksi', 'Jurnal', 'Galeri'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800/50'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {/* TAB: AKSI */}
        {activeTab === 'Aksi' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Daily Check-in Streak */}
            <div className="bg-gradient-to-r from-orange-500/10 to-slate-900/80 border border-orange-500/10 rounded-3xl p-5 flex flex-col gap-4 shadow-sm relative overflow-hidden">
              <div className="absolute -left-4 -bottom-4 opacity-5 pointer-events-none">
                 <Flame className="w-32 h-32 text-orange-500" />
              </div>
              <div className="flex flex-col gap-3 relative z-10">
                {isTargetReached ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mb-4">
                      <CheckSquare className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-emerald-400 mb-2">
                      {lang === 'id' ? 'Misi Telah Selesai!' : 'Mission Completed!'}
                    </h3>
                    <p className="text-sm text-slate-400 max-w-[240px]">
                      {lang === 'id' 
                        ? 'Luar biasa! Kamu telah mencapai target disiplin yang ditentukan.' 
                        : 'Awesome! You have reached your discipline goal.'}
                    </p>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        const checkinsArr = d.dailyCheckins || [];
                        if (!checkinsArr.includes(todayStr)) {
                          updateTask({ ...task, disciplineData: { ...d, dailyCheckins: [...checkinsArr, todayStr] } });
                          checkInDaily();
                        }
                      }}
                      disabled={d.dailyCheckins?.includes(new Date().toISOString().split('T')[0])}
                      className={`w-full px-5 py-4 rounded-2xl font-bold text-sm transition-all ${
                        d.dailyCheckins?.includes(new Date().toISOString().split('T')[0])
                          ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-800'
                          : 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20 active:scale-95'
                      }`}
                    >
                      {d.dailyCheckins?.includes(new Date().toISOString().split('T')[0]) 
                        ? (lang === 'id' ? 'Selesai Hari Ini' : 'Done Today') 
                        : (lang === 'id' ? 'Check-in Sekarang' : 'Check-in Now')}
                    </button>
                    
                    <button
                      onClick={() => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        const checkinsArr = d.dailyCheckins || [];
                        const rests = d.usedRestDates || [];
                        if (!checkinsArr.includes(todayStr)) {
                          updateTask({ 
                            ...task, 
                            disciplineData: { 
                              ...d, 
                              dailyCheckins: [...checkinsArr, todayStr],
                              usedRestDates: [...rests, todayStr]
                            } 
                          });
                          checkInDaily();
                        }
                      }}
                      disabled={
                        d.dailyCheckins?.includes(new Date().toISOString().split('T')[0]) || 
                        ((d.usedRestDates || []).filter(date => (new Date().getTime() - new Date(date).getTime()) < 7 * 24 * 60 * 60 * 1000).length >= 1)
                      }
                      className={`w-full px-5 py-3 rounded-2xl font-bold text-sm transition-all border ${
                        d.dailyCheckins?.includes(new Date().toISOString().split('T')[0]) || ((d.usedRestDates || []).filter(date => (new Date().getTime() - new Date(date).getTime()) < 7 * 24 * 60 * 60 * 1000).length >= 1)
                          ? 'bg-slate-900/50 text-slate-500 border-slate-800 cursor-not-allowed'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border-slate-700 active:scale-95'
                      }`}
                    >
                      {lang === 'id' ? 'Gunakan Jatah Libur (1x/Minggu)' : 'Use Rest Day (1x/Week)'}
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Missed / Success Status */}
            {isMissedDay && d.punishment && !task.completed && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-5 shadow-lg shadow-rose-900/10 flex flex-col md:flex-row items-start gap-4 backdrop-blur-sm relative overflow-hidden text-left">
                <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0 border border-rose-500/30 relative z-10">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="relative z-10 flex-1">
                  <h3 className="text-base font-bold text-rose-400 mb-1">{lang === 'id' ? 'Anda Melewatkan Hari!' : 'You Missed a Day!'}</h3>
                  <p className="text-xs text-slate-400 mb-3 leading-relaxed pr-6">{lang === 'id' ? 'Sesuai komitmen awal, Anda harus menerima konsekuensi:' : 'As per your commitment, you must accept the consequence:'}</p>
                  <div className="bg-rose-500/10 rounded-2xl p-4 border border-rose-500/20 shadow-inner mb-3">
                    <span className="text-sm font-bold text-slate-100">{d.punishment}</span>
                    <div className="mt-2 text-xs font-semibold text-rose-400/90 flex items-center gap-1.5">
                      <span>🎯</span>
                      <span>
                        {lang === 'id' 
                          ? `Hukuman ini telah dilakukan sebanyak ${(d.punishmentCompletedDates || []).length} kali.` 
                          : `This punishment has been completed ${(d.punishmentCompletedDates || []).length} times.`}
                      </span>
                    </div>
                  </div>
                  {!(d.punishmentCompletedDates || []).includes(today) ? (
                    <button
                      onClick={() => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        const completedPunishments = d.punishmentCompletedDates || [];
                        if (!completedPunishments.includes(todayStr)) {
                          updateTask({
                            ...task,
                            disciplineData: {
                              ...d,
                              punishmentCompletedDates: [...completedPunishments, todayStr]
                            }
                          });
                        }
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md shadow-rose-600/10 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {t('punishmentCompletedBtn')}
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl w-fit text-emerald-400 text-xs font-bold">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>{t('punishmentCompletedStatus')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {task.completed && d.reward && (
              <div className="bg-gradient-to-br from-emerald-500/10 to-slate-900/80 border border-emerald-500/20 rounded-3xl p-6 shadow-xl text-center">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-4 border border-emerald-500/30 rotate-3">
                  <Gift className="w-8 h-8 -rotate-3" />
                </div>
                <h2 className="text-xl font-bold text-emerald-400 mb-2">{lang === 'id' ? 'Misi Berhasil Ditamatkan! 🎉' : 'Mission Completed! 🎉'}</h2>
                <div className="bg-emerald-500/10 rounded-2xl px-4 py-3 border border-emerald-500/20 inline-block mt-2">
                  <span className="text-base font-bold text-slate-100">{d.reward}</span>
                </div>
              </div>
            )}

            {/* Date & Settings */}
            <div className="grid grid-cols-2 gap-3">
               <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 block">{lang === 'id' ? 'Mulai' : 'Start'}</span>
                  <input 
                    type="date" 
                    value={d.startDate || (task.date && task.date.includes('-') ? task.date : (task.createdAt ? task.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]))}
                    onChange={(e) => updateTask({ ...task, disciplineData: { ...d, startDate: e.target.value } })}
                    className="bg-transparent text-sm font-medium text-slate-300 focus:outline-none w-full"
                  />
               </div>
               <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 block">{lang === 'id' ? 'Target' : 'Target'}</span>
                  <input 
                    type="date" 
                    value={d.targetDate || ''}
                    onChange={(e) => updateTask({ ...task, disciplineData: { ...d, targetDate: e.target.value } })}
                    className="bg-transparent text-sm font-medium text-slate-300 focus:outline-none w-full"
                  />
               </div>
            </div>
            
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
               <div className="flex flex-col">
                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">{lang === 'id' ? 'Notifikasi Pengingat' : 'Reminder Notification'}</span>
                 <span className="text-[10px] text-slate-400">{lang === 'id' ? 'Aktif setiap hari' : 'Active every day'}</span>
               </div>
               <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-800">
                 <Bell className="w-4 h-4 text-indigo-400/70" />
                 <input 
                   type="time" 
                   value={task.alarmTime || ''}
                   onChange={(e) => updateTask({ ...task, alarmTime: e.target.value || undefined })}
                   className="bg-transparent text-sm font-bold text-slate-200 focus:outline-none w-20"
                 />
               </div>
            </div>

            {/* Contract Rules */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">{lang === 'id' ? 'Kontrak Komitmen' : 'Commitment Contract'}</h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 transition-colors focus-within:border-emerald-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{lang === 'id' ? 'Hadiah Keberhasilan' : 'Success Reward'}</span>
                  </div>
                  <textarea 
                    value={d.reward || ''}
                    onChange={(e) => updateTask({ ...task, disciplineData: { ...d, reward: e.target.value } })}
                    placeholder={lang === 'id' ? 'Apa hadiah jika tercapai?' : 'What is your reward?'}
                    disabled={hasStarted}
                    className={`w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none resize-none min-h-[40px] ${hasStarted ? 'opacity-50' : ''}`}
                  />
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 transition-colors focus-within:border-rose-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{lang === 'id' ? 'Konsekuensi Gagal' : 'Failure Consequence'}</span>
                  </div>
                  <textarea 
                    value={d.punishment || ''}
                    onChange={(e) => updateTask({ ...task, disciplineData: { ...d, punishment: e.target.value } })}
                    placeholder={lang === 'id' ? 'Apa konsekuensinya?' : 'What is the consequence?'}
                    disabled={hasStarted}
                    className={`w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none resize-none min-h-[40px] ${hasStarted ? 'opacity-50' : ''}`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: JURNAL */}
        {activeTab === 'Jurnal' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <div className="flex items-center justify-between mb-3 px-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{lang === 'id' ? 'Alasan Kuat (Why)' : 'Strong Reason (Why)'}</h3>
                {hasStarted && <span className="text-[10px] font-bold bg-slate-800 px-2 py-0.5 rounded text-slate-400">{lang === 'id' ? 'Terkunci' : 'Locked'}</span>}
              </div>
              <div className={`bg-slate-900/80 border border-slate-800 rounded-2xl p-4 ${hasStarted ? 'opacity-70' : 'focus-within:border-indigo-500/30'}`}>
                <textarea 
                  value={d.motivation || ''}
                  onChange={(e) => updateTask({ ...task, disciplineData: { ...d, motivation: e.target.value } })}
                  placeholder={lang === 'id' ? 'Alasan terdalam kenapa harus mencapai ini...' : 'Deepest reason to achieve this...'}
                  disabled={hasStarted}
                  className="w-full min-h-[80px] bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">{lang === 'id' ? 'Catatan Harian' : 'Daily Notes'}</h3>
              
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 focus-within:border-indigo-500/30 mb-4 shadow-sm">
                <textarea 
                  id={`new-note-${task.id}`}
                  placeholder={lang === 'id' ? 'Progress hari ini...' : 'Today\'s progress...'}
                  className="w-full min-h-[60px] bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none resize-none mb-3"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      const textarea = document.getElementById(`new-note-${task.id}`) as HTMLTextAreaElement;
                      if (textarea && textarea.value.trim()) {
                        const newLog = [...(d.journeyLog || []), {
                          id: Date.now().toString(),
                          date: new Date().toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
                          content: textarea.value.trim()
                        }];
                        updateTask({ ...task, disciplineData: { ...d, journeyLog: newLog } });
                        textarea.value = '';
                      }
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-500 transition-colors"
                  >
                    {lang === 'id' ? 'Simpan' : 'Save'}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {d.journeyLog?.slice().reverse().map((note) => (
                  <div key={note.id} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 group">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{note.date}</span>
                       <button 
                         onClick={() => {
                           const newLog = d.journeyLog?.filter(n => n.id !== note.id);
                           updateTask({ ...task, disciplineData: { ...d, journeyLog: newLog } });
                         }}
                         className="text-slate-500 hover:text-red-400 transition-opacity"
                       >
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                    </div>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: GALERI */}
        {activeTab === 'Galeri' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">{lang === 'id' ? 'Transformasi Visual' : 'Visual Transformation'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => d.beforePhotoUrl ? setFullScreenImage({ url: d.beforePhotoUrl, type: 'beforePhotoUrl' }) : handlePhotoUpload('beforePhotoUrl')}
                className="aspect-[3/4] bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden relative group cursor-pointer shadow-sm hover:border-slate-700"
              >
                {d.beforePhotoUrl ? (
                  <>
                    <img src={d.beforePhotoUrl} alt="Before" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-lg border border-white/10">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white">{lang === 'id' ? 'Sebelum' : 'Before'}</span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                     <ImageIcon className="w-6 h-6 mb-2 opacity-50" />
                     <span className="text-[10px] font-bold uppercase tracking-widest">{lang === 'id' ? 'Sebelum' : 'Before'}</span>
                  </div>
                )}
              </div>
              
              <div 
                onClick={() => d.afterPhotoUrl ? setFullScreenImage({ url: d.afterPhotoUrl, type: 'afterPhotoUrl' }) : handlePhotoUpload('afterPhotoUrl')}
                className="aspect-[3/4] bg-indigo-500/10 border border-slate-800 rounded-2xl overflow-hidden relative group cursor-pointer shadow-sm hover:border-indigo-500/30"
              >
                {d.afterPhotoUrl ? (
                  <>
                    <img src={d.afterPhotoUrl} alt="After" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute bottom-2 right-2 bg-indigo-500/80 px-2 py-1 rounded-lg border border-white/20">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white">{lang === 'id' ? 'Sesudah' : 'After'}</span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-500/40">
                     <ImageIcon className="w-6 h-6 mb-2 opacity-50" />
                     <span className="text-[10px] font-bold uppercase tracking-widest">{lang === 'id' ? 'Sesudah' : 'After'}</span>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => setShowAllPhotos(!showAllPhotos)}
              className="w-full py-3 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-slate-300 transition-colors uppercase tracking-wider"
            >
              {showAllPhotos ? (lang === 'id' ? 'Tutup Milestone' : 'Close Milestones') : (lang === 'id' ? 'Tampilkan Milestone Bulanan' : 'Show Monthly Milestones')}
            </button>

            {showAllPhotos && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div 
                  onClick={() => d.after1MonthPhotoUrl ? setFullScreenImage({ url: d.after1MonthPhotoUrl, type: 'after1MonthPhotoUrl' }) : handlePhotoUpload('after1MonthPhotoUrl')}
                  className="aspect-[3/4] bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden relative group cursor-pointer hover:border-slate-700"
                >
                  {d.after1MonthPhotoUrl ? (
                    <>
                      <img src={d.after1MonthPhotoUrl} alt="1 Month" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded-lg border border-white/10">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white">{lang === 'id' ? '1 Bulan' : '1 Month'}</span>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                       <ImageIcon className="w-6 h-6 mb-2 opacity-30" />
                       <span className="text-[10px] font-bold uppercase tracking-widest">{lang === 'id' ? '1 Bulan' : '1 Month'}</span>
                    </div>
                  )}
                </div>

                <div 
                  onClick={() => d.after6MonthsPhotoUrl ? setFullScreenImage({ url: d.after6MonthsPhotoUrl, type: 'after6MonthsPhotoUrl' }) : handlePhotoUpload('after6MonthsPhotoUrl')}
                  className="aspect-[3/4] bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden relative group cursor-pointer hover:border-slate-700"
                >
                  {d.after6MonthsPhotoUrl ? (
                    <>
                      <img src={d.after6MonthsPhotoUrl} alt="6 Months" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded-lg border border-white/10">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white">{lang === 'id' ? '6 Bulan' : '6 Months'}</span>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                       <ImageIcon className="w-6 h-6 mb-2 opacity-30" />
                       <span className="text-[10px] font-bold uppercase tracking-widest">{lang === 'id' ? '6 Bulan' : '6 Months'}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {fullScreenImage && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[200] flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-lg flex justify-between items-center mb-4">
             <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">
                {lang === 'id' ? 'Galeri Transformasi' : 'Transformation Gallery'}
             </span>
             <button onClick={() => setFullScreenImage(null)} className="p-2 bg-slate-800/80 text-slate-300 rounded-full hover:bg-slate-700">
               <X className="w-5 h-5" />
              </button>
          </div>
          <img src={fullScreenImage.url} alt="Transformation Full" className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl" referrerPolicy="no-referrer" />
          <button 
             onClick={(e) => { 
               e.stopPropagation();
               setFullScreenImage(null); 
               handleRemovePhoto(e, fullScreenImage.type); 
             }}
             className="mt-6 flex items-center gap-2 bg-rose-500/10 text-rose-400 px-6 py-3 rounded-2xl font-bold hover:bg-rose-500/20 transition-colors"
          >
             <Trash2 className="w-4 h-4" />
             {lang === 'id' ? 'Hapus Foto Ini' : 'Remove This Photo'}
          </button>
        </div>
      )}
    </div>
  );
});
