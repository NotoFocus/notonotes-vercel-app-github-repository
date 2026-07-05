const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf8');

code = code.replace(/toggleTask: \(id: string\) => void;/g, 'toggleTask: (id: string, dateStr?: string) => void;');

const oldToggle = `  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const wasCompleted = task.completed;
    const todayIso = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const taskDateStr = todayIso;
      
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const completedDates = new Set(t.completedDates || []);
      if (!t.completed) {
        completedDates.add(taskDateStr);
      } else {
        completedDates.delete(taskDateStr);
      }
      return { ...t, completed: !t.completed, completedDates: Array.from(completedDates) };
    }));
    
    if (!wasCompleted) {`;

const newToggle = `  const toggleTask = (id: string, dateStr?: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const todayIso = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const targetDate = dateStr || todayIso;
    const isToday = targetDate === todayIso;
    
    let isNowCompleted = false;
    let wasCompleted = false;

    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
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
      }
      
      return { ...t, completed: newCompleted, completedDates: Array.from(completedDates) };
    }));
    
    if (isNowCompleted && !wasCompleted) {`;

code = code.replace(oldToggle, newToggle);
fs.writeFileSync('src/store.tsx', code);
