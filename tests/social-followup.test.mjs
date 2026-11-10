import assert from 'node:assert/strict';
import * as E from '../engine.js';import * as H from '../hangouts.js';
function start(category='水族館'){
 let s=E.newGame(119);s.week=44;let m=E.meetupQuote(s);m.vibe=4;const h=H.beginHangout(s,E.tripQuote(s),m);h.category=category;h.place='待ち合わせた場所';s.pending={kind:'hangout',hangout:h,next:null};s=H.resolveHangout(s,0);s=H.resolveHangout(s,0);s=H.resolveHangout(s,-1);s.week=47;return s;
}
for(const [category,keyword] of [['水族館','水槽'],['ボードゲームカフェ','遊び'],['美術館','展示'],['スポーツ','体'],['食べ歩き','おいしかった'],['街歩き','思い出した']]){
 let s=start(category),m=H.nextMessage(s),before=structuredClone(s);assert.ok(m);const sent=H.answerMessage(s,m.id,'continue');assert.deepEqual(s,before);assert.equal(sent.cash,s.cash);assert.equal(sent.spent,s.spent);assert.equal(sent.week,s.week);assert.deepEqual(sent.totals,s.totals);let child=sent.social.messages.find(x=>x.id===m.id+':after');assert.ok(child);assert.equal(child.person,m.person);assert.ok(sent.social.trips.at(-1).people.includes(child.person));assert.match(child.body,new RegExp(keyword));assert.match(child.body,/待ち合わせた場所/);assert.equal(child.due,50);assert.equal(H.nextMessage(sent),null);assert.throws(()=>H.answerMessage(sent,m.id,'continue'));
 sent.week=48;sent.phase='ending';let next=E.continueYear(sent,'enrolled');next=E.migrateGame(JSON.parse(JSON.stringify(next)));assert.equal(H.nextMessage(next),null);next.week=2;assert.equal(H.nextMessage(next).id,child.id);let answered=H.answerMessage(next,child.id,'later');assert.equal(answered.social.messages.filter(x=>x.id.startsWith(m.id+':after')).length,1);assert.equal(answered.cash,next.cash);assert.throws(()=>H.answerMessage(answered,child.id,'later'));
}
let late=start(),m=H.nextMessage(late);late=H.answerMessage(late,m.id,'later');assert.equal(late.social.messages.find(x=>x.id===m.id+':after').due,52);
// No recorded attendee means no relationship change or invented follow-up.
let absent=E.newGame(5);absent.week=3;absent.social.trips=[{key:'test',people:['meme'],place:'公園',category:'街歩き'}];absent.social.messages=[{id:'test:sasami',person:'sasami',due:0,reply:null}];absent=H.answerMessage(absent,'test:sasami','continue');assert.equal(absent.social.messages.length,1);assert.equal(absent.social.bonds.sasami,undefined);
let legacy=E.newGame(6);legacy.social.messages=[{id:'old',due:0,reply:null}];legacy=H.answerMessage(legacy,'old','continue');assert.equal(legacy.social.messages.length,1);
// A full inbox retains every unanswered message when the new reply is queued.
let full=start(),first=H.nextMessage(full);full.social.messages.unshift(...Array.from({length:49},(_,i)=>({id:'unread-'+i,due:10000,reply:null})));full=H.answerMessage(full,first.id,'continue');assert.equal(full.social.messages.length,50);for(let i=0;i<49;i++)assert.ok(full.social.messages.some(x=>x.id==='unread-'+i&&!x.reply));assert.equal(new Set(full.social.messages.map(x=>x.id)).size,50);assert.ok(full.social.messages.some(x=>x.id===first.id+':after'));
let repeated=start(),r=H.nextMessage(repeated);repeated.social.messages.push({...r});const frozen=JSON.stringify(repeated);assert.throws(()=>H.answerMessage(repeated,r.id,'continue'));assert.equal(JSON.stringify(repeated),frozen);
for(const j of [{event:{type:'questioning'}},{criminal:{arrested:true},procedure:{stage:'counsel'}}]){let blocked=start(),id=H.nextMessage(blocked).id;blocked.justice=j;const original=JSON.stringify(blocked);assert.throws(()=>H.answerMessage(blocked,id,'continue'));assert.equal(JSON.stringify(blocked),original);}
let pending=start();pending.pending={kind:'story'};assert.throws(()=>H.answerMessage(pending,pending.social.messages[0].id,'continue'));
console.log('social follow-up: single continuation, attendee evidence, contexts, year rollover, inbox preservation and pending/justice guards passed');
let collision=start(),base=H.nextMessage(collision);collision.social.messages.push({id:base.id+':after',person:base.person,due:100,reply:null});collision=H.answerMessage(collision,base.id,'continue');assert.equal(collision.social.messages.filter(x=>x.id===base.id+':after').length,1);
let noReply=start();noReply.week=47;assert.equal(noReply.social.messages.length,1);assert.equal(H.nextMessage(noReply).id,noReply.social.messages[0].id);
console.log('social follow-up: existing-id collision and optional reply passed');
