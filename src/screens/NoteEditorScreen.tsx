import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import { useTranslation } from '../translations';
import { Note } from "../types";
import { useAppStore } from "../store";

interface NoteEditorProps {
  note: Note;
  onBack: () => void;
}

export default function NoteEditorScreen({ note, onBack }: NoteEditorProps) {
  const { notes, addNote, updateNote, deleteNote, lang } = useAppStore();
  const t = useTranslation(lang);
  const [title, setTitle] = useState(note.title);
  const [initialHtml] = useState(() => {
    let html = note.content;
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

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== initialHtml) {
      editorRef.current.innerHTML = initialHtml;
    }
  }, []); // Only run once on mount

  const saveNote = () => {
    setIsSaving(true);
    const existing = notes.find((n) => n.id === note.id);
    const currTitle = title;
    const currContent = editorRef.current ? editorRef.current.innerHTML : contentRef.current;
    const currTags = tags;
    
    if (currTitle.trim() || currContent.trim() || currTags.length > 0) {
      if (existing) {
        updateNote({ ...existing, title: currTitle, content: currContent, tags: currTags });
      } else {
        addNote({ ...note, title: currTitle, content: currContent, tags: currTags });
      }
    } else {
      if (existing) {
        deleteNote(note.id);
      }
    }
    
    titleRef.current = currTitle;
    contentRef.current = currContent;
    tagsRef.current = currTags;
    
    setHasUnsavedChanges(false);
    setIsSaving(false);
    setLastSaved(Date.now());
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    contentRef.current = e.currentTarget.innerHTML;
    setHasUnsavedChanges(true);
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      saveNote();
    }
    
    // Also remove if perfectly empty
    const currTitle = title;
    const currContent = editorRef.current ? editorRef.current.innerHTML : contentRef.current;
    const currTags = tags;
    
    if (!currTitle.trim() && !currContent.trim() && currTags.length === 0) {
      const existing = notes.find((n) => n.id === note.id);
      if (existing) deleteNote(note.id);
    }
    onBack();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImage = () => {
    fileInputRef.current?.click();
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
          setHasUnsavedChanges(true);
          return newTags;
        });
      }
    }
    setNewTagInput("");
    setIsAddingTag(false);
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => {
      const newTags = prev.filter((t) => t !== tagToRemove);
      setHasUnsavedChanges(true);
      return newTags;
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 font-sans text-slate-200">
      {/* Top Bar */}
      <div className="flex-none h-16 border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="p-3 -ml-2 text-slate-400 hover:text-slate-50 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 text-slate-400">
          <button
            className="p-3 -mr-2 hover:text-red-400 transition-colors cursor-pointer text-slate-400"
            onClick={() => setShowDeleteConfirm(true)}
          >
             <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar flex flex-col">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="w-full text-3xl font-bold bg-transparent border-none outline-none text-slate-50 tracking-tight placeholder-slate-700 mb-4"
          placeholder={t('titlePlaceholder') || "New Note Title..."}
        />

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
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
              className="h-7 px-3 flex items-center justify-center rounded-lg border border-dashed border-slate-700 text-[10px] font-bold text-slate-500 uppercase tracking-wider hover:border-slate-500 transition-colors cursor-pointer"
            >
              + Tag
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-grow flex flex-col bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <div
            id="note-editor-content"
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onBlur={handleInput}
            className="w-full flex-grow text-slate-300 text-sm leading-relaxed bg-transparent border-none outline-none overflow-y-auto"
            style={{ minHeight: "200px" }}
            data-placeholder={t('notePlaceholder') || "Mulai menulis di sini..."}
          />
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
          </div>

          {isSaving ? (
            <div className="flex items-center justify-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400">
                {t('saving')}
              </span>
            </div>
          ) : hasUnsavedChanges ? (
            <button 
              onClick={saveNote}
              className="flex items-center justify-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full hover:bg-indigo-500/20 transition-colors cursor-pointer"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400">
                {t('save')}
              </span>
            </button>
          ) : (
            <div className="flex items-center justify-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">
                {t('saved')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center p-6 z-[100]">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-sm">
            <h3 className="text-lg font-bold text-red-400 mb-2">{t('deleteNoteTitle')}</h3>
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
    </div>
  );
}
