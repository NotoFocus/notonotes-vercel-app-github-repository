const fs = require('fs');
let code = fs.readFileSync('src/screens/HomeScreen.tsx', 'utf8');

code = code.replace(/hasSeenUpdate300/g, 'hasSeenUpdate400');
code = code.replace(/setHasSeenUpdate121/g, 'setHasSeenUpdate400'); // wait, the original was setHasSeenUpdate121? yes from grep.
code = code.replace(/has_seen_update_300/g, 'has_seen_update_400');

fs.writeFileSync('src/screens/HomeScreen.tsx', code);
