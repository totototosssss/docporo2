import assert from 'node:assert/strict';
import * as E from '../engine.js';
import {learningTalent,newTalent} from '../talent.js';
let values=[];for(let i=0;i<200000;i++)values.push(learningTalent({talent:newTalent(i)}));values.sort((a,b)=>a-b);
const q=p=>values[Math.floor(values.length*p)];assert.ok(q(.5)>.97&&q(.5)<1.03);assert.ok(q(.999)>1.3);assert.ok(q(.99999)>1.4);assert.ok(values.every(v=>Number.isFinite(v)&&v>0));
const s=E.newGame(12345),factor=learningTalent(s);assert.notEqual(factor,1);assert.equal(learningTalent(E.migrateGame(JSON.parse(JSON.stringify(s)))),factor);
const legacy=structuredClone(s);delete legacy.talent;assert.equal(learningTalent(E.migrateGame(legacy)),1);
const p=E.blankPlan();p.counts.math=2;const before=JSON.stringify(s);E.simulateWeek(s,p,{preview:true});assert.equal(JSON.stringify(s),before);
console.log('talent: stable, legacy-neutral, hidden distribution and preview passed',q(.5).toFixed(3),q(.999).toFixed(3),q(.99999).toFixed(3));
