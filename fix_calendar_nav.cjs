const fs = require('fs');
let code = fs.readFileSync('src/screens/CalendarScreen.tsx', 'utf8');

code = code.replace(/<button className="p-2 -ml-2 text-slate-400 hover:text-slate-50 transition-colors" onClick=\{handlePrevMonth\}>/g, '<button className="p-2 -ml-2 text-slate-400 hover:text-slate-50 hover:bg-slate-800 rounded-full transition-colors" onClick={handlePrevMonth}>');
code = code.replace(/<button className="p-2 -mr-2 text-slate-400 hover:text-slate-50 transition-colors" onClick=\{handleNextMonth\}>/g, '<button className="p-2 -mr-2 text-slate-400 hover:text-slate-50 hover:bg-slate-800 rounded-full transition-colors" onClick={handleNextMonth}>');

fs.writeFileSync('src/screens/CalendarScreen.tsx', code);
