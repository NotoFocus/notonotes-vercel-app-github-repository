const fs = require('fs');
let code = fs.readFileSync('src/screens/TasksScreen.tsx', 'utf8');

const oldActual = `const actualStartDate = d.startDate || task.date;`;
const newActual = `const actualStartDate = d.startDate || (task.date && task.date.includes('-') ? task.date : (task.createdAt ? task.createdAt.split('T')[0] : today));`;

code = code.replace(oldActual, newActual);

const oldDaysSince = `const daysSinceStart = Math.max(1, Math.floor((parseDate(today) - parseDate(d.startDate || task.date)) / 86400000) + 1);`;
const newDaysSince = `const daysSinceStart = Math.max(1, Math.floor((parseDate(today) - parseDate(actualStartDate)) / 86400000) + 1);`;

code = code.replace(oldDaysSince, newDaysSince);

const oldTargetDays = `totalTargetDays = Math.max(daysDone + daysMissed + daysLeft, Math.floor((targetMs - parseDate(d.startDate || task.date)) / 86400000) + 1);`;
const newTargetDays = `totalTargetDays = Math.max(daysDone + daysMissed + daysLeft, Math.floor((targetMs - parseDate(actualStartDate)) / 86400000) + 1);`;

code = code.replace(oldTargetDays, newTargetDays);

fs.writeFileSync('src/screens/TasksScreen.tsx', code);
