import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, X, FileText, Pin, Trash2, Bell, Folder, CheckSquare, Plus, Tag as TagIcon, Archive } from 'lucide-react';
import { useAppStore } from '../store';
import { useTranslation } from '../translations';
import { Note, Task } from '../types';
import { generateId, formatReminderDate } from '../utils';

export default function SearchScreen({ onOpenNote }: { onOpenNote: (note: Note) => void }) {
  const { notes, tasks, toggleTask, updateTask, deleteTask, updateNote, deleteNote, searchQuery, setSearchQuery, lang, checkInDaily } = useAppStore();
  const t = useTranslation(lang);
  const [activeFilter, setActiveFilter] = useState<string>('all'); // 'all', 'archive', or tag name

  const query = searchQuery.toLowerCase().trim();

  const filteredNotes = query ? notes.filter(n => 
    (n.title ?? '').toLowerCase().includes(query) || 
    (n.content ?? '').toLowerCase().includes(query) ||
    (n.tags && n.tags.some(t => t.toLowerCase().includes(query)))
  ) : notes;

  const activeTasks = query ? tasks.filter(t => 
    !t.isArchived && !t.isDiscipline && (t.title || '').toLowerCase().includes(query)
  ) : [];

  const archivedNotes = filteredNotes.filter(n => n.isArchived);
  const activeNotes = filteredNotes.filter(n => !n.isArchived);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    activeNotes.forEach(n => n.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [activeNotes]);

  let displayedNotes = activeNotes;
  if (activeFilter === 'archive') {
    displayedNotes = archivedNotes;
  } else if (activeFilter !== 'all') {
    displayedNotes = activeNotes.filter(n => n.tags?.includes(activeFilter));
  }

  const handleTogglePinNote = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    updateNote({ ...note, pinned: !note.pinned });
  };

  const handleTogglePinTask = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    updateTask({ ...task, pinned: !task.pinned });
  };
  
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

  const renderNoteCard = (note: Note) => (
    <div 
      key={`note-${note.id}`} 
      onClick={() => onOpenNote(note)}
      role="button"
      className="w-full text-left flex flex-col justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer group shadow-sm relative overflow-hidden min-w-0"
    >
      {note.pinned && (
        <div className="absolute top-0 right-0 w-8 h-8 bg-orange-500/10 rounded-bl-xl flex items-center justify-center">
          <Pin className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
        </div>
      )}
      
      <div className="flex-1 overflow-hidden pr-6 min-w-0 flex flex-col">
         <h4 className="font-bold text-slate-50 leading-tight mb-1.5 truncate w-full">{note.title || (lang === 'id' ? 'Catatan Tanpa Judul' : 'Untitled Note')}</h4>
         <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed break-words">{note.content ? note.content.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>?/gm, '').replace(/&nbsp;?/gi, ' ').replace(/&bnsp;?/gi, ' ').replace(/\s+/g, ' ').trim() : '...'}</p>
         {note.reminder && (
           <div className="flex items-center gap-1.5 mt-2.5 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/10 rounded-md w-fit text-indigo-400 text-[10px] font-bold">
             <Bell className="w-3 h-3 text-indigo-400 animate-pulse" />
             <span>{formatReminderDate(note.reminder, lang)}</span>
           </div>
         )}
      </div>
      
      <div className="flex items-center justify-between mt-1 pt-3 border-t border-slate-800/50 gap-2">
        <div className="flex items-center gap-1.5 overflow-x-hidden min-w-0">
          {note.tags && note.tags.length > 0 ? (
            note.tags.slice(0, 3).map(tag => (
              <span 
                key={tag} 
                onClick={(e) => { e.stopPropagation(); setActiveFilter(tag); setSearchQuery(''); }}
                className="cursor-pointer hover:bg-indigo-500 hover:text-white transition-colors text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-indigo-300 bg-indigo-500/10 flex-shrink-0 truncate max-w-full"
              >
                #{tag.replace('#', '')}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-slate-500 font-mono truncate">{note.date}</span>
          )}
        </div>
        
        <div className="flex gap-1 flex-shrink-0 opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); updateNote({ ...note, isArchived: !note.isArchived }); }}
            className="p-1.5 rounded-lg transition-colors hover:bg-slate-700 text-slate-400 hover:text-indigo-400"
            title={note.isArchived ? (lang === 'id' ? 'Batal Arsipkan' : 'Unarchive') : (lang === 'id' ? 'Arsipkan' : 'Archive')}
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
            className="p-1.5 rounded-lg transition-colors hover:bg-slate-700 text-slate-400 hover:text-red-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <div 
            onClick={(e) => handleTogglePinNote(e, note)}
            className="p-1.5 rounded-lg transition-colors hover:bg-slate-700"
          >
            <Pin className={`w-3.5 h-3.5 ${note.pinned ? 'fill-orange-400 text-orange-400' : 'text-slate-400 hover:text-orange-400'}`} />
          </div>
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
           </div>
           
           <div className="flex items-center gap-2">
             <button 
               onClick={(e) => handleTogglePinTask(e, task)}
               className="p-2 rounded-full transition-opacity hover:bg-slate-800/80 flex-none"
             >
               <Pin className={`w-4 h-4 ${task.pinned ? 'fill-indigo-400 text-indigo-400' : 'text-slate-400 hover:text-indigo-400'}`} />
             </button>
           </div>
         </div>
       );
     }

     const isHigh = task.priority === 'Tinggi';
     const isMed = task.priority === 'Sedang';
     return (
       <div key={`task-${task.id}`} className={`flex items-start gap-3 group border-slate-800/60 cursor-pointer px-4 ${!isLast ? 'border-b py-3' : 'pt-3 pb-3'}`} onClick={() => toggleTask(task.id)}>
         <button className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${
           task.completed 
             ? 'bg-indigo-500 border-indigo-500 text-white' 
             : 'border-slate-600 hover:border-indigo-400'
         }`}>
           {task.completed && <CheckSquare className="w-3 h-3" />}
         </button>
         <div className={`flex-1 ${task.completed ? 'opacity-50' : ''}`}>
            <h4 className={`text-sm font-medium ${task.completed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>{task.title}</h4>
         </div>
       </div>
     );
  };

  const renderContent = () => {
    if (query) {
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
           {activeTasks.length > 0 && (
             <div>
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 px-1"><CheckSquare className="w-4 h-4" /> {t('tasks')}</h3>
               <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                 {activeTasks.map((task, i) => renderTaskCard(task, i === activeTasks.length - 1))}
               </div>
             </div>
           )}
           {filteredNotes.length > 0 && (
             <div>
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2 px-1"><FileText className="w-4 h-4" /> {t('notes')}</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                 {filteredNotes.map(note => renderNoteCard(note))}
               </div>
             </div>
           )}
           {filteredNotes.length === 0 && activeTasks.length === 0 && (
             <div className="text-center py-20">
               <div className="w-16 h-16 bg-slate-800 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4">
                 <SearchIcon className="w-8 h-8" />
               </div>
               <h3 className="text-slate-300 font-bold text-lg mb-2">{t('no_results') || 'Tidak ada hasil'}</h3>
               <p className="text-slate-500 text-sm">{lang === 'id' ? 'Coba cari dengan kata kunci lain' : 'Try searching with another keyword'}</p>
             </div>
           )}
        </div>
      );
    }

    return (
       <div className="animate-in fade-in duration-300">
         {displayedNotes.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
             {displayedNotes.map(note => renderNoteCard(note))}
           </div>
         ) : (
           <div className="text-center py-20">
             <div className="w-16 h-16 bg-slate-800 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
               {activeFilter === 'archive' ? <Archive className="w-8 h-8" /> : activeFilter !== 'all' ? <TagIcon className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
             </div>
             <h3 className="text-slate-300 font-bold text-lg mb-2">
               {activeFilter === 'archive' 
                 ? (lang === 'id' ? 'Tidak ada arsip' : 'No archives') 
                 : activeFilter !== 'all' 
                   ? (lang === 'id' ? 'Tidak ada catatan dengan tag ini' : 'No notes with this tag')
                   : (lang === 'id' ? 'Belum ada catatan' : 'No notes yet')}
             </h3>
             {activeFilter === 'all' && (
               <p className="text-slate-500 text-sm">{lang === 'id' ? 'Buat catatan baru untuk melihatnya di sini' : 'Create a new note to see it here'}</p>
             )}
           </div>
         )}
       </div>
    );
  };

  return (
    <div className="h-full flex flex-col w-full overflow-hidden relative">
      <div className="flex-1 overflow-y-auto w-full no-scrollbar">
        <div className="pb-24 pt-[calc(env(safe-area-inset-top)+1.5rem)] px-4 md:px-8 max-w-4xl mx-auto space-y-6">
          
          <div className="flex justify-between items-center animate-in slide-in-from-bottom-2 fade-in duration-300">
            <h1 className="text-2xl font-black text-slate-50">
              {lang === 'id' ? 'Catatan' : 'Notes'}
            </h1>
            <button
              onClick={handleCreateNote}
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-full shadow-lg shadow-indigo-500/25 transition-transform active:scale-95 flex items-center justify-center"
              title={lang === 'id' ? 'Tambah Catatan' : 'Add Note'}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="relative group animate-in slide-in-from-bottom-3 fade-in duration-300 delay-75">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              placeholder={lang === 'id' ? 'Cari catatan atau tugas...' : 'Search notes or tasks...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-11 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-500 shadow-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-200 transition-colors rounded-full hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {!query && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide animate-in slide-in-from-bottom-4 fade-in duration-300 delay-100">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  activeFilter === 'all'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-500/20' 
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {lang === 'id' ? 'Semua' : 'All'}
              </button>
              
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveFilter(tag)}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                    activeFilter === tag
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-500/20' 
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <TagIcon className="w-3 h-3" />
                  {tag}
                </button>
              ))}

              <button
                onClick={() => setActiveFilter('archive')}
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  activeFilter === 'archive'
                    ? 'bg-slate-700 text-white border-slate-600 shadow-sm' 
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Archive className="w-3 h-3" />
                {lang === 'id' ? 'Arsip' : 'Archive'}
              </button>
            </div>
          )}

          {renderContent()}

        </div>
      </div>
    </div>
  );
}

