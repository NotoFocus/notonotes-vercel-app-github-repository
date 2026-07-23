const fs = require('fs');
let code = fs.readFileSync('src/screens/SettingsScreen.tsx', 'utf8');

// For Lite mode, let's remove borders and just use subtle background changes
code = code.replace(/bg-slate-900\/20 border border-slate-800\/50/g, 'bg-slate-900/30 border border-transparent');
code = code.replace(/bg-slate-950\/40 border border-slate-800\/60/g, 'bg-slate-950/40 border border-transparent');

fs.writeFileSync('src/screens/SettingsScreen.tsx', code);
