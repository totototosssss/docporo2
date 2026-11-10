import assert from 'node:assert/strict';
import * as E from '../engine.js';import * as X from '../exams.js';import * as U from '../utokyo-depth.js';import {SCHOOLS} from '../data.js';
const clamp=(x,a=0,b=100)=>Math.max(a,Math.min(b,x)),sigmoid=x=>1/(1+Math.exp(-x));
const logistic=(seed,key)=>Math.log(X.draw(seed,key)/(1-X.draw(seed,key)));
// At ordinary levels both forecast and actual common-test scores are unchanged.
for(const ability of [32,100,180,250])for(const seed of [1,7,100,999]){
 const s=E.newGame(seed);s.health=60;s.writing=80;for(const id of Object.keys(s.skills)){s.skills[id]=ability;s.journey.topics[id]=s.journey.topics[id].map(()=>ability-5);}
 for(const [id] of Object.entries(X.CT_WEIGHTS)){
  const old=clamp(98.2-91*Math.exp(-Math.max(0,ability)/49)-.5,0,98.2);assert.equal(X.commonSubject(s,id),old);
  for(const tactic of ['steady','check','rush']){const oldScore=Math.round(clamp(old+logistic(seed,'common-day')*.45+logistic(seed,'common:'+id)*(tactic==='rush'?1.05:.68)+(tactic==='check'?.2:0),0,98.8)*10)/10;assert.equal(X.sitCommon(s,tactic).scores[id],oldScore);}
 }
 const key=s.training.style,oldScore=clamp(100*sigmoid((ability-78)/22)*(.72+Math.min(100,s.writing)*.0015)+(X.draw(seed,key+2026)-.5)*7,0,98);const result=X.paperStep(s,1,1);assert.equal(result.record.score,Math.round(oldScore));
}
// Deep sustained preparation opens room beyond 82%; a lucky exam alone cannot.
const school=SCHOOLS.find(s=>s.id==='utokyo'),s=E.newGame(1);s.yearIndex=8;s.week=44;s.writing=2000;s.interview=1000;s.papers.mastery.utokyo=2000;for(const id of Object.keys(s.skills)){s.skills[id]=2000;s.journey.topics[id]=s.journey.topics[id].map(()=>1999);}s.papers.records=Array.from({length:160},(_,i)=>({key:'utokyo',week:428-i*2,analyzed:true,retried:true}));
const f=X.examForecast(s,school,E.weights(s,school));assert.ok(f.probability>.9&&f.probability<=1);assert.ok(U.utokyoDepth(s).multiplier>.9&&U.utokyoDepth(s).multiplier<=1);
const insufficient=structuredClone(s);insufficient.papers.records=[];assert.ok(U.utokyoDepth(insufficient).multiplier<.82);
let actual=0,fullCommon=0,fullPaper=0;const n=5000;for(let seed=0;seed<n;seed++){
 s.seed=seed;const common=X.sitCommon(s,'steady');for(const score of Object.values(common.scores))assert.ok(score>=0&&score<=100);assert.ok(common.score>=0&&common.score<=100);if(Object.values(common.scores).some(x=>x===100))fullCommon++;
 const r=X.sitSecondary(s,school,E.weights(s,school),'steady');assert.ok(Object.values(r.subjectScores).every(x=>x>=0&&x<=100));actual+=Number(r.passed);
 const trial=structuredClone(s);trial.training.focus=null;trial.papers.mode='timed';const paper=X.paperStep(trial,1,1);assert.ok(paper.record.score>=0&&paper.record.score<=100);if(paper.record.score===100){fullPaper++;assert.deepEqual(paper.record.errors,[]);assert.equal(trial.papers.mistakes[paper.key]||0,0);assert.match(paper.reason,/満点/);}
}
assert.ok(fullCommon>0);assert.ok(fullPaper>0);assert.ok(Math.abs(actual/n-f.probability)<.03);
console.log('exam extremes: ordinary parity, 100-point limits, rare full scores, and forecast/outcome agreement passed');
let perfectTrial;for(let seed=0;seed<1000&&!perfectTrial;seed++){const t=structuredClone(s);t.seed=seed;t.training.focus=null;t.papers.mode='timed';const a=X.paperStep(t,1,1);if(a.record.score===100)perfectTrial=t;}assert.ok(perfectTrial);perfectTrial.papers.mode='analysis';const analysis=X.paperStep(perfectTrial,1,1);assert.match(analysis.reason,/満点の答案/);assert.equal(perfectTrial.papers.mistakes[analysis.key]||0,0);
console.log('perfect paper review does not invent mistakes');
