const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/cool-theme bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950/g, 'cool-theme bg-slate-950');
code = code.replace(/cute-theme bg-gradient-to-br from-rose-50 via-slate-950 to-orange-50/g, 'cute-theme bg-slate-950');

fs.writeFileSync('src/App.tsx', code);
