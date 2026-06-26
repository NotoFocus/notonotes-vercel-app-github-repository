const fs = require('fs');
const path = require('path');

const tasksScreenPath = path.join(__dirname, 'src/screens/TasksScreen.tsx');
let content = fs.readFileSync(tasksScreenPath, 'utf8');

// Fix reward and punishment input text color
content = content.replace(/text-emerald-100/g, 'text-slate-200');
content = content.replace(/text-rose-100/g, 'text-slate-200');

// Fix reward and punishment displayed text color
content = content.replace(/text-emerald-200/g, 'text-slate-100');
content = content.replace(/text-rose-200/g, 'text-slate-100');

// Fix descriptions text color
content = content.replace(/text-emerald-100\/70/g, 'text-slate-400');
content = content.replace(/text-rose-300\/80/g, 'text-slate-400');

fs.writeFileSync(tasksScreenPath, content);
console.log('Fixed text colors in TasksScreen');
