const fs = require('fs');
let code = fs.readFileSync('src/screens/SettingsScreen.tsx', 'utf8');

// For Lite mode, let's remove borders and just use subtle background changes
code = code.replace(
  /className=\{isLiteMode \? "flex flex-col gap-1 bg-slate-900\/20 rounded-3xl p-2 border border-slate-800\/50" \: "grid grid-cols-1 sm:grid-cols-2 gap-4"\}/g,
  'className={isLiteMode ? "flex flex-col gap-2 bg-transparent" : "grid grid-cols-1 sm:grid-cols-2 gap-4"}'
);

// Update inner lite mode buttons to look like separate subtle cards
code = code.replace(
  /"p-4 text-left hover:bg-slate-800\/40 rounded-2xl transition-all group cursor-pointer flex items-center gap-4"/g,
  '"p-4 bg-slate-900/40 hover:bg-slate-800/60 rounded-[1.25rem] transition-all group cursor-pointer flex items-center gap-4"'
);

fs.writeFileSync('src/screens/SettingsScreen.tsx', code);
