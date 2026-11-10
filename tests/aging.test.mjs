import assert from 'node:assert/strict';
import * as E from '../engine.js';
import * as M from '../memory.js';
import {agingView} from '../aging.js';
const original=E.newGame(12345), s=E.copy(original);
assert.equal(s.aging,undefined);
for(const year of [0,14]){s.yearIndex=year;const a=agingView(s);assert.equal(a.forgettingFactor,1);assert.equal(a.recoveryPenalty,0);}
const reference=E.copy(original);reference.yearIndex=19;reference.health=50;reference.university.status='leave';reference.university.current=null;reference.world.health.fitness=0;
const input=JSON.stringify(reference),plan=E.blankPlan();for(const id of ['math','english','physics','chemistry'])plan.counts[id]=4;
const forecast=E.simulateWeek(reference,plan,{preview:true});assert.equal(JSON.stringify(reference),input);assert.equal(forecast.aging,undefined);
const advanced=E.simulateWeek(reference,plan);assert.equal(JSON.stringify(reference),input);assert.ok(advanced.aging.trait>=.8&&advanced.aging.trait<=1.2);assert.equal(agingView(advanced).trait,agingView(reference).trait);
const reloaded=E.migrateGame(JSON.parse(JSON.stringify(advanced)));assert.equal(reloaded.aging.trait,advanced.aging.trait);
let next=E.copy(reloaded);next.phase='ending';next.pending=null;next=E.continueYear(next,'leave');assert.equal(next.aging.trait,advanced.aging.trait);assert.equal(agingView(next).trait,advanced.aging.trait);
for(const year of [19,39,59,200]){const state=E.copy(reference);state.yearIndex=year;const a=agingView(state);assert.ok(a.forgettingFactor>=1&&a.forgettingFactor<=1.2);assert.ok(a.recoveryPenalty>=0&&a.recoveryPenalty<=1);}
const low=E.copy(reference),high=E.copy(reference);low.yearIndex=high.yearIndex=39;high.world.health.fitness=100;assert.ok(agingView(high).recoveryPenalty<agingView(low).recoveryPenalty);high.sleep='short';assert.deepEqual(agingView(high),agingView({...high,sleep:'steady'}));
// Passive decay changes only accessibility, while the existing knowledge decay is identical.
const young=E.copy(original),old=E.copy(original);young.yearIndex=14;old.yearIndex=39;for(const state of [young,old])for(const row of Object.values(state.memory.cells))for(const c of row){c.last=M.absoluteWeek(state);c.knowledge=100;c.accessible=100;c.stability=10;}
const p=E.blankPlan();M.memoryStep(young,young,p.counts,p,1);M.memoryStep(old,old,p.counts,p,1);assert.equal(young.memory.cells.math[0].knowledge,old.memory.cells.math[0].knowledge);assert.ok(old.memory.cells.math[0].accessible<young.memory.cells.math[0].accessible);
// Existing review can retrieve the gap, at either age.
const reviewed=E.copy(old);reviewed.week++;p.counts.review=4;M.memoryStep(reviewed,reviewed,p.counts,p,1);assert.ok(reviewed.memory.lastReview.some(q=>q.recovered>0));
const legacy=E.copy(reference);legacy.pastYears=[{seed:99}];const trait=agingView(legacy).trait;legacy.seed=123456;assert.equal(agingView(legacy).trait,trait);
console.log('aging: compatibility, fixed individual trait, preview, bounds, activity, year rollover and retrieval passed');
// At the same weekly plan, sleep retains its existing penalty and fitness mitigates only age recovery.
const aged=E.copy(reference);aged.yearIndex=39;aged.health=50;aged.world.health.fitness=0;
const fit=E.copy(aged);fit.world.health.fitness=100;
const short=E.copy(aged);short.sleep='short';
const comparable=E.copy(plan);comparable.counts.math=2;const predicted=E.simulateWeek(aged,comparable,{preview:true});const predictedFit=E.simulateWeek(fit,comparable,{preview:true});const predictedShort=E.simulateWeek(short,comparable,{preview:true});
assert.ok(predictedFit.health>predicted.health);assert.equal(predicted.health-predictedShort.health,12);
// 100 weeks of sparse practice, with and without reviews, remain finite and recoverable at age 80.
for(const review of [0,2]){const sample=E.copy(original);sample.yearIndex=59;for(const row of Object.values(sample.memory.cells))for(const c of row)c.last=M.absoluteWeek(sample);const weekly=E.blankPlan();weekly.counts.review=review;for(let i=0;i<100;i++){M.memoryStep(sample,sample,weekly.counts,weekly,1);sample.week++;}assert.ok(Object.values(sample.skills).every(Number.isFinite));assert.ok(sample.memory.cells.math.every(c=>Number.isFinite(c.knowledge)&&c.knowledge>0&&Number.isFinite(c.accessible)));if(review)assert.ok(sample.memory.cells.math[0].accessible>0);}
console.log('aging: sleep, exercise recovery and 100-week older-age simulation passed');
