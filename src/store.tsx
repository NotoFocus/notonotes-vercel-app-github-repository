import React, { createContext, useContext, useState, useEffect } from 'react';
import { Note, Task, User, Transaction } from './types';
import { currentUser, recentNotes, allTasks } from './data';

interface AppContextType {
  notes: Note[];
  tasks: Task[];
  transactions: Transaction[];
  user: User;
  updateUser: (u: User) => void;
  addNote: (note: Note) => void;
  updateNote: (note: Note) => void;
  deleteNote: (id: string) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  clearAllTransactions: () => void;
  importTransactions: (transactions: Transaction[]) => void;
  importData: (notes: Note[], tasks: Task[], transactions?: Transaction[]) => void;
  clearAllData: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  appPin: string | null;
  setAppPin: (pin: string | null) => void;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(() => {
    try { const s = localStorage.getItem('noto_user'); if (s) return JSON.parse(s); } catch(e){}
    return currentUser;
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    try { 
      const s = localStorage.getItem('noto_notes'); 
      if (s) {
        const parsed = JSON.parse(s);
        const seen = new Set();
        return parsed.map((n: Note) => {
          if (seen.has(n.id)) n.id = crypto.randomUUID();
          seen.add(n.id);
          return n;
        });
      } 
    } catch(e){}
    return recentNotes;
  });
  
  const [tasks, setTasks] = useState<Task[]>(() => {
    try { 
      const s = localStorage.getItem('noto_tasks'); 
      if (s) {
        const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        const parsed = JSON.parse(s);
        const seen = new Set();
        return parsed.map((t: Task) => {
          if (seen.has(t.id)) t.id = crypto.randomUUID();
          seen.add(t.id);
          
          if (t.repeat === 'daily' && t.date && t.date < todayStr) {
            t.date = todayStr;
            t.completed = false;
          }
          
          return t;
        });
      }
    } catch(e){}
    return allTasks;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const s = localStorage.getItem('noto_transactions');
      if (s) {
        return JSON.parse(s);
      }
    } catch(e){}
    return [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [appPin, setAppPin] = useState<string | null>(() => {
    try { return localStorage.getItem('noto_pin'); } catch(e){}
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

  useEffect(() => { localStorage.setItem('noto_lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('noto_reminder_active', JSON.stringify(reminderActive)); }, [reminderActive]);
  useEffect(() => { localStorage.setItem('noto_reminder_time', reminderTime); }, [reminderTime]);
  useEffect(() => {
    if (savingsTarget !== null) localStorage.setItem('noto_savings_target', JSON.stringify(savingsTarget));
    else localStorage.removeItem('noto_savings_target');
  }, [savingsTarget]);

  useEffect(() => {
    if (savingsTargetTitle) localStorage.setItem('noto_savings_target_title', savingsTargetTitle);
    else localStorage.removeItem('noto_savings_target_title');
  }, [savingsTargetTitle]);

  useEffect(() => {
    localStorage.setItem('noto_savings_balance', JSON.stringify(savingsBalance));
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
        if (parsed.name && parsed.name !== 'Pengguna') return true;
      }

      const tasksStr = localStorage.getItem('noto_tasks');
      if (tasksStr && tasksStr !== '[]') return true;

      const notesStr = localStorage.getItem('noto_notes');
      if (notesStr && notesStr !== '[]') return true;
      
    } catch(e){}
    return false;
  });

  useEffect(() => { localStorage.setItem('noto_onboarding_completed', JSON.stringify(hasCompletedOnboarding)); }, [hasCompletedOnboarding]);

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

  useEffect(() => { localStorage.setItem('noto_user', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('noto_notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('noto_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('noto_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { if (appPin) localStorage.setItem('noto_pin', appPin); else localStorage.removeItem('noto_pin'); }, [appPin]);
  useEffect(() => { localStorage.setItem('noto_streak', streak.toString()); }, [streak]);
  useEffect(() => { if (lastTaskCompleted) localStorage.setItem('noto_last_task_completed', lastTaskCompleted); }, [lastTaskCompleted]);

  const addNote = (note: Note) => setNotes(prev => [note, ...prev]);
  const updateNote = (note: Note) => setNotes(prev => prev.map(n => n.id === note.id ? note : n));
  const deleteNote = (id: string) => setNotes(prev => prev.filter(n => n.id !== id));

  const addTask = (task: Task) => setTasks(prev => [task, ...prev]);
  const updateTask = (task: Task) => setTasks(prev => prev.map(t => t.id === task.id ? task : t));
  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const wasCompleted = task.completed;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    
    if (!wasCompleted) {
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
        const hasOtherCompletedTasksToday = tasks.some(t => t.id !== id && t.completed && t.date === today);
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
  const deleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

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

  const clearAllData = () => {
    localStorage.setItem('noto_user', JSON.stringify({ name: 'Pengguna', avatarUrl: '' }));
    localStorage.setItem('noto_notes', '[]');
    localStorage.setItem('noto_tasks', '[]');
    localStorage.setItem('noto_transactions', '[]');
    localStorage.setItem('noto_streak', '0');
    localStorage.removeItem('noto_last_task_completed');
    localStorage.removeItem('noto_pin');
    localStorage.removeItem('noto_onboarding_completed');
    setNotes([]);
    setTasks([]);
    setTransactions([]);
    setStreak(0);
    setLastTaskCompleted(null);
    setAppPin(null);
    setHasCompletedOnboarding(false);
    setUser({ name: 'Pengguna', avatarUrl: '' });
  };

  const contextValue = React.useMemo(() => ({
    notes, tasks, transactions, user, updateUser: setUser,
    addNote, updateNote, deleteNote, 
    addTask, updateTask, toggleTask, deleteTask,
    addTransaction, updateTransaction, deleteTransaction, clearAllTransactions, importTransactions,
    importData, clearAllData,
    searchQuery, setSearchQuery, appPin, setAppPin,
    lang, setLang,
    hasCompletedOnboarding, setHasCompletedOnboarding,
    isUnlocked, setIsUnlocked, streak,
    reminderActive, setReminderActive, reminderTime, setReminderTime,
    savingsTarget, setSavingsTarget, savingsTargetTitle, setSavingsTargetTitle,
    savingsBalance, setSavingsBalance
  }), [
    notes, tasks, transactions, user, searchQuery, appPin, lang,
    hasCompletedOnboarding, isUnlocked, streak,
    reminderActive, reminderTime, savingsTarget, savingsTargetTitle, savingsBalance
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
