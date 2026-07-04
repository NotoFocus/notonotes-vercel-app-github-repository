const tasks = [
  { id: '1', completed: true, completedDates: ['2026-07-03'] }
];
const taskDateStr = '2026-07-04'; // Today
let t = tasks[0];

// What happens currently in toggleTask if we DON'T reset the raw task?
const wasCompleted = t.completed; // true
const completedDates = new Set(t.completedDates || []);
if (!t.completed) {
  completedDates.add(taskDateStr);
} else {
  completedDates.delete(taskDateStr);
}
t = { ...t, completed: !t.completed, completedDates: Array.from(completedDates) };
console.log(t);
