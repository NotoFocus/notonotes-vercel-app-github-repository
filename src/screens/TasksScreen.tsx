import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, ClipboardList, Repeat, Bell, X, Target, Image as ImageIcon, Calendar, CheckSquare, Pencil, Camera, ChevronRight, Flame, Gift, AlertTriangle, Pin } from 'lucide-react';
import { useAppStore } from '../store';
import { useTranslation } from '../translations';
import { Task } from '../types';

export default function TasksScreen({ onNavigate }: { onNavigate?: (s: any) => void }) {
  const [activeTab, setActiveTab] = useState<'Biasa' | 'Disiplin'>('Biasa');
  const [showCompleted, setShowCompleted] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'Tinggi' | 'Sedang' | 'Rendah'>('Sedang');
  const [newTaskRepeat, setNewTaskRepeat] = useState<'once' | 'daily'>('once');
  const [newTaskDate, setNewTaskDate] = useState<string>(new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0]);
  const [newTaskAlarm, setNewTaskAlarm] = useState<string>('');
  const [newTaskIsDiscipline, setNewTaskIsDiscipline] = useState<boolean>(false);
  const { tasks, addTask, updateTask, toggleTask, lang } = useAppStore();
  const t = useTranslation(lang);

  const openEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskPriority(task.priority);
    setNewTaskRepeat(task.repeat || 'once');
    setNewTaskDate(task.date || new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0]);
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
       const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
       const todayDate = localDate.toISOString().split('T')[0];

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
           localStorage.setItem(`noto_alarm_${editingTask.id}_${todayDate}`, 'true');
         }
       } else {
         const locale = lang === 'en' ? 'en-US' : 'id-ID';
         const newId = crypto.randomUUID();
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
           localStorage.setItem(`noto_alarm_${newId}_${todayDate}`, 'true');
         }
       }
    }
    setNewTaskTitle('');
    setNewTaskPriority('Sedang');
    setNewTaskRepeat('once');
    setNewTaskDate(new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0]);
    setNewTaskAlarm('');
    setNewTaskIsDiscipline(false);
    setIsAddingTask(false);
    setEditingTask(null);
  };

  const { todayTasks, overdueTasks, upcomingTasks, noDateTasks, completedTasks, disciplineTask, filteredTasks } = useMemo(() => {
    const todayDate = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000));
    const todayStr = todayDate.toISOString().split('T')[0];

    const getTaskDateStr = (t: any) => {
        if (t.date === 'Hari ini' || t.date === 'Hari Ini') return todayStr;
        if (t.date === 'Besok') {
            const tmr = new Date(todayDate);
            tmr.setDate(todayDate.getDate() + 1);
            return tmr.toISOString().split('T')[0];
        }
        return t.date;
    };

    let filtered = [...(tasks || [])].filter(t => t !== null && t !== undefined && !t.isDiscipline);
    
    // For Biasa view, we only partition tasks
    const uncompleted = filtered.filter(t => !t.completed);
    const completed = filtered.filter(t => t.completed);

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

    const todayTasks = uncompleted.filter(isTodayTask);
    const overdueTasks = uncompleted.filter(isOverdueTask);
    const upcomingTasks = uncompleted.filter(isUpcomingTask);
    const noDateTasks = uncompleted.filter(isNoDateTask);

    const disciplineTask = tasks.find(t => t.isDiscipline && !t.isArchived);

    return { todayTasks, overdueTasks, upcomingTasks, noDateTasks, completedTasks: completed, disciplineTask, filteredTasks: uncompleted };
  }, [tasks]);

  const handleSelectExisting = useCallback(() => { setNewTaskIsDiscipline(true); setIsAddingTask(true); }, []);

  return (
    <div className="flex flex-col h-full bg-slate-950 font-sans text-slate-200">
      {/* Top Bar */}
      <div className="flex-none pt-6 pb-2 px-6 flex items-center justify-between border-b border-slate-800/50 bg-slate-900/80">
        <div className="flex items-center gap-4">
          <span className="font-bold text-2xl text-slate-50 tracking-tight">{t('tasksMenu')}</span>
        </div>
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
            </>
          )}

        </div>
      </div>

      {/* FAB Add */}
      {!isAddingTask && (
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

                   {/* Date & Time */}
                   <div className="flex gap-3">
                     <div className="flex-1">
                       <span className="text-[10px] text-slate-400 font-medium mb-1.5 ml-1 block">{lang === 'id' ? 'Tanggal' : 'Date'}</span>
                       <input
                         type="date"
                         value={newTaskDate}
                         onChange={e => setNewTaskDate(e.target.value)}
                         className="w-full bg-slate-950/80 border border-slate-800/50 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                         
                       />
                     </div>
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

                   {/* Discipline Toggle */}
                   <div className="flex items-center justify-between p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl mt-4">
                     <div className="flex flex-col">
                       <span className="text-sm font-bold text-indigo-400">{lang === 'id' ? '🔥 Fokus Disiplin' : '🔥 Discipline Focus'}</span>
                       <span className="text-[10px] text-slate-400">{lang === 'id' ? 'Jadikan sebagai target utama (hanya bisa 1 tugas)' : 'Make this main target (only 1 task allowed)'}</span>
                     </div>
                     <button
                        type="button"
                        onClick={() => setNewTaskIsDiscipline(!newTaskIsDiscipline)}
                        className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors ${newTaskIsDiscipline ? 'bg-indigo-500' : 'bg-slate-700'}`}
                     >
                       <div className={`w-4 h-4 rounded-full bg-white transition-transform ${newTaskIsDiscipline ? 'translate-x-6' : 'translate-x-0'}`} />
                     </button>
                   </div>
                 </div>

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
  const { deleteTask, lang } = useAppStore();
  const t = useTranslation(lang);

  let dailyStats = null;
  if (task.repeat === 'daily' && task.createdAt) {
    const today = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const startDate = new Date(task.createdAt);
    const todayDate = new Date(today);
    const diffTime = todayDate.getTime() - startDate.getTime();
    const diffDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);
    
    const allCompletedDates = new Set(task.completedDates || []);
    if (task.completed) allCompletedDates.add(today);
    
    const completedDays = allCompletedDates.size;
    const missedDays = Math.max(0, diffDays - completedDays);
    
    dailyStats = { completed: completedDays, missed: missedDays };
  }

  return (
    <div className={`flex items-start gap-4 group border-slate-800/60 cursor-pointer px-4 ${!last ? 'border-b py-4' : 'pt-4 pb-4'}`}>
      <button onClick={() => onToggle(task.id)} className="p-4 -ml-4 rounded-full flex-none flex items-center justify-center transition-colors mt-0">
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
          task.completed 
            ? 'border-indigo-500 bg-indigo-500' 
            : 'border-slate-700 group-hover:border-indigo-500'
        }`}>
          {task.completed && <div className="w-2 h-2 rounded-sm bg-white" />}
        </div>
      </button>
      <div onClick={() => onEdit(task)} className={`flex-1 ${task.completed ? 'opacity-50' : ''}`}>
         <h4 className={`text-sm font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-50'}`}>{task.title}</h4>
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
         {dailyStats && (
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
      <button 
        onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} 
        className="opacity-100 p-4 -mr-2 text-slate-400 hover:text-red-400 transition-colors flex items-center justify-center"
      >
         <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
});

const DisciplineView = React.memo<{ task?: Task, onSelectExisting: () => void, lang: string }>(({ task, onSelectExisting, lang }) => {
  const { updateTask, checkInDaily } = useAppStore();
  const [fullScreenImage, setFullScreenImage] = useState<{ url: string, type: 'beforePhotoUrl' | 'afterPhotoUrl' | 'after1MonthPhotoUrl' | 'after6MonthsPhotoUrl' | 'after1YearPhotoUrl' } | null>(null);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  
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

  const today = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  const yesterdayDate = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000) - 86400000).toISOString().split('T')[0];
  
  const d = task.disciplineData || {};
  const checkins = d.dailyCheckins || [];
  const lastCheckin = checkins.length > 0 ? checkins[checkins.length - 1] : null;
  const isMissedDay = lastCheckin && lastCheckin !== today && lastCheckin !== yesterdayDate;
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

  return (
    <div className="animate-in fade-in duration-300 pb-8 px-1 space-y-8">
      {/* 1. Header Info */}
      <div className="bg-gradient-to-br from-indigo-500/10 via-slate-900/80 to-slate-900 border border-indigo-500/10 rounded-3xl p-6 relative overflow-hidden shadow-lg shadow-black/20 backdrop-blur-sm">
        <div className="absolute -top-10 -right-10 p-6 opacity-5 rotate-12">
          <Target className="w-48 h-48 text-indigo-400" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 bg-indigo-500/20 border border-indigo-500/20 px-3 py-1 rounded-full">
              {lang === 'id' ? 'Tujuan Utama' : 'Main Goal'}
            </span>
          </div>
          <div className="flex justify-between items-start gap-4 mb-6">
            <h2 className="text-2xl font-bold text-slate-50 pr-4 leading-tight tracking-tight">{task.title}</h2>
            <button
              onClick={() => updateTask({ ...task, pinned: !task.pinned })}
              className={`p-2 rounded-full border transition-all ${task.pinned ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-slate-800/80 border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30'}`}
              title={lang === 'id' ? 'Sematkan di Beranda' : 'Pin to Home'}
            >
              <Pin className={`w-5 h-5 ${task.pinned ? 'fill-indigo-400' : ''}`} />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
             <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 block">{lang === 'id' ? 'Mulai' : 'Start'}</span>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <Calendar className="w-4 h-4 text-indigo-400/70" />
                  {d.startDate || task.date}
                </div>
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
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">{lang === 'id' ? 'Alarm Pengingat' : 'Reminder Alarm'}</span>
               <span className="text-[10px] text-slate-400">{lang === 'id' ? 'Aktif setiap hari' : 'Active every day'}</span>
             </div>
             <div className="flex items-center gap-2">
               <Bell className="w-4 h-4 text-indigo-400/70" />
               <input 
                 type="time" 
                 value={task.alarmTime || ''}
                 onChange={(e) => updateTask({ ...task, alarmTime: e.target.value || undefined })}
                 className="bg-transparent text-sm font-bold text-slate-200 focus:outline-none"
                 
               />
             </div>
          </div>
        </div>
      </div>

      {/* 2. Motivation Note */}
      <div>
        <div className="flex items-center justify-between mb-3 px-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            {lang === 'id' ? 'Alasan Kuat (Why)' : 'Strong Reason (Why)'}
          </h3>
          {hasStarted && <span className="text-[10px] font-bold bg-slate-800/80 px-2 py-0.5 rounded-md text-slate-400 border border-slate-800">{lang === 'id' ? 'Terkunci' : 'Locked'}</span>}
        </div>
        <div className={`bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-sm transition-colors ${hasStarted ? 'opacity-50' : 'focus-within:border-indigo-500/30 focus-within:bg-slate-900/80'}`}>
          <textarea 
            value={d.motivation || ''}
            onChange={(e) => updateTask({ ...task, disciplineData: { ...d, motivation: e.target.value } })}
            placeholder={lang === 'id' ? 'Tuliskan alasan terdalam kenapa Anda harus mencapai ini...' : 'Write your deepest reason why you must achieve this...'}
            disabled={hasStarted}
            className="w-full min-h-[80px] bg-transparent text-[15px] font-medium text-slate-200 placeholder:text-slate-600 focus:outline-none resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* 3. Journey Notes */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
          {lang === 'id' ? 'Catatan Perjalanan' : 'Journey Notes'}
        </h3>
        <div className="space-y-3">
          {d.journeyLog?.map((note) => (
            <div key={note.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm relative group">
              <div className="flex items-center justify-between mb-2">
                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{note.date}</span>
                 <button 
                   onClick={() => {
                     const newLog = d.journeyLog?.filter(n => n.id !== note.id);
                     updateTask({ ...task, disciplineData: { ...d, journeyLog: newLog } });
                   }}
                   className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-opacity"
                 >
                   <Trash2 className="w-3.5 h-3.5" />
                 </button>
              </div>
              <p className="text-sm font-medium text-slate-300 leading-relaxed whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
          
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 shadow-sm transition-colors focus-within:border-indigo-500/30 focus-within:bg-slate-900/80">
            <textarea 
              id={`new-note-${task.id}`}
              placeholder={lang === 'id' ? 'Tulis progress harian atau kendala yang dihadapi...' : 'Write your daily progress or challenges faced...'}
              className="w-full min-h-[80px] bg-transparent text-[14px] font-medium text-slate-200 placeholder:text-slate-600 focus:outline-none resize-none leading-relaxed mb-3"
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
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-500 transition-colors shadow-sm"
              >
                {lang === 'id' ? 'Simpan Catatan' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Daily Check-in Streak */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
          {lang === 'id' ? 'Aksi Harian' : 'Daily Action'}
        </h3>
        <div className="bg-gradient-to-r from-orange-500/10 to-slate-900/80 border border-orange-500/10 rounded-3xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="absolute -left-4 -bottom-4 opacity-5 pointer-events-none">
             <Flame className="w-32 h-32 text-orange-500" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <Flame className="w-6 h-6 text-orange-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-200">{lang === 'id' ? 'Konsistensi' : 'Consistency'}</span>
              <span className="text-xs text-slate-400 font-medium mt-0.5">
                <span className="text-orange-400 font-bold text-sm">{d.dailyCheckins?.length || 0}</span> {lang === 'id' ? 'Hari Streak' : 'Day Streak'}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              const checkins = d.dailyCheckins || [];
              if (!checkins.includes(today)) {
                updateTask({ ...task, disciplineData: { ...d, dailyCheckins: [...checkins, today] } });
                checkInDaily();
              }
            }}
            disabled={d.dailyCheckins?.includes(new Date().toISOString().split('T')[0])}
            className={`relative z-10 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              d.dailyCheckins?.includes(new Date().toISOString().split('T')[0])
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-800'
                : 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20 active:scale-95'
            }`}
          >
            {d.dailyCheckins?.includes(new Date().toISOString().split('T')[0]) 
              ? (lang === 'id' ? 'Selesai Hari Ini' : 'Done Today') 
              : (lang === 'id' ? 'Check-in Sekarang' : 'Check-in Now')}
          </button>
        </div>
      </div>

      {/* 5. Contract: Reward & Punishment */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
          {lang === 'id' ? 'Kontrak Komitmen' : 'Commitment Contract'}
        </h3>
        
        {isMissedDay && d.punishment && !task.completed && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-5 mb-4 shadow-lg shadow-rose-900/10 flex items-start gap-4 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-5 pointer-events-none -translate-y-4 translate-x-4">
              <AlertTriangle className="w-32 h-32 text-rose-500" />
            </div>
            <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0 border border-rose-500/30 relative z-10">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="relative z-10">
              <h3 className="text-base font-bold text-rose-400 mb-1">{lang === 'id' ? 'Anda Melewatkan Hari!' : 'You Missed a Day!'}</h3>
              <p className="text-sm text-slate-400 mb-4 leading-relaxed pr-6">{lang === 'id' ? 'Sesuai komitmen awal, Anda harus menerima konsekuensi:' : 'As per your commitment, you must accept the consequence:'}</p>
              <div className="bg-rose-500/10 rounded-2xl p-4 border border-rose-500/20 shadow-inner">
                <span className="text-base font-bold text-slate-100">{d.punishment}</span>
              </div>
            </div>
          </div>
        )}

        {task.completed && d.reward && (
          <div className="bg-gradient-to-br from-emerald-500/10 to-slate-900/80 border border-emerald-500/20 rounded-3xl p-8 mb-4 shadow-xl shadow-emerald-900/10 text-center relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12 scale-150 transform-origin-center">
              <Gift className="w-48 h-48 text-emerald-400" />
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/30 shadow-lg shadow-emerald-500/20 rotate-3">
                <Gift className="w-10 h-10 -rotate-3" />
              </div>
              <h2 className="text-2xl font-bold text-emerald-400 mb-3 tracking-tight">{lang === 'id' ? 'Misi Berhasil Ditamatkan! 🎉' : 'Mission Completed! 🎉'}</h2>
              <p className="text-[15px] text-slate-200/70 mb-6 max-w-[280px] leading-relaxed">
                {lang === 'id' ? 'Luar biasa! Silakan nikmati hadiah yang telah Anda janjikan untuk diri sendiri:' : 'Awesome! Please enjoy the reward you promised yourself:'}
              </p>
              <div className="bg-emerald-500/10 rounded-2xl px-6 py-4 border border-emerald-500/20 shadow-inner w-full max-w-[320px]">
                <span className="text-lg font-bold text-slate-100">{d.reward}</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-sm transition-colors focus-within:border-emerald-500/30 focus-within:bg-slate-900/80">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                <Gift className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">{lang === 'id' ? 'Hadiah Keberhasilan' : 'Success Reward'}</h3>
              {hasStarted && <span className="text-[10px] font-bold bg-slate-800/80 px-2 py-0.5 rounded-md text-slate-400 ml-auto border border-slate-800">{lang === 'id' ? 'Terkunci' : 'Locked'}</span>}
            </div>
            <textarea 
              value={d.reward || ''}
              onChange={(e) => updateTask({ ...task, disciplineData: { ...d, reward: e.target.value } })}
              placeholder={lang === 'id' ? 'Apa hadiah untuk diri sendiri jika ini tercapai?' : 'What is your reward if you achieve this?'}
              disabled={hasStarted}
              className={`w-full min-h-[60px] bg-transparent text-[14px] font-medium text-slate-200 placeholder:text-slate-600 focus:outline-none resize-none leading-relaxed ${hasStarted ? 'opacity-50' : ''}`}
            />
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-sm transition-colors focus-within:border-rose-500/30 focus-within:bg-slate-900/80">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">{lang === 'id' ? 'Konsekuensi Gagal' : 'Failure Consequence'}</h3>
              {hasStarted && <span className="text-[10px] font-bold bg-slate-800/80 px-2 py-0.5 rounded-md text-slate-400 ml-auto border border-slate-800">{lang === 'id' ? 'Terkunci' : 'Locked'}</span>}
            </div>
            <textarea 
              value={d.punishment || ''}
              onChange={(e) => updateTask({ ...task, disciplineData: { ...d, punishment: e.target.value } })}
              placeholder={lang === 'id' ? 'Apa konsekuensi jika Anda menyerah (misal: bolong 1 hari)?' : 'What is the consequence if you give up (e.g. miss 1 day)?'}
              disabled={hasStarted}
              className={`w-full min-h-[60px] bg-transparent text-[14px] font-medium text-slate-200 placeholder:text-slate-600 focus:outline-none resize-none leading-relaxed ${hasStarted ? 'opacity-50' : ''}`}
            />
          </div>
        </div>
      </div>

      {/* 6. Transformation Photos */}
      <div>
        <div className="flex items-center justify-between mb-3 px-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{lang === 'id' ? 'Transformasi Visual' : 'Visual Transformation'}</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div 
            onClick={() => d.beforePhotoUrl ? setFullScreenImage({ url: d.beforePhotoUrl, type: 'beforePhotoUrl' }) : handlePhotoUpload('beforePhotoUrl')}
            className="aspect-[3/4] bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden relative group cursor-pointer shadow-sm hover:border-slate-700 transition-colors"
          >
            {d.beforePhotoUrl ? (
              <>
                <img src={d.beforePhotoUrl} alt="Before" className="w-full h-full object-cover" />
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white">{lang === 'id' ? 'Sebelum' : 'Before'}</span>
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
                   <ImageIcon className="w-8 h-8 mb-3 opacity-30 group-hover:scale-110 transition-transform" />
                   <span className="text-[10px] font-bold uppercase tracking-widest">{lang === 'id' ? 'Sebelum' : 'Before'}</span>
                </div>
              </>
            )}
          </div>
          
          <div 
            onClick={() => d.afterPhotoUrl ? setFullScreenImage({ url: d.afterPhotoUrl, type: 'afterPhotoUrl' }) : handlePhotoUpload('afterPhotoUrl')}
            className="aspect-[3/4] bg-indigo-500/10 border border-slate-800 rounded-3xl overflow-hidden relative group cursor-pointer shadow-sm hover:border-indigo-500/30 transition-colors"
          >
            {d.afterPhotoUrl ? (
              <>
                <img src={d.afterPhotoUrl} alt="After" className="w-full h-full object-cover" />
                <div className="absolute bottom-3 right-3 bg-indigo-500/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white">{lang === 'id' ? 'Sesudah' : 'After'}</span>
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-500/30">
                   <ImageIcon className="w-8 h-8 mb-3 opacity-50 group-hover:scale-110 transition-transform text-indigo-400" />
                   <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">{lang === 'id' ? 'Sesudah' : 'After'}</span>
                </div>
              </>
            )}
          </div>

          {showAllPhotos && (
            <>
              <div 
                onClick={() => d.after1MonthPhotoUrl ? setFullScreenImage({ url: d.after1MonthPhotoUrl, type: 'after1MonthPhotoUrl' }) : handlePhotoUpload('after1MonthPhotoUrl')}
                className="aspect-[3/4] bg-indigo-500/5 border border-slate-800 rounded-3xl overflow-hidden relative group cursor-pointer shadow-sm hover:border-indigo-500/20 transition-colors"
              >
                {d.after1MonthPhotoUrl ? (
                  <>
                    <img src={d.after1MonthPhotoUrl} alt="1 Month" className="w-full h-full object-cover" />
                    <div className="absolute bottom-3 right-3 bg-indigo-500/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-lg">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white">{lang === 'id' ? '1 Bulan' : '1 Month'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-500/20">
                       <ImageIcon className="w-8 h-8 mb-3 opacity-40 group-hover:scale-110 transition-transform text-indigo-300" />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">{lang === 'id' ? '1 Bulan' : '1 Month'}</span>
                    </div>
                  </>
                )}
              </div>

              <div 
                onClick={() => d.after6MonthsPhotoUrl ? setFullScreenImage({ url: d.after6MonthsPhotoUrl, type: 'after6MonthsPhotoUrl' }) : handlePhotoUpload('after6MonthsPhotoUrl')}
                className="aspect-[3/4] bg-indigo-500/5 border border-slate-800 rounded-3xl overflow-hidden relative group cursor-pointer shadow-sm hover:border-indigo-500/20 transition-colors"
              >
                {d.after6MonthsPhotoUrl ? (
                  <>
                    <img src={d.after6MonthsPhotoUrl} alt="6 Months" className="w-full h-full object-cover" />
                    <div className="absolute bottom-3 right-3 bg-indigo-500/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-lg">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white">{lang === 'id' ? '6 Bulan' : '6 Months'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-500/20">
                       <ImageIcon className="w-8 h-8 mb-3 opacity-40 group-hover:scale-110 transition-transform text-indigo-300" />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">{lang === 'id' ? '6 Bulan' : '6 Months'}</span>
                    </div>
                  </>
                )}
              </div>

              <div 
                onClick={() => d.after1YearPhotoUrl ? setFullScreenImage({ url: d.after1YearPhotoUrl, type: 'after1YearPhotoUrl' }) : handlePhotoUpload('after1YearPhotoUrl')}
                className="aspect-[3/4] bg-indigo-500/5 border border-slate-800 rounded-3xl overflow-hidden relative group cursor-pointer shadow-sm hover:border-indigo-500/20 transition-colors"
              >
                {d.after1YearPhotoUrl ? (
                  <>
                    <img src={d.after1YearPhotoUrl} alt="1 Year" className="w-full h-full object-cover" />
                    <div className="absolute bottom-3 right-3 bg-indigo-500/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-lg">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white">{lang === 'id' ? '1 Tahun' : '1 Year'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-500/20">
                       <ImageIcon className="w-8 h-8 mb-3 opacity-40 group-hover:scale-110 transition-transform text-indigo-300" />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">{lang === 'id' ? '1 Tahun' : '1 Year'}</span>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
        
        {!showAllPhotos && (
           <button 
             onClick={() => setShowAllPhotos(true)}
             className="w-full mt-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors"
           >
             {lang === 'id' ? 'Lihat Selengkapnya' : 'View More'}
           </button>
        )}
      </div>

      {/* 7. Complete Mission Button */}
      <div className="pt-8">
        <h3 className="text-[11px] text-center font-bold text-slate-400 uppercase tracking-widest mb-4">
          {lang === 'id' ? 'Tamatkan Fokus Disiplin Ini Secara Final' : 'Permanently Complete This Focus'}
        </h3>
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => {
              updateTask({ ...task, completed: !task.completed });
            }}
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
              task.completed 
                ? 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 border border-slate-800' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 active:scale-95'
            }`}
          >
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 ${task.completed ? 'bg-slate-700 border-slate-600' : 'bg-slate-800/30 border-slate-600'}`}>
              {task.completed && <CheckSquare className="w-4 h-4 text-slate-400" />}
            </div>
            {task.completed 
              ? (lang === 'id' ? 'Batalkan Status Tamat' : 'Revert Final Status') 
              : (lang === 'id' ? 'Tamatkan Misi Utama (Final)' : 'Complete Main Mission (Final)')}
          </button>

          {task.completed && (
             <button
                onClick={() => {
                  updateTask({ ...task, isArchived: true });
                }}
                className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 shadow-lg shadow-emerald-900/10 active:scale-95 mt-2"
             >
                <Plus className="w-5 h-5" />
                {lang === 'id' ? 'Mulai Target Fokus Baru' : 'Start New Focus Target'}
             </button>
          )}
        </div>
      </div>
      
      {/* Full Screen Image Modal */}
      {fullScreenImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setFullScreenImage(null)}
        >
          <div className="absolute top-0 inset-x-0 p-6 flex justify-end z-10 bg-gradient-to-b from-black/80 to-transparent">
            <button 
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
              onClick={(e) => { e.stopPropagation(); setFullScreenImage(null); }}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <img 
            src={fullScreenImage.url} 
            alt="Full Screen" 
            className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl relative z-0" 
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-0 inset-x-0 p-6 flex justify-center gap-4 z-10 bg-gradient-to-t from-black/80 to-transparent">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                handlePhotoUpload(fullScreenImage.type);
                setFullScreenImage(null);
              }}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl font-bold text-white flex items-center gap-2 backdrop-blur-md transition-colors"
            >
              <Camera className="w-5 h-5" />
              {lang === 'id' ? 'Ganti' : 'Change'}
            </button>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                handleRemovePhoto(e, fullScreenImage.type);
                setFullScreenImage(null);
              }}
              className="px-6 py-3 bg-rose-500/20 hover:bg-rose-500/30 rounded-2xl font-bold text-rose-300 flex items-center gap-2 backdrop-blur-md transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              {lang === 'id' ? 'Hapus' : 'Delete'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
});
