const fs = require('fs');
let code = fs.readFileSync('src/screens/TasksScreen.tsx', 'utf8');

// Replace Start Date rendering to be an input
const oldStart = `<div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <Calendar className="w-4 h-4 text-indigo-400/70" />
                    {d.startDate || task.date}
                  </div>`;
const newStart = `<input 
                    type="date" 
                    value={d.startDate || (task.date && task.date.includes('-') ? task.date : (task.createdAt ? task.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]))}
                    onChange={(e) => updateTask({ ...task, disciplineData: { ...d, startDate: e.target.value } })}
                    className="bg-transparent text-sm font-medium text-slate-300 focus:outline-none w-full"
                  />`;

code = code.replace(oldStart, newStart);
fs.writeFileSync('src/screens/TasksScreen.tsx', code);
