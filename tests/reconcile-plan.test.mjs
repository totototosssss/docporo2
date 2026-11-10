import assert from 'node:assert/strict';
import * as E from '../engine.js';
import * as P from '../planner.js';

// Choosing an event after the week was advanced creates a new fixed commitment.
let s=E.newGame(123);s.week=2;s.job='tutor';s.journey.work.contract='regular';s.pending={kind:'story',week:1};
const original=P.automaticPlan(s),before=structuredClone(original);
assert.equal(original.counts.work,2);
let chosen=E.chooseEvent(s,1);
assert.equal(E.commitmentsCost(chosen),1);
let result=P.reconcilePlan(chosen,original);
assert.deepEqual(original,before);
assert.equal(result.plan.counts.work,2);
assert.equal(E.planCount(result.plan),E.capacity(chosen));
assert.equal(result.reduced.reduce((n,x)=>n+x.blocks,0),1);
assert(!result.reduced.some(x=>x.id==='work'));
assert.equal(result.overbookedBy,0);
assert.equal(result.workShortfall,0);
chosen=E.dismissNarrative(chosen);
assert.equal(E.validatePlan(chosen,result.plan),null);

// If there is spare time, move a displaced slot and leave all other slots intact.
const partial=E.blankPlan();partial.counts.work=2;partial.counts.english=1;
partial.schedule=E.bestSchedule(s,partial).schedule;
let spare=P.reconcilePlan(chosen,partial);
assert.deepEqual(spare.plan.counts,partial.counts);
assert.equal(spare.reduced.length,0);
for(const [i,id] of Object.entries(partial.schedule))if(Object.hasOwn(spare.plan.schedule,i))assert.equal(spare.plan.schedule[i],id);
assert.equal(E.validatePlan(chosen,spare.plan),null);

// Reserved lectures and commitments alone can exceed the entire week: report it.
let crowded=E.newGame(4);crowded.job='tutor';crowded.journey.work.contract='regular';
const prior=P.automaticPlan(crowded);crowded.journey.commitments.push({week:crowded.week,name:'予約',blocks:20,effect:{}});
const impossible=P.reconcilePlan(crowded,prior);
assert(impossible.overbookedBy>0);assert.equal(impossible.plan.counts.work,0);assert.equal(impossible.workShortfall,2);
assert.equal(E.planCount(impossible.plan),0);
assert.match(E.validatePlan(crowded,impossible.plan),/空き時間/);

// A trip is either kept in full or removed; never leave a partial reservation.
let trip=E.newGame(9);trip.job='tutor';trip.journey.work.contract='regular';
trip.lifestyle.outing.pref=46;
const blocks=E.tripQuote(trip).blocks;
const planned=E.blankPlan();planned.counts.work=2;planned.counts.outing=blocks;planned.schedule=E.bestSchedule(trip,planned).schedule;
trip.journey.commitments.push({week:trip.week,name:'予約',blocks:9,effect:{}});
const trimmed=P.reconcilePlan(trip,planned);
assert.equal(trimmed.plan.counts.work,2);assert.equal(trimmed.plan.counts.outing,0);
assert(trimmed.reduced.some(x=>x.id==='outing'&&x.blocks===blocks));
assert.equal(E.validatePlan(trip,trimmed.plan),null);
console.log('event commitments, protected work, slot moves and impossible capacity: passed');
