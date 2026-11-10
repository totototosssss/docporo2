// Four-week intentions are measured from weeks actually played, not the current plan.
// Callers store the returned {active, history} object on state.goals.
export const GOALS = Object.freeze([
  {id:'review', name:'復習を重ねる', description:'復習の時間をつくる', target:4, unit:'コマ', action:'review'},
  {id:'exercise', name:'体を動かす', description:'運動する時間をつくる', target:3, unit:'コマ', action:'exercise'},
  {id:'connection', name:'誰かと過ごす', description:'会話や外出を予定する', target:2, unit:'週', action:'connection'}
]);

const definition = id => GOALS.find(goal => goal.id === id);
const records = state => Array.isArray(state.goals?.history) ? state.goals.history : [];
const current = state => state.goals?.active || null;
const blocks = value => Number.isFinite(value) && value > 0 ? value : 0;

// Old saves have no goals field. Reject malformed new data before it replaces a game.
export function validateGoals(state) {
  const goals = state?.goals;
  if (goals == null) return true;
  if (typeof goals !== 'object' || Array.isArray(goals) || !Array.isArray(goals.history)) return false;
  const validGoal = goal => {
    if (!goal || typeof goal !== 'object' || Array.isArray(goal)) return false;
    const def = definition(goal.id);
    if (!def || !Number.isInteger(goal.year) || goal.year < 0 || goal.year > state.yearIndex ||
        !Number.isInteger(goal.startWeek) || goal.startWeek < 0 || goal.startWeek >= 48 ||
        !Number.isInteger(goal.endWeek) || goal.endWeek <= goal.startWeek || goal.endWeek > 48 || goal.endWeek-goal.startWeek > 4 ||
        goal.target !== Math.ceil(def.target * (goal.endWeek-goal.startWeek) / 4)) return false;
    return goal.year !== state.yearIndex || goal.startWeek <= state.week;
  };
  if (goals.active != null && !validGoal(goals.active)) return false;
  return goals.history.every(goal => validGoal(goal) && ['completed','expired','cancelled'].includes(goal.status) &&
    Number.isInteger(goal.value) && goal.value >= 0 && goal.value <= goal.target &&
    (goal.status !== 'completed' || goal.value === goal.target) &&
    Number.isInteger(goal.finishedWeek) && goal.finishedWeek >= goal.startWeek && goal.finishedWeek <= goal.endWeek);
}

export function goalProgress(state, goal = current(state)) {
  const def = goal && definition(goal.id);
  if (!def) return null;
  // A calendar week counts at most once even if a malformed history has duplicates.
  const weeks = new Map();
  const source = goal.year === state.yearIndex ? state.history : state.pastYears?.find(year => year.year === goal.year)?.history;
  for (const item of source || []) {
    if (Number.isInteger(item.week) && item.week >= goal.startWeek && item.week < goal.endWeek && (goal.year !== state.yearIndex || item.week < state.week) && !weeks.has(item.week)) weeks.set(item.week, item);
  }
  let value = 0;
  for (const item of weeks.values()) {
    const counts = item.plan?.counts || {};
    value += def.action === 'connection'
      ? (blocks(counts.talk) + blocks(counts.outing) + blocks(counts.meetup) > 0 ? 1 : 0)
      : blocks(counts[def.action]);
  }
  return {
    value: Math.min(goal.target, value), target: goal.target, unit: def.unit,
    weeksRemaining: goal.year === state.yearIndex ? Math.max(0, goal.endWeek - state.week) : 0,
    completed: value >= goal.target,
    expired: goal.year !== state.yearIndex || state.week >= goal.endWeek
  };
}

// Archive a completed or expired intention once; repeated calls are safe.
export function updateGoals(state) {
  const active = current(state), history = records(state).slice();
  if (!active) return {active:null, history};
  const progress = goalProgress(state, active);
  if (!progress) return {active:null, history};
  if (!progress.completed && !progress.expired) return {active:{...active}, history};
  return {active:null, history:[...history, {...active, value:progress.value, status:progress.completed?'completed':'expired', finishedWeek:active.year === state.yearIndex ? Math.min(state.week, active.endWeek) : active.endWeek}]};
}

// Choosing is explicit; players can cancel an existing intention before choosing another.
export function chooseGoal(state, id) {
  const def = definition(id);
  if (!def) throw new Error('目標を選んでください。');
  if (state.phase !== 'study' || !Number.isInteger(state.week) || state.week < 0 || state.week >= 48) throw new Error('次の一年が始まってから目標を選べます。');
  const goals = updateGoals(state);
  if (goals.active) throw new Error('今の目標を解除してから選んでください。');
  const endWeek = Math.min(48, state.week + 4);
  return {active:{id, year:state.yearIndex, startWeek:state.week, endWeek, target:Math.ceil(def.target * (endWeek-state.week) / 4)}, history:goals.history};
}

export function cancelGoal(state) {
  const goals = updateGoals(state);
  if (!goals.active) return goals;
  const progress = goalProgress(state, goals.active);
  return {active:null, history:[...goals.history, {...goals.active, value:progress.value, status:'cancelled', finishedWeek:state.week}]};
}
