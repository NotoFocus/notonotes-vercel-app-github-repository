const fs = require('fs');
let code = fs.readFileSync('src/screens/CalendarScreen.tsx', 'utf8');

code = code.replace(/flex items-center gap-2\.5 flex items-center gap-2/g, 'flex items-center gap-2.5');

fs.writeFileSync('src/screens/CalendarScreen.tsx', code);
