const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/cool-theme bg-slate-950/g, 'cool-theme text-slate-200');
code = code.replace(/cute-theme bg-slate-950/g, 'cute-theme text-slate-900');

fs.writeFileSync('src/App.tsx', code);
