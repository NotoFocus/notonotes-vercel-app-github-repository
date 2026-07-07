import React, { createContext, useContext, useState, useEffect } from 'react';
import { Note, Task, User, Transaction, MoodEntry } from './types';
import { currentUser, recentNotes, allTasks } from './data';
import { generateId } from './utils';
import { getLargeItem, getLargeItemSync, setLargeItem, deleteLargeItem } from './utils/db';

interface AppContextType {
  notes: Note[];
  tasks: Task[];
  transactions: Transaction[];
  moods: MoodEntry[];
  user: User;
  updateUser: (u: User) => void;
  addNote: (note: Note) => void;
  updateNote: (note: Note) => void;
  deleteNote: (id: string) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  toggleTask: (id: string, dateStr?: string) => void;
  deleteTask: (id: string) => void;
  setMood: (date: string, mood: MoodEntry['mood'], note?: string) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  clearAllTransactions: () => void;
  importTransactions: (transactions: Transaction[]) => void;
  importData: (notes: Note[], tasks: Task[], transactions?: Transaction[]) => void;
  clearAllData: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  appPin: string | null;
  setAppPin: (pin: string | null) => void;
  pinRecoveryQuestion: string | null;
  setPinRecoveryQuestion: (question: string | null) => void;
  pinRecoveryAnswer: string | null;
  setPinRecoveryAnswer: (answer: string | null) => void;
  lang: 'id' | 'en';
  setLang: (l: 'id' | 'en') => void;
  isUnlocked: boolean;
  setIsUnlocked: (val: boolean) => void;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (val: boolean) => void;
  streak: number;
  reminderActive: boolean;
  setReminderActive: (val: boolean) => void;
  reminderTime: string;
  setReminderTime: (val: string) => void;
  savingsTarget: number | null;
  setSavingsTarget: (val: number | null) => void;
  savingsTargetTitle: string;
  setSavingsTargetTitle: (val: string) => void;
  savingsBalance: number;
  setSavingsBalance: React.Dispatch<React.SetStateAction<number>>;
  checkInDaily: () => void;
  archivedTags: string[];
  setArchivedTags: React.Dispatch<React.SetStateAction<string[]>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage:`, e);
  }
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(() => {
    try {
      const dbStr = getLargeItemSync('noto_user');
      const s = dbStr || localStorage.getItem('noto_user');
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed && typeof parsed === 'object') {
          if (parsed.avatarUrl === 'indexeddb:user_avatar') {
            const cached = getLargeItemSync('user_avatar');
            if (cached) parsed.avatarUrl = cached;
          }
          return parsed;
        }
      }
    } catch(e){}
    return currentUser;
  });


  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const dbStr = getLargeItemSync('noto_notes');
      const s = dbStr || localStorage.getItem('noto_notes');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) {
          const seen = new Set();
          return parsed.map((n: Note) => {
            if (seen.has(n.id)) n.id = generateId();
            seen.add(n.id);
            return n;
          });
        }
      }
    } catch(e){}
    return recentNotes;
  });

  
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const dbStr = getLargeItemSync('noto_tasks');
      const s = dbStr || localStorage.getItem('noto_tasks');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) {
          const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
          return parsed.map((t: Task) => {
            if (t.repeat === 'daily') {
              const isCompletedToday = t.completedDates && t.completedDates.includes(todayStr);
              if (t.completed && !isCompletedToday) {
                return { ...t, completed: false };
              }
            }
            return t;
          });
        }
      }
    } catch(e){}
    return allTasks;
  });



  useEffect(() => {
    const checkDailyReset = () => {
      const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      setTasks(prev => {
        if (!prev) return prev;
        let needsUpdate = false;
        const next = prev.map(t => {
          if (t.repeat === 'daily') {
            const isCompletedToday = t.completedDates && t.completedDates.includes(todayStr);
            if (t.completed && !isCompletedToday) {
              needsUpdate = true;
              return { ...t, completed: false };
            }
          }
          return t;
        });
        return needsUpdate ? next : prev;
      });
    };

    checkDailyReset();
    const interval = setInterval(checkDailyReset, 60000);
    return () => clearInterval(interval);
  }, []);

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const dbStr = getLargeItemSync('noto_transactions');
      const s = dbStr || localStorage.getItem('noto_transactions');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch(e){}
    return [];
  });


  const [moods, setMoods] = useState<MoodEntry[]>(() => {
    try {
      const dbStr = getLargeItemSync('noto_moods');
      const s = dbStr || localStorage.getItem('noto_moods');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch(e){}
    return [];
  });


  const [archivedTags, setArchivedTags] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('noto_archived_tags');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch(e){}
    return [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [appPin, setAppPin] = useState<string | null>(() => {
    try { return localStorage.getItem('noto_pin'); } catch(e){}
    return null;
  });
  const [pinRecoveryQuestion, setPinRecoveryQuestion] = useState<string | null>(() => {
    try { return localStorage.getItem('noto_pin_question'); } catch(e){}
    return null;
  });
  const [pinRecoveryAnswer, setPinRecoveryAnswer] = useState<string | null>(() => {
    try { return localStorage.getItem('noto_pin_answer'); } catch(e){}
    return null;
  });
  const [lang, setLang] = useState<'id' | 'en'>(() => {
    try { const s = localStorage.getItem('noto_lang'); if (s) return s as 'id' | 'en'; } catch(e){}
    return 'id';
  });

  const [reminderActive, setReminderActive] = useState<boolean>(() => {
    try { 
      const s = localStorage.getItem('noto_reminder_active'); 
      if (s !== null) return JSON.parse(s); 
    } catch(e){}
    return true;
  });

  const [reminderTime, setReminderTime] = useState<string>(() => {
    try { 
      const s = localStorage.getItem('noto_reminder_time'); 
      if (s) return s; 
    } catch(e){}
    return '09:00';
  });

  const [savingsTarget, setSavingsTarget] = useState<number | null>(() => {
    try {
      const s = localStorage.getItem('noto_savings_target');
      if (s !== null) return JSON.parse(s);
    } catch(e){}
    return null;
  });

  const [savingsTargetTitle, setSavingsTargetTitle] = useState<string>(() => {
    try {
      const s = localStorage.getItem('noto_savings_target_title');
      if (s !== null) return s;
    } catch(e){}
    return '';
  });

  const [savingsBalance, setSavingsBalance] = useState<number>(() => {
    try {
      const s = localStorage.getItem('noto_savings_balance');
      if (s !== null) return JSON.parse(s);
    } catch(e){}
    return 0;
  });

  useEffect(() => { safeSetItem('noto_lang', lang); }, [lang]);
  useEffect(() => { safeSetItem('noto_reminder_active', JSON.stringify(reminderActive)); }, [reminderActive]);
  useEffect(() => { safeSetItem('noto_reminder_time', reminderTime); }, [reminderTime]);
  useEffect(() => {
    if (savingsTarget !== null) safeSetItem('noto_savings_target', JSON.stringify(savingsTarget));
    else { try { localStorage.removeItem('noto_savings_target'); } catch(e){} }
  }, [savingsTarget]);

  useEffect(() => {
    if (savingsTargetTitle) safeSetItem('noto_savings_target_title', savingsTargetTitle);
    else { try { localStorage.removeItem('noto_savings_target_title'); } catch(e){} }
  }, [savingsTargetTitle]);

  useEffect(() => {
    safeSetItem('noto_savings_balance', JSON.stringify(savingsBalance));
  }, [savingsBalance]);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    try { 
      const s = localStorage.getItem('noto_onboarding_completed'); 
      if (s !== null) {
        const isCompleted = JSON.parse(s);
        if (isCompleted) return true;
      }

      // Jika belum selesai atau false tapi ternyata punya data (pengguna lama sebelum fitur rilis)
      const u = localStorage.getItem('noto_user');
      if (u) {
        const parsed = JSON.parse(u);
        if (parsed?.name && parsed.name !== 'Pengguna') return true;
      }

      const tasksStr = localStorage.getItem('noto_tasks');
      if (tasksStr && tasksStr !== '[]') return true;

      const notesStr = localStorage.getItem('noto_notes');
      if (notesStr && notesStr !== '[]') return true;
      
    } catch(e){}
    return false;
  });

  useEffect(() => { safeSetItem('noto_onboarding_completed', JSON.stringify(hasCompletedOnboarding)); }, [hasCompletedOnboarding]);

  // Streak logic
  const [streak, setStreak] = useState(() => {
    try { const s = localStorage.getItem('noto_streak'); if (s) return parseInt(s, 10); } catch(e){}
    return 0;
  });
  const [lastTaskCompleted, setLastTaskCompleted] = useState(() => {
    try { return localStorage.getItem('noto_last_task_completed'); } catch(e){}
    return null;
  });

  useEffect(() => {
    if (lastTaskCompleted) {
      const today = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      const lastDate = new Date(lastTaskCompleted);
      const currentDate = new Date(today);
      const MathFloorDiff = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)); 
      
      if (MathFloorDiff > 1) {
        setStreak(0);
      }
    }
  }, []);

  // Request storage persistence so browser does not clear localStorage automatically
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then((persisted) => {
        if (persisted) {
          console.log("Noto storage persistence granted.");
        } else {
          console.log("Noto storage persistence not granted.");
        }
      }).catch((err) => {
        console.warn("Storage persistence error:", err);
      });
    }
  }, []);

  useEffect(() => {
    const lightweightUser = { ...user };
    if (user.avatarUrl && user.avatarUrl.startsWith('data:image/')) {
      setLargeItem('user_avatar', user.avatarUrl).catch(e => console.error(e));
      lightweightUser.avatarUrl = 'indexeddb:user_avatar';
    } else if (user.avatarUrl === '') {
      deleteLargeItem('user_avatar').catch(e => console.error(e));
    }
    safeSetItem('noto_user', JSON.stringify(lightweightUser));
  }, [user]);
  useEffect(() => { 
    const str = JSON.stringify(notes);
    safeSetItem('noto_notes', str); 
    setLargeItem('noto_notes', str).catch(e => console.error(e));
  }, [notes]);
  useEffect(() => { 
    const str = JSON.stringify(tasks);
    safeSetItem('noto_tasks', str); 
    setLargeItem('noto_tasks', str).catch(e => console.error(e));
  }, [tasks]);
  useEffect(() => { 
    const str = JSON.stringify(transactions);
    safeSetItem('noto_transactions', str); 
    setLargeItem('noto_transactions', str).catch(e => console.error(e));
  }, [transactions]);
  useEffect(() => { 
    const str = JSON.stringify(moods);
    safeSetItem('noto_moods', str); 
    setLargeItem('noto_moods', str).catch(e => console.error(e));
  }, [moods]);
  useEffect(() => {
    try {
      if (appPin) safeSetItem('noto_pin', appPin); else localStorage.removeItem('noto_pin');
    } catch(e){}
  }, [appPin]);
  useEffect(() => {
    try {
      if (pinRecoveryQuestion) safeSetItem('noto_pin_question', pinRecoveryQuestion); else localStorage.removeItem('noto_pin_question');
    } catch(e){}
  }, [pinRecoveryQuestion]);
  useEffect(() => {
    try {
      if (pinRecoveryAnswer) safeSetItem('noto_pin_answer', pinRecoveryAnswer); else localStorage.removeItem('noto_pin_answer');
    } catch(e){}
  }, [pinRecoveryAnswer]);
  useEffect(() => { safeSetItem('noto_streak', streak.toString()); }, [streak]);
  useEffect(() => { if (lastTaskCompleted) safeSetItem('noto_last_task_completed', lastTaskCompleted); }, [lastTaskCompleted]);
  useEffect(() => { safeSetItem('noto_archived_tags', JSON.stringify(archivedTags)); }, [archivedTags]);

  const addNote = (note: Note) => setNotes(prev => {
    if (prev.some(n => n.id === note.id)) return prev.map(n => n.id === note.id ? note : n);
    return [note, ...prev];
  });
  const updateNote = (note: Note) => setNotes(prev => prev.map(n => n.id === note.id ? note : n));
  const deleteNote = (id: string) => setNotes(prev => prev.filter(n => n.id !== id));

  const addTask = (task: Task) => setTasks(prev => {
    if (prev.some(t => t.id === task.id)) return prev.map(t => t.id === task.id ? task : t);
    return [task, ...prev];
  });
  const updateTask = (task: Task) => setTasks(prev => prev.map(t => t.id === task.id ? task : t));
  const toggleTask = (id: string, dateStr?: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const todayIso = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const targetDate = dateStr || todayIso;
    const isToday = targetDate === todayIso;
    
    let isNowCompleted = false;
    let wasCompleted = false;

    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      
      if (t.isDiscipline) {
         const disciplineData = t.disciplineData || {};
         const dailyCheckins = new Set(disciplineData.dailyCheckins || []);
         const wasDoneOnDate = dailyCheckins.has(targetDate);
         
         if (isToday) {
            wasCompleted = t.completed;
            const newCompleted = !t.completed;
            if (newCompleted) dailyCheckins.add(targetDate);
            else dailyCheckins.delete(targetDate);
            isNowCompleted = newCompleted;
         } else {
            if (wasDoneOnDate) {
              dailyCheckins.delete(targetDate);
            } else {
              dailyCheckins.add(targetDate);
              isNowCompleted = true; // For streak trigger
            }
         }
         
         const isCompletedToday = dailyCheckins.has(todayIso);
         
         return {
           ...t,
           completed: isCompletedToday,
           disciplineData: {
             ...disciplineData,
             dailyCheckins: Array.from(dailyCheckins)
           }
         };
      }

      const completedDates = new Set(t.completedDates || []);
      let newCompleted = t.completed;
      
      if (t.repeat === 'daily') {
         if (isToday) {
            wasCompleted = t.completed;
            newCompleted = !t.completed;
            if (newCompleted) completedDates.add(targetDate);
            else completedDates.delete(targetDate);
            isNowCompleted = newCompleted;
         } else {
            const wasDoneOnDate = completedDates.has(targetDate);
            if (wasDoneOnDate) completedDates.delete(targetDate);
            else {
              completedDates.add(targetDate);
              isNowCompleted = true; // For streak trigger
            }
         }
      } else {
         wasCompleted = t.completed;
         newCompleted = !t.completed;
         isNowCompleted = newCompleted;
         if (newCompleted) completedDates.add(targetDate);
         else completedDates.delete(targetDate);
      }
      
      return { ...t, completed: newCompleted, completedDates: Array.from(completedDates) };
    }));
    
    if (isNowCompleted && !wasCompleted && isToday) {
      const today = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      if (lastTaskCompleted !== today) {
        if (lastTaskCompleted) {
          const lastDate = new Date(lastTaskCompleted);
          const currentDate = new Date(today);
          const MathFloorDiff = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (MathFloorDiff === 1) {
            setStreak(s => s + 1);
          } else if (MathFloorDiff > 1) {
            setStreak(1);
          }
        } else {
          setStreak(1);
        }
        setLastTaskCompleted(today);
      }
    } else {
      // Fitur canggih tambahan: mengurangi streak jika membatalkan penyelesaian dan memundurkan lastTask
      const today = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      if (lastTaskCompleted === today) {
        // Cek secara sinkron apakah masih ada tugas lain yang 'completed' HARI INI
        // (kita gunakan 'tasks' dengan filter, tapi ingat 'tasks' state-nya akan berubah jadi cek 't.id !== id' yang completed)
        const hasOtherCompletedTasksToday = tasks.some(t => {
          if (t.id === id) return false;
          if (t.completedDates && t.completedDates.includes(today)) return true;
          // For backward compatibility if completedDates is not set but it was completed today
          if (t.completed && (t.date === today || t.date === 'Hari ini')) return true;
          return false;
        });
        if (!hasOtherCompletedTasksToday) {
          setStreak(s => Math.max(0, s - 1));
          
          const yestDate = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000));
          yestDate.setDate(yestDate.getDate() - 1);
          const yesterday = yestDate.toISOString().split('T')[0];
          setLastTaskCompleted(yesterday);
        }
      }
    }
  };
  const deleteTask = (id: string) => setTasks(prev => {
    const existing = prev.find(t => t.id === id);
    if (!existing) return prev;
    
    if (existing.deleted) {
      // Permanent delete
      return prev.filter(t => t.id !== id);
    }
    
    // Soft delete
    return prev.map(t => {
      if (t.id !== id) return t;
      return {
        ...t,
        deleted: true,
        deletedAt: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0]
      };
    });
  });

  const setMood = (date: string, mood: MoodEntry['mood'], note?: string) => {
    setMoods(prev => {
      const existingIndex = prev.findIndex(m => m.date === date);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = { ...next[existingIndex], mood, note: note ?? next[existingIndex].note };
        return next;
      } else {
        return [...prev, { date, mood, note }];
      }
    });
  };

  const checkInDaily = () => {
    const today = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    if (lastTaskCompleted !== today) {
      if (lastTaskCompleted) {
        const lastDate = new Date(lastTaskCompleted);
        const currentDate = new Date(today);
        const MathFloorDiff = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (MathFloorDiff === 1) {
          setStreak(s => s + 1);
        } else if (MathFloorDiff > 1) {
          setStreak(1);
        }
      } else {
        setStreak(1);
      }
      setLastTaskCompleted(today);
    }
  };

  const addTransaction = (t: Transaction) => setTransactions(prev => [t, ...prev]);
  const updateTransaction = (id: string, updates: Partial<Transaction>) => setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  const deleteTransaction = (id: string) => setTransactions(prev => prev.filter(t => t.id !== id));
  const clearAllTransactions = () => setTransactions([]);
  const importTransactions = (importedTransactions: Transaction[]) => setTransactions(importedTransactions);

  const importData = (importedNotes: Note[], importedTasks: Task[], importedTransactions?: Transaction[]) => {
    setNotes(importedNotes);
    setTasks(importedTasks);
    if (importedTransactions) setTransactions(importedTransactions);
  };

  const clearAllData = async () => {
    // Securely wipe all data from local storage by dynamically finding all keys, overwriting, and clearing
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        try {
          const val = localStorage.getItem(key);
          if (val) {
            localStorage.setItem(key, '0'.repeat(val.length || 10));
          }
        } catch (e) {}
      });
      localStorage.clear();
    } catch (e) {
      console.error("Error securely wiping localStorage:", e);
    }

    // Delete large items stored in IndexedDB
    const largeKeys = [
      'noto_notes', 'noto_tasks', 'noto_transactions', 'noto_moods', 
      'user_avatar', 'noto_custom_wallpaper', 'noto_banner_wallpaper'
    ];
    for (const key of largeKeys) {
      try {
        await deleteLargeItem(key);
      } catch (e) {
        console.error("Failed to delete IndexedDB item during reset:", key, e);
      }
    }

    setNotes([]);
    setTasks([]);
    setTransactions([]);
    setMoods([]);
    setStreak(0);
    setLastTaskCompleted(null);
    setAppPin(null);
    setPinRecoveryQuestion(null);
    setPinRecoveryAnswer(null);
    setHasCompletedOnboarding(false);
    setUser({ name: 'Pengguna', avatarUrl: '' });
    setReminderActive(true);
    setReminderTime('09:00');
    setSavingsTarget(null);
    setSavingsTargetTitle('');
    setSavingsBalance(0);
  };

  const contextValue = React.useMemo(() => ({
    notes, tasks, transactions, moods, user, updateUser: setUser,
    addNote, updateNote, deleteNote, 
    addTask, updateTask, toggleTask, deleteTask, setMood,
    addTransaction, updateTransaction, deleteTransaction, clearAllTransactions, importTransactions,
    importData, clearAllData,
    searchQuery, setSearchQuery, appPin, setAppPin,
    pinRecoveryQuestion, setPinRecoveryQuestion, pinRecoveryAnswer, setPinRecoveryAnswer,
    lang, setLang,
    hasCompletedOnboarding, setHasCompletedOnboarding,
    isUnlocked, setIsUnlocked, streak,
    reminderActive, setReminderActive, reminderTime, setReminderTime,
    savingsTarget, setSavingsTarget, savingsTargetTitle, setSavingsTargetTitle,
    savingsBalance, setSavingsBalance, checkInDaily,
    archivedTags, setArchivedTags
  }), [
    notes, tasks, transactions, moods, user, searchQuery, appPin, pinRecoveryQuestion, pinRecoveryAnswer, lang,
    hasCompletedOnboarding, isUnlocked, streak,
    reminderActive, reminderTime, savingsTarget, savingsTargetTitle, savingsBalance,
    archivedTags
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppStore must be used within AppProvider");
  return context;
}
