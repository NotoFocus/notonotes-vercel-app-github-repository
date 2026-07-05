const fs = require('fs');
let code = fs.readFileSync('src/screens/SettingsScreen.tsx', 'utf8');

code = code.replace(/className="bg-slate-900 border border-slate-800 rounded-3xl flex flex-col overflow-hidden divide-y divide-slate-800"/g, 
                    'className="bg-slate-900 border border-slate-800/80 rounded-[2rem] shadow-sm flex flex-col overflow-hidden divide-y divide-slate-800/50"');

fs.writeFileSync('src/screens/SettingsScreen.tsx', code);
