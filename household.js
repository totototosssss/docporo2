// All household members and event weights are game state; no real-world predictions.
const hash=value=>{let h=2166136261;for(const c of String(value))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
const copy=value=>JSON.parse(JSON.stringify(value));
const names={parent_a:'母',parent_b:'父',sibling_a:'きょうだい',sibling_b:'もう一人のきょうだい'};
// The game's fictional first-year reference age is 21; it does not describe the player.
const siblingNames=new Set(['きょうだい','もう一人のきょうだい','兄','姉','弟','妹']);
const siblingName=p=>p.ageAtStart===21?'きょうだい':p.ageAtStart>21?(p.gender==='male'?'兄':'姉'):(p.gender==='male'?'弟':'妹');
function displayName(h,p){if(p.role!=='sibling')return names[p.id]||'家族';const label=siblingNames.has(p.name)?p.name:'きょうだい';const first=h.people.find(x=>x.id==='sibling_a');return p.id==='sibling_b'&&first&&first.name===label&&label!=='もう一人のきょうだい'?`もう一人の${label}`:label;}
const now=s=>s.yearIndex*48+s.week;
const living=(h,id)=>h.people.find(p=>p.id===id&&p.alive);
const pairAlive=h=>living(h,'parent_a')&&living(h,'parent_b');
const idRole={parent_a:'parent',parent_b:'parent',sibling_a:'sibling',sibling_b:'sibling'};
function pendingHousehold(p){
 const seen=new Set();let found=null,depth=0;
 while(p&&typeof p==='object'&&!Array.isArray(p)&&depth++<40&&!seen.has(p)){seen.add(p);if(p.kind==='household'){if(found)return {invalid:true};found=p;}p=p.next;}
 if(p)return {invalid:true};return found;
}
// Legacy saves without a household are valid unless a household dialog claims
// to be open. Invalid new state is rejected, never silently regenerated.
export function validateHousehold(s){
 if(!s||!Number.isSafeInteger(s.yearIndex)||s.yearIndex<0||!Number.isInteger(s.week)||s.week<0||s.week>48)return false;
 const pending=pendingHousehold(s.pending);if(pending?.invalid)return false;
 const h=s.household;if(h==null)return !pending;
 if(!h||typeof h!=='object'||Array.isArray(h)||h.version!==1||!Array.isArray(h.people)||h.people.length<2||h.people.length>4||!Array.isArray(h.history)||h.history.length>60)return false;
 if(!['together','separated','widowed'].includes(h.partnership)||!Number.isInteger(h.nextEligibleYear)||h.nextEligibleYear<0||!(h.lastRollYear===null||Number.isInteger(h.lastRollYear)&&h.lastRollYear>=0&&h.lastRollYear<=s.yearIndex))return false;
 const ids=new Set();for(const p of h.people){if(!p||!idRole[p.id]||ids.has(p.id)||(p.role==='parent'?p.name!==names[p.id]:!siblingNames.has(p.name))||p.role!==idRole[p.id]||typeof p.alive!=='boolean'||!['stable','needs-care','deceased'].includes(p.health))return false;ids.add(p.id);
  if(p.ageAtStart!==undefined&&(!Number.isInteger(p.ageAtStart)||p.ageAtStart<1||p.ageAtStart>100))return false;
  if(p.role==='sibling'&&p.gender!==undefined&&!['male','female'].includes(p.gender))return false;
  if(p.role==='sibling'&&p.ageAtStart!==undefined&&p.gender!==undefined&&['兄','姉','弟','妹'].includes(p.name)&&p.name!==siblingName(p))return false;
  if(p.alive&&p.health==='deceased'||!p.alive&&(p.health!=='deceased'||!Number.isSafeInteger(p.deathAt)||p.deathAt<0||p.deathAt>now(s)))return false;
 }
 if(!ids.has('parent_a')||!ids.has('parent_b')||ids.has('sibling_b')&&!ids.has('sibling_a'))return false;
 const deaths=new Set();for(const x of h.history){if(!x||typeof x!=='object'||typeof x.id!=='string'||x.id.length>120||!['health','separation','unavailable'].includes(x.kind)||!Number.isSafeInteger(x.at)||x.at<0||x.at>now(s))return false;
  if(x.kind==='health'){if(!ids.has(x.actor)||!['recovered','ongoing','death'].includes(x.outcome))return false;if(x.outcome==='death'){if(deaths.has(x.actor)||h.people.find(p=>p.id===x.actor).alive)return false;deaths.add(x.actor);}}
  if(x.kind==='separation'&&x.outcome!=='separated')return false;
 }
 const e=h.episode;if(e!=null){if(!e||typeof e!=='object'||typeof e.id!=='string'||!e.id||e.id.length>120||!['health','separation'].includes(e.kind)||!['start','followup'].includes(e.stage)||!Number.isSafeInteger(e.due)||e.due<0||!(e.dispatched===undefined||typeof e.dispatched==='boolean'))return false;
  if(e.kind==='health'&&(!living(h,e.actor)||!['recovered','ongoing','death'].includes(e.outcome)))return false;
  if(e.kind==='separation'&&(e.actor!==null||e.outcome!=='separated'||h.partnership!=='together'||!pairAlive(h)))return false;
  if(pending&&(pending.episodeId!==e.id||e.dispatched===false||e.due>now(s)))return false;
  if(e.dispatched===true&&!pending)return false;
 }else if(pending)return false;
 return true;
}
function initialAge(s,p){const siblingAges=[18,19,20,22,23,24,25,26,27];return p.role==='parent'?48+hash(`${s.seed}:${p.id}:age`)%10:siblingAges[hash(`${s.seed}:${p.id}:age`)%siblingAges.length];}
function fillPerson(s,p){if(p.ageAtStart===undefined)p.ageAtStart=initialAge(s,p);if(p.role==='sibling'){if(p.gender===undefined)p.gender=hash(`${s.seed}:${p.id}:gender`)%2?'male':'female';p.name=siblingName(p);}}
// Coarse game weights loosely reflect the age gradient in the 2025 MHLW life
// tables (https://www.mhlw.go.jp/content/12602000/001749652.pdf). These are not
// individual forecasts or a reproduction of population rates: the game permits
// only one episode at a time and applies a cooldown. Ages are fictional.
function mortalityWeight(age){return age<30?.00035:age<40?.0005:age<50?.001:age<60?.002:age<70?.005:age<80?.015:age<90?.05:age<100?.13:.25;}
const draw=key=>hash(key)/4294967296;
export function ensureHousehold(s){
 if(!validateHousehold(s))throw Error('家族の記録が不正です。');
 if(s.household?.version===1){const h=s.household;for(const p of h.people)fillPerson(s,p);if(h.episode&&h.episode.dispatched===undefined)h.episode.dispatched=!!pendingHousehold(s.pending);if(h.partnership==='together'&&!pairAlive(h))h.partnership='widowed';return h;}
 const n=hash(`${s.seed}:siblings`)%100,count=n<45?0:n<90?1:2;
 const people=[{id:'parent_a',name:'母',role:'parent',alive:true,health:'stable'},{id:'parent_b',name:'父',role:'parent',alive:true,health:'stable'}];
 if(count>0)people.push({id:'sibling_a',name:'きょうだい',role:'sibling',alive:true,health:'stable'});
 if(count>1)people.push({id:'sibling_b',name:'もう一人のきょうだい',role:'sibling',alive:true,health:'stable'});
 for(const p of people)fillPerson(s,p);
 s.household={version:1,people,partnership:'together',episode:null,history:[],lastRollYear:null,nextEligibleYear:s.yearIndex+1};
 return s.household;
}
function scheduleAnnual(s,h){
 const year=s.yearIndex;if(h.lastRollYear===year)return;h.lastRollYear=year;
 if(year<h.nextEligibleYear||h.episode)return;
 const adults=h.people.filter(p=>p.alive);
 // The age gradient is a game assumption, independent of player choices and
 // unrelated to an individual's diagnosis or survival prediction.
 const death=adults.find(p=>draw(`${s.seed}:${year}:death:${p.id}`)<mortalityWeight(p.ageAtStart+year));
 const r=draw(`${s.seed}:${year}:household-event`),divorce=!death&&r<.02&&h.partnership==='together'&&pairAlive(h);
 if(!death&&!divorce&&(r>=.10||!adults.length))return;
 const weighted=adults.flatMap(p=>Array((p.ageAtStart+year)<40?1:(p.ageAtStart+year)<60?2:3).fill(p));
 const actor=divorce?null:death||weighted[hash(`${s.seed}:${year}:household-person`)%weighted.length];
 if(!divorce&&!actor)return;
 const outcome=divorce?'separated':death?'death':draw(`${s.seed}:${year}:household-outcome`)<.7?'recovered':'ongoing';
 const due=Math.max(now(s)+1,year*48+8+hash(`${s.seed}:${year}:household-week`)%25);
 h.episode={id:`household:${year}:${divorce?'separation':actor.id}`,kind:divorce?'separation':'health',stage:'start',actor:actor?.id||null,outcome,due,dispatched:false};
}
// Call only after all normal pending events have been queued. Returns true if a
// household event was set. A busy queue defers rather than discarding the episode.
export function advanceHousehold(s,{preview=false}={}){
 if(preview)return false;
 const h=ensureHousehold(s);scheduleAnnual(s,h);const e=h.episode;
 if(!e||s.pending||e.due>now(s))return false;
 if((e.kind==='health'&&!living(h,e.actor))||(e.kind==='separation'&&(!pairAlive(h)||h.partnership!=='together'))){h.episode=null;h.history.push({id:e.id,kind:'unavailable',at:now(s)});return false;}
 e.dispatched=true;s.pending={kind:'household',episodeId:e.id};return true;
}
const choice=(label,hint,after,commitment=null)=>({label,hint,after,...(commitment?{commitment}:{})});
export function householdView(s){
 const h=s.household,e=h?.episode;if(s.pending?.kind!=='household'||!e||s.pending.episodeId!==e.id)return null;
 const actor=e.kind==='health'?living(h,e.actor):null;if(e.kind==='health'&&!actor)return null;const name=actor?displayName(h,actor):'';
 if(e.kind==='health'&&e.stage==='start')return {title:`${name}の近況`,image:'peek',body:`${name}から、体調が気になって相談に行くと連絡が来た。${e.outcome==='death'||e.outcome==='ongoing'?'しばらく検査が続くという。':'詳しいことはまだ分かっていない。'}`,lines:[[name,'分かったら、また連絡するね。']],choices:[
  choice('話す時間を取る','次の一週間に3時間。時間を決めて話を聞く。','話す時間を決めた。詳しいことは、連絡が来てから聞く。',{name:`${name}と話す`,blocks:1,effect:{}}),
  choice('返事だけして、連絡を待つ','今は予定に時間を追加しない。','無理に答えを求めず、連絡を待つと返した。'),
  choice('自分の予定も整理しておく','今は予定に時間を追加しない。','決まっている予定を確認し、今できることを一つずつ分けた。')
 ]};
 if(e.kind==='separation'&&e.stage==='start')return {title:'家族からの連絡',image:'peek',body:'母と父から、これからの暮らし方を話し合っていると聞いた。まだ決まっていないこともある。',lines:[['家族','決まったことから伝えるね。']],choices:[
  choice('話を聞く時間を取る','次の一週間に3時間。分かっていることを聞く。','分かっていることを聞く時間を取ることにした。',{name:'家族の話を聞く',blocks:1,effect:{}}),
  choice('今は連絡を待つ','今は予定に時間を追加しない。','決まったことを後で知らせてほしいと伝えた。'),
  choice('自分の予定を見直す','今は予定に時間を追加しない。','今週の予定を書き出した。家族の話は、続きを聞いてから考える。')
 ]};
 if(e.kind==='health'&&e.stage==='followup'){
  const body=e.outcome==='death'?`${name}が亡くなったと連絡があった。言葉にする前に、今聞いたことを受け止める。`:e.outcome==='ongoing'?`${name}は診察を受け、しばらく治療を続けることになった。今は分かっている範囲の話を聞く。`:`${name}から、いったん普段どおりの生活に戻れそうだと連絡が来た。`;
  return {title:`${name}についての知らせ`,image:e.outcome==='death'?'sad':'peek',body,lines:[],choices:[choice('今は話を聞く','今は予定に時間を追加しない。','すぐに結論を出さず、聞いたことを受け止めた。'),choice('一人で少し考える','今は予定に時間を追加しない。','すぐに言葉にならないまま、今日は静かに過ごした。')]};
 }
 if(e.kind==='separation'&&e.stage==='followup')return {title:'それぞれの暮らし',image:'peek',body:'母と父から、離婚して別々に暮らすことになったと聞いた。これからの連絡方法を少しずつ確かめていく。',lines:[],choices:[choice('今分かることを聞く','今は予定に時間を追加しない。','これからの連絡先と、まだ決まっていないことを分けた。'),choice('一度、自分で考える','今は予定に時間を追加しない。','今すぐ返事をまとめず、今日は自分の時間を取った。')]};
 return null;
}
export function chooseHousehold(state,index){
 if(!validateHousehold(state))throw Error('家族の記録が不正です。');
 const s=copy(state),h=s.household,e=h?.episode,view=householdView(s),c=view?.choices[index];
 if(!e||!c)throw Error('今は選べません。');
 if(c.commitment)s.journey.commitments.push({...copy(c.commitment),week:s.week});
 const next=s.pending.next||null;let cancelledNow=0,cancelledLater=0;
 if(e.stage==='start'){
  e.stage='followup';e.due=now(s)+4;e.dispatched=false;
 }else{
  if(e.kind==='health'){
   const person=living(h,e.actor);if(!person)throw Error('この知らせは確認済みです。');
   if(e.outcome==='death'){
    person.alive=false;person.health='deceased';person.deathAt=now(s);if(person.role==='parent'&&h.partnership==='together')h.partnership='widowed';
    if(!h.people.some(p=>p.alive)){
     const familyName=/家族|母|父|きょうだい|兄|姉|弟|妹/;
     const isFamilyCommitment=x=>!!x.familyCompletion||!!x.effect?.family||familyName.test(String(x.name||''));
     s.journey.commitments=s.journey.commitments.filter(x=>{if(x.week>=s.week&&isFamilyCommitment(x)){if(x.week===s.week)cancelledNow+=x.blocks*3;else cancelledLater+=x.blocks*3;return false;}return true;});
     for(const echo of s.journey.echoes||[]){
      const record=(s.journey.narrative||[]).find(n=>String(echo.id).startsWith(`${n.id}:${n.year}:`));
      if(!echo.done&&(String(echo.id).startsWith('family:')||familyName.test(String(echo.body))||(record&&familyName.test(String(record.choice)))))echo.body='以前の会話を思い出した。';
     }
    }
   }
   else person.health=e.outcome==='ongoing'?'needs-care':'stable';
  }else{
   if(!pairAlive(h)||h.partnership!=='together')throw Error('この知らせは確認済みです。');
   h.partnership='separated';h.separatedAt=now(s);
  }
  h.history.push({id:e.id,kind:e.kind,actor:e.actor,outcome:e.outcome,at:now(s)});h.history=h.history.slice(-60);h.episode=null;h.nextEligibleYear=s.yearIndex+3;
 }
 const after=c.after+(cancelledNow||cancelledLater?` 家族との予定を取り消しました。${cancelledNow?`今週の${cancelledNow}時間が空いています。予定を確認できます。`:''}${cancelledLater?`今後の予定から${cancelledLater}時間を取り消しました。`:''}`:'');
 s.world.journal.push({title:view.title,text:after,image:view.image,week:s.week,year:s.yearIndex});s.world.journal=s.world.journal.slice(-180);
 s.pending={kind:'afterStory',title:'選んだ言葉の、あと',body:after,choice:c.label,image:view.image,next};
 return s;
}
