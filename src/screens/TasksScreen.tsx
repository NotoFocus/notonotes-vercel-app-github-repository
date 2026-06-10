import React, { useState } from 'react';
import { Plus, Trash2, ClipboardList } from 'lucide-react';
import { useAppStore } from '../store';
import { useTranslation } from '../translations';
import { Task } from '../types';

export default function TasksScreen({ onNavigate }: { onNavigate?: (s: any) => void }) {
  const [activeTab, setActiveTab] = useState<'Semua' | 'Hari Ini' | 'Minggu Ini' | 'Selesai'>('Semua');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'Tinggi' | 'Sedang' | 'Rendah'>('Sedang');
  const { tasks, addTask, updateTask, toggleTask, lang } = useAppStore();
  const t = useTranslation(lang);

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskPriority(task.priority);
  };

  const handleAddTaskSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newTaskTitle.trim()) {
       if (editingTask) {
         updateTask({
           ...editingTask,
           title: newTaskTitle.trim(),
           priority: newTaskPriority
         });
       } else {
         const locale = lang === 'en' ? 'en-US' : 'id-ID';
         addTask({
           id: crypto.randomUUID(),
           title: newTaskTitle.trim(),
           completed: false,
           priority: newTaskPriority,
           date: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0],
           time: new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
         });
       }
    }
    setNewTaskTitle('');
    setNewTaskPriority('Sedang');
    setIsAddingTask(false);
    setEditingTask(null);
  };

  const todayDate = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000));
  const todayStr = todayDate.toISOString().split('T')[0];
  const tmr = new Date(todayDate);
  tmr.setDate(tmr.getDate() + 1);
  const tomorrowStr = tmr.toISOString().split('T')[0];

  const getStartOfWeekStr = () => {
    const d = new Date(todayDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  };

  const getEndOfWeekStr = () => {
    const d = new Date(todayDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? 0 : 7);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  };

  let filteredTasks = tasks;
  if (activeTab === 'Hari Ini') {
    filteredTasks = tasks.filter(t => t.date === todayStr || t.date === 'Hari ini' || t.date === 'Hari Ini');
  }
  if (activeTab === 'Minggu Ini') {
    const startOfWeek = getStartOfWeekStr();
    const endOfWeek = getEndOfWeekStr();
    filteredTasks = tasks.filter(t => {
      if (t.date === 'Hari ini' || t.date === 'Hari Ini' || t.date === 'Besok') return true;
      return t.date >= startOfWeek && t.date <= endOfWeek;
    });
  }
  if (activeTab === 'Selesai') {
    filteredTasks = tasks.filter(t => t.completed);
  }

  const isTodayTask = (d: string) => d === todayStr || d === 'Hari ini' || d === 'Hari Ini';
  const isTomorrowTask = (d: string) => d === tomorrowStr || d === 'Besok';

  const todayTasks = filteredTasks.filter(t => isTodayTask(t.date));
  const tomorrowTasks = filteredTasks.filter(t => isTomorrowTask(t.date));
  const otherTasks = filteredTasks.filter(t => !isTodayTask(t.date) && !isTomorrowTask(t.date));

  return (
    <div className="flex flex-col h-full bg-slate-950 font-sans text-slate-200">
      {/* Top Bar */}
      <div className="flex-none h-16 border-b border-slate-800 bg-slate-900 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-bold text-lg text-slate-50 tracking-tight">{t('tasksMenu')}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar border-b border-slate-800/50 flex-shrink-0">
        {['Semua', 'Hari Ini', 'Minggu Ini', 'Selesai'].map((tab, idx) => {
          const tabLabels = [t('allTasks') || 'Semua', t('today') || 'Hari Ini', t('thisWeek') || 'Minggu Ini', t('completed') || 'Selesai'];
          return (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors flex-shrink-0 ${
              activeTab === tab 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {tabLabels[idx]}
          </button>
        )})}
      </div>

      <div className="px-6 py-6 flex-1 overflow-y-auto no-scrollbar space-y-8 pb-6">
        
        {filteredTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <ClipboardList className="w-12 h-12 mb-4 text-slate-700 opacity-50" />
            <div className="text-center font-medium placeholder-text text-sm">
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t('today')}</h3>
            <span className="w-5 h-5 bg-indigo-500/20 text-indigo-400 rounded flex items-center justify-center text-[10px] font-bold">{todayTasks.length}</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-3">
             {todayTasks.map((task, i) => (
               <TaskCard key={task.id} task={task} last={i === todayTasks.length - 1} onToggle={() => toggleTask(task.id)} onEdit={() => { openEditTask(task); setIsAddingTask(true); }} />
             ))}
          </div>
        </div>
        )}

        {/* Group: Besok */}
        {tomorrowTasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t('tomorrow')}</h3>
            <span className="w-5 h-5 bg-slate-800 text-slate-400 rounded flex items-center justify-center text-[10px] font-bold">{tomorrowTasks.length}</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-3">
             {tomorrowTasks.map((task, i) => (
               <TaskCard key={task.id} task={task} last={i === tomorrowTasks.length - 1} onToggle={() => toggleTask(task.id)} onEdit={() => { openEditTask(task); setIsAddingTask(true); }} />
             ))}
          </div>
        </div>
        )}

        {/* Group: Lainnya */}
        {otherTasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t('other')}</h3>
            <span className="w-5 h-5 bg-slate-800 text-slate-400 rounded flex items-center justify-center text-[10px] font-bold">{otherTasks.length}</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-3">
             {otherTasks.map((task, i) => (
               <TaskCard key={task.id} task={task} last={i === otherTasks.length - 1} onToggle={() => toggleTask(task.id)} onEdit={() => { openEditTask(task); setIsAddingTask(true); }} />
             ))}
          </div>
        </div>
        )}

      </div>

      {/* FAB Add */}
      {!isAddingTask && (
        <button onClick={() => setIsAddingTask(true)} className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 transition-transform active:scale-95 z-50">
          <Plus className="w-6 h-6 stroke-[2]" />
        </button>
      )}

      {isAddingTask && (
        <div className="absolute inset-0 bg-slate-950/95 z-[100] flex flex-col justify-end animate-in fade-in duration-200">
           <div className="bg-slate-900 border-t border-slate-800 p-6 rounded-t-3xl animate-in slide-in-from-bottom-8 duration-300">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{editingTask ? t('editTask') || 'Edit Tugas' : t('newTask')}</h3>
              <form onSubmit={handleAddTaskSubmit}>
                 <input 
                   autoFocus
                   type="text" 
                   value={newTaskTitle}
                   onChange={e => setNewTaskTitle(e.target.value)}
                   placeholder={t('taskPlaceholder') || "Contoh: Belajar UI/UX..."}
                   className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-slate-50 focus:outline-none focus:border-indigo-500 mb-4"
                 />
                 <div className="flex gap-2 mb-4">
                   {(['Tinggi', 'Sedang', 'Rendah'] as const).map(p => {
                     const pLabel = p === 'Tinggi' ? t('high') || p : p === 'Sedang' ? t('medium') || p : t('low') || p;
                     return (
                     <button
                       key={p}
                       type="button"
                       onClick={() => setNewTaskPriority(p)}
                       className={`flex-1 py-2 text-xs font-bold rounded-xl border ${newTaskPriority === p ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                     >
                       {pLabel}
                     </button>
                   )})}
                 </div>
                 <div className="flex gap-3">
                   <button type="button" onClick={() => { setIsAddingTask(false); setEditingTask(null); setNewTaskTitle(''); }} className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-50 font-bold hover:bg-slate-700 transition-colors">{t('cancel')}</button>
                   <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors">{t('save')}</button>
                 </div>
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
    <div className={`flex items-start gap-3 group border-slate-800 pb-3 cursor-pointer ${last ? '' : 'border-b pt-1'}`}>
      <button onClick={onToggle} className="p-2 -ml-2 -mt-1 rounded-full flex-none flex items-center justify-center transition-colors">
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
           <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 ${
             isHigh ? 'text-orange-400 bg-orange-500/10' : 
             isMed ? 'text-blue-400 bg-blue-500/10' : 
             'text-emerald-400 bg-emerald-500/10'
           }`}>
             {(isHigh ? t('high') : isMed ? t('medium') : t('low')) || task.priority} {t('priority')}
           </span>
         </div>
      </div>
      <button 
        onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} 
        className="opacity-100 p-1 text-slate-500 hover:text-red-400 transition-colors"
      >
         <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
