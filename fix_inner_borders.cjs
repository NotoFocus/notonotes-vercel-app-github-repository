const fs = require('fs');
let code = fs.readFileSync('src/screens/CalendarScreen.tsx', 'utf8');

code = code.replace(/bg-slate-950 p-2 md:p-3 rounded-3xl border border-slate-800/g, 'bg-slate-950/50 p-2 md:p-3 rounded-3xl border border-slate-800/50');
code = code.replace(/flex-1 bg-slate-950 border border-slate-800 rounded-2xl/g, 'flex-1 bg-slate-950/50 border border-slate-800/50 rounded-2xl');
code = code.replace(/bg-slate-950 border border-emerald-900\/50/g, 'bg-emerald-950/20 border border-emerald-900/30');
code = code.replace(/bg-slate-950 border border-orange-900\/50/g, 'bg-orange-950/20 border border-orange-900/30');
code = code.replace(/bg-slate-950 p-3\.5 rounded-2xl border border-slate-800/g, 'bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/50');
code = code.replace(/bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between/g, 'bg-slate-950/50 border border-slate-800/50 rounded-[1.5rem] p-4 flex flex-col justify-between');

fs.writeFileSync('src/screens/CalendarScreen.tsx', code);
