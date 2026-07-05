const fs = require('fs');
let code = fs.readFileSync('src/screens/CalendarScreen.tsx', 'utf8');

const oldHarianBlock = `    if (viewType === 'Harian') {
      selectedTasks.forEach(tk => {
        const compDates = tk.completedDates || [];
        if (compDates.includes(selectedDateStr)) {
          completed++;
        } else {
          if (selectedDateStr === todayStr) {
             if (tk.completed) completed++;
             else active++;
          } else {
             active++;
          }
        }
      });
    }`;

const newHarianBlock = `    if (viewType === 'Harian') {
      selectedTasks.forEach(tk => {
        if (tk.repeat === 'daily') {
          const compDates = tk.completedDates || [];
          if (compDates.includes(selectedDateStr)) {
            completed++;
          } else {
            if (selectedDateStr === todayStr) {
               if (tk.completed) completed++;
               else active++;
            } else {
               active++;
            }
          }
        } else {
          if (tk.completed) {
            completed++;
          } else {
            active++;
          }
        }
      });
    }`;

code = code.replace(oldHarianBlock, newHarianBlock);
fs.writeFileSync('src/screens/CalendarScreen.tsx', code);
