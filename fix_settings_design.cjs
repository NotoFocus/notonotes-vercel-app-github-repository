const fs = require('fs');
let code = fs.readFileSync('src/screens/SettingsScreen.tsx', 'utf8');

// Update section headers
code = code.replace(/className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2 flex items-center gap-2"/g, 
                    'className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-2 flex items-center gap-2.5"');

// Wait, the icons have `size={16}`. It's fine.

// Let's replace `p-4` with `p-4 sm:p-5` on the rows where it's a direct child of the divided container.
// Or just leave it as p-4. The user said "Rapihkan design pengaturan". 
// Maybe the theme selection looks weird?
// "Di tema keren dan lucu jangan pake foto background aja soalnya cuman muncul di preview doang"

fs.writeFileSync('src/screens/SettingsScreen.tsx', code);
