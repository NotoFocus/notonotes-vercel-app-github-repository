const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf8');

const oldStreak = `    if (isNowCompleted && !wasCompleted) {
      const today = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      if (lastTaskCompleted !== today) {`;

const newStreak = `    if (isNowCompleted && !wasCompleted && isToday) {
      const today = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      if (lastTaskCompleted !== today) {`;

code = code.replace(oldStreak, newStreak);
fs.writeFileSync('src/store.tsx', code);
