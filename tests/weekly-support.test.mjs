import assert from 'node:assert/strict';
import * as E from '../engine.js';
import * as Market from '../market.js';
const blank=s=>E.bestSchedule(s,E.blankPlan());
for(const [family,support] of [['standard',10000],['limited',4000]]){
 const s=E.newGame(1,{family});s.cash=0;s.week=4;const p=blank(s),cost=E.costOfPlan(p,s),before=JSON.stringify(s);assert.equal(E.weeklySupport(s),support);assert.equal(E.validatePlan(s,p),null);const preview=E.simulateWeek(s,p,{preview:true});assert.equal(JSON.stringify(s),before);assert.equal(preview.cash,support-cost);const out=E.simulateWeek(s,p);assert.equal(out.cash,support-cost);assert.equal(out.journey.ledger.at(-1).support,support);assert.equal(out.journey.ledger.at(-1).materials,cost);
 let off=structuredClone(s);off.week=5;assert.equal(E.weeklySupport(off),0);assert.match(E.validatePlan(off,blank(off)),/費用/);
}
// Fixed commitments are paid before support; validation mirrors their cash effects.
let s=E.newGame(9);s.week=1;s.cash=1000;s.journey.commitments.push({week:1,name:'支払い',blocks:0,effect:{cash:-300}});assert.match(E.validatePlan(s,blank(s)),/費用/);s.week=4;s.journey.commitments[0].week=4;assert.equal(E.validatePlan(s,blank(s)),null);let result=E.simulateWeek(s,blank(s));assert.equal(result.cash,1000-300+10000-E.costOfPlan(blank(s),s));
// A busy month-start with zero free time must still be able to spend its support.
let busy=E.newGame(11);busy.week=4;busy.cash=0;busy.journey.commitments.push({week:4,name:'予約',blocks:E.baseCapacity(busy),effect:{}});assert.equal(E.capacity(busy),0);assert.equal(E.validatePlan(busy,blank(busy)),null);result=E.simulateWeek(busy,blank(busy));assert.equal(result.cash,10000-E.costOfPlan(blank(busy),busy));
// Buy-order reservations remain outside available cash and cannot be spent twice.
let reserved=E.newGame(4);reserved.week=4;reserved.cash=9000;reserved=Market.placeLimitOrder(reserved,'tech','buy',20);const held=Market.reservedCash(reserved),available=reserved.cash;assert.ok(held>0);const cost=E.costOfPlan(blank(reserved),reserved);assert.equal(E.validatePlan(reserved,blank(reserved)),null);const out=E.simulateWeek(reserved,blank(reserved));assert.ok(out.cash>=0);assert.equal(out.journey.ledger.at(-1).support,10000);assert.equal(available+held,9000);assert.ok(cost<=available+10000);
// The first week after a year transition uses the same support rule.
let old=E.newGame(5,{family:'limited'});old.week=48;old.phase='ending';old.pending=null;old.cash=0;old=E.continueYear(old,'leave');old=E.migrateGame(JSON.parse(JSON.stringify(old)));assert.equal(E.weeklySupport(old),4000);assert.equal(E.validatePlan(old,blank(old)),null);result=E.simulateWeek(old,blank(old));assert.equal(result.journey.ledger.at(-1).support,4000);assert.equal(result.cash,4000-E.costOfPlan(blank(old),old));
console.log('weekly support: validation, fixed obligations, reserved funds, preview and year rollover passed');
