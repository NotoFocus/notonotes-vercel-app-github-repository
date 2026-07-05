const fs = require('fs');
let code = fs.readFileSync('src/screens/SettingsScreen.tsx', 'utf8');

code = code.replace(/appearance-none focus:text-indigo-300 transition-colors"/g, 'appearance-none focus:text-indigo-300 transition-colors pr-2"');

fs.writeFileSync('src/screens/SettingsScreen.tsx', code);
