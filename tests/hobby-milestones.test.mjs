import assert from 'node:assert/strict';
import * as E from '../engine.js';
import * as H from '../hobby-milestones.js';
const fresh=()=>{const s=E.newGame(42);s.world.hobby='photo';s.world.hobbyProgress.photo=4;return s;};
const plan=(s,hobby=1,talk=0)=>{const p=E.blankPlan();p.counts.hobby=hobby;p.counts.talk=talk;return E.bestSchedule(s,p);};
let s=fresh();assert.equal(H.validateHobbyMilestones(s),true);assert.equal(H.milestoneInfo(s).ready,true);
s=H.bookMilestone(s,'together');assert.equal(H.validateHobbyMilestones(s),true);assert.throws(()=>H.bookMilestone(s,'solo'));
let p=plan(s,2,1);assert.equal(H.milestonePlan(s,p).ready,true);assert.equal(H.milestoneCost(s,p),1500);
const noBooking=H.cancelMilestone(s);assert.equal(E.costOfPlan(p,s)-E.costOfPlan(p,noBooking),1500);
const snapshot=JSON.stringify(s),preview=E.simulateWeek(s,p,{preview:true});assert.equal(JSON.stringify(s),snapshot);assert.equal(preview.hobbyMilestones.records.length,0);assert.equal(preview.lastReport.hobbyMilestone,null);
const after=E.simulateWeek(s,p);assert.equal(after.hobbyMilestones.records.length,1);assert.equal(after.lastReport.hobbyMilestone.title,'今日の一枚');assert.equal(after.hobbyMilestones.pending,null);assert.equal(after.hobbyMilestones.records[0].id,'photo');assert.equal(H.validateHobbyMilestones(after),true);assert.equal(H.finishMilestone(after,s,p),null);assert.equal(after.hobbyMilestones.records.length,1);
assert.equal(H.milestoneInfo(after).stage,1);assert.equal(H.milestoneInfo(after).ready,false);
let again=JSON.parse(JSON.stringify(after));assert.equal(H.milestoneCost(again,plan(again,2,1)),0);
let missing=H.bookMilestone(fresh(),'together'),missingPlan=plan(missing,1,0);assert.equal(H.milestoneCost(missing,missingPlan),0);let missed=E.simulateWeek(missing,missingPlan);assert.equal(missed.hobbyMilestones.records.length,0);assert.equal(missed.hobbyMilestones.pending,null);assert.ok(missed.lastReport.notes.some(note=>note.includes('実行されませんでした')));assert.equal(missed.lastReport.hobbyMilestone.cancelled,true);assert.match(missed.lastReport.hobbyMilestone.reason,/コマ/);
let brokeState=fresh();brokeState.week=1;let broke=H.bookMilestone(brokeState,'together');let brokePlan=plan(broke,2,1);broke.cash=E.costOfPlan(brokePlan,H.cancelMilestone(broke));assert.equal(E.validatePlan(H.cancelMilestone(broke),brokePlan),null);assert.match(E.validatePlan(broke,brokePlan),/費用/);const before=JSON.stringify(broke);assert.throws(()=>E.simulateWeek(broke,brokePlan));assert.equal(JSON.stringify(broke),before);
let switched=H.bookMilestone(fresh(),'together');switched.world.hobby='music';let switchedPlan=plan(switched,2,1);assert.equal(H.milestoneCost(switched,switchedPlan),0);assert.equal(E.simulateWeek(switched,switchedPlan).hobbyMilestones.records.length,0);
let second=JSON.parse(JSON.stringify(after));second.world.hobbyProgress.photo=12;assert.equal(H.milestoneInfo(second).ready,true);second=H.bookMilestone(second,'solo');second=E.simulateWeek(second,plan(second));assert.equal(second.hobbyMilestones.records.length,2);assert.equal(H.milestoneInfo(second).complete,true);
let stale=H.bookMilestone(fresh(),'solo');stale.yearIndex=1;assert.equal(H.milestonePlan(stale,plan(stale)).ready,false);let expired=E.simulateWeek(stale,plan(stale));assert.equal(expired.hobbyMilestones.records.length,0);
let end=fresh();end.week=47;end=H.bookMilestone(end,'solo');end=E.simulateWeek(end,plan(end));assert.equal(end.hobbyMilestones.records.length,1);end=E.takeFinal(end);end=E.continueYear(end,'leave');assert.equal(end.yearIndex,1);assert.equal(end.hobbyMilestones.records.length,1);assert.equal(H.milestoneInfo(end,'photo').stage,1);
let graduated=fresh();graduated.world.hobby='club';graduated.world.hobbyProgress.club=30;graduated.university.status='graduated';assert.equal(H.milestoneInfo(graduated).ready,false);
for(const id of Object.keys(H.HOBBY_MILESTONES)){let x=fresh();x.world.hobby=id;x.world.hobbyProgress[id]=12;for(const mode of Object.keys(H.MILESTONE_MODES)){const booked=H.bookMilestone(x,mode);assert.equal(H.validateHobbyMilestones(booked),true);}}
let invalid=fresh();invalid.hobbyMilestones={records:[{id:'photo',stage:0,mode:'solo',year:0,week:0},{id:'photo',stage:0,mode:'share',year:0,week:1}],pending:null};assert.equal(H.validateHobbyMilestones(invalid),false);
console.log('hobby milestones: all tests passed');

const badFuture=fresh();badFuture.hobbyMilestones={records:[{id:'photo',stage:0,mode:'solo',year:0,week:0}],pending:null};assert.equal(H.validateHobbyMilestones(badFuture),false);
const badOrder=fresh();badOrder.week=10;badOrder.hobbyMilestones={records:[{id:'photo',stage:1,mode:'solo',year:0,week:3},{id:'photo',stage:0,mode:'solo',year:0,week:4}],pending:null};assert.equal(H.validateHobbyMilestones(badOrder),false);
const badPending=fresh();badPending.hobbyMilestones={records:[],pending:{id:'photo',stage:1,mode:'solo',year:0,week:0}};assert.equal(H.validateHobbyMilestones(badPending),false);
console.log('hobby save validation: all tests passed');
