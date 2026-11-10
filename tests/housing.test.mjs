import assert from 'node:assert/strict';
import * as H from '../housing.js';
const game=(seed=1)=>({seed,yearIndex:1,week:10,phase:'study',pending:null,health:80,cash:30000});
const next=s=>{s=structuredClone(s);if(s.week===47){s.week=0;s.yearIndex++;}else s.week++;return s;};
const dismiss=(s,index)=>H.chooseHousing(s,index);
let legacy=game();assert(H.validateHousing(legacy));const p=H.advanceHousing(legacy,{preview:true});assert.equal(JSON.stringify(p),JSON.stringify(legacy));assert.equal(H.housingWeeklyCost(legacy),0);
let s=H.beginHousingNotice(legacy);assert.equal(legacy.housing,undefined);s.pending={kind:'common'};let blocked=H.advanceHousing(s);assert.equal(blocked.pending.kind,'common');assert.equal(blocked.housing.events[0].dispatched,false);blocked.pending=null;s=H.advanceHousing(blocked);assert.equal(s.pending.kind,'housing');assert.equal(H.housingView(s).title,'住まいのことで、連絡が来た');
// Saved/reloaded queued event has exactly the same deadline and does not reroll.
let saved=JSON.parse(JSON.stringify(s));assert(H.validateHousing(saved));assert.equal(JSON.stringify(H.advanceHousing(saved)),JSON.stringify(saved));s=dismiss(saved,1);assert.equal(s.housing.remaining,4);const once=H.advanceHousing(s);assert.equal(once.housing.remaining,4);
s=H.advanceHousing(next(s));assert.equal(s.housing.remaining,3);s=H.advanceHousing(next(s));assert.equal(s.housing.remaining,2);assert.equal(H.housingView(s).title,'住まいの期限が近い');s=dismiss(s,1);s=H.advanceHousing(next(s));assert.equal(s.housing.remaining,1);
// An unrelated required event delays both the loss and its deadline.
let collision=next(s);collision.pending={kind:'applications'};collision=H.advanceHousing(collision);assert.equal(collision.housing.remaining,1);assert.equal(collision.pending.kind,'applications');collision.pending=null;s=H.advanceHousing(collision);assert.equal(H.housingView(s).title,'今夜の場所を探す');s=dismiss(s,0);assert.equal(s.housing.status,'shelter');assert.equal(s.cash,30000);assert.equal(H.housingWeeklyCost(s),0);
let consult=H.housingAction(s,'consult');assert.equal(consult.housing.status,'housed');assert.equal(consult.cash,30000);assert.equal(H.housingWeeklyCost(consult),0);assert.equal(H.housingAction(s,'work').housing.status,'shelter');
let poor=structuredClone(s);poor.cash=0;assert.throws(()=>H.housingAction(poor,'rent'));assert.equal(H.housingAction(poor,'consult').cash,0);
let rental=H.housingAction(s,'rent');assert.equal(rental.cash,10000);assert.equal(H.housingWeeklyCost(rental),H.WEEKLY_RENT);rental=H.housingAction(rental,'leave-rental');assert.equal(H.housingWeeklyCost(rental),0);assert.equal(rental.housing.status,'shelter');
let year=H.beginHousingNotice(game());year.yearIndex=1;year.week=47;year=H.advanceHousing(year);year=dismiss(year,1);year=H.advanceHousing(next(year));assert.equal(year.yearIndex,2);assert.equal(year.housing.remaining,3);assert(H.validateHousing(JSON.parse(JSON.stringify(year))));
let unwell=game();unwell.health=0;for(let i=0;i<4;i++){unwell=H.advanceHousing(unwell);if(i<3)unwell=next(unwell);}assert.equal(H.housingView(unwell).title,'休む時間が必要');let recovering=dismiss(unwell,0);assert.equal(recovering.health,15);assert.equal(recovering.housing.crisisWeeks,0);assert.equal(recovering.cash,30000);
// Find a deterministic seed that triggers the rare death only after warnings.
let death=null;for(let seed=0;seed<20000&&!death;seed++){let x=game(seed);x.health=0;for(let i=0;i<24;i++){x=H.advanceHousing(x);if(x.pending?.kind==='housing'){const view=H.housingView(x);if(view.title==='時間が止まる'){death=x;break;}x=dismiss(x,view.title==='休む時間が必要'?1:0);}x=next(x);}}
assert(death);assert(death.housing.crisisWeeks>=12);const ended=dismiss(death,0);assert.equal(ended.phase,'deceased');assert.equal(ended.lifeEnd.kind,'health');assert.equal(ended.pending,null);
let invalid=structuredClone(s);invalid.housing.events=[{id:'x',type:'loss',dispatched:true}];assert.equal(H.validateHousing(invalid),false);assert.throws(()=>H.ensureHousing(invalid));
console.log('housing tests passed');
