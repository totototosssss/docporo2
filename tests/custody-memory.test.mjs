import assert from 'node:assert/strict';
import * as E from '../engine.js';
import * as C from '../custody.js';
import * as M from '../memory.js';
import {ensureAging} from '../aging.js';
// Both paths use the same unstudied-week decay, including age and existing knowledge decay.
for(const year of [0,19,59]){
 let base=E.newGame(50);base.yearIndex=year;base.week=10;base.university.status='leave';base.university.current=null;
 for(const row of Object.values(base.memory.cells))for(const cell of row)cell.last=M.absoluteWeek(base)-20;
 const normal=E.simulateWeek(base,E.bestSchedule(base,E.blankPlan()));
 let prisoner=C.enterCustody(base,{weeks:2});const initial=JSON.stringify(prisoner),preview=C.advanceCustodyWeek(prisoner,{preview:true});assert.equal(JSON.stringify(prisoner),initial);assert.equal(JSON.stringify(preview),initial);
 prisoner=C.advanceCustodyWeek(prisoner);assert.deepEqual(prisoner.memory,normal.memory);assert.deepEqual(prisoner.skills,normal.skills);assert.deepEqual(prisoner.journey.topics,normal.journey.topics);assert.ok(Object.values(prisoner.skills).every((v,i)=>v<Object.values(base.skills)[i]));
 assert.throws(()=>C.advanceCustodyWeek({...prisoner,week:10}));
}
// Two full annual boundaries; each real week decays exactly once, not at rollover.
let s=E.newGame(77);s.week=47;s=C.enterCustody(s,{weeks:102});
for(let i=0;i<102;i++){
 if(s.week===48){const before=structuredClone(s.memory);s=E.continueCustodyYear(s);assert.deepEqual(s.memory,before);}
 const reference=structuredClone(s);ensureAging(reference);M.memoryStep(reference,reference,{}, {methods:{}},1);
 s=C.advanceCustodyWeek(s);assert.deepEqual(s.memory,reference.memory);assert.deepEqual(s.skills,reference.skills);s=E.migrateGame(JSON.parse(JSON.stringify(s)));assert.ok(C.validateCustody(s));
}
assert.equal(s.custody.remainingWeeks,0);
// Older custody saves are not retroactively decayed when loaded.
let old=C.enterCustody(E.newGame(19),{weeks:5}),initial=structuredClone(old);for(let i=0;i<3;i++)old=C.advanceCustodyWeek(old);
old.memory=structuredClone(initial.memory);old.skills=structuredClone(initial.skills);old.journey.topics=structuredClone(initial.journey.topics);old=E.migrateGame(JSON.parse(JSON.stringify(old)));const reference=structuredClone(old);ensureAging(reference);M.memoryStep(reference,reference,{}, {methods:{}},1);old=C.advanceCustodyWeek(old);assert.deepEqual(old.memory,reference.memory);assert.deepEqual(old.skills,reference.skills);
console.log('custody memory: ordinary-week parity, age, preview, legacy, one tick and 102-week year rollover passed');
