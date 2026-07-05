const fs = require('fs');
let code = fs.readFileSync('src/screens/CalendarScreen.tsx', 'utf8');

// Update useMemo for completedCount and activeCount
const oldPie = `            if (tk.repeat === 'daily') {
              // Daily task/habit
              const compDates = tk.completedDates || [];
              if (compDates.includes(iterStr)) {
                completed++;
              } else {
                if (iterStr === todayStr) {
                  if (tk.completed) completed++;
                  else active++;
                } else {
                  active++;
                }
              }
            } else {
              // One-time task
              // It is only relevant on its specific due date (tDateStr)
              if (tDateStr === iterStr) {
                if (tk.completed || (tk.completedDates || []).includes(iterStr)) {
                  completed++;
                } else {
                  active++;
                }
              }
            }`;

const newPie = `            if (tk.repeat === 'daily') {
              // Daily task/habit
              const compDates = tk.completedDates || [];
              if (compDates.includes(iterStr)) {
                completed++;
              } else {
                if (iterStr === todayStr) {
                  if (tk.completed) completed++;
                  else active++;
                } else {
                  active++;
                }
              }
            } else {
              // One-time task
              // It is only relevant on its specific due date (tDateStr)
              if (tDateStr === iterStr) {
                if (tk.completed) {
                  completed++;
                } else {
                  active++;
                }
              }
            }`;

// also in viewType === 'Harian'
const oldHarian = `        if (tk.repeat === 'daily') {
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
        }`;

// We will just do a generic replace for both.

code = code.replace(/if \\(tk\\.completed \\|\\| \\(tk\\.completedDates \\|\\| \\[\\]\\)\\.includes\\(iterStr\\)\\) \\{/g, 'if (tk.completed) {');
code = code.replace(/if \\(tk\\.completed \\|\\| \\(tk\\.completedDates \\|\\| \\[\\]\\)\\.includes\\(selectedDateStr\\)\\) \\{/g, 'if (tk.completed) {');


// Make the list interactive
const oldList = `{selectedTasks.map(task => (
                             <div key={task.id} className="flex items-center gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                               <div className={\`w-3.5 h-3.5 rounded-full border-2 \${task.completed || (task.completedDates && task.completedDates.includes(selectedDateStr)) ? 'bg-emerald-500 border-emerald-500' : 'bg-transparent border-slate-600'}\`}></div>
                               <span className={\`text-sm font-medium \${task.completed || (task.completedDates && task.completedDates.includes(selectedDateStr)) ? 'text-slate-400 line-through' : 'text-slate-200'}\`}>{task.title}</span>
                             </div>
                          ))}`;

const newList = `{selectedTasks.map(task => {
                             const isTaskCompleted = task.repeat === 'daily' 
                                 ? (task.completedDates?.includes(selectedDateStr) || (selectedDateStr === todayStr && task.completed)) 
                                 : task.completed;
                             return (
                             <div key={task.id} 
                               onClick={() => toggleTask(task.id, selectedDateStr)}
                               className="flex items-center gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 cursor-pointer hover:border-indigo-500/50 transition-colors"
                             >
                               <div className={\`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors \${isTaskCompleted ? 'bg-emerald-500 border-emerald-500' : 'bg-transparent border-slate-500'}\`}>
                                 {isTaskCompleted && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5 text-slate-950"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                               </div>
                               <span className={\`text-sm font-medium \${isTaskCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}\`}>{task.title}</span>
                             </div>
                             );
                          })}`;

code = code.replace(oldList, newList);

// we also need to import toggleTask in CalendarScreen.tsx
// It's already there? Let's check.
const storeImport = /const { tasks, moods, lang, streak, setMood } = useAppStore\(\);/;
if (storeImport.test(code)) {
    code = code.replace(storeImport, 'const { tasks, moods, lang, streak, setMood, toggleTask } = useAppStore();');
}

fs.writeFileSync('src/screens/CalendarScreen.tsx', code);
