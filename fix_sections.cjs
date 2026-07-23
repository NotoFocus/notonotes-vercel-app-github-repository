const fs = require('fs');
let code = fs.readFileSync('src/screens/SettingsScreen.tsx', 'utf8');

// Replace standard card classes
code = code.replace(/className="p-5 sm:p-6 bg-slate-900\/40 border border-slate-800\/80 rounded-3xl/g, 'className={isLiteMode ? "p-4 sm:p-5 bg-slate-900/20 border border-slate-800/50 rounded-3xl" : "p-5 sm:p-6 bg-slate-900/40 border border-slate-800/80 rounded-3xl"}');
code = code.replace(/className="space-y-6"/g, 'className={isLiteMode ? "space-y-4" : "space-y-6"}');

// Replace inner lists/toggles that have bg-slate-950/60
code = code.replace(/className="bg-slate-950\/60 border border-slate-850 rounded-2xl p-4 space-y-3"/g, 'className={isLiteMode ? "bg-slate-950/40 border border-slate-800/60 rounded-xl p-3 space-y-2" : "bg-slate-950/60 border border-slate-850 rounded-2xl p-4 space-y-3"}');

fs.writeFileSync('src/screens/SettingsScreen.tsx', code);
