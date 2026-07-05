const fs = require('fs');
let code = fs.readFileSync('src/screens/CalendarScreen.tsx', 'utf8');

code = code.replace(/<div className="w-full px-6 py-6 space-y-6">/g, '<div className="w-full px-6 py-6 space-y-6 max-w-7xl mx-auto">');

fs.writeFileSync('src/screens/CalendarScreen.tsx', code);
