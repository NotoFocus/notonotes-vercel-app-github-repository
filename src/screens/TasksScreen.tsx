import React, { useState } from 'react';
import { Plus, Trash2, ClipboardList, Repeat, Bell, X } from 'lucide-react';
import { useAppStore } from '../store';
import { useTranslation } from '../translations';
import { Task } from '../types';

export default function TasksScreen({ onNavigate }: { onNavigate?: (s: any) => void }) {
  const [activeTab, setActiveTab] = useState<'Hari Ini' | 'Akan Datang' | 'Belum Selesai' | 'Selesai'>('Hari Ini');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'Tinggi' | 'Sedang' | 'Rendah'>('Sedang');
  const [newTaskRepeat, setNewTaskRepeat] = useState<'once' | 'daily'>('once');
  const [newTaskDate, setNewTaskDate] = useState<string>(new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0]);
  const [newTaskAlarm, setNewTaskAlarm] = useState<string>('');
  const { tasks, addTask, updateTask, toggleTask, lang } = useAppStore();
  const t = useTranslation(lang);

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskPriority(task.priority);
    setNewTaskRepeat(task.repeat || 'once');
    setNewTaskDate(task.date || new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0]);
    setNewTaskAlarm(task.alarmTime || '');
  };

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

       if (editingTask) {
         updateTask({
           ...editingTask,
           title: newTaskTitle.trim(),
           priority: newTaskPriority,
           repeat: newTaskRepeat,
           date: newTaskDate,
           alarmTime: newTaskAlarm || undefined
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
           time: new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
           repeat: newTaskRepeat,
           alarmTime: newTaskAlarm || undefined
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
    setIsAddingTask(false);
    setEditingTask(null);
  };

  const todayDate = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000));
  const todayStr = todayDate.toISOString().split('T')[0];
  const tmr = new Date(todayDate);
  tmr.setDate(tmr.getDate() + 1);
  const tomorrowStr = tmr.toISOString().split('T')[0];

  let filteredTasks = [...(tasks || [])].filter(t => t !== null && t !== undefined);
  if (activeTab === 'Hari Ini') {
    filteredTasks = filteredTasks.filter(t => (t.date === todayStr || t.date === 'Hari ini' || t.date === 'Hari Ini'));
  } else if (activeTab === 'Akan Datang') {
    filteredTasks = filteredTasks.filter(t => !t.completed && t.date && t.date > todayStr && t.date !== 'Hari ini' && t.date !== 'Hari Ini');
  } else if (activeTab === 'Belum Selesai') {
    filteredTasks = filteredTasks.filter(t => !t.completed);
  } else if (activeTab === 'Selesai') {
    filteredTasks = filteredTasks.filter(t => t.completed);
  }

  filteredTasks.sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return 0;
  });

  const isTodayTask = (d: string) => d === todayStr || d === 'Hari ini' || d === 'Hari Ini';
  const isTomorrowTask = (d: string) => d === tomorrowStr || d === 'Besok';

  const todayTasks = filteredTasks.filter(t => isTodayTask(t?.date || ''));
  const tomorrowTasks = filteredTasks.filter(t => isTomorrowTask(t?.date || ''));
  const otherTasks = filteredTasks.filter(t => !isTodayTask(t?.date || '') && !isTomorrowTask(t?.date || ''));

  return (
    <div className="flex flex-col h-full bg-slate-950 font-sans text-slate-200">
      {/* Top Bar */}
      <div className="flex-none h-16 border-b border-slate-800 bg-slate-900 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-bold text-2xl text-slate-50 tracking-tight">{t('tasksMenu')}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 py-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-slate-800/80 flex-shrink-0 lg:justify-center">
        {['Hari Ini', 'Akan Datang', 'Belum Selesai', 'Selesai'].map((tab, idx) => {
          const tabLabels = [
             lang === 'id' ? 'Hari Ini' : "Today", 
             lang === 'id' ? 'Berikutnya' : "Upcoming", 
             lang === 'id' ? 'Belum Selesai' : "Uncompleted", 
             lang === 'id' ? 'Selesai' : "Done"
          ];
          return (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-xl text-[11px] md:text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors flex-shrink-0 ${
              activeTab === tab 
                ? 'bg-slate-800 text-slate-50' 
                : 'text-slate-500 hover:bg-slate-900'
            }`}
          >
            {tabLabels[idx]}
          </button>
        )})}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 w-full">
        <div className="w-full px-4 md:px-6 py-6 space-y-6">
          
          {filteredTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500">
              <ClipboardList className="w-12 h-12 mb-4 text-slate-800" />
              <div className="text-center font-medium text-sm md:text-base">
                {activeTab === 'Selesai' 
                  ? (lang === 'id' ? 'Belum ada tugas yang selesai.' : 'No completed tasks yet.') 
                  : activeTab === 'Hari Ini' 
                    ? t('noTasks') 
                    : (lang === 'id' ? 'Belum ada tugas.' : 'No tasks.')}
              </div>
            </div>
          )}

          {/* Group: Hari Ini */}
          {todayTasks.length > 0 && (
          <div>
            {activeTab !== 'Hari Ini' && (
              <div className="flex items-center gap-3 mb-3 ml-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('today')}</h3>
                <span className="text-[10px] text-slate-500 font-medium bg-slate-800/50 px-2 py-0.5 rounded-md">{todayTasks.length}</span>
              </div>
            )}
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl flex flex-col overflow-hidden">
               {todayTasks.map((task, i) => (
                 <TaskCard key={task.id} task={task} last={i === todayTasks.length - 1} onToggle={() => toggleTask(task.id)} onEdit={() => { openEditTask(task); setIsAddingTask(true); }} />
               ))}
            </div>
          </div>
          )}

          {/* Group: Besok */}
          {tomorrowTasks.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-3 ml-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('tomorrow')}</h3>
              <span className="text-[10px] text-slate-500 font-medium bg-slate-800/50 px-2 py-0.5 rounded-md">{tomorrowTasks.length}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl flex flex-col overflow-hidden">
               {tomorrowTasks.map((task, i) => (
                 <TaskCard key={task.id} task={task} last={i === tomorrowTasks.length - 1} onToggle={() => toggleTask(task.id)} onEdit={() => { openEditTask(task); setIsAddingTask(true); }} />
               ))}
            </div>
          </div>
          )}

          {/* Group: Lainnya */}
          {otherTasks.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-3 ml-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('other')}</h3>
              <span className="text-[10px] text-slate-500 font-medium bg-slate-800/50 px-2 py-0.5 rounded-md">{otherTasks.length}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl flex flex-col overflow-hidden">
               {otherTasks.map((task, i) => (
                 <TaskCard key={task.id} task={task} last={i === otherTasks.length - 1} onToggle={() => toggleTask(task.id)} onEdit={() => { openEditTask(task); setIsAddingTask(true); }} />
               ))}
            </div>
          </div>
          )}

        </div>
      </div>

      {/* FAB Add */}
      {!isAddingTask && (
        <button onClick={() => setIsAddingTask(true)} className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 transition-transform active:scale-95 z-50">
          <Plus className="w-6 h-6 stroke-[2]" />
        </button>
      )}

      {isAddingTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex flex-col pt-8 sm:p-4 animate-in fade-in duration-200 overflow-y-auto overscroll-none">
           <div className="bg-slate-900 border-t sm:border border-slate-800 p-4 sm:p-4 md:p-4 rounded-t-3xl sm:rounded-3xl w-full max-w-[480px] mx-auto mt-auto sm:my-auto animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 shadow-2xl relative">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-slate-200">{editingTask ? (lang === 'id' ? 'Edit Tugas' : 'Edit Task') : (lang === 'id' ? 'Tugas Baru' : 'New Task')}</h3>
                <button onClick={() => { setIsAddingTask(false); setEditingTask(null); setNewTaskTitle(''); }} className="p-2 bg-slate-800/50 hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-200 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddTaskSubmit}>
                 <textarea 
                   autoFocus
                   value={newTaskTitle}
                   onChange={e => setNewTaskTitle(e.target.value)}
                   placeholder={t('taskPlaceholder') || "Contoh: Belajar UI/UX..."}
                   className="w-full min-h-[80px] bg-slate-950/50 border border-slate-800/80 rounded-2xl px-4 py-4 text-xl text-slate-50 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-slate-950 mb-5 resize-none transition-all"
                 />
                 
                 <div className="space-y-4 mb-6">
                   {/* Priority */}
                   <div>
                     <span className="text-[10px] text-slate-500 font-medium mb-1.5 ml-1 block">{lang === 'id' ? 'Prioritas' : 'Priority'}</span>
                     <div className="flex gap-1.5 p-1 bg-slate-950/50 rounded-xl border border-slate-800/50">
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
                           className={`flex-1 py-1.5 text-xs rounded-lg transition-all ${newTaskPriority === p ? activeClass : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800/50'}`}
                         >
                           {pLabel}
                         </button>
                       )})}
                     </div>
                   </div>

                   {/* Date & Time */}
                   <div className="flex gap-3">
                     <div className="flex-1">
                       <span className="text-[10px] text-slate-500 font-medium mb-1.5 ml-1 block">{lang === 'id' ? 'Tanggal' : 'Date'}</span>
                       <input
                         type="date"
                         value={newTaskDate}
                         onChange={e => setNewTaskDate(e.target.value)}
                         className="w-full bg-slate-950/50 border border-slate-800/50 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                         style={{ colorScheme: 'dark' }}
                       />
                     </div>
                     <div className="flex-1">
                       <span className="text-[10px] text-slate-500 font-medium mb-1.5 ml-1 flex items-center gap-1">
                         <Bell className="w-3 h-3 text-indigo-400" />
                         {lang === 'id' ? 'Pengingat' : 'Reminder'}
                       </span>
                       <div className="relative">
                         <input
                           type="time"
                           value={newTaskAlarm}
                           onChange={e => setNewTaskAlarm(e.target.value)}
                           className="w-full bg-slate-950/50 border border-slate-800/50 rounded-xl pl-3 pr-8 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
                           style={{ colorScheme: 'dark' }}
                         />
                         {newTaskAlarm && (
                           <button 
                             type="button" 
                             onClick={() => setNewTaskAlarm('')}
                             className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors bg-slate-800 rounded-full p-0.5"
                           >
                             <X className="w-3 h-3" />
                           </button>
                         )}
                       </div>
                     </div>
                   </div>

                   {/* Repeat */}
                   <div>
                     <span className="text-[10px] text-slate-500 font-medium mb-1.5 ml-1 block">{lang === 'id' ? 'Perulangan' : 'Repeat'}</span>
                     <div className="flex gap-1.5 p-1 bg-slate-950/50 rounded-xl border border-slate-800/50">
                       <button
                         type="button"
                         onClick={() => setNewTaskRepeat('once')}
                         className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-lg transition-all ${newTaskRepeat === 'once' ? 'bg-slate-700/50 text-slate-200 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800/50'}`}
                       >
                         {lang === 'id' ? 'Sekali Aja' : 'Once'}
                       </button>
                       <button
                         type="button"
                         onClick={() => setNewTaskRepeat('daily')}
                         className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-lg transition-all ${newTaskRepeat === 'daily' ? 'bg-indigo-500/20 text-indigo-400 font-bold shadow-sm' : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800/50'}`}
                       >
                         <Repeat className="w-3 h-3" />
                         {lang === 'id' ? 'Tiap Hari' : 'Daily'}
                       </button>
                     </div>
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

const TaskCard: React.FC<{ task: Task, last?: boolean, onToggle: () => void, onEdit: () => void }> = ({ task, last, onToggle, onEdit }) => {
  const isHigh = task.priority === 'Tinggi';
  const isMed = task.priority === 'Sedang';
  const { deleteTask, lang } = useAppStore();
  const t = useTranslation(lang);

  return (
    <div className={`flex items-start gap-4 group border-slate-800/60 cursor-pointer px-4 ${!last ? 'border-b py-4' : 'pt-4 pb-4'}`}>
      <button onClick={onToggle} className="p-2 -ml-2 rounded-full flex-none flex items-center justify-center transition-colors mt-0">
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
          task.completed 
            ? 'border-indigo-500 bg-indigo-500' 
            : 'border-slate-700 group-hover:border-indigo-500'
        }`}>
          {task.completed && <div className="w-2 h-2 rounded-sm bg-white" />}
        </div>
      </button>
      <div onClick={onEdit} className={`flex-1 ${task.completed ? 'opacity-50' : ''}`}>
         <h4 className={`text-sm font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-50'}`}>{task.title}</h4>
         <div className="flex items-center gap-2 mt-1">
           <span className="text-[10px] text-slate-500 font-mono">
             {task.date && task.date.includes('-') && task.date !== new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0] ? `${task.date} • ` : ''}{task.time}
           </span>
           {task.alarmTime && (
             <span className="text-[10px] flex gap-1 items-center font-bold text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded">
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
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} 
        className="opacity-100 p-2 text-slate-500 hover:text-red-400 transition-colors"
      >
         <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
