import assert from 'node:assert/strict';
import * as E from '../engine.js';
import * as P from '../planner.js';
import * as W from '../world.js';
const fresh=()=>{const s=E.newGame(2);s.week=3;s.university.status='leave';s.university.policy='skip';s.university.current=null;return s;};
const cost=s=>W.worldCost(s,{exercise:0,hobby:0,checkup:0});
// An absent or null budget preserves each legacy food pattern and cooking fee.
for(const [diet,amount] of [['regular',0],['convenience',0],['cook',700]]){
 let s=fresh();s.world.health.diet=diet;assert.equal(cost(s),amount);const restored=E.migrateGame(s);assert.equal(cost(restored),amount);
 const enabled=W.configureLiving(s,{foodBudget:1200});assert.equal(cost(enabled),1400);assert.equal(cost(s),amount);
 const disabled=W.configureLiving(enabled,{foodBudget:null});assert.equal(cost(disabled),amount);
}
let s=fresh();for(const [daily,extra] of [[300,0],[1000,0],[1200,1400],[5000,28000]]){
 const q=W.configureLiving(s,{foodBudget:daily}),info=W.foodBudgetInfo(q);assert.equal(info.weeklyTotal,daily*7);assert.equal(info.weeklyExtra,extra);assert.equal(info.weeklySupport+info.weeklyExtra,info.weeklyTotal);
}
for(const invalid of [299,5001,1.5,'1200',NaN])assert.throws(()=>W.configureLiving(s,{foodBudget:invalid}));
assert.throws(()=>W.configureLiving(s,{sleep:'night'}));const locked=structuredClone(s);locked.pending={kind:'story'};assert.throws(()=>W.configureLiving(locked,{sleep:'short'}));
// Weekly cost includes the budget only once; other exercise, hobby and care costs remain.
s.world.health.diet='cook';s.world.health.care=true;s.world.hobby='photo';const legacy=W.worldCost(s,{exercise:1,hobby:1,checkup:1});const withBudget=W.configureLiving(s,{foodBudget:1200});assert.equal(W.worldCost(withBudget,{exercise:1,hobby:1,checkup:1})-legacy,700);
// Insufficient money is caught before the week runs, not silently converted into a debt.
let poor=W.configureLiving(fresh(),{foodBudget:5000});poor.cash=0;const plan=P.automaticPlan(poor);assert.match(E.validatePlan(poor,plan),/費用/);
// A preview leaves input untouched, while actual spending matches the shared quote.
let week=W.configureLiving(fresh(),{foodBudget:1200});const p=P.automaticPlan(week),before=structuredClone(week),quote=E.costOfPlan(p,week),income=E.workIncome(week,p.counts.work);const preview=E.simulateWeek(week,p,{preview:true});assert.deepEqual(week,before);assert.equal(preview.cash,week.cash-quote+income);const after=E.simulateWeek(week,p);assert.equal(after.cash,week.cash-quote+income);assert.equal(after.world.health.foodBudget,1200);
// Sleep changes capacity, but the configuration API leaves the existing plan to its caller.
const short=W.configureLiving(fresh(),{sleep:'short'});const shortPlan=P.automaticPlan(short);const steady=W.configureLiving(short,{sleep:'steady'});assert.equal(E.capacity(short),E.capacity(steady)+2);assert.equal(short.sleep,'short');assert.equal(steady.sleep,'steady');assert(E.planCount(shortPlan)>E.capacity(steady));assert.match(E.validatePlan(steady,shortPlan),/空き時間/);assert(!E.validatePlan(steady,P.reconcilePlan(steady,shortPlan).plan));
// The selected budget and sleep survive a year transition and an old save remains legacy.
let year=W.configureLiving(fresh(),{foodBudget:1200,sleep:'short'});year.phase='ending';year.pending=null;year=E.continueYear(year,'leave');assert.equal(year.world.health.foodBudget,1200);assert.equal(year.sleep,'short');assert.equal(cost(year),1400);
let old=fresh();delete old.world.health.foodBudget;old=E.migrateGame(old);assert.equal(W.foodBudgetInfo(old).enabled,false);
console.log('living tests passed');
