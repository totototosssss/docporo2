// Fictional game-balance model, not a prediction of admission to a real university.
// Derives all evidence from existing save fields; it never changes the state.
const cap=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const sigmoid=x=>1/(1+Math.exp(-x));
const nonnegative=x=>Number.isFinite(x)?Math.max(0,x):0;
const SUBJECTS=['math','english','physics','chemistry','japanese'];

export function utokyoDepth(state){
 const now=Math.max(0,(Number.isInteger(state.yearIndex)?state.yearIndex:0)*48+(Number.isInteger(state.week)?state.week:0));
 const subjectDepth=SUBJECTS.map(id=>{
  const skill=nonnegative(state.skills?.[id]),raw=state.journey?.topics?.[id];
  const units=Array.isArray(raw)?raw.filter(Number.isFinite):[];
  return units.length?Math.min(skill,...units):skill;
 });
 const weakest=Math.min(...subjectDepth),breadth=sigmoid((weakest-180)/30);
 const writing=sigmoid((nonnegative(state.writing)-200)/55);
 const mastery=1-Math.exp(-nonnegative(state.papers?.mastery?.utokyo)/50);
 const depth=Math.sqrt(writing*mastery);
 const rows=Array.isArray(state.papers?.records)?state.papers.records:[];
 const attempts=rows.filter(r=>r&&r.key==='utokyo'&&Number.isInteger(r.week)&&r.week>=0&&r.week<=now);
 const completedWeeks=new Set(attempts.filter(r=>r.analyzed===true&&r.retried===true).map(r=>r.week));
 const reproduction=1-Math.exp(-completedWeeks.size/16);
 const latest=attempts.length?Math.max(...attempts.map(r=>r.week)):null;
 const recentAttempt=latest!==null&&now-latest<=12;
 // The usual .82 factor stays in place; exceptionally broad, deep and repeatedly
 // reproduced preparation can gradually exceed it, without a fixed 82% ceiling.
 const exceptional=sigmoid((weakest-400)/40)*sigmoid((nonnegative(state.writing)-400)/50)*(1-Math.exp(-Math.max(0,nonnegative(state.papers?.mastery?.utokyo)-200)/100))*(1-Math.exp(-Math.max(0,completedWeeks.size-32)/16))*Number(recentAttempt);
 const multiplier=cap((.82+.18*exceptional)*(.15+.85*breadth)*(.15+.85*depth)*(.12+.88*reproduction)*(.75+.25*Number(recentAttempt)));
 return {breadth,depth,reproduction,completed:completedWeeks.size,recentAttempt,multiplier};
}
export function utokyoMultiplier(state,schoolId){return schoolId==='utokyo'?utokyoDepth(state).multiplier:1;}
// Applied to the ordinary exam outcome with an independent deterministic game draw.
export function utokyoOutcomePass(state,schoolId,ordinaryPass,uniform){
 if(!ordinaryPass)return false;
 if(schoolId!=='utokyo')return true;
 if(!Number.isFinite(uniform)||uniform<0||uniform>=1)throw Error('判定値が不正です。');
 return uniform<utokyoMultiplier(state,schoolId);
}
