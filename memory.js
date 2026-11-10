import {unitBookEffect} from './books.js?v=8.2';
import {subjectTopics,subjectUnits,SOCIAL_TRACKS} from './curriculum.js?v=8.2';
import {agingView} from './aging.js?v=8.2';
// Fictional learning model. Knowledge has no 100-point ceiling.
export const SUBJECT_IDS=['math','english','physics','chemistry','japanese','social','info'];
const copy=x=>structuredClone(x), cap=(x,a,b)=>Math.max(a,Math.min(b,x));
export const absoluteWeek=s=>s.yearIndex*48+s.week;
export function newMemory(s){return {mode:'due',subject:'english',cells:Object.fromEntries(SUBJECT_IDS.map(id=>[id,(s.journey?.topics[id]||[-8,-2,4,6].map(d=>Math.max(1,s.skills[id]+d))).map(value=>({knowledge:value,accessible:value,stability:5,last:absoluteWeek(s),retrievals:0}))])),lastReview:[]};}
export function retention(cell,week){return Math.exp(-Math.max(0,week-cell.last)/(Math.max(2,cell.stability)*8));}
export function memoryQueue(s){const w=absoluteWeek(s);return SUBJECT_IDS.flatMap(id=>s.memory.cells[id].map((c,i)=>({id,i,knowledge:c.knowledge,value:c.accessible,stability:c.stability,age:w-c.last,due:(w-c.last)/Math.max(1,c.stability*.65),retrievals:c.retrievals}))).sort((a,b)=>b.due-a.due);}
export function setReview(state,mode,subject){if(!['due','weak','subject'].includes(mode)||!SUBJECT_IDS.includes(subject))throw Error('復習する範囲を選んでください。');const s=copy(state);s.memory.mode=mode;s.memory.subject=subject;return s;}
export function learnAmount(x,method='foundation'){const base=1.10/(1+Math.max(0,x-65)/82);const match=method==='foundation'?1/(1+Math.exp((x-77)/10)):method==='practice'?Math.exp(-(((x-88)/46)**2)):1/(1+Math.exp(-(x-79)/10));return base*(.18+1.12*match);}
export function syncMemory(s){for(const id of SUBJECT_IDS){s.journey.topics[id]=s.memory.cells[id].map(c=>c.accessible);s.skills[id]=s.journey.topics[id].reduce((n,x)=>n+x,0)/s.journey.topics[id].length;}}
export function memoryStep(s,before,counts,plan,eff,external={}){
 const w=absoluteWeek(s),m=s.memory,reviewed=[],forgettingFactor=agingView(s).forgettingFactor;
 for(const id of SUBJECT_IDS){const focus=s.journey.focus[id],n=counts[id]||0,days=plan.schedule?new Set(Object.entries(plan.schedule).filter(([,a])=>a===id).map(([k])=>Math.floor(+k/3))).size:Math.min(3,n),factor=days>1?1.07:1;
  m.cells[id].forEach((cell,i)=>{const units=subjectUnits(s,id),group=units[Number(focus)]?.group,members=units.filter(u=>u.group===group).length;const raw=j=>j===Number(focus)?4:units[j]?.group===group?1.7:.65,totalWeight=units.reduce((sum,_,j)=>sum+raw(j),0);const weight=focus==='balanced'?1:raw(i)*m.cells[id].length/totalWeight;const bookEffect=unitBookEffect(s,plan.books?.[id],i,plan.methods[id]);const gain=learnAmount(cell.knowledge,plan.methods[id])*n*weight*eff*factor*(1+(plan.boost?.[id]||0)+bookEffect.boost)*(1-Math.max(0,n-2)*.12);const ext=Math.max(0,external[id]||0);
   if(n||ext){const age=w-cell.last;cell.knowledge+=gain+ext;cell.accessible+=(cell.knowledge-cell.accessible)*Math.min(.94,.42+n*.22)+gain*.1;cell.accessible=Math.min(cell.knowledge,cell.accessible);if(age>=1&&n){cell.stability=Math.min(110,cell.stability*(1+.07*Math.min(age,5)+bookEffect.stability)+.15);cell.retrievals++;}cell.last=w;}
   else cell.accessible=Math.max(0,cell.accessible*Math.exp(-forgettingFactor/(Math.max(2,cell.stability)*8)));
   if(w-cell.last>14)cell.knowledge*=.999;
  });
 }
 let queue=memoryQueue(s);if(m.mode==='weak')queue.sort((a,b)=>a.value-b.value);if(m.mode==='subject')queue=queue.filter(x=>x.id===m.subject);
 const budget=(counts.review||0)*Math.ceil(Object.values(m.cells).reduce((n,row)=>n+row.length,0)/6);
 for(const q of queue.slice(0,budget)){const cell=m.cells[q.id][q.i],age=w-cell.last;if(age>0){const recover=cell.knowledge-cell.accessible;cell.accessible+=recover*.85;cell.stability=Math.min(160,cell.stability*(1.20+Math.min(age,10)*.022)+.3);cell.retrievals++;cell.last=w;reviewed.push({...q,recovered:recover*.85});}}
 m.lastReview=reviewed;syncMemory(s);return reviewed;
}
export function bridgeMemory(s,before){for(const id of SUBJECT_IDS){const d=s.skills[id]-before[id];if(d>0)for(const c of s.memory.cells[id]){c.knowledge+=d;c.accessible+=d;}}syncMemory(s);}
export function longBreak(s,weeks=3){for(const row of Object.values(s.memory.cells))for(const c of row){c.accessible*=Math.exp(-weeks/(Math.max(2,c.stability)*8));c.last-=weeks;}syncMemory(s);}

export function migrateMemory(s){for(const id of SUBJECT_IDS){const count=subjectTopics(s,id).length,old=s.memory.cells[id];if(old.length===count)continue;const average=old.reduce((n,c)=>n+c.accessible,0)/old.length;const row=Array.from({length:count},(_,i)=>({...old[Math.floor(i*old.length/count)]}));const delta=average-row.reduce((n,c)=>n+c.accessible,0)/count;for(const c of row){c.accessible+=delta;c.knowledge+=delta;}s.memory.cells[id]=row;s.journey.focus[id]='balanced';}syncMemory(s);return s;}
export function setSocialTrack(state,track){if(!SOCIAL_TRACKS[track])throw Error('地歴公民の科目を選んでください。');if(state.phase!=='study'||state.pending)throw Error('出来事を確認してから選ぼう。');if(state.registered)throw Error('共通テスト登録後は地歴公民を変更できません。');const s=copy(state);s.curriculum=s.curriculum||{social:'geo',banks:{}};s.curriculum.banks=s.curriculum.banks||{};s.curriculum.banks[s.curriculum.social]=s.memory.cells.social;s.curriculum.social=track;s.memory.cells.social=s.curriculum.banks[track]||subjectTopics(s,'social').map(()=>({knowledge:32,accessible:32,stability:5,last:absoluteWeek(s),retrievals:0}));s.journey.focus.social='balanced';syncMemory(s);return s;}
