import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
// Load as an ES module even when this static-site repo has no package.json.
const source = await readFile(new URL('../goals.js', import.meta.url), 'utf8');
const {chooseGoal, goalProgress, updateGoals, cancelGoal, validateGoals} = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const base = () => ({yearIndex:0, week:0, phase:'study', history:[]});
const play = (state, counts) => ({...state, week:state.week+1, history:[...state.history,{week:state.week,plan:{counts}}]});
let s=base();
assert.deepEqual(updateGoals(s),{active:null,history:[]}); // old saves
s.goals=chooseGoal(s,'review');
assert.deepEqual([s.goals.active.startWeek,s.goals.active.endWeek,s.goals.active.target],[0,4,4]);
assert.throws(()=>chooseGoal(s,'exercise'));
s=play(s,{review:2});assert.equal(goalProgress(s).value,2);
s=play(s,{review:2});assert.equal(goalProgress(s).completed,true);
s.goals=updateGoals(s);assert.equal(s.goals.active,null);assert.equal(s.goals.history[0].status,'completed');
assert.deepEqual(updateGoals(s),s.goals); // no double archive
s.goals=chooseGoal(s,'exercise');s=play(s,{exercise:1});s.goals=cancelGoal(s);
assert.equal(s.goals.history.at(-1).status,'cancelled');assert.equal(s.goals.history.at(-1).value,1);
s.goals=chooseGoal(s,'connection');
s=play(s,{talk:1,outing:2});assert.equal(goalProgress(s).value,1); // one week, not three actions
s.history.push({...s.history.at(-1)});assert.equal(goalProgress(s).value,1); // duplicate history
s=play(s,{meetup:3});s.goals=updateGoals(s);assert.equal(s.goals.history.at(-1).status,'completed');
s=base();s.week=46;s.goals=chooseGoal(s,'review');assert.deepEqual([s.goals.active.endWeek,s.goals.active.target],[48,2]);
s=play(s,{});s=play(s,{});s.goals=updateGoals(s);assert.equal(s.goals.history[0].status,'expired');
assert.throws(()=>chooseGoal(s,'review')); // no crossing year boundary
s={...base(),yearIndex:1,goals:{active:{id:'review',year:0,startWeek:45,endWeek:48,target:3},history:[]}};
assert.equal(updateGoals(s).history[0].status,'expired');
s.pastYears=[{year:0,history:[{week:45,plan:{counts:{review:3}}}]}];assert.equal(updateGoals(s).history[0].status,'completed');
assert.throws(()=>chooseGoal(base(),'unknown'));
console.log('goals: all tests passed');

assert.equal(validateGoals(base()),true);
assert.equal(validateGoals({...base(),goals:{active:{id:'review'},history:[]}}),false);
assert.equal(validateGoals({...base(),goals:{active:null,history:'bad'}}),false);
let v=base();v.goals=chooseGoal(v,'review');assert.equal(validateGoals(v),true);
v=play(v,{review:4});v.goals=updateGoals(v);assert.equal(validateGoals(v),true);
assert.equal(validateGoals({...v,goals:{...v.goals,history:[{...v.goals.history[0],value:0}]}}),false);
assert.equal(validateGoals({...v,goals:{active:{...chooseGoal(base(),'review').active,year:2},history:[]}}),false);
console.log('goal save validation: all tests passed');
