import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ArrowLeft,
  Trash2,
  Image as ImageIcon,
  Paperclip,
  Bell,
  Clock,
  Calendar,
  X,
  AlertCircle,
  Check,
  Bot,
  Sparkles,
  Shield,
  Eye,
  RefreshCw
} from "lucide-react";
import { useTranslation } from '../translations';
import { Note } from "../types";
import { useAppStore } from "../store";
import { formatReminderDate } from "../utils";

interface NoteEditorProps {
  note: Note;
  onBack: () => void;
  onNavigate?: (screen: any) => void;
}

export default function NoteEditorScreen({ note, onBack, onNavigate }: NoteEditorProps) {
  const { notes, addNote, updateNote, deleteNote, lang, setTempNoteContext, geminiApiKey } = useAppStore();
  const t = useTranslation(lang);
  const [title, setTitle] = useState(note.title);
  const [initialHtml] = useState(() => {
    let html = note.content || "";
    if (html && !html.includes("<") && html.includes("**")) {
      html = html
        .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
        .replace(/\*(.*?)\*/g, "<i>$1</i>")
        .replace(/__(.*?)__/g, "<u>$1</u>")
        .replace(/\n/g, "<br>");
    }
    return html;
  });
  
  const contentRef = useRef(initialHtml);
  const editorRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const titleRef = useRef(note.title);
  
  // Keep refs in sync for save callback without dependencies
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  const [tags, setTags] = useState(note.tags);
  const tagsRef = useRef(note.tags);
  useEffect(() => {
    tagsRef.current = tags;
  }, [tags]);

  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(Date.now());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [reminder, setReminder] = useState<string | undefined>(note.reminder);
  const reminderRef = useRef(note.reminder);
  useEffect(() => {
    reminderRef.current = reminder;
  }, [reminder]);

  const [showReminderModal, setShowReminderModal] = useState(false);
  const [customReminderVal, setCustomReminderVal] = useState("");

  // Noto AI Helper State
  const [showAIHelperModal, setShowAIHelperModal] = useState(false);
  const [aiHelperStage, setAIHelperStage] = useState<'select' | 'consent' | 'processing' | 'result'>('select');
  const [aiHelperAction, setAIHelperAction] = useState<'tidy' | 'summary' | 'checklist' | 'ideas'>('tidy');
  const [aiHelperResult, setAIHelperResult] = useState('');
  const [aiHelperError, setAIHelperError] = useState<string | null>(null);
  const [aiCredits, setAICredits] = useState(10);
  const [showGiveToAIModal, setShowGiveToAIModal] = useState(false);
  const [sharedWithAI, setSharedWithAI] = useState<boolean>(!!note.sharedWithAI);
  const sharedWithAIRef = useRef(!!note.sharedWithAI);
  useEffect(() => {
    sharedWithAIRef.current = sharedWithAI;
  }, [sharedWithAI]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== initialHtml) {
      editorRef.current.innerHTML = initialHtml;
    }
  }, []); // Only run once on mount

  // Load and check daily credits
  useEffect(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const storedDate = localStorage.getItem('noto_ai_credits_date');
      const storedCredits = localStorage.getItem('noto_ai_credits_left');

      if (storedDate === today && storedCredits !== null) {
        setAICredits(Number(storedCredits));
      } else {
        localStorage.setItem('noto_ai_credits_date', today);
        localStorage.setItem('noto_ai_credits_left', '10');
        setAICredits(10);
      }
    } catch (e) {}
  }, [showAIHelperModal]);

  const handleRunAIHelper = async () => {
    const rawContent = (editorRef.current ? editorRef.current.innerText : contentRef.current) || '';
    if (!rawContent.trim()) {
      setAIHelperError(lang === 'id' ? "Catatan Anda masih kosong. Silakan tulis sesuatu terlebih dahulu!" : "Your note is empty. Please write something first!");
      return;
    }

    if (aiCredits <= 0) {
      setAIHelperError(lang === 'id' ? "Kredit AI harian Anda habis. Silakan coba lagi besok!" : "Your daily AI credits are fully spent. Please try again tomorrow!");
      return;
    }

    setAIHelperStage('processing');
    setAIHelperError(null);

    let instruction = '';
    if (aiHelperAction === 'tidy') {
      instruction = lang === 'id'
        ? "Tolong rapikan tulisan berikut agar lebih rapi, profesional, perbaiki ejaan, tata bahasa, dan struktur kalimatnya tanpa merubah inti isinya. Kembalikan hasil jadinya langsung tanpa komentar pembuka atau penutup:\n\n"
        : "Please tidy up the following writing, improve its spelling, grammar, sentence structure, and make it look clean and professional without changing its core meaning. Return the finalized text directly without any introductory or concluding remarks:\n\n";
    } else if (aiHelperAction === 'summary') {
      instruction = lang === 'id'
        ? "Tolong buat ringkasan eksekutif yang padat, jelas, menggunakan poin-poin penting dari catatan berikut. Sampaikan langsung dengan format markdown atau poin-poin:\n\n"
        : "Please create a concise, clear executive summary with key bullet points from the following note. Return the formatted markdown directly:\n\n";
    } else if (aiHelperAction === 'checklist') {
      instruction = lang === 'id'
        ? "Tolong ubah catatan atau tulisan berikut menjadi daftar checklist tugas (todo list) terstruktur dalam format markdown sederhana:\n\n"
        : "Please convert the following writing/notes into a structured todo checklist in simple markdown format:\n\n";
    } else {
      instruction = lang === 'id'
        ? "Tolong berikan saran kreatif, ide pengembangan tambahan, atau umpan balik konstruktif untuk memperkaya isi catatan berikut:\n\n"
        : "Please provide creative suggestions, additional development ideas, or constructive feedback to enrich the following note:\n\n";
    }

    try {
      const messagesPayload = [
        { role: 'user', content: instruction + rawContent }
      ];

      const requestUrl = `${window.location.origin}/api/ai/chat`;
      console.log("[AI Note Helper Request]:", {
        url: requestUrl,
        payloadSize: JSON.stringify(messagesPayload).length,
      });

      const res = await fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesPayload,
          lang,
          customApiKey: geminiApiKey ? geminiApiKey.trim() : undefined
        })
      });

      console.log("[AI Note Helper Response]:", {
        status: res.status,
        statusText: res.statusText,
      });

      if (!res.ok) {
        const responseBodyText = await res.text().catch(() => "");
        console.error("[AI Note Helper Response Error Body]:", responseBodyText);
        
        let errorData: any = {};
        try {
          errorData = JSON.parse(responseBodyText);
        } catch (_) {}

        let errMsg = errorData?.error || `API Error (${res.status})`;
        if (res.status === 404) {
          errMsg = lang === 'id'
            ? `Error 404: Endpoint API atau Model tidak ditemukan. Harap pastikan model yang digunakan valid atau server web berjalan dengan benar.`
            : `Error 404: API Endpoint or Model not found. Please ensure the model is valid or the web server is running correctly.`;
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      setAIHelperResult(data.reply || '');
      setAIHelperStage('result');

      // Deduct credit
      const nextCredits = Math.max(0, aiCredits - 1);
      setAICredits(nextCredits);
      localStorage.setItem('noto_ai_credits_left', String(nextCredits));

    } catch (err) {
      console.error(err);
      setAIHelperError(lang === 'id' ? "Gagal memproses dengan Noto AI. Silakan coba lagi nanti." : "Failed to process with Noto AI. Please try again later.");
      setAIHelperStage('select');
    }
  };

  const handleApplyAIResult = () => {
    if (editorRef.current) {
      const formatted = aiHelperResult
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\*(.*?)\*/g, '<i>$1</i>')
        .replace(/\n/g, '<br>');
      
      editorRef.current.innerHTML = formatted;
      contentRef.current = formatted;
      setHasUnsavedChanges(true);
      triggerAutosave();
    }
    setShowAIHelperModal(false);
  };

  const handleGiveToAI = () => {
    const rawContent = (editorRef.current ? editorRef.current.innerText : contentRef.current) || '';
    setSharedWithAI(true);
    sharedWithAIRef.current = true;
    
    setTempNoteContext({
      title: title || (lang === 'id' ? 'Catatan Tanpa Judul' : 'Untitled Note'),
      content: rawContent
    });
    
    const existing = notes.find((n) => n.id === note.id);
    const currTitle = titleRef.current || '';
    const currContent = (editorRef.current ? editorRef.current.innerHTML : contentRef.current) || '';
    const currTags = tagsRef.current || [];
    const currReminder = reminderRef.current;
    
    if (existing) {
      updateNote({ ...existing, title: currTitle, content: currContent, tags: currTags, reminder: currReminder, sharedWithAI: true });
    } else {
      addNote({ ...note, title: currTitle, content: currContent, tags: currTags, reminder: currReminder, sharedWithAI: true });
    }
    
    setShowGiveToAIModal(false);
    if (onNavigate) {
      onNavigate('ai-companion');
    }
  };

  const handleRevokeAIAccess = () => {
    setSharedWithAI(false);
    sharedWithAIRef.current = false;
    
    const currTitleVal = title || (lang === 'id' ? 'Catatan Tanpa Judul' : 'Untitled Note');
    // Also clear from temp context if currently selected
    setTempNoteContext(null);
    
    const existing = notes.find((n) => n.id === note.id);
    const currTitle = titleRef.current || '';
    const currContent = (editorRef.current ? editorRef.current.innerHTML : contentRef.current) || '';
    const currTags = tagsRef.current || [];
    const currReminder = reminderRef.current;
    
    if (existing) {
      updateNote({ ...existing, title: currTitle, content: currContent, tags: currTags, reminder: currReminder, sharedWithAI: false });
    } else {
      addNote({ ...note, title: currTitle, content: currContent, tags: currTags, reminder: currReminder, sharedWithAI: false });
    }
    
    setShowGiveToAIModal(false);
  };

  const saveNote = () => {
    setIsSaving(true);
    const existing = notes.find((n) => n.id === note.id);
    const currTitle = titleRef.current || '';
    const currContent = (editorRef.current ? editorRef.current.innerHTML : contentRef.current) || '';
    const currTags = tagsRef.current || [];
    const currReminder = reminderRef.current;
    const currSharedWithAI = sharedWithAIRef.current;
    
    if (currTitle.trim() || currContent.trim() || currTags.length > 0 || currReminder || currSharedWithAI) {
      if (existing) {
        updateNote({ ...existing, title: currTitle, content: currContent, tags: currTags, reminder: currReminder, sharedWithAI: currSharedWithAI });
      } else {
        addNote({ ...note, title: currTitle, content: currContent, tags: currTags, reminder: currReminder, sharedWithAI: currSharedWithAI });
      }
    } else {
      if (existing) {
        deleteNote(note.id);
      }
    }
    
    setHasUnsavedChanges(false);
    setIsSaving(false);
    setLastSaved(Date.now());
  };

  const triggerAutosave = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      saveNote();
    }, 1500);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    titleRef.current = e.target.value;
    setHasUnsavedChanges(true);
    triggerAutosave();
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    contentRef.current = e.currentTarget.innerHTML;
    setHasUnsavedChanges(true);
    triggerAutosave();
  };

  const handleBack = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (hasUnsavedChanges) {
      saveNote();
    }
    
    // Also remove if perfectly empty (and no reminder set)
    const currTitle = titleRef.current || '';
    const currContent = (editorRef.current ? editorRef.current.innerHTML : contentRef.current) || '';
    const currTags = tagsRef.current || [];
    const currReminder = reminderRef.current;
    const currSharedWithAI = sharedWithAIRef.current;
    
    if (!currTitle.trim() && !currContent.trim() && currTags.length === 0 && !currReminder && !currSharedWithAI) {
      const existing = notes.find((n) => n.id === note.id);
      if (existing) deleteNote(note.id);
    }
    onBack();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docAttachRef = useRef<HTMLInputElement>(null);

  const handleImage = () => {
    fileInputRef.current?.click();
  };

  const handleDocAttachClick = () => {
    docAttachRef.current?.click();
  };

  const handleDocAttachChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (editorRef.current) {
        editorRef.current.focus();
        // Create an attractive, non-editable looking file attachment block
        const fileExt = file.name.split('.').pop()?.toUpperCase() || 'FILE';
        const html = `
          <br><br>
          <a href="${dataUrl}" download="${file.name}" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; text-decoration: none; color: #f8fafc; max-width: 300px; margin: 4px 0;" contenteditable="false">
            <div style="width: 40px; height: 40px; border-radius: 8px; background-color: #312e81; color: #818cf8; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; flex-shrink: 0;">
              ${fileExt.substring(0, 4)}
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${file.name}</div>
              <div style="font-size: 12px; color: #94a3b8;">${(file.size / 1024).toFixed(1)} KB • Klik untuk unduh</div>
            </div>
          </a>
          <br><br>
        `;
        document.execCommand("insertHTML", false, html);
        contentRef.current = editorRef.current.innerHTML;
        setHasUnsavedChanges(true);
        triggerAutosave();
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (editorRef.current) {
        editorRef.current.focus();
        const html = `<br><br><img src="${dataUrl}" alt="image" style="max-width: 100%; border-radius: 8px;" /><br><br>`;
        document.execCommand("insertHTML", false, html);
        contentRef.current = editorRef.current.innerHTML;
        setHasUnsavedChanges(true);
        triggerAutosave();
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");

  const handleAddTagSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newTagInput.trim()) {
      const newTag = newTagInput.trim().startsWith("#")
        ? newTagInput.trim()
        : "#" + newTagInput.trim();
      if (!tags.includes(newTag)) {
        setTags((prev) => {
          const newTags = [...prev, newTag];
          tagsRef.current = newTags;
          setHasUnsavedChanges(true);
          return newTags;
        });
        triggerAutosave();
      }
    }
    setNewTagInput("");
    setIsAddingTag(false);
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => {
      const newTags = prev.filter((t) => t !== tagToRemove);
      tagsRef.current = newTags;
      setHasUnsavedChanges(true);
      return newTags;
    });
    triggerAutosave();
  };

  const allExistingTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach(n => {
      n.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [notes]);
  
  const suggestedTags = useMemo(() => {
    const defaultTags = ['#penting', '#ide', '#kerja', '#pribadi', '#tugas'];
    const combinedTags = Array.from(new Set([...allExistingTags, ...defaultTags]));
    return combinedTags.filter(t => !tags.includes(t)).slice(0, 8);
  }, [allExistingTags, tags]);

  const handleAddExistingTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags(prev => {
        const newTags = [...prev, tag];
        tagsRef.current = newTags;
        setHasUnsavedChanges(true);
        return newTags;
      });
      triggerAutosave();
    }
  };

  return (
    <div className="flex flex-col h-full font-sans text-slate-200">
      {/* Top Bar */}
      <div className="flex-none min-h-[4rem] pt-[env(safe-area-inset-top)] border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="p-3 -ml-2 text-slate-400 hover:text-slate-50 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-4 text-slate-400">
          {isSaving ? (
            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mr-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                {t('saving')}
              </span>
            </div>
          ) : hasUnsavedChanges ? (
            <button 
              onClick={saveNote}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 border border-indigo-400 rounded-full hover:bg-indigo-600 transition-colors cursor-pointer mr-2 shadow-lg shadow-indigo-500/20"
            >
              <span className="text-sm font-bold uppercase tracking-widest text-white">
                {t('save')}
              </span>
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mr-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                {t('saved')}
              </span>
            </div>
          )}
          <button
            onClick={() => {
              const currTitle = titleRef.current;
              const currContent = contentRef.current;
              const currTags = tagsRef.current;
              
              if (note.id && notes.some(n => n.id === note.id)) {
                 updateNote({ ...note, title: currTitle, content: currContent, tags: currTags, isArchived: !note.isArchived, reminder: reminderRef.current });
              } else {
                 addNote({ ...note, title: currTitle, content: currContent, tags: currTags, isArchived: !note.isArchived, reminder: reminderRef.current });
              }
              onBack();
            }}
            className="p-3 hover:text-indigo-400 transition-colors cursor-pointer text-slate-400 relative group"
            title={note.isArchived ? (lang === 'id' ? 'Batal Arsipkan' : 'Unarchive') : (lang === 'id' ? 'Arsipkan' : 'Archive')}
          >
            {note.isArchived ? (
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="9 10 12 7 15 10"></polyline><line x1="12" y1="7" x2="12" y2="15"></line><polyline points="21 8 21 21 3 21 3 8"></polyline><line x1="23" y1="3" x2="1" y2="3"></line><line x1="23" y1="8" x2="1" y2="8"></line></svg>
            ) : (
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
            )}
          </button>
          <button
            className="p-3 -mr-2 hover:text-red-400 transition-colors cursor-pointer text-slate-400"
            onClick={() => setShowDeleteConfirm(true)}
          >
             <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar w-full">
        <div className="w-full max-w-4xl mx-auto px-6 py-6 flex flex-col min-h-full">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="w-full text-3xl font-bold bg-transparent border-none outline-none text-slate-50 tracking-tight placeholder-slate-400 mb-4"
            placeholder={t('titlePlaceholder') || "New Note Title..."}
          />

          {/* Noto AI Permission Badge */}
          {sharedWithAI && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full w-fit mb-4 text-indigo-400 text-[10px] font-bold animate-in fade-in duration-200">
              <Sparkles size={11} className="animate-pulse" />
              <span>{lang === 'id' ? 'Telah Masuk Noto AI' : 'Shared with Noto AI'}</span>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-col gap-3 mb-8">
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg group"
                >
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                    {tag.replace("#", "")}
                  </span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="w-4 h-4 flex items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 hover:bg-red-500/80 hover:text-white transition-colors"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {isAddingTag ? (
                <form onSubmit={handleAddTagSubmit} className="flex items-center">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    autoFocus
                    onBlur={handleAddTagSubmit}
                    placeholder={t('tagNamePlaceholder')}
                    className="h-7 w-24 px-2 bg-slate-900 border border-indigo-500 rounded-lg text-[10px] text-slate-50 outline-none"
                  />
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingTag(true)}
                  className="h-7 px-3 flex items-center justify-center rounded-lg border border-dashed border-slate-700 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:border-slate-500 transition-colors cursor-pointer"
                >
                  + Tag
                </button>
              )}
            </div>

            {suggestedTags.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Rekomendasi:</span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleAddExistingTag(tag)}
                      className="px-2 py-1 rounded-md border border-slate-800 bg-slate-900/80 text-[10px] text-slate-400 font-bold uppercase tracking-wider hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      +{tag.replace("#", "")}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Reminder Banner */}
          {reminder && (
            <div className="flex items-center justify-between p-3.5 mb-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Bell className="w-4 h-4 animate-swing" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">{t('reminderBadgeLabel')}</span>
                  <span className="text-xs font-semibold text-slate-100">{formatReminderDate(reminder, lang)}</span>
                </div>
              </div>
              <button 
                onClick={() => { setReminder(undefined); setHasUnsavedChanges(true); }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-all text-[11px] font-bold"
              >
                {t('clearReminder')}
              </button>
            </div>
          )}

          {/* Content */}
          <div className="flex-grow flex flex-col bg-slate-900 border border-slate-800 rounded-3xl p-4 md:p-5">
            <div
              id="note-editor-content"
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onBlur={handleInput}
              className="w-full flex-grow text-slate-300 text-sm leading-relaxed bg-transparent border-none outline-none overflow-y-auto overflow-x-hidden note-editor-area break-words "
              style={{ minHeight: "200px" }}
              data-placeholder={t('notePlaceholder') || "Mulai menulis di sini..."}
            />
          </div>
        </div>
      </div>

      {/* Editor Toolbar & Status */}
      <div className="bg-slate-900 border-t border-slate-800 p-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                handleImage();
              }}
              className="hover:text-indigo-400 transition-colors"
              title="Lampirkan Gambar"
            >
              <ImageIcon size={18} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                handleDocAttachClick();
              }}
              className="hover:text-indigo-400 transition-colors"
              title="Lampirkan Dokumen"
            >
              <Paperclip size={18} />
            </button>
            <input 
              type="file" 
              ref={docAttachRef} 
              onChange={handleDocAttachChange} 
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar" 
              className="hidden" 
            />
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                setShowReminderModal(true);
              }}
              className={`hover:text-indigo-400 transition-colors ${reminder ? 'text-indigo-400' : 'text-slate-400'}`}
              title={t('setReminder')}
            >
              <Bell size={18} />
            </button>

            {/* Noto AI Surgical Note Helper */}
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                setAIHelperStage('select');
                setAIHelperError(null);
                setShowAIHelperModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-500/40 rounded-full text-xs font-semibold text-indigo-400 cursor-pointer transition-all hover:bg-indigo-500/20 ml-2"
              title="Noto AI Helper"
            >
              <Bot size={14} className="animate-pulse" />
              <span>Noto AI</span>
            </button>

            {/* Berikan ke AI Button */}
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                setShowGiveToAIModal(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 border hover:border-emerald-500/40 rounded-full text-xs font-semibold cursor-pointer transition-all ml-2 ${
                sharedWithAI 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-700/60 hover:text-slate-200'
              }`}
              title={lang === 'id' ? 'Pengaturan Akses Noto AI' : 'Noto AI Access Settings'}
            >
              <Sparkles size={14} className={sharedWithAI ? "animate-pulse text-emerald-400" : ""} />
              <span>{sharedWithAI ? (lang === 'id' ? 'Masuk AI (Aktif)' : 'Shared (Active)') : (lang === 'id' ? 'Berikan ke AI' : 'Give to AI')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reminder Setting Modal */}
      {showReminderModal && (
        <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-4 md:p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-sm flex flex-col text-left shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-50 flex items-center gap-2">
                <Bell size={18} className="text-indigo-400" /> {t('setReminder')}
              </h3>
              <button 
                onClick={() => setShowReminderModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              {t('reminderSetFor')} {reminder ? <strong className="text-indigo-400">{formatReminderDate(reminder, lang)}</strong> : <em className="text-slate-500">{t('noReminder')}</em>}
            </p>

            <div className="flex flex-col gap-2.5 mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('quickPresets')}</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const d = new Date();
                    d.setHours(d.getHours() + 1);
                    const tzOffset = d.getTimezoneOffset() * 60000;
                    const localISO = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
                    setReminder(localISO);
                    setHasUnsavedChanges(true);
                    setShowReminderModal(false);
                  }}
                  className="px-3 py-2.5 text-xs font-bold text-slate-200 bg-slate-850 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 rounded-xl transition-all flex items-center gap-2 justify-center"
                >
                  <Clock size={12} className="text-indigo-400" /> {t('preset1Hour')}
                </button>
                <button
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    d.setHours(9, 0, 0, 0); // 9 AM tomorrow
                    const tzOffset = d.getTimezoneOffset() * 60000;
                    const localISO = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
                    setReminder(localISO);
                    setHasUnsavedChanges(true);
                    setShowReminderModal(false);
                  }}
                  className="px-3 py-2.5 text-xs font-bold text-slate-200 bg-slate-850 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 rounded-xl transition-all flex items-center gap-2 justify-center"
                >
                  <Calendar size={12} className="text-indigo-400" /> {t('presetTomorrow')}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('customReminder')}</span>
              <input
                type="datetime-local"
                value={customReminderVal || (reminder ? reminder.slice(0, 16) : "")}
                onChange={(e) => {
                  setCustomReminderVal(e.target.value);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-50 text-sm outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="flex justify-end gap-3">
              {reminder && (
                <button 
                  onClick={() => {
                    setReminder(undefined);
                    setCustomReminderVal("");
                    setHasUnsavedChanges(true);
                    setShowReminderModal(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors mr-auto"
                >
                  {t('clearReminder')}
                </button>
              )}
              <button 
                onClick={() => setShowReminderModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-50 bg-slate-800 transition-colors"
              >
                {t('cancel')}
              </button>
              <button 
                onClick={() => {
                  if (customReminderVal) {
                    setReminder(customReminderVal);
                    setHasUnsavedChanges(true);
                  }
                  setShowReminderModal(false);
                }}
                className="px-4 py-2 rounded-xl text-white text-sm font-bold bg-indigo-500 hover:bg-indigo-600 transition-colors"
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-4 md:p-4 z-[100]">
          <div className="bg-slate-900 border border-slate-800 p-4 md:p-4 rounded-3xl w-full max-w-sm">
            <h3 className="text-xl font-bold text-red-400 mb-2">{t('deleteNoteTitle')}</h3>
            <p className="text-sm text-slate-400 mb-6">
              {t('deleteNoteConfirm')}
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-50 bg-slate-800 transition-colors"
              >
                {t('cancel')}
              </button>
              <button 
                onClick={() => {
                  deleteNote(note.id);
                  onBack();
                }}
                className="px-4 py-2 rounded-xl text-white text-sm font-bold bg-red-500 hover:bg-red-600 transition-colors"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTO AI HELPER MODAL */}
      {showAIHelperModal && (
        <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-4 md:p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-md flex flex-col text-left shadow-2xl relative overflow-hidden">
            {/* Ambient bg blur decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4 flex-none">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Bot size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Noto AI Helper</h3>
                  <p className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1">
                    <Shield size={10} /> Privacy-First Surgical Note Helper
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAIHelperModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                &times;
              </button>
            </div>

            {aiHelperError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-2 flex-none">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300 leading-relaxed">{aiHelperError}</p>
              </div>
            )}

            {/* Stage: Select Action */}
            {aiHelperStage === 'select' && (
              <div className="flex flex-col flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  {lang === 'id' ? 'Pilih Aksi AI' : 'Select AI Action'}
                </span>

                <div className="grid grid-cols-2 gap-2.5 mb-5">
                  <button
                    onClick={() => setAIHelperAction('tidy')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      aiHelperAction === 'tidy' 
                        ? 'bg-indigo-600/20 border-indigo-500 text-slate-100' 
                        : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs">{lang === 'id' ? 'Rapikan Tulisan' : 'Tidy Up'}</div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-normal">{lang === 'id' ? 'Tata bahasa & ejaan' : 'Fix grammar & styling'}</div>
                  </button>

                  <button
                    onClick={() => setAIHelperAction('summary')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      aiHelperAction === 'summary' 
                        ? 'bg-indigo-600/20 border-indigo-500 text-slate-100' 
                        : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs">{lang === 'id' ? 'Buat Ringkasan' : 'Summarize'}</div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-normal">{lang === 'id' ? 'Poin-poin eksekutif' : 'Key executive points'}</div>
                  </button>

                  <button
                    onClick={() => setAIHelperAction('checklist')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      aiHelperAction === 'checklist' 
                        ? 'bg-indigo-600/20 border-indigo-500 text-slate-100' 
                        : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs">{lang === 'id' ? 'Ubah Checklist' : 'To Checklist'}</div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-normal">{lang === 'id' ? 'Ubah jadi daftar todo' : 'Turn into todo list'}</div>
                  </button>

                  <button
                    onClick={() => setAIHelperAction('ideas')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      aiHelperAction === 'ideas' 
                        ? 'bg-indigo-600/20 border-indigo-500 text-slate-100' 
                        : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs">{lang === 'id' ? 'Saran & Ide' : 'Get Ideas'}</div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-normal">{lang === 'id' ? 'Inspirasi tambahan' : 'Feedback & creativity'}</div>
                  </button>
                </div>

                <div className="flex justify-between items-center bg-slate-950 px-4 py-3 border border-slate-800/80 rounded-2xl mb-5 flex-none">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <Sparkles size={14} className="text-amber-400" />
                    <span>{lang === 'id' ? 'Kredit Harian Tersisa:' : 'Daily Credits Left:'}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-200 bg-slate-800 px-2.5 py-1 rounded-full">
                    {aiCredits} / 10
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAIHelperModal(false)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-semibold text-sm rounded-xl transition-colors cursor-pointer border border-slate-700/40 text-center"
                  >
                    {lang === 'id' ? 'Batal' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => setAIHelperStage('consent')}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer text-center shadow-lg shadow-indigo-600/20"
                  >
                    {lang === 'id' ? 'Lanjutkan' : 'Continue'}
                  </button>
                </div>
              </div>
            )}

            {/* Stage: Explicit Consent */}
            {aiHelperStage === 'consent' && (
              <div className="flex flex-col">
                <div className="flex items-center gap-2.5 text-amber-400 mb-3 flex-none">
                  <Shield size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">{lang === 'id' ? 'Persetujuan Privasi' : 'Privacy Consent'}</span>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  {lang === 'id'
                    ? "Untuk melakukan pemrosesan ini, Noto AI perlu mengirimkan **seluruh isi catatan aktif ini** ke server Gemini API secara aman."
                    : "To perform this request, Noto AI needs to securely transmit the **entire text of this active note** to the Gemini API server."}
                </p>

                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 mb-5 flex items-start gap-2.5 flex-none">
                  <Eye className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {lang === 'id'
                      ? "Kami tidak menyimpan, mencatat, atau membagikan catatan Anda kepada siapa pun. Data dikirim statelesst untuk pemrosesan instan dan langsung dilupakan."
                      : "We never save, log, or track your writing. Data is sent statelessly for instant computation and is immediately forgotten."}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setAIHelperStage('select')}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-semibold text-sm rounded-xl transition-colors cursor-pointer border border-slate-700/40 text-center"
                  >
                    {lang === 'id' ? 'Kembali' : 'Back'}
                  </button>
                  <button
                    onClick={handleRunAIHelper}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-colors cursor-pointer text-center shadow-lg shadow-indigo-600/20"
                  >
                    {lang === 'id' ? 'Izinkan & Proses' : 'Allow & Process'}
                  </button>
                </div>
              </div>
            )}

            {/* Stage: Processing */}
            {aiHelperStage === 'processing' && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <RefreshCw size={36} className="text-indigo-400 animate-spin mb-4" />
                <h4 className="font-bold text-slate-100 text-sm mb-1">{lang === 'id' ? 'Sedang Memproses secara Aman...' : 'Processing Securely...'}</h4>
                <p className="text-xs text-slate-400 max-w-[280px] leading-relaxed">
                  {lang === 'id' 
                    ? "Menghubungi Noto AI menggunakan jalur terenkripsi. Mohon tunggu sebentar." 
                    : "Connecting to Noto AI over encrypted channels. Please wait."}
                </p>
              </div>
            )}

            {/* Stage: Result View */}
            {aiHelperStage === 'result' && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex-none">
                  {lang === 'id' ? 'HASIL PROSES NOTO AI' : 'NOTO AI OUTPUT'}
                </span>

                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 mb-5 overflow-y-auto max-h-[220px] text-xs leading-relaxed text-slate-200 no-scrollbar whitespace-pre-wrap flex-1 font-mono">
                  {aiHelperResult}
                </div>

                <div className="flex gap-2.5 flex-none">
                  <button
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(aiHelperResult);
                      } catch (err) {}
                    }}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors border border-slate-700/40 text-center cursor-pointer"
                  >
                    {lang === 'id' ? 'Salin' : 'Copy'}
                  </button>
                  <button
                    onClick={() => {
                      setAIHelperStage('select');
                      setAIHelperResult('');
                    }}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors border border-slate-700/40 text-center cursor-pointer"
                  >
                    {lang === 'id' ? 'Kembali' : 'Back'}
                  </button>
                  <button
                    onClick={handleApplyAIResult}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-colors text-center cursor-pointer shadow-lg shadow-indigo-600/20"
                  >
                    {lang === 'id' ? 'Terapkan ke Catatan' : 'Apply to Note'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* GIVE TO AI CONSENT MODAL */}
      {showGiveToAIModal && (
        <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-4 md:p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-sm flex flex-col text-left shadow-2xl relative overflow-hidden">
            {/* Ambient decoration */}
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none ${sharedWithAI ? 'bg-indigo-500/10' : 'bg-emerald-500/10'}`} />

            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${sharedWithAI ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                {sharedWithAI ? <Sparkles size={20} className="animate-pulse" /> : <Shield size={20} />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  {sharedWithAI 
                    ? (lang === 'id' ? 'Akses Noto AI Aktif' : 'Noto AI Access Active') 
                    : (lang === 'id' ? 'Berikan ke Noto AI' : 'Give to Noto AI')}
                </h3>
                <span className={`text-[10px] font-medium uppercase tracking-wider block mt-0.5 ${sharedWithAI ? 'text-indigo-400' : 'text-emerald-400'}`}>
                  {sharedWithAI 
                    ? (lang === 'id' ? 'Izin Akses Diaktifkan' : 'Access Permission Enabled') 
                    : (lang === 'id' ? 'Izin Privasi Terbatas' : 'Limited Privacy Permission')}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {sharedWithAI 
                ? (lang === 'id'
                  ? 'Catatan ini telah diberikan izin untuk dibahas dengan asisten AI Noto secara aman. Anda bisa langsung masuk ke obrolan atau mencabut izin akses ini.'
                  : 'This note has been granted access to be discussed securely with the Noto AI assistant. You can proceed to the chat or revoke this permission.')
                : (lang === 'id'
                  ? 'Apakah Anda ingin mengirimkan isi catatan ini secara aman ke Noto AI Companion? Catatan ini hanya akan tersedia selama sesi obrolan aktif ini dan tidak akan disimpan permanen.'
                  : 'Do you want to securely share this note\'s contents with the Noto AI Companion? It will only be active during this stateless chat session and won\'t be permanently stored.')}
            </p>

            {/* Content Preview */}
            <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-2xl mb-5 max-h-[120px] overflow-y-auto no-scrollbar">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                {lang === 'id' ? 'Judul Catatan' : 'Note Title'}
              </span>
              <span className="text-xs font-bold text-slate-200 block mb-2">{title || (lang === 'id' ? 'Catatan Tanpa Judul' : 'Untitled Note')}</span>
              
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                {lang === 'id' ? 'Konten Terenkripsi Lokal' : 'Local Plaintext Content'}
              </span>
              <p className="text-xs font-mono text-slate-400 whitespace-pre-wrap leading-relaxed">
                {(editorRef.current ? editorRef.current.innerText : contentRef.current) || (lang === 'id' ? '(Catatan Kosong)' : '(Empty Note)')}
              </p>
            </div>

            {sharedWithAI ? (
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleGiveToAI}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer text-center shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  <Sparkles size={14} />
                  <span>{lang === 'id' ? 'Buka di Obrolan AI' : 'Open in AI Chat'}</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowGiveToAIModal(false)}
                    className="py-2.5 bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer border border-slate-700/40 text-center"
                  >
                    {lang === 'id' ? 'Kembali' : 'Back'}
                  </button>
                  <button
                    onClick={handleRevokeAIAccess}
                    className="py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-xs rounded-xl transition-colors cursor-pointer border border-red-500/20 text-center"
                  >
                    {lang === 'id' ? 'Cabut Izin Akses' : 'Revoke Access'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowGiveToAIModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700/80 text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer border border-slate-700/40 text-center"
                >
                  {lang === 'id' ? 'Batalkan' : 'Cancel'}
                </button>
                <button
                  onClick={handleGiveToAI}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer text-center shadow-lg shadow-emerald-600/20"
                >
                  {lang === 'id' ? 'Berikan & Bahas' : 'Give & Discuss'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
