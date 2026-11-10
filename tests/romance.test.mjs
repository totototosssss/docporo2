import assert from 'node:assert/strict';
import * as E from '../engine.js';
import {draw} from '../exams.js';
import {FRIENDS} from '../social.js';
import * as R from '../romance.js';

const person=R.FICTIONAL_PEOPLE[0],id=person.id;
assert(R.FICTIONAL_PEOPLE.every(p=>p.id.startsWith('fictional-')&&!FRIENDS.some(f=>f.id===p.id||f.name===p.name)));
let s=E.newGame(1),before=structuredClone(s);
assert.equal(R.validateRomance(s),true);assert.equal(R.validateRomance({...s,romance:{version:1,auto:'yes'}}),false);assert.equal(R.romanceView(s).auto,false);assert.equal(R.quoteRomance(s,{freeBlocks:5}).action,null);assert.deepEqual(s,before);
assert.throws(()=>R.queueRomanceAction(s,'meme','introduce'));
assert.throws(()=>R.queueRomanceAction(s,id,'meet'));
assert.throws(()=>R.queueRomanceAction(s,id,'ask'));
s=R.queueRomanceAction(s,id,'introduce');assert.equal(s.romance.auto,false);
assert.throws(()=>R.queueRomanceAction(s,id,'introduce'));
assert.equal(R.quoteRomance(s,{freeBlocks:0}).available,false);
assert.equal(R.quoteRomance(s,{freeBlocks:1,availableCash:299}).available,false);
const initial=structuredClone(s),preview=R.advanceRomance(s,{freeBlocks:1,preview:true});assert(preview.available);assert(!preview.executed);assert.deepEqual(s,initial);
const noTime=R.advanceRomance(s,{freeBlocks:0});assert(!noTime.executed);assert.deepEqual(s,initial);
const poor=structuredClone(s);poor.cash=299;const poorBefore=structuredClone(poor);assert(!R.advanceRomance(poor,{freeBlocks:1}).executed);assert.deepEqual(poor,poorBefore);
const inconsistent=structuredClone(s);inconsistent.romance.queued.kind='message';const inconsistentBefore=structuredClone(inconsistent);assert(!R.advanceRomance(inconsistent,{freeBlocks:1}).executed);assert.deepEqual(inconsistent,inconsistentBefore);
const cancelled=R.cancelRomanceAction(s);assert.equal(cancelled.romance.queued,null);assert(s.romance.queued);

// Choose a deterministic seed for an accepted introduction; no real data is used.
for(let seed=1;seed<1000;seed++)if(draw(seed,`romance:0:0:${id}:introduce`)<.75){s.seed=seed;break;}
let oldCash=s.cash,oldSpent=s.spent,first=R.advanceRomance(s,{freeBlocks:1});assert(first.executed);assert.equal(first.outcome,'accepted');assert.equal(s.cash,oldCash-300);assert.equal(s.spent,oldSpent+300);assert.equal(s.romance.people[id].status,'talking');assert.equal(s.romance.lastWeek,0);assert.equal(R.validateRomance(s),true);
let snap=structuredClone(s),duplicate=R.advanceRomance(s,{freeBlocks:3});assert(!duplicate.executed);assert.deepEqual(s,snap);
assert.throws(()=>R.queueRomanceAction(s,id,'meet'));assert.throws(()=>R.queueRomanceAction(s,id,'ask'));
s.week++;assert.equal(R.quoteRomance(s,{freeBlocks:1}).action,null); // default auto off
s=R.setRomanceAuto(s,true);let firstMessage=R.advanceRomance(s,{freeBlocks:1});assert.equal(firstMessage.outcome,'message');assert.equal(firstMessage.action.topic,'brief');assert.equal(firstMessage.entry.topic,'brief');assert.equal(firstMessage.entry.lines.length,2);assert.equal(s.romance.people[id].messages,1);
s.week++;let secondMessage=R.advanceRomance(s,{freeBlocks:1});assert.equal(secondMessage.outcome,'message');assert.equal(s.romance.people[id].messages,2);
s.week++;s=R.queueRomanceAction(s,id,'meet');let quote=R.quoteRomance(s,{freeBlocks:1});assert.equal(quote.cost,1200);assert.equal(quote.blocks,1);
for(let seed=1;seed<1000;seed++)if(draw(seed,`romance:0:${s.week}:${id}:meet`)<.8){s.seed=seed;break;}
oldCash=s.cash;let meeting=R.advanceRomance(s,{freeBlocks:1});assert.equal(meeting.outcome,'accepted');assert.equal(s.cash,oldCash-1200);assert.equal(s.romance.people[id].meetings,1);
s.week++;for(let n=0;n<3;n++){let x=R.advanceRomance(s,{freeBlocks:1});assert.equal(x.action.kind,'message');assert.equal(s.romance.people[id].status,'talking');s.week++;} // automation never chooses romance
s=R.queueRomanceAction(s,id,'ask');for(let seed=1;seed<1000;seed++)if(draw(seed,`romance:0:${s.week}:${id}:ask`)<.65){s.seed=seed;break;}let ask=R.advanceRomance(s,{freeBlocks:1});assert.equal(ask.outcome,'accepted');assert.equal(s.romance.people[id].status,'partner');
// A partner can choose to spend time together in later years; it never happens automatically.
let partner=structuredClone(s);partner.week++;partner=R.queueRomanceAction(partner,id,'meet');
for(let seed=1;seed<1000;seed++)if(draw(seed,`romance:0:${partner.week}:${id}:meet`)<.8){partner.seed=seed;break;}
oldCash=partner.cash;const partnerMeeting=R.advanceRomance(partner,{freeBlocks:1});assert.equal(partnerMeeting.outcome,'accepted');assert.equal(partner.romance.people[id].status,'partner');assert.equal(partner.romance.people[id].meetings,2);assert.equal(partner.cash,oldCash-1200);
let beforeView=structuredClone(partner.romance);let detached=R.romanceView(partner);detached.log[0].text='変更';assert.deepEqual(partner.romance,beforeView);
for(const profile of R.FICTIONAL_PEOPLE){
 const t=E.newGame(11);t.romance=R.newRomance();t.romance.selected=profile.id;t.romance.people[profile.id]={status:'talking',messages:0,meetings:0};
 assert.throws(()=>R.queueRomanceAction(t,profile.id,'message','invalid-topic'));
 const selected=R.queueRomanceAction(t,profile.id,'message','listen');const step=R.advanceRomance(selected,{freeBlocks:1});
 assert.equal(step.entry.topic,'listen');assert.equal(step.entry.lines[1].name,profile.name);assert.equal(R.validateRomance(selected),true);
}
const a1=E.newGame(1);a1.romance=R.newRomance();a1.romance.selected=id;a1.romance.people[id]={status:'talking',messages:0,meetings:0};a1.romance.queued={id,kind:'message'};assert.equal(R.validateRomance(a1),true);assert.equal(R.quoteRomance(a1,{freeBlocks:1}).action.topic,'daily');assert.equal(R.advanceRomance(a1,{freeBlocks:1}).entry.topic,'daily');
let stopped=R.setRomanceAuto(s,false);stopped.week++;assert.equal(R.quoteRomance(stopped,{freeBlocks:1}).action,null);
let ended=R.endRomance(stopped);assert.equal(ended.romance.people[id].status,'closed');assert.equal(ended.romance.selected,null);assert.equal(ended.romance.auto,false);

// Refused requests remain refusals, and a declined meeting does not charge the budget.
let rejected=E.newGame(1);for(let seed=1;seed<1000;seed++)if(draw(seed,`romance:0:0:${id}:introduce`)>=.75){rejected.seed=seed;break;}
rejected=R.queueRomanceAction(rejected,id,'introduce');assert.equal(R.advanceRomance(rejected,{freeBlocks:1}).outcome,'declined');assert.equal(rejected.romance.selected,null);assert.equal(rejected.romance.people[id].status,'declined');
let declined=structuredClone(s);declined.week++;declined.romance.people[id]={status:'talking',messages:2,meetings:0};declined=R.queueRomanceAction(declined,id,'meet');for(let seed=1;seed<1000;seed++)if(draw(seed,`romance:0:${declined.week}:${id}:meet`)>=.8){declined.seed=seed;break;}oldCash=declined.cash;let noMeet=R.advanceRomance(declined,{freeBlocks:1});assert.equal(noMeet.outcome,'declined');assert.equal(noMeet.cost,0);assert.equal(declined.cash,oldCash);assert.equal(declined.romance.people[id].meetings,0);assert.equal(declined.romance.auto,false);

// Legacy saves stay off; state and queued intent survive migration and a year change.
let old=E.newGame(2);delete old.romance;const migrated=E.migrateGame(JSON.parse(JSON.stringify(old)));assert.equal(R.romanceView(migrated).auto,false);assert(!migrated.romance);
let years=structuredClone(stopped);years.week=48;years.phase='ending';years.romance.queued={id,kind:'message'};let next=E.continueYear(years,'enrolled');assert.equal(next.romance.people[id].status,'partner');assert.equal(next.romance.queued.kind,'message');assert.equal(next.romance.auto,false);assert.equal(R.quoteRomance(next,{freeBlocks:1}).available,true);const restored=E.migrateGame(JSON.parse(JSON.stringify(next)));assert.deepEqual(restored.romance,next.romance);
// Deterministic, repeatable snapshots; cross-tab write conflicts belong to the storage layer.
let a=structuredClone(restored),b=structuredClone(restored);assert.deepEqual(R.advanceRomance(a,{freeBlocks:1}),R.advanceRomance(b,{freeBlocks:1}));assert.deepEqual(a.romance,b.romance);
a.week++;a=R.queueRomanceAction(a,id,'meet');for(let seed=1;seed<1000;seed++)if(draw(seed,`romance:1:${a.week}:${id}:meet`)<.8){a.seed=seed;break;}assert.equal(R.advanceRomance(a,{freeBlocks:1}).outcome,'accepted');assert.equal(a.romance.people[id].status,'partner');assert(a.romance.people[id].meetings>=2);
console.log('fictional romance: opt-in automation, consent, time/cost, preview and persistence passed');
