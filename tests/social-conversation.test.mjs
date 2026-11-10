import assert from 'node:assert/strict';
import * as E from '../engine.js';
import * as H from '../hangouts.js';
import {LIVE_SCENES} from '../open-chat-scenes.js';
for(const topic of ['friends','hobby','exam']){
 const s=E.newGame(20);s.lifestyle.talk=topic;const same=structuredClone(s),count=LIVE_SCENES[topic].length,seen=[];
 for(let i=0;i<count*2;i++){if(i===Math.floor(count/2))s.seed=(s.seed+1)>>>0;const lines=H.liveConversation(s),other=H.liveConversation(same);assert.deepEqual(lines,other);assert.ok(lines.length>=3);assert.equal(new Set(lines.slice(0,3).map(x=>x.id)).size,3);assert.deepEqual(s.social.lastLive.lines,lines);seen.push(lines[0].text);}
 assert.equal(new Set(seen.slice(0,count)).size,count,topic+' should not repeat within a cycle');assert.equal(new Set(seen.slice(count)).size,count);assert.notEqual(seen[count-1],seen[count]);assert.equal(s.social.liveCount,count*2);
}
let legacy=E.newGame(3);legacy.social={seen:['saved-story'],liveCount:4};legacy.pending={kind:'hangout',hangout:{key:'existing'}};const migrated=E.migrateGame(JSON.parse(JSON.stringify(legacy)));assert.deepEqual(migrated.social.seen,['saved-story']);assert.equal(migrated.social.liveCount,4);assert.deepEqual(migrated.social.messages,[]);assert.deepEqual(migrated.pending,legacy.pending);
let complete=E.newGame(4);complete.social.messages=[{id:'old',due:0,reply:'保存済み',answer:'以前の返事'}];complete.social.trips=[{title:'休日の記録'}];const preserved=E.migrateGame(JSON.parse(JSON.stringify(complete)));assert.deepEqual(preserved.social,complete.social);
let damaged=E.newGame(4);damaged.social={messages:'invalid',seen:['keep']};const before=JSON.stringify(damaged);assert.equal(H.validateSocial(damaged),false);assert.throws(()=>H.ensureSocial(damaged),/交流の記録/);assert.equal(JSON.stringify(damaged),before);
for(const mode of ['continue','later']){const examples=new Set();for(let i=0;i<12;i++){const s=E.newGame(100);s.social.messages=[{id:'m'+i,due:0,reply:null}];const before=JSON.stringify(s);const r=H.answerMessage(s,'m'+i,mode);assert.equal(JSON.stringify(s),before);assert.ok(r.social.messages[0].reply);assert.ok(r.social.messages[0].answer);assert.throws(()=>H.answerMessage(r,'m'+i,mode));examples.add(r.social.messages[0].reply);}assert.ok(examples.size>=2,mode+' should have variation');}
console.log('social conversations: distinct room scenes, reply choices, legacy fields and invalid-state preservation passed');
const remembered=E.newGame(10);remembered.week=7;remembered.social.trips=[{key:'0:5',year:0,week:5,place:'公園',people:E.GUESTS.map(x=>x.id),decisions:['歩いて帰る']}];const tripRecord=JSON.stringify(remembered.social.trips);H.liveConversation(remembered);const lines=H.liveConversation(remembered);assert.ok(lines.some(x=>x.text.includes('公園')||x.text.includes('歩いて帰る')||x.text.includes('前に「')));assert.equal(JSON.stringify(remembered.social.trips),tripRecord);
console.log('social conversations: recent participation and conversation affect later dialogue');
// New conversation content does not add a second time or money charge.
const weekly=E.newGame(9);weekly.social.liveCount=6;weekly.lifestyle.talk='exam';let plan=E.blankPlan();plan.counts.talk=1;plan=E.bestSchedule(weekly,plan);const originalWeek=JSON.stringify(weekly),cost=E.costOfPlan(plan,weekly);const preview=E.simulateWeek(weekly,plan,{preview:true});assert.equal(JSON.stringify(weekly),originalWeek);assert.equal(preview.social.liveCount,6);const played=E.simulateWeek(weekly,plan);assert.equal(played.social.liveCount,7);assert.ok(played.social.lastLive.lines.length>=3);assert.equal(played.totals.blocks,1);assert.equal(played.cash,weekly.cash+10000-cost);assert.equal(played.week,weekly.week+1);
console.log('social conversations: forecast, weekly time and cash accounting unchanged');
