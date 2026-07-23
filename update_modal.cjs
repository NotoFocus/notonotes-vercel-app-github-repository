const fs = require('fs');
let code = fs.readFileSync('src/components/UpdateNotesModal.tsx', 'utf8');

const target = /<li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0\.5">\{t\('aboutAppFeat11'\)\}<\/strong> <span>\{t\('aboutAppFeat11Desc'\)\}<\/span><\/li>/;

const replacement = `<li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0.5">{t('aboutAppFeat12')}</strong> <span>{t('aboutAppFeat12Desc')}</span></li>
            <li className="flex flex-col"><strong className="text-emerald-400 text-sm mb-0.5">{t('aboutAppFeat11')}</strong> <span>{t('aboutAppFeat11Desc')}</span></li>`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/UpdateNotesModal.tsx', code);
