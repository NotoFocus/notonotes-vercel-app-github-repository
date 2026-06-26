const fs = require('fs');
const path = require('path');

const tasksScreenPath = path.join(__dirname, 'src/screens/TasksScreen.tsx');
let content = fs.readFileSync(tasksScreenPath, 'utf8');

content = content.replace(/text-emerald-400/g, 'text-emerald-600');
content = content.replace(/text-rose-400/g, 'text-rose-600');
content = content.replace(/text-indigo-400/g, 'text-indigo-600');
content = content.replace(/text-orange-400/g, 'text-orange-600');

fs.writeFileSync(tasksScreenPath, content);
console.log('Fixed text-400 to text-600');
