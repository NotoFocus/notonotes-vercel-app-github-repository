const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf8');

const hookToInsert = `
  useEffect(() => {
    const checkDailyReset = () => {
      const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      setTasks(prev => {
        if (!prev) return prev;
        let needsUpdate = false;
        const next = prev.map(t => {
          if (t.repeat === 'daily') {
            const isCompletedToday = t.completedDates && t.completedDates.includes(todayStr);
            if (t.completed && !isCompletedToday) {
              needsUpdate = true;
              return { ...t, completed: false };
            }
          }
          return t;
        });
        return needsUpdate ? next : prev;
      });
    };

    checkDailyReset();
    const interval = setInterval(checkDailyReset, 60000);
    return () => clearInterval(interval);
  }, []);
`;

// Insert it right after `const [tasks, setTasks] = useState(...)`
const searchStr = `  const [transactions, setTransactions] = useState<Transaction[]>((`;
code = code.replace(searchStr, hookToInsert + '\n' + searchStr);

fs.writeFileSync('src/store.tsx', code);
