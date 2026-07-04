const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf8');

// Replace the taskDateStr logic in toggleTask
const oldTaskDateStr = `const taskDateStr = task.date && task.date.includes('-') 
      ? task.date 
      : new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];`;
const newTaskDateStr = `const todayIso = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const taskDateStr = todayIso;`;

code = code.replace(oldTaskDateStr, newTaskDateStr);

// Replace the hasOtherCompletedTasksToday logic
const oldHasOther = `const hasOtherCompletedTasksToday = tasks.some(t => t.id !== id && t.completed && t.date === today);`;
const newHasOther = `const hasOtherCompletedTasksToday = tasks.some(t => {
          if (t.id === id) return false;
          if (t.completedDates && t.completedDates.includes(today)) return true;
          // For backward compatibility if completedDates is not set but it was completed today
          if (t.completed && (t.date === today || t.date === 'Hari ini')) return true;
          return false;
        });`;

code = code.replace(oldHasOther, newHasOther);

fs.writeFileSync('src/store.tsx', code);
