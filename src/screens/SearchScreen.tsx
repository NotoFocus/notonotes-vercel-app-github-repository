import React, { useState } from 'react';
import { Search as SearchIcon, X, CheckSquare, FileText, Pin, Trash2, Tag, Repeat, Bell } from 'lucide-react';
import { useAppStore } from '../store';
import { useTranslation } from '../translations';
import { Note, Task } from '../types';

export default function SearchScreen({ onOpenNote }: { onOpenNote: (note: Note) => void }) {
  const { notes, tasks, toggleTask, updateTask, updateNote, deleteNote, deleteTask, searchQuery, setSearchQuery, lang, checkInDaily } = useAppStore();
  const t = useTranslation(lang);
  const [groupBy, setGroupBy] = useState<'Semua' | 'Level Tugas' | 'Tag Catatan'>('Semua');

  const query = searchQuery.toLowerCase().trim();

  const filteredNotes = query ? notes.filter(n => 
    (n.title ?? '').toLowerCase().includes(query) || 
    (n.content ?? '').toLowerCase().includes(query) ||
    (n.tags && n.tags.some(t => t.toLowerCase().includes(query)))
  ) : notes;

  const filteredTasks = query ? tasks.filter(t => 
    (t.title || '').toLowerCase().includes(query)
  ) : tasks;

  const handleTogglePinNote = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    updateNote({ ...note, pinned: !note.pinned });
  };

  const handleTogglePinTask = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    updateTask({ ...task, pinned: !task.pinned });
  };

  const renderNoteCard = (note: Note) => (
    <div 
      key={`note-${note.id}`} 
      onClick={() => onOpenNote(note)}
      role="button"
      className="w-full text-left flex items-start gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer group"
    >
      <div className="flex-1 overflow-hidden">
         <h4 className="font-bold text-slate-50 leading-tight mb-1 truncate">{note.title || 'Untitled Note'}</h4>
         <p className="text-xs text-slate-400 line-clamp-2">{note.content ? note.content.replace(/<[^>]*>?/gm, '') : '...'}</p>
         {note.tags && note.tags.length > 0 && (
           <div className="flex gap-1 overflow-x-hidden flex-wrap max-w-full mt-2">
             {note.tags.map(tag => (
               <span key={tag} className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-indigo-300 bg-indigo-500/10 flex-shrink-0">
                 #{tag}
               </span>
             ))}
           </div>
         )}
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button 
          onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
          className="p-3 flex items-center justify-center rounded-xl transition-colors hover:bg-slate-800 text-slate-400 hover:text-red-400 opacity-100"
        >
          <Trash2 className="w-5 h-5" />
        </button>
        <div 
          onClick={(e) => handleTogglePinNote(e, note)}
          className="p-3 flex items-center justify-center rounded-xl transition-colors hover:bg-slate-800"
        >
          <Pin className={`w-5 h-5 ${note.pinned ? 'fill-orange-400 text-orange-400' : 'text-slate-400 hover:text-orange-400'}`} />
        </div>
      </div>
    </div>
  );

  const renderTaskCard = (task: Task, isLast: boolean) => {
     if (task.isDiscipline) {
       return (
         <div key={`task-${task.id}`} className={`flex items-start gap-4 group border-slate-800/60 px-4 ${!isLast ? 'border-b py-4' : 'pt-4 pb-4'}`}>
           <div className={`flex-1 ${task.completed ? 'opacity-50' : ''}`}>
              <h4 className={`text-sm font-bold text-indigo-300`}>
                <span className="mr-2 inline-block">🎯</span>
                {task.title}
              </h4>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  {lang === 'id' ? 'Fokus Disiplin' : 'Discipline'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                   {task.disciplineData?.targetDate ? `Target: ${task.disciplineData.targetDate}` : ''}
                </span>
              </div>
           </div>
           
           <div className="flex items-center gap-2">
             <button
                onClick={(e) => {
                  e.stopPropagation();
                  const d = task.disciplineData || {};
                  const today = new Date().toISOString().split('T')[0];
                  const checkins = d.dailyCheckins || [];
                  if (!checkins.includes(today)) {
                    updateTask({ ...task, disciplineData: { ...d, dailyCheckins: [...checkins, today] } });
                    checkInDaily();
                  }
                }}
                disabled={task.disciplineData?.dailyCheckins?.includes(new Date().toISOString().split('T')[0])}
                className={`flex-none px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all ${
                  task.disciplineData?.dailyCheckins?.includes(new Date().toISOString().split('T')[0])
                    ? 'bg-slate-800/80 text-slate-400 cursor-not-allowed border border-slate-800'
                    : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 active:scale-95'
                }`}
              >
                {task.disciplineData?.dailyCheckins?.includes(new Date().toISOString().split('T')[0]) 
                  ? (lang === 'id' ? 'Selesai' : 'Done') 
                  : (lang === 'id' ? 'Check-in' : 'Check-in')}
             </button>
             <button 
               onClick={(e) => handleTogglePinTask(e, task)}
               className="p-3 -mr-3 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-slate-800/80 flex-none"
             >
               <Pin className={`w-5 h-5 ${task.pinned ? 'fill-indigo-400 text-indigo-400' : 'text-slate-400 hover:text-indigo-400'}`} />
             </button>
           </div>
         </div>
       );
     }

     const isHigh = task.priority === 'Tinggi';
     const isMed = task.priority === 'Sedang';
     return (
       <div key={`task-${task.id}`} className={`flex items-start gap-4 group border-slate-800/60 cursor-pointer px-4 ${!isLast ? 'border-b py-4' : 'pt-4 pb-4'}`} onClick={() => toggleTask(task.id)}>
         <button className="p-4 -ml-4 rounded-full flex-none flex items-center justify-center transition-colors mt-0">
           <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${task.completed ? 'border-indigo-500 bg-indigo-500' : 'border-slate-700 group-hover:border-indigo-500'}`}>
             {task.completed && <div className="w-2 h-2 rounded-sm bg-white" />}
           </div>
         </button>
         <div className={`flex-1 ${task.completed ? 'opacity-50' : ''}`}>
            <h4 className={`text-sm font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-50'}`}>{task.title}</h4>
            <div className="flex flex-wrap items-center gap-2 mt-1">
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
         </div>
         <div className="flex gap-1 flex-shrink-0 opacity-100">
           <button 
             onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
             className="p-3 -mr-2 text-slate-400 hover:text-red-400 transition-colors flex items-center justify-center"
           >
             <Trash2 className="w-5 h-5" />
           </button>
           <button 
             onClick={(e) => handleTogglePinTask(e, task)}
             className="p-3 text-slate-400 hover:text-orange-400 transition-colors flex items-center justify-center"
           >
             <Pin className={`w-5 h-5 ${task.pinned ? 'fill-orange-400 text-orange-400' : 'text-slate-400 hover:text-orange-400'}`} />
           </button>
         </div>
       </div>
     );
  };

  const renderGroupedContent = () => {
    if (groupBy === 'Level Tugas') {
       const groups = [
         { name: `${t('high') || 'Tinggi'} ${t('priority') || 'Prioritas'}`, items: filteredTasks.filter(t => t.priority === 'Tinggi') },
         { name: `${t('medium') || 'Sedang'} ${t('priority') || 'Prioritas'}`, items: filteredTasks.filter(t => t.priority === 'Sedang') },
         { name: `${t('low') || 'Rendah'} ${t('priority') || 'Prioritas'}`, items: filteredTasks.filter(t => t.priority === 'Rendah') }
       ].filter(g => g.items.length > 0);

       return (
         <div className="space-y-8">
           {groups.map(group => (
             <div key={group.name} className="mb-8">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><CheckSquare className="w-4 h-4" /> {group.name}</h3>
                 <span className="w-5 h-5 bg-slate-800 text-slate-400 rounded flex items-center justify-center text-[10px] font-bold">{group.items.length}</span>
               </div>
               <div className="bg-slate-900 border border-slate-800/80 rounded-3xl flex flex-col overflow-hidden shadow-sm">
                 {group.items.map((task, i) => renderTaskCard(task, i === group.items.length - 1))}
               </div>
             </div>
           ))}
         </div>
       );
    } else if (groupBy === 'Tag Catatan') {
        const allTags = new Set<string>();
        filteredNotes.forEach(n => n.tags?.forEach(tag => allTags.add(tag)));
        
        const groups = Array.from(allTags).sort().map(tag => ({
          name: `#${tag}`,
          notes: filteredNotes.filter(n => n.tags?.includes(tag)),
        }));
        const noTagNotes = filteredNotes.filter(n => !n.tags || n.tags.length === 0);
        if (noTagNotes.length > 0) {
           groups.push({ name: t('untagged') || 'Tanpa Tag', notes: noTagNotes });
        }

        return (
          <div className="space-y-8">
             {groups.filter(g => g.notes.length > 0).map(group => (
               <div key={group.name} className="mb-8 relative pl-5 border-l-2 border-slate-800">
                 <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-slate-900 border-2 border-indigo-500/50 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                 </div>
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                   <Tag className="w-5 h-5 text-indigo-400" /> {group.name}
                 </h3>
                 <div className="space-y-4">
                   {group.notes.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">{group.notes.map(n => renderNoteCard(n))}</div>}
                 </div>
               </div>
             ))}
          </div>
        );
    }

    return (
       <div>
         {filteredNotes.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><FileText className="w-4 h-4" /> {t('notes')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {filteredNotes.map(note => renderNoteCard(note))}
            </div>
          </div>
         )}
         {filteredTasks.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><CheckSquare className="w-4 h-4" /> {t('tasks')}</h3>
            <div className="bg-slate-900 border border-slate-800/80 rounded-3xl flex flex-col overflow-hidden shadow-sm">
               {filteredTasks.map((task, i) => renderTaskCard(task, i === filteredTasks.length - 1))}
            </div>
          </div>
        )}
       </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 font-sans text-slate-200">
      <div className="flex-none bg-slate-950 px-6 pt-6 pb-4 flex flex-col gap-4 border-b border-slate-800/60 sticky top-0 z-10">
        <div className="relative w-full">
           <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
           <input 
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
             placeholder={t('search') || "Cari catatan, tugas, atau tag..."}
             className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl h-12 pl-12 pr-10 text-sm text-slate-50 placeholder-slate-400 outline-none focus:border-indigo-500/50 focus:bg-slate-900 transition-all font-medium shadow-sm"
           />
           {searchQuery && (
             <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-50 transition-colors">
               <X className="w-4 h-4" />
             </button>
           )}
        </div>
        
        <div className="flex items-center justify-start overflow-x-auto no-scrollbar gap-2 pb-1">
            {['Semua', 'Level Tugas', 'Tag Catatan'].map((g, idx) => {
              const displayLabels = [t('allGroups'), t('taskLevel'), t('noteTag')];
              return (
              <button
                key={g}
                onClick={() => setGroupBy(g as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex-shrink-0 ${
                  groupBy === g 
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' 
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {displayLabels[idx]}
              </button>
            )})}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 w-full">
        <div className="w-full px-6 py-6 space-y-8">
          {groupBy === 'Semua' && filteredNotes.length === 0 && filteredTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <SearchIcon className="w-12 h-12 md:w-16 md:h-16 mb-4 text-slate-700 opacity-50" />
              <div className="text-center font-medium text-sm md:text-base">
                {searchQuery ? `${t('noMatchData')} "${searchQuery}"` : `${t('noNotes')} & ${t('noTasks')}`}
              </div>
            </div>
          )}
          {groupBy === 'Level Tugas' && filteredTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <CheckSquare className="w-12 h-12 md:w-16 md:h-16 mb-4 text-slate-700 opacity-50" />
              <div className="text-center font-medium text-sm md:text-base">{t('noMatchTasks')}</div>
            </div>
          )}
          {groupBy === 'Tag Catatan' && filteredNotes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Tag className="w-12 h-12 md:w-16 md:h-16 mb-4 text-slate-700 opacity-50" />
              <div className="text-center font-medium text-sm md:text-base">{t('noMatchNotes')}</div>
            </div>
          )}

          {renderGroupedContent()}

        </div>
      </div>
    </div>
  );
}
