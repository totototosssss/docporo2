import {draw} from './exams.js?v=8.3';
import * as Custody from './custody.js?v=8.3';

// A deliberately abstract event: it contains no method, contact or real-world person.
export const JUSTICE_OFFER={amount:50000,blocks:1,questioningBlocks:1,arrestBlocks:2,recoveryCost:5000,recoveryBlocks:1,
 title:'資金の話',description:'違法な行動に関われば、5万円を受け取れる。今週3時間を使い、その後に調査、事情聴取や逮捕につながる可能性がある。',
 warning:'事情聴取には3時間、逮捕された場合はさらに6時間の対応が必要になる。逮捕は有罪を意味しない。'};
export const COUNSEL_OFFER={cost:20000,blocks:1,hearingWait:3,sentenceWeeks:8,description:'相談には3時間と2万円が必要です。相談しない場合も、後日審理があります。結果は約束されません。'};
export const JUSTICE_EVENTS={
 none:{title:'その後の連絡',body:'今のところ連絡はない。手続きの結果が決まったわけではない。'},
 questioning:{title:'事情を聞く連絡',body:'事情を聞く連絡が入った。対応に3時間が必要になる。'},
 arrest:{title:'身柄の拘束',body:'逮捕され、手続きにさらに6時間が必要になる。逮捕は有罪を意味しない。'},
 guilty:{title:'審理の結果',body:'有罪となり、8週間の服役が決まった。'},
 acquitted:{title:'審理の結果',body:'無罪となった。ここからの生活を考える。'},
 release:{title:'出所',body:'刑期を終えた。これからの生活を整えていこう。'}
};
const initial=()=>({action:'available',scheduled:null,caseStatus:'none',exposureDue:null,event:null,criminal:{arrested:false,convicted:null},timeDue:0,lastProcessedWeek:null,recovery:'available',recoveryScheduled:null,history:[]});
const int=x=>Number.isSafeInteger(x)&&x>=0;
const abs=s=>s.yearIndex*48+s.week;
const saved=s=>s.justice??initial();
const newProcedure=()=>({stage:'counsel',counsel:'undecided',scheduled:null,hearingDue:null,verdict:null});
const procedure=j=>j.procedure??(j.criminal.arrested?newProcedure():null);
const clamp=x=>Math.max(0,Math.min(100,x));
const current=(s,p)=>p&&p.year===s.yearIndex&&p.week===s.week;
const date=s=>({year:s.yearIndex,week:s.week});
const lock=s=>{if(s.phase!=='study'||s.pending)throw Error('先に今の出来事を確認してください。');};

export function validateJustice(s){
 const j=s.justice;if(j==null)return true;
 if(!j||typeof j!=='object'||Array.isArray(j)||!['available','scheduled','declined','done'].includes(j.action)||!['none','waiting','unresolved','questioned','arrested'].includes(j.caseStatus)||!['available','scheduled','complete'].includes(j.recovery)||!j.criminal||typeof j.criminal.arrested!=='boolean'||![null,true,false].includes(j.criminal.convicted)||!int(j.timeDue)||j.timeDue>3||!Array.isArray(j.history))return false;
 if(j.lastProcessedWeek!=null&&(!int(j.lastProcessedWeek)||j.lastProcessedWeek>abs(s)))return false;
 const validDate=d=>d&&int(d.year)&&d.year<=s.yearIndex&&int(d.week)&&d.week<=48&&(d.year!==s.yearIndex||d.week<=s.week);
 if(j.scheduled!==null&&!validDate(j.scheduled)||j.action==='scheduled'&&j.scheduled===null||j.action!=='scheduled'&&j.scheduled!==null)return false;
 if(j.recoveryScheduled!==null&&!validDate(j.recoveryScheduled)||j.recovery==='scheduled'&&j.recoveryScheduled===null||j.recovery!=='scheduled'&&j.recoveryScheduled!==null)return false;
 if(!(j.exposureDue===null||int(j.exposureDue))||j.caseStatus==='waiting'&&j.exposureDue===null)return false;
 if(j.event!==null&&(!j.event||!['none','questioning','arrest','guilty','acquitted','release'].includes(j.event.type)||!int(j.event.createdAt)||typeof j.event.arrestAfter!=='boolean'))return false;
 if(j.criminal.arrested!==(j.caseStatus==='arrested'))return false;
 if(j.procedure!=null){const p=j.procedure;if(!p||typeof p!=='object'||!['counsel','counsel-scheduled','hearing','serving','released','acquitted'].includes(p.stage)||!['undecided','scheduled','consulted','declined'].includes(p.counsel)||!(p.hearingDue===null||int(p.hearingDue))||![null,true,false].includes(p.verdict)||!(p.scheduled===null||validDate(p.scheduled)))return false;if((p.stage==='counsel-scheduled')!==(p.counsel==='scheduled')||(p.counsel==='scheduled')!==(p.scheduled!==null))return false;if(p.stage==='hearing'&&p.hearingDue===null)return false;if(['serving','released'].includes(p.stage)&&(p.verdict!==true||j.criminal.convicted!==true)||p.stage==='acquitted'&&(p.verdict!==false||j.criminal.convicted!==false))return false;if(!j.criminal.arrested)return false;if(['counsel','counsel-scheduled','hearing'].includes(p.stage)&&(p.verdict!==null||j.criminal.convicted!==null))return false;if(p.stage==='serving'&&(!['serving','release-pending'].includes(s.custody?.status)||s.phase!=='custody'))return false;if(p.stage==='released'&&s.custody?.status!=='released')return false;if(['guilty','acquitted'].includes(j.event?.type)&&p.stage!=='hearing')return false;if(j.event?.type==='release'&&(p.stage!=='serving'||s.custody?.status!=='release-pending'))return false;}else if(j.criminal.convicted!==null||s.custody&&s.custody.status!=='released')return false;
 if(j.action!=='done'&&(j.caseStatus!=='none'||j.event!==null||j.timeDue!==0))return false;
 return j.history.every(x=>x&&['declined','joined','missed','notice','questioned','arrested','recovered','counsel','counsel-declined','verdict','released'].includes(x.type)&&validDate(x));
}
export function justiceView(state){const j=saved(state);return {offer:JUSTICE_OFFER,action:j.action,caseStatus:j.caseStatus,event:j.event?{type:j.event.type}:null,criminal:{...j.criminal},timeDue:j.timeDue,recovery:j.recovery,procedure:procedure(j)?structuredClone(procedure(j)):null,counselOffer:COUNSEL_OFFER,history:j.history.slice()};}
export function chooseJustice(state,choice){
 lock(state);if(!['decline','participate'].includes(choice))throw Error('選択肢を確認してください。');
 const s=structuredClone(state),j=saved(s);if(j.action!=='available'||j.event)throw Error('この話にはすでに返事をしています。');
 if(choice==='decline'){j.action='declined';j.history.push({type:'declined',...date(s)});}else{j.action='scheduled';j.scheduled=date(s);}s.justice=j;return s;
}
export function scheduleJusticeRecovery(state){
 lock(state);const s=structuredClone(state),j=saved(s);
 if(j.action!=='done'||j.event||j.caseStatus==='waiting'||j.caseStatus==='none'||j.recovery!=='available'||procedure(j)&&!['released','acquitted'].includes(procedure(j).stage))throw Error('今は予定できません。');
 j.recovery='scheduled';j.recoveryScheduled=date(s);s.justice=j;return s;
}
export function cancelJusticePlan(state){
 lock(state);const s=structuredClone(state),j=saved(s);
 if(j.action==='scheduled'){j.action='available';j.scheduled=null;}
 if(j.recovery==='scheduled'){j.recovery='available';j.recoveryScheduled=null;}
 s.justice=j;return s;
}
// Existing mandatory game events take priority; an unresolved notice blocks the next week.
export function justiceBlocked(state){const j=saved(state);if(j.event)return '資金の話の続きがあります。先に確認してください。';if(procedure(j)?.stage==='counsel')return '弁護人への相談をどうするか選んでください。';return null;}
export function scheduleCounsel(state){lock(state);const s=structuredClone(state),j=saved(s),p=procedure(j);if(j.event||!p||p.stage!=='counsel'||j.recovery==='scheduled')throw Error('今は相談を予定できません。');p.stage='counsel-scheduled';p.counsel='scheduled';p.scheduled=date(s);j.procedure=p;s.justice=j;return s;}
export function declineCounsel(state){lock(state);const s=structuredClone(state),j=saved(s),p=procedure(j);if(j.event||!p||p.stage!=='counsel')throw Error('今は選べません。');p.stage='hearing';p.counsel='declined';p.hearingDue=abs(s)+COUNSEL_OFFER.hearingWait;j.procedure=p;j.history.push({type:'counsel-declined',...date(s)});s.justice=j;return s;}
export function cancelCounsel(state){lock(state);const s=structuredClone(state),j=saved(s),p=procedure(j);if(!p||p.stage!=='counsel-scheduled')throw Error('相談の予定はありません。');p.stage='counsel';p.counsel='undecided';p.scheduled=null;j.procedure=p;s.justice=j;return s;}
// Capacity must be the ordinary fixed-commitment capacity BEFORE this deduction.
export function justiceFixedBlocks(state,baseCapacity){return Math.min(saved(state).timeDue,Math.max(0,Math.floor(Number.isFinite(baseCapacity)?baseCapacity:0)));}
export function justiceQuote(state,{freeBlocks=0,availableCash=state.cash}={}){
 const j=saved(state),free=Math.max(0,Math.floor(Number.isFinite(freeBlocks)?freeBlocks:0));
 if(j.event)return {kind:'notice',ready:false,blocks:0,cost:0,reason:justiceBlocked(state)};
 const p=procedure(j);if(p?.stage==='counsel-scheduled'){if(!current(state,p.scheduled))return {kind:'counsel',ready:false,blocks:0,cost:0,reason:'予定した週が過ぎました。'};if(free<COUNSEL_OFFER.blocks)return {kind:'counsel',ready:false,blocks:0,cost:0,reason:'必要な時間を確保できませんでした。'};if(!Number.isFinite(availableCash)||availableCash<COUNSEL_OFFER.cost)return {kind:'counsel',ready:false,blocks:0,cost:0,reason:'手持ちが足りません。'};return {kind:'counsel',ready:true,blocks:COUNSEL_OFFER.blocks,cost:COUNSEL_OFFER.cost,reason:''};}
 if(j.action==='scheduled'){
  if(!current(state,j.scheduled))return {kind:'action',ready:false,blocks:0,cost:0,reason:'予定した週が過ぎました。'};
  if(free<JUSTICE_OFFER.blocks)return {kind:'action',ready:false,blocks:0,cost:0,reason:'必要な時間を確保できませんでした。'};
  return {kind:'action',ready:true,blocks:JUSTICE_OFFER.blocks,cost:0,reason:''};
 }
 if(j.recovery==='scheduled'){
  if(!current(state,j.recoveryScheduled))return {kind:'recovery',ready:false,blocks:0,cost:0,reason:'予定した週が過ぎました。'};
  if(free<JUSTICE_OFFER.recoveryBlocks)return {kind:'recovery',ready:false,blocks:0,cost:0,reason:'必要な時間を確保できませんでした。'};
  if(!Number.isFinite(availableCash)||availableCash<JUSTICE_OFFER.recoveryCost)return {kind:'recovery',ready:false,blocks:0,cost:0,reason:'手持ちが足りません。'};
  return {kind:'recovery',ready:true,blocks:JUSTICE_OFFER.recoveryBlocks,cost:JUSTICE_OFFER.recoveryCost,reason:''};
 }
 return {kind:null,ready:false,blocks:0,cost:0,reason:''};
}
// Applying the weekly result is side-effect free. Caller must pass the ordinary
// capacity before justiceFixedBlocks, and freeBlocks after fixed obligations.
export function advanceJustice(result,before,{freeBlocks=0,baseCapacity=0,preview=false}={}){
 if(preview||before.justice==null)return {state:result,report:null};
 if(before.pending||before.phase!=='study')throw Error('先に今の出来事を確認してください。');
 if(justiceBlocked(before))throw Error(justiceBlocked(before));
 const s=structuredClone(result),j=saved(s),now=abs(before);if(j.lastProcessedWeek===now)return {state:s,report:null};
 const quote=justiceQuote(before,{freeBlocks,availableCash:s.cash});let report=null;j.lastProcessedWeek=now;const proc=procedure(j);if(proc&&!j.procedure)j.procedure=proc;
 j.timeDue=Math.max(0,j.timeDue-justiceFixedBlocks(before,baseCapacity));
 if(quote.kind==='action'){
  j.scheduled=null;
  if(quote.ready){if(!Number.isSafeInteger(s.cash+JUSTICE_OFFER.amount))throw Error('手持ちを確認できません。');s.cash+=JUSTICE_OFFER.amount;j.action='done';j.caseStatus='waiting';j.exposureDue=now+3;j.history.push({type:'joined',...date(before)});report={kind:'joined',text:'資金を受け取った。後の連絡を待つ。',amount:JUSTICE_OFFER.amount,blocks:quote.blocks};}
  else {j.action='available';j.history.push({type:'missed',...date(before)});report={kind:'missed',text:quote.reason,amount:0,blocks:0};}
 }
 if(quote.kind==='recovery'){
  j.recoveryScheduled=null;
  if(quote.ready){s.cash-=quote.cost;j.recovery='complete';s.stress=clamp(s.stress-2);j.history.push({type:'recovered',...date(before)});report={kind:'recovered',text:'生活の予定と支出を整理した。手続きの結果はまだ決まっていない。',cost:quote.cost,blocks:quote.blocks};}
  else {j.recovery='available';report={kind:'missed',text:quote.reason,cost:0,blocks:0};}
 }
 if(quote.kind==='counsel'){const p=j.procedure;p.scheduled=null;if(quote.ready){s.cash-=quote.cost;p.counsel='consulted';p.stage='hearing';p.hearingDue=now+COUNSEL_OFFER.hearingWait;j.history.push({type:'counsel',...date(before)});report={kind:'counsel',text:'弁護人に相談し、今後の予定を確認した。',cost:quote.cost,blocks:quote.blocks};}else{p.counsel='undecided';p.stage='counsel';report={kind:'missed',text:quote.reason,cost:0,blocks:0};}}
 if(j.procedure?.stage==='hearing'&&j.event===null&&now>=j.procedure.hearingDue){const guilty=draw(before.seed,'justice:verdict:'+j.procedure.hearingDue)<.7;j.event={type:guilty?'guilty':'acquitted',createdAt:now,arrestAfter:false};report={kind:'notice',text:'審理の結果が届いた。確認しよう。'};}
 // A newly opened case cannot be processed twice, and its notice never replaces result.pending.
 if(j.caseStatus==='waiting'&&j.event===null&&j.exposureDue!==null&&now>=j.exposureDue){
  const detected=draw(before.seed,'justice:notice:'+j.exposureDue)<.65;
  j.event={type:detected?'questioning':'none',createdAt:now,arrestAfter:detected&&draw(before.seed,'justice:arrest:'+j.exposureDue)<.35};
  j.history.push({type:'notice',...date(before)});report={kind:'notice',text:'資金の話の続きがある。確認しよう。'};
 }
 s.justice=j;return {state:s,report};
}
export function acknowledgeJustice(state){
 if(state.pending||!(state.phase==='study'||state.phase==='custody'&&saved(state).event?.type==='release'))throw Error('先に今の出来事を確認してください。');const s=structuredClone(state),j=saved(s),event=j.event;if(!event)throw Error('確認する出来事はありません。');
 j.event=null;
 if(event.type==='none'){j.caseStatus='unresolved';}
 else if(event.type==='questioning'){
  j.caseStatus='questioned';j.timeDue=Math.min(3,j.timeDue+JUSTICE_OFFER.questioningBlocks);s.stress=clamp(s.stress+3);j.history.push({type:'questioned',...date(s)});
  if(event.arrestAfter)j.event={type:'arrest',createdAt:abs(s),arrestAfter:false};
 }else{
  if(event.type==='arrest'){j.caseStatus='arrested';j.criminal.arrested=true;j.timeDue=Math.min(3,j.timeDue+JUSTICE_OFFER.arrestBlocks);s.stress=clamp(s.stress+3);j.history.push({type:'arrested',...date(s)});j.procedure=newProcedure();}
  else if(event.type==='guilty'||event.type==='acquitted'){const p=procedure(j);if(!p||p.stage!=='hearing')throw Error('審理の記録を確認できません。');const guilty=event.type==='guilty';p.verdict=guilty;p.stage=guilty?'serving':'acquitted';j.procedure=p;j.criminal.convicted=guilty;j.history.push({type:'verdict',...date(s)});s.justice=j;if(guilty)return Custody.enterCustody(s,{weeks:COUNSEL_OFFER.sentenceWeeks});}
  else if(event.type==='release'){const p=procedure(j);if(!p||p.stage!=='serving')throw Error('服役の記録を確認できません。');p.stage='released';j.procedure=p;j.history.push({type:'released',...date(s)});s.justice=j;return Custody.releaseCustody(s);}
 }
 s.justice=j;return s;
}
