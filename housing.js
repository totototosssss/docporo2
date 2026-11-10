// Housing is an independent game system. Amounts and probabilities are game settings.
export const RENT_DEPOSIT=20000, WEEKLY_RENT=8000;
const clone=s=>structuredClone(s), absolute=s=>s.yearIndex*48+s.week;
function hash(text){let h=2166136261;for(const c of String(text))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
function draw(s,key){return hash(`${s.seed}:${s.yearIndex}:${key}`)/4294967296;}
function active(s){return s.phase==='study'&&!s.pending;}
function fresh(s){return {version:1,status:'housed',remaining:null,lastTick:null,lastRollYear:null,nextEligibleYear:s.yearIndex+1,events:[],crisisWeeks:0,crisisWarned:false,lastMessage:null};}
export function validateHousing(s){
 const h=s.housing;if(h==null)return s.pending?.kind!=='housing';
 if(h.version!==1||!['housed','notice','shelter','rental'].includes(h.status)||!Array.isArray(h.events)||!Number.isInteger(h.crisisWeeks)||h.crisisWeeks<0||typeof h.crisisWarned!=='boolean'||!Number.isInteger(h.nextEligibleYear)||h.nextEligibleYear<0)return false;
 if(h.lastTick!==null&&(!Number.isInteger(h.lastTick)||h.lastTick<0))return false;
 if(h.lastRollYear!==null&&(!Number.isInteger(h.lastRollYear)||h.lastRollYear<0))return false;
 if(h.status==='notice'?!Number.isInteger(h.remaining)||h.remaining<0||h.remaining>4:h.remaining!==null)return false;
 if(h.events.length>4||h.events.some(e=>!e||!['notice','warning','loss','crisis','death'].includes(e.type)||typeof e.id!=='string'||typeof e.dispatched!=='boolean'))return false;
 if(new Set(h.events.map(e=>e.id)).size!==h.events.length)return false;
 const dispatched=h.events.filter(e=>e.dispatched);if(dispatched.length>1)return false;
 if(dispatched.length&&!(s.pending?.kind==='housing'&&s.pending.id===dispatched[0].id))return false;
 if(s.pending?.kind==='housing'&&(!dispatched.length||s.pending.id!==dispatched[0].id))return false;
 return true;
}
export function ensureHousing(s){if(!validateHousing(s))throw Error('住まいの記録が不正です。');if(!s.housing)s.housing=fresh(s);return s.housing;}
export function housingWeeklyCost(s){return s.housing?.status==='rental'?WEEKLY_RENT:0;}
function enqueue(s,type){const h=s.housing;if(!h.events.some(e=>e.type===type))h.events.push({id:`housing:${absolute(s)}:${type}`,type,dispatched:false});}
// Can also be invoked by a future story: a deadline starts only after the notice is read.
export function beginHousingNotice(state){const s=clone(state),h=ensureHousing(s);if(h.status!=='housed'||h.events.some(e=>['notice','warning','loss'].includes(e.type)))throw Error('今は新しい住まいの知らせを追加できません。');enqueue(s,'notice');return s;}
// Call after a committed week. A blocked pending or non-study phase freezes the
// countdown, preserving the chance to respond. Preview never changes state.
export function advanceHousing(state,{preview=false}={}){
 if(preview)return clone(state);
 const s=clone(state),h=ensureHousing(s);if(!active(s))return s;
 const t=absolute(s);
 if(h.lastTick!==t){
  h.lastTick=t;
  if(h.lastRollYear!==s.yearIndex){h.lastRollYear=s.yearIndex;if(h.status==='housed'&&s.yearIndex>=h.nextEligibleYear&&draw(s,'housing-notice')<.015)enqueue(s,'notice');}
  if(h.status==='notice'&&!h.events.some(e=>['notice','warning','loss'].includes(e.type))){h.remaining=Math.max(0,h.remaining-1);if(h.remaining===2)enqueue(s,'warning');if(h.remaining===0)enqueue(s,'loss');}
  if(s.health<15){h.crisisWeeks++;if(h.crisisWeeks>=4&&!h.crisisWarned){h.crisisWarned=true;enqueue(s,'crisis');}if(h.crisisWeeks>=12&&h.crisisWeeks%4===0&&draw(s,`health-crisis:${t}`)<.15)enqueue(s,'death');}
  else{h.crisisWeeks=0;h.crisisWarned=false;h.events=h.events.filter(e=>e.type!=='crisis'&&!(!e.dispatched&&e.type==='death'));}
 }
 const event=h.events.find(e=>!e.dispatched);if(event){event.dispatched=true;s.pending={kind:'housing',id:event.id};}
 return s;
}
const choice=(label,hint)=>({label,hint});
export function housingView(s){
 const h=s.housing,e=h?.events.find(x=>x.dispatched&&x.id===s.pending?.id);if(s.pending?.kind!=='housing'||!e)return null;
 if(e.type==='notice')return {title:'住まいのことで、連絡が来た',body:'今の住まいをこのまま使い続けることが難しくなりそうだ。あと4週間。まずは相談できる。',choices:[choice('無料で相談する','今の住まいを続けられるか確認する。費用・予約なし。'),choice('仕事と資金を確認する','今の仕事を続けながら、後で住まいを考える。'),choice('自費の部屋を確保する',`今すぐ${RENT_DEPOSIT.toLocaleString()}円、以後毎週${WEEKLY_RENT.toLocaleString()}円。`)]};
 if(e.type==='warning')return {title:'住まいの期限が近い',body:`今の住まいを使えるのは、あと${h.remaining}週間。相談と準備を先に進めたい。`,choices:[choice('無料で相談する','費用・予約なし。今の住まいを続けられるか確認。'),choice('仕事を続けて考える','今の契約を維持し、後で決める。'),choice('自費の部屋を確保する',`今すぐ${RENT_DEPOSIT.toLocaleString()}円、以後毎週${WEEKLY_RENT.toLocaleString()}円。`)]};
 if(e.type==='loss')return {title:'今夜の場所を探す',body:'今の住まいの期限が来た。相談して、一時的に過ごせる場所へ移る。',choices:[choice('一時的な居所を確保する','費用なし。仕事と勉強は続けられる。')]};
 if(e.type==='crisis')return {title:'休む時間が必要',body:'体調が厳しい状態が続いている。このまま無理を重ねると、取り返しのつかないこともある。',choices:[choice('無料で相談し、休む','費用・予約なし。体調を整える。'),choice('今は予定を続ける','休養を後回しにする。体調が回復しない場合は危険が続く。')]};
 if(e.type==='death')return {title:'時間が止まる',body:'長く続いた体調の悪化のなかで、ポロを。は亡くなった。積み重ねた日々は、記録に残っている。',choices:[choice('記録を閉じる','この人生の続きを進めることはできません。')]};
 return null;
}
export function chooseHousing(state,index){
 const s=clone(state),h=ensureHousing(s),e=h.events.find(x=>x.dispatched&&x.id===s.pending?.id),v=housingView(s);if(!e||!v?.choices[index])throw Error('今は選べません。');
 if(['notice','warning'].includes(e.type)){
  if(index===0){h.status='housed';h.remaining=null;h.nextEligibleYear=s.yearIndex+3;h.lastMessage='相談し、今の住まいを続けることになった。';}
  else if(index===1){h.status='notice';if(e.type==='notice')h.remaining=4;h.lastMessage='仕事と資金を確認し、住まいは引き続き考える。';}
  else{if(s.cash<RENT_DEPOSIT)throw Error('部屋を確保する費用が足りません。');s.cash-=RENT_DEPOSIT;h.status='rental';h.remaining=null;h.lastMessage='自費の部屋を確保した。次の一週間から家賃がかかる。';}
 }else if(e.type==='loss'){h.status='shelter';h.remaining=null;h.lastMessage='一時的な居所を確保した。相談や仕事を続けられる。';}
 else if(e.type==='crisis'){if(index===0){s.health=Math.min(100,s.health+15);h.crisisWeeks=0;h.crisisWarned=false;h.lastMessage='相談して、休む時間を取った。';}else h.lastMessage='今は予定を続ける。体調に気を配りたい。';}
 else if(e.type==='death'){s.phase='deceased';s.lifeEnd={kind:'health',year:s.yearIndex,week:s.week};h.lastMessage='これまでの日々を記録に残した。';}
 h.events=h.events.filter(x=>x.id!==e.id);s.pending=null;return s;
}
// Available directly from the living screen, without waiting for a random event.
export function housingAction(state,action){
 const s=clone(state),h=ensureHousing(s);if(!active(s))throw Error('先に今の出来事を確認しよう。');
 if(action==='consult'&&h.status==='shelter'){h.status='housed';h.remaining=null;h.nextEligibleYear=s.yearIndex+3;h.lastMessage='相談して、住まいを確保した。';}
 else if(action==='work'&&h.status==='shelter'){h.lastMessage='今の仕事を続けながら、住まいを考える。';}
 else if(action==='rent'&&h.status==='shelter'){if(s.cash<RENT_DEPOSIT)throw Error('部屋を確保する費用が足りません。');s.cash-=RENT_DEPOSIT;h.status='rental';h.lastMessage='自費の部屋を確保した。次の一週間から家賃がかかる。';}
 else if(action==='leave-rental'&&h.status==='rental'){h.status='shelter';h.lastMessage='部屋を離れ、一時的な居所へ移った。';}
 else if(action==='rest'&&h.crisisWeeks>=4){s.health=Math.min(100,s.health+15);h.crisisWeeks=0;h.crisisWarned=false;h.events=h.events.filter(e=>!['crisis','death'].includes(e.type));h.lastMessage='相談して、休む時間を取った。';}
 else throw Error('今はその行動を選べません。');
 return s;
}
