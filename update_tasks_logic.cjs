const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf8');

const replacement = `const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const dbStr = getLargeItemSync('noto_tasks');
      const s = dbStr || localStorage.getItem('noto_tasks');
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) {
          const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
          return parsed.map((t: Task) => {
            if (t.repeat === 'daily') {
              const isCompletedToday = t.completedDates && t.completedDates.includes(todayStr);
              if (t.completed && !isCompletedToday) {
                return { ...t, completed: false };
              }
            }
            return t;
          });
        }
      }
    } catch(e){}
    return allTasks;
  });`;

code = code.replace(/const \[tasks, setTasks\] = useState<Task\[\]>\(\(\) => \{[\s\S]*?return allTasks;\n  \}\);/, replacement);

fs.writeFileSync('src/store.tsx', code);
