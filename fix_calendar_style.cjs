const fs = require('fs');
let code = fs.readFileSync('src/screens/CalendarScreen.tsx', 'utf8');

// Change standard cards to rounded-[2rem]
code = code.replace(/bg-slate-900 border border-slate-800 rounded-3xl/g, 'bg-slate-900 border border-slate-800/80 rounded-[2rem] shadow-sm');
code = code.replace(/bg-slate-900 border border-slate-800 rounded-2xl/g, 'bg-slate-900 border border-slate-800/80 rounded-2xl shadow-sm');

// Tidy up headers
code = code.replace(/text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2/g, 'text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2.5');

// For View Toggle, it was using rounded-2xl
code = code.replace(/flex bg-slate-900 border border-slate-800\/80 rounded-2xl p-1.5 mb-6 shadow-sm/g, 'flex bg-slate-900/50 border border-slate-800/80 rounded-[1.5rem] p-1.5 mb-6 shadow-sm');
code = code.replace(/flex-1 py-2 rounded-xl text-xs md:text-sm font-bold transition-all/g, 'flex-1 py-2.5 rounded-[1.2rem] text-xs md:text-sm font-bold transition-all');

fs.writeFileSync('src/screens/CalendarScreen.tsx', code);
