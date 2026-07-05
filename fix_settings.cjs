const fs = require('fs');
let code = fs.readFileSync('src/screens/SettingsScreen.tsx', 'utf8');

// Replace all `border-b border-slate-800/60` and similar inside setting rows with nothing, 
// and add `divide-y divide-slate-800/60` to the parent container.
// Actually, it's easier to just use regex to clean up the classes.

// 1. Update the parent containers:
code = code.replace(/className="bg-slate-800\/40 border border-slate-800\/60 rounded-3xl flex flex-col overflow-hidden"/g, 'className="bg-slate-900 border border-slate-800 rounded-3xl flex flex-col overflow-hidden divide-y divide-slate-800"');

// 2. Remove the border-b from the rows:
code = code.replace(/ border-b border-slate-800\/60/g, '');

fs.writeFileSync('src/screens/SettingsScreen.tsx', code);
