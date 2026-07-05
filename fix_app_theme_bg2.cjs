const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/cool-theme text-slate-200/g, 'cool-theme');
code = code.replace(/cute-theme text-slate-900/g, 'cute-theme');

fs.writeFileSync('src/App.tsx', code);
