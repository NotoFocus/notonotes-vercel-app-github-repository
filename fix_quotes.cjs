const fs = require('fs');
let code = fs.readFileSync('src/screens/SettingsScreen.tsx', 'utf8');

code = code.replace(/className=\{isLiteMode \? "p-4 sm:p-5 bg-slate-900\/20 border border-slate-800\/50 rounded-3xl" \: "p-5 sm:p-6 bg-slate-900\/40 border border-slate-800\/80 rounded-3xl"\} flex flex-col gap-6">/g, 
  'className={`flex flex-col gap-6 ${isLiteMode ? "p-4 sm:p-5 bg-slate-900/20 border border-slate-800/50 rounded-3xl" : "p-5 sm:p-6 bg-slate-900/40 border border-slate-800/80 rounded-3xl"}`}>');

code = code.replace(/className=\{isLiteMode \? "space-y-4" \: "space-y-6"\} flex flex-col gap-6">/g, 
  'className={`flex flex-col gap-6 ${isLiteMode ? "space-y-4" : "space-y-6"}`}>');

fs.writeFileSync('src/screens/SettingsScreen.tsx', code);
