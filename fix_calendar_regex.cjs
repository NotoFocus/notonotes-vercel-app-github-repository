const fs = require('fs');
let code = fs.readFileSync('src/screens/CalendarScreen.tsx', 'utf8');

code = code.replace('if (tk.completed || (tk.completedDates || []).includes(iterStr)) {', 'if (tk.completed) {');

fs.writeFileSync('src/screens/CalendarScreen.tsx', code);
