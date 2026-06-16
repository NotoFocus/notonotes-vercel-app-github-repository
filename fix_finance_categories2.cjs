const fs = require('fs');
let content = fs.readFileSync('src/screens/FinanceScreen.tsx', 'utf8');

// 1. Filter dropdown options
content = content.replace(
  /<option key=\{cat\} value=\{cat\}>\{cat\}<\/option>/g,
  '<option key={cat} value={cat}>{translateCategory(cat, lang)}</option>'
);

// 2. Transaction list category
content = content.replace(
  /<h4 className=\{\`font-bold text-sm \$\{getTextClass\(\)\}\`\}>\{t\.category\}<\/h4>/g,
  '<h4 className={`font-bold text-sm ${getTextClass()}`}>{translateCategory(t.category, lang)}</h4>'
);

// 3. Category Breakdown labels (in pie chart list)
content = content.replace(
  /<span className=\{getTextClass\(\)\}>\{c\.name\}<\/span>/g,
  '<span className={getTextClass()}>{c.name}</span>' // already translated in useMemo
);

// 4. Statistics topCatName
content = content.replace(
  /<span className=\{\`text-sm md:text-base font-bold \$\{getTextClass\(\)\}\`\}>\{statistics\.topCatName\}<\/span>/g,
  '<span className={`text-sm md:text-base font-bold ${getTextClass()}`}>{translateCategory(statistics.topCatName, lang)}</span>'
);

// 5. Statistics highestExpense.category
content = content.replace(
  /<span className=\{\`text-sm md:text-base font-bold \$\{getTextClass\(\)\}\`\}>\{statistics\.highestExpense\.category\}<\/span>/g,
  '<span className={`text-sm md:text-base font-bold ${getTextClass()}`}>{translateCategory(statistics.highestExpense.category, lang)}</span>'
);

// 6. Category pills in Add Transaction form
content = content.replace(
  />\{cat\}<\/button>/g,
  '>{translateCategory(cat, lang)}</button>'
);

fs.writeFileSync('src/screens/FinanceScreen.tsx', content);
