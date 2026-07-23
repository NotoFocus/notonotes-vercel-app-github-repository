const fs = require('fs');
let code = fs.readFileSync('src/screens/SettingsScreen.tsx', 'utf8');

const targetLiRegex = /<li>\{lang === 'id' \? 'Fitur AI di workspace Preview berjalan otomatis menggunakan kunci developer bawaan AI Studio.*?<\/li>/;
code = code.replace(targetLiRegex, '');

const targetDivRegex = /<div className="mt-3\.5 p-3 bg-amber-500\/10 border border-amber-500\/20 rounded-2xl text-\[11px\] text-amber-300\/90 leading-relaxed space-y-1">[\s\S]*?<\/div>/;
code = code.replace(targetDivRegex, '');

fs.writeFileSync('src/screens/SettingsScreen.tsx', code);
