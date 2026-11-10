import {hobbyRestriction} from './world.js?v=8.0';
import * as E from './engine.js?v=8.0';
import {SUBJECTS,ACTIVITIES} from './data.js?v=8.0';
export const WEEK_STYLES=[
 {id:'balanced',name:'受験科目をまんべんなく',short:'全科目',text:'弱い科目を多めに。復習も続ける。'},
 {id:'math',name:'数学を詰め込む',short:'数学集中',text:'まとまった時間で、選んだ単元を深掘り。'},
 {id:'weak',name:'苦手科目を立て直す',short:'苦手集中',text:'一番弱い科目を中心に基礎を積む。'},
 {id:'secondary',name:'答案と過去問を磨く',short:'二次対策',text:'記述・過去問・面接に時間を振り向ける。'},
 {id:'common',name:'共通テストを仕上げる',short:'共テ対策',text:'国語・地歴公民・情報の取りこぼしも拾う。'},
 {id:'university',name:'大学の課題を片づける',short:'大学優先',text:'実験レポートと期末試験の準備を優先。'},
 {id:'work',name:'仕事で資金を作る',short:'仕事優先',text:'働く時間を先に確保。勉強も少し続ける。'},
 {id:'rest',name:'調子を立て直す',short:'休養優先',text:'睡眠と運動。無理を減らして机へ戻る。'}
];
export function preferences(s){return {style:'balanced',work:0,exercise:1,pace:'steady',...s.weekly};}
export function automaticPlan(s,extra={},methods=null){
 const prefs={...preferences(s),...extra},p=E.blankPlan(),c=p.counts,cap=Math.max(0,E.capacity(s));
 const put=(id,n)=>{c[id]=Math.min(4,Math.max(0,Math.min(n,cap-E.planCount(p)+c[id])));};
 let work=Math.max(prefs.style==='work'?3:prefs.work,s.journey.work.contract==='regular'?2:0,(s.journey.work.bookings||[]).filter(x=>x.year===s.yearIndex&&x.week===s.week).reduce((n,x)=>n+x.blocks,0));
 put('work',work);put('campus',E.lectureSlots(s)?prefs.style==='university'?3:2:0);
 put('rest',prefs.style==='rest'?3:s.health<65||prefs.pace==='gentle'?2:1);
 put('exercise',prefs.exercise);put('review',s.debt>9?2:1);
 if(prefs.style==='rest'&&!hobbyRestriction(s))put('hobby',1);
 if(prefs.style==='secondary'){put('past',2);put('writing',2);put('interview',1);}
 if(prefs.style==='balanced'&&s.week>=20){put('writing',1);if(s.week%2)put('past',1);else put('interview',1);}
 const ids=SUBJECTS.map(a=>a.id),weak=ids.slice().sort((a,b)=>s.skills[a]-s.skills[b]);
 const order=prefs.style==='math'?['math','math','math','math',...weak.filter(x=>x!=='math')]:prefs.style==='weak'?[weak[0],weak[0],weak[0],...weak]:prefs.style==='common'?['japanese','social','info','english','math','physics','chemistry']:prefs.style==='secondary'?['english','math','physics','chemistry']:weak;
 const limit=cap-(prefs.pace==='gentle'?1:0);let i=0;
 while(E.planCount(p)<limit&&i<100){const id=order[i++%order.length];if(c[id]<4)c[id]++;}
 for(const a of SUBJECTS)p.methods[a.id]=methods?.[a.id]||(s.skills[a.id]<66?'foundation':s.skills[a.id]<82?'practice':'advanced');
 p.auto={...prefs};return E.bestSchedule(s,p);
}
export function addToPlan(s,old,id,{preserve=[]}={}){
 const p=structuredClone(old),size=['outing','meetup'].includes(id)?E.tripQuote(s).blocks:1;
 if(!Object.hasOwn(p.counts,id))throw Error('予定を選んでください。');
 if(['outing','meetup'].includes(id)&&p.counts[id])throw Error('今週はすでに予定しています。');
 if(id==='outing')p.counts.meetup=0;if(id==='meetup')p.counts.outing=0;
 const maximum=id==='talk'?2:id==='mock'?1:4;
 if(p.counts[id]+size>maximum)throw Error('今週は十分な時間を確保しています。');
 const protectedIds=new Set([id,'work','campus','rest','review','exercise','outing','meetup','checkup',...preserve]);
 while(E.planCount(p)+size>E.capacity(s)){
  const reduce=Object.keys(p.counts).filter(k=>!protectedIds.has(k)&&p.counts[k]>0).sort((a,b)=>p.counts[b]-p.counts[a])[0];
  if(!reduce)throw Error('今週は予定がいっぱいです。予定一覧から一つ取り消してください。');p.counts[reduce]--;
 }
 p.counts[id]+=size;const q=E.bestSchedule(s,p),err=E.validatePlan(s,q);if(err)throw Error(err);return q;
}

// Refit an existing plan after new fixed commitments change the available slots.
// Preserve planned work until every other activity has been considered; outings
// are kept or removed as a whole because their travel time is indivisible.
export function reconcilePlan(s,old){
 const p=structuredClone(old),capacity=E.capacity(s),available=Math.max(0,capacity),before={...p.counts};
 const priority=['math','english','physics','chemistry','japanese','social','info','past','writing','interview','mock','talk','hobby','pachinko','exercise','checkup','campus','review','rest','outing','meetup','work'];
 const ids=ACTIVITIES.map(a=>a.id),flexible=new Set(['math','english','physics','chemistry','japanese','social','info','past','writing','interview','mock','talk','hobby','pachinko']);
 for(const id of ids)p.counts[id]=Math.min(4,Math.max(0,Math.floor(Number(p.counts[id])||0)));
 for(const id of ['outing','meetup'])if(p.counts[id]&&p.counts[id]!==E.tripQuote(s).blocks)p.counts[id]=0;
 if(s.university.status==='graduated')p.counts.campus=0;
 while(E.planCount(p)>available){
  const options=priority.filter(id=>flexible.has(id)&&p.counts[id]>0);options.sort((a,b)=>p.counts[b]-p.counts[a]);
  const id=options[0]||priority.find(id=>p.counts[id]>0)||ids.find(id=>p.counts[id]>0);
  if(!id)break;
  if(['outing','meetup'].includes(id))p.counts[id]=0;else p.counts[id]--;
 }
 const positions=s.sleep==='short'?[0,1,2,3,4,5,6,7,9,10,11,12,13,14,15,16,17,18,19,20]:[0,1,3,4,6,7,9,10,11,12,13,14,15,16,17,18,19,20];
 const order=[0,3,6,9,12,1,4,7,10,13,16,19,11,14,17,20,15,18,2,5].filter(i=>positions.includes(i));
 const reserved=new Set(order.slice(0,Math.max(0,positions.length-available))),free=positions.filter(i=>!reserved.has(i)),schedule={},used=Object.fromEntries(ids.map(id=>[id,0]));
 for(const [key,id] of Object.entries(old.schedule||{})){const i=Number(key);if(String(i)!==key||!free.includes(i)||!ids.includes(id)||used[id]>=p.counts[id])continue;schedule[i]=id;used[id]++;}
 // Fill only the displaced slots; keep the unaffected positions as the player set them.
 const preferred=E.bestSchedule(s,p).schedule;
 for(const [key,id] of Object.entries(preferred)){if(used[id]>=p.counts[id])continue;const i=free.includes(+key)&&!schedule[key]?+key:free.find(x=>!schedule[x]);if(i===undefined)break;schedule[i]=id;used[id]++;}
 for(const id of ids)while(used[id]<p.counts[id]){const i=free.find(x=>!schedule[x]);if(i===undefined)break;schedule[i]=id;used[id]++;}
 p.schedule=schedule;
 const reduced=ids.map(id=>({id,blocks:(Number(before[id])||0)-p.counts[id]})).filter(x=>x.blocks>0);
 const booked=(s.journey.work.bookings||[]).filter(x=>x.year===s.yearIndex&&x.week===s.week).reduce((n,x)=>n+x.blocks,0),requiredWork=Math.max(booked,s.journey.work.contract==='regular'?2:0);
 return {plan:p,reduced,overbookedBy:Math.max(0,-capacity),workShortfall:Math.max(0,requiredWork-p.counts.work)};
}
