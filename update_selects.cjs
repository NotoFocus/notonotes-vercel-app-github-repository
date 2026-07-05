const fs = require('fs');
let code = fs.readFileSync('src/screens/SettingsScreen.tsx', 'utf8');

const selectThemeOld = `<select 
                  value={appTheme}
                  onChange={(e) => setAppTheme(e.target.value as any)}
                  className="bg-transparent text-indigo-400 font-bold text-[15px] outline-none cursor-pointer text-right appearance-none focus:text-indigo-300 transition-colors"
                >`;

const selectThemeNew = `<div className="flex items-center gap-1">
                  <select 
                    value={appTheme}
                    onChange={(e) => setAppTheme(e.target.value as any)}
                    className="bg-transparent text-indigo-400 font-bold text-[15px] outline-none cursor-pointer text-right appearance-none focus:text-indigo-300 transition-colors"
                  >`;

code = code.replace(selectThemeOld, selectThemeNew);
code = code.replace(`                  <option value="wallpaper" className="bg-slate-900">{t('themeWallpaper')}</option>\n                </select>`, `                  <option value="wallpaper" className="bg-slate-900">{t('themeWallpaper')}</option>\n                  </select>\n                  <ChevronRight className="w-4 h-4 text-slate-600" />\n                </div>`);

const selectLangOld = `<select 
                value={lang} onChange={(e) => setLang(e.target.value as 'id' | 'en')}
                className="bg-transparent text-indigo-400 font-bold text-[15px] outline-none cursor-pointer text-right appearance-none focus:text-indigo-300 transition-colors"
              >`;

const selectLangNew = `<div className="flex items-center gap-1">
                <select 
                  value={lang} onChange={(e) => setLang(e.target.value as 'id' | 'en')}
                  className="bg-transparent text-indigo-400 font-bold text-[15px] outline-none cursor-pointer text-right appearance-none focus:text-indigo-300 transition-colors"
                >`;

code = code.replace(selectLangOld, selectLangNew);
code = code.replace(`                <option value="en" className="bg-slate-900">English</option>\n              </select>`, `                <option value="en" className="bg-slate-900">English</option>\n                </select>\n                <ChevronRight className="w-4 h-4 text-slate-600" />\n              </div>`);

fs.writeFileSync('src/screens/SettingsScreen.tsx', code);
