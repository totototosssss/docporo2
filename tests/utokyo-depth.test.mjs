import assert from 'node:assert/strict';
import {utokyoDepth,utokyoMultiplier} from '../utokyo-depth.js';
const state=()=>({yearIndex:0,week:20,skills:{math:180,english:180,physics:180,chemistry:180,japanese:180},journey:{topics:Object.fromEntries(['math','english','physics','chemistry','japanese'].map(x=>[x,[170,180]]))},writing:200,papers:{mastery:{utokyo:50},records:[]}});
let s=state(),before=JSON.stringify(s),a=utokyoDepth(s);assert.equal(JSON.stringify(s),before);assert.ok(a.multiplier>0&&a.multiplier<.82);assert.equal(utokyoMultiplier(s,'kyoto'),1);assert.equal(utokyoMultiplier(s,'science-tokyo'),1);
let worse=structuredClone(s);worse.journey.topics.japanese=[0,180];assert.ok(utokyoDepth(worse).breadth<a.breadth);assert.ok(utokyoDepth(worse).multiplier<a.multiplier);
let low=structuredClone(s);low.writing=0;assert.ok(utokyoDepth(low).depth<a.depth);low=structuredClone(s);low.papers.mastery.utokyo=0;assert.ok(utokyoDepth(low).depth<a.depth);
let trained=structuredClone(s);trained.papers.records=[{key:'utokyo',week:10,analyzed:true,retried:true},{key:'utokyo',week:11,analyzed:true,retried:true}];let b=utokyoDepth(trained);assert.equal(b.completed,2);assert.equal(b.recentAttempt,true);assert.ok(b.multiplier>a.multiplier);
trained.papers.records.push({key:'utokyo',week:10,analyzed:true,retried:true},{key:'utokyo',week:12,analyzed:false,retried:true},{key:'elite',week:13,analyzed:true,retried:true},{key:'utokyo',week:21,analyzed:true,retried:true});assert.equal(utokyoDepth(trained).completed,2);
let ancient=structuredClone(trained);ancient.week=47;assert.equal(utokyoDepth(ancient).recentAttempt,false);assert.ok(utokyoDepth(ancient).multiplier<utokyoDepth(trained).multiplier);
let legacy=state();delete legacy.papers;const old=utokyoDepth(legacy);assert.ok(Number.isFinite(old.multiplier)&&old.multiplier>0);assert.equal(old.completed,0);
let master=state();for(const id of Object.keys(master.skills)){master.skills[id]=1e6;master.journey.topics[id]=[1e6]}master.writing=1e6;master.papers.mastery.utokyo=1e6;master.week=47;master.papers.records=Array.from({length:48},(_,week)=>({key:'utokyo',week,analyzed:true,retried:true}));assert.ok(utokyoDepth(master).multiplier>.82&&utokyoDepth(master).multiplier<=1);
console.log('utokyo depth: pure, school isolation, breadth, depth, delayed reproduction, deduplication and legacy tests passed');
// Counterfactual pass frequency matches forecast × quality, with a separate game draw.
const {utokyoOutcomePass}=await import('../utokyo-depth.js');
const {draw}=await import('../exams.js');
const baseProbability=.94,multiplier=utokyoMultiplier(trained,'utokyo');let passed=0;const n=50000;
for(let seed=0;seed<n;seed++){const base=draw(seed,'test-ordinary')<baseProbability;passed+=Number(utokyoOutcomePass(trained,'utokyo',base,draw(seed,'test-depth')));}
assert.ok(Math.abs(passed/n-baseProbability*multiplier)<.01);assert.equal(utokyoOutcomePass(trained,'kyoto',true,0.99),true);assert.equal(utokyoOutcomePass(trained,'kyoto',false,0),false);
assert.throws(()=>utokyoOutcomePass(trained,'utokyo',true,1));
console.log('utokyo depth: independent outcome frequency agrees with forecast', (passed/n).toFixed(4));
