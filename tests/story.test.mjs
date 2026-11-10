import assert from 'node:assert/strict';
import * as E from '../engine.js';
import * as P from '../planner.js';
import * as J from '../journey.js';
import * as H from '../household.js';
import {twistStory} from '../twists.js';
const base=()=>{const s=E.newGame(2);s.yearIndex=1;s.pastYears=[{results:[],income:0,promotion:{ok:false,label:'留年・再履修'}}];return s;};
const select=(s,week,index)=>{s.week=week+1;s.pending={kind:'story',week};return E.chooseEvent(s,index);};
// Family disclosures, including deferred sharing, work in all study states.
for(const status of ['enrolled','leave','graduated'])for(let spring=0;spring<3;spring++)for(let autumn=0;autumn<3;autumn++){
 let s=base();s.university.status=status;const support=s.examBudget;s=select(s,7,spring);
 assert.equal(s.journey.familyContext.shared.schedule,spring===0);assert.equal(s.journey.familyContext.shared.feelings,spring===1);
 s=select(s,19,autumn);assert.equal(s.journey.familyContext.shared.costs,false);assert.equal(s.examBudget,support);
 if(autumn===1){assert(s.journey.commitments.some(c=>c.familyCompletion?.share==='costs'&&c.blocks===1));s=E.dismissNarrative(s);const plan=P.automaticPlan(s);const preview=E.simulateWeek(s,plan,{preview:true});assert.equal(preview.journey.familyContext.shared.costs,false);s=E.simulateWeek(s,plan);assert.equal(s.journey.familyContext.shared.costs,true);}
 const winter=J.storyAt(s,31);assert.equal(winter.choices.length,autumn===1?3:2);
 for(let i=0;i<winter.choices.length;i++){const chosen=select(structuredClone(s),31,i);assert.equal(chosen.examBudget,support);if(i===0)assert.equal(chosen.journey.familyContext.shared.costs,true);}
}
const legacy=base();delete legacy.journey.familyContext;assert.equal(E.migrateGame(legacy).journey.familyContext,undefined);const shared=select(legacy,7,0);shared.phase='ending';shared.pending=null;const carry=E.continueYear(shared,'leave');assert.equal(carry.journey.familyContext.shared.schedule,true);
// Registration remains possible after every household member has died.
for(const status of ['enrolled','leave','graduated'])for(let i=0;i<2;i++){
 const s=base();s.university.status=status;for(const p of s.household.people){p.alive=false;p.health='deceased';p.deathAt=0;}s.week=24;s.pending={kind:'story',week:23};
 const event=E.storyAt(s);assert.equal(event.choices.length,2);assert(!JSON.stringify(event).includes('家族'));const out=E.chooseEvent(s,i);assert.equal(out.registered,true);assert.equal(out.examBudget,s.examBudget);
}
for(const w of [1,7,13,19,25,31,33]){const s=base();for(const p of s.household.people){p.alive=false;p.health='deceased';p.deathAt=0;}const event=J.storyAt(s,w);if(event)assert(!JSON.stringify(event).includes('家族'));}
// Also handle imported or constructed first-year states without a living family.
for(let w=0;w<48;w++){const s=E.newGame(7);for(const p of s.household.people){p.alive=false;p.health='deceased';p.deathAt=0;}const event=J.storyAt(s,w);if(event){assert(event.choices.length>0);assert(!JSON.stringify(event).includes('家族'),`week ${w}`);}}
// Every twist option saves its own follow-up; the seat option reserves time.
for(const w of [9,21,37,45])for(let seed=0;seed<3;seed++)for(let i=0;i<3;i++){
 const s=base();s.seed=seed;const q=twistStory(s,w);s.week=w+1;s.pending={kind:'story',week:w};const actual=E.storyAt(s);assert.equal(actual.id,q.id);const out=E.chooseEvent(s,i);
 assert.equal(out.journey.echoes.at(-1).body,actual.choices[i].echo);assert.equal(out.journey.echoes.at(-1).due,s.yearIndex*48+s.week+2+(i===2?1:0));
 if(actual.id==='twist:9:seat'&&i===0){assert.equal(out.journey.commitments.at(-1).blocks,1);assert.equal(E.capacity(out),E.capacity(s)-1);}
}
// A due follow-up must preserve a simultaneously queued common exam.
let collision=base();collision.seed=2;collision.week=36;collision.registered=true;collision.pending={kind:'story',week:9};collision=E.dismissNarrative(E.chooseEvent(collision,0));collision=E.simulateWeek(collision,P.automaticPlan(collision));
while(collision.pending){if(collision.pending.kind==='afterStory')collision=E.dismissNarrative(collision);else if(collision.pending.kind==='encounter')collision=E.resolveEncounter(collision,0);else throw Error('unexpected early event');}
collision=E.simulateWeek(collision,P.automaticPlan(collision));let chain=[],p=collision.pending;while(p){chain.push(p.kind);p=p.next;}assert(chain.includes('afterStory'));assert(chain.includes('common'));
// Six consecutive years: old stories do not block registration or the final.
for(const seed of [9,2026]){let s=E.newGame(seed);const recent={};for(let year=0;year<6;year++){let guard=0;while(s.phase!=='ending'&&guard++<1000){if(!s.pending){s=E.simulateWeek(s,P.automaticPlan(s));continue;}const kind=s.pending.kind;
 if(kind==='story'){const q=E.storyAt(s);if(q.id?.startsWith('loop:')||q.id?.startsWith('twist:')){const key=q.id.split(':').slice(0,2).join(':'),last=recent[key]||[];assert(!last.slice(-2).includes(q.id));recent[key]=[...last,q.id];}s=E.chooseEvent(s,0);}
 else if(kind==='household')s=H.chooseHousehold(s,0);else if(kind==='afterStory')s=E.dismissNarrative(s);else if(kind==='encounter')s=E.resolveEncounter(s,0);else if(kind==='applications')s=E.finalizeApplications(s);else if(kind==='common')s=E.takeCommon(s,'steady');else if(kind==='commonResult')s=E.dismissCommon(s);else if(kind==='final')s=E.takeFinal(s,'steady');else throw Error('Unexpected pending '+kind);
 }assert.equal(s.phase,'ending');assert.equal(s.registered,true);assert.equal(s.week,48);if(year<5)s=E.continueYear(s,'leave');}}
console.log('story tests passed');
