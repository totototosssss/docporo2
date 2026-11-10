import {shiftWage} from './journey.js?v=8.2';
// All courses, credit rules, wages and household budgets are fictional game rules.
export const COURSES=[
 {id:'math',name:'微積分・線形代数',credits:3,slots:1,homework:.23,subjects:{math:1}},
 {id:'physics',name:'力学・電磁気学',credits:3,slots:1,homework:.23,subjects:{physics:1}},
 {id:'chemistry',name:'基礎化学',credits:3,slots:1,homework:.23,subjects:{chemistry:1}},
 {id:'lab',name:'理学実験・レポート',credits:3,slots:2,homework:.62,subjects:{physics:.45,chemistry:.45},lab:true},
 {id:'english',name:'科学英語',credits:2,slots:1,homework:.17,subjects:{english:1}},
 {id:'info',name:'情報・データ演習',credits:2,slots:1,homework:.17,subjects:{info:1}}
];
export const JOBS={
 short:{name:'短期バイト',hourly:1300,fatigue:3.8,stress:1.1,description:'催事・軽作業の単発勤務。3時間3,900円。週ごとに働く量を決める。'},
 tutor:{name:'塾講',hourly:2000,fatigue:2.8,stress:1,description:'中学数学の個別指導。3時間6,000円。内職は任意。'}
};
const cap=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const termIndex=w=>w<16?0:w>=24&&w<40?1:null;
const key=(s,t,id)=>`${s.university.grade}:${t}:${id}`;
export function newUniversity(){return {grade:1,status:'enrolled',examPolicy:'sit',policy:'all',focus:'balanced',earned:{},legacyCredits:0,terms:[],current:null,lastPromotion:null};}
export function ensureTerm(s){
 const ti=termIndex(s.week);if(ti===null||s.university.status!=='enrolled')return;
 if(s.university.current?.year===s.yearIndex&&s.university.current?.term===ti)return;
 s.university.current={year:s.yearIndex,term:ti,grade:s.university.grade,weeks:0,closed:false,enrolled:COURSES.filter(c=>!s.university.earned[key(s,ti,c.id)]).map(c=>c.id),stats:Object.fromEntries(COURSES.map(c=>[c.id,{attendance:0,homework:0}]))};
 s.campusDebt=0;
}
export function cloneUniversity(u){return {...u,earned:{...u.earned},terms:[...u.terms],current:u.current?{...u.current,enrolled:[...u.current.enrolled],stats:Object.fromEntries(Object.entries(u.current.stats).map(([id,v])=>[id,{...v}]))}:null};}
export function activeCourses(s){if(termIndex(s.week)===null||s.university.status!=='enrolled'||s.university.current?.closed)return [];return COURSES.filter(c=>s.university.current?.enrolled.includes(c.id));}
export function attends(s,c){return s.university.policy==='all'||s.university.policy==='core'&&['math','lab'].includes(c.id);}
export function lectureSlots(s){return activeCourses(s).filter(c=>attends(s,c)).reduce((n,c)=>n+c.slots,0);}
export function universityCredits(s){return s.university.legacyCredits+Object.values(s.university.earned).reduce((n,v)=>n+v,0);}
export function courseStatus(s,c){
 const t=s.university.current;const recorded=t?.closed?s.university.terms.find(v=>v.year===t.year&&v.term===t.term)?.results.find(v=>v.id===c.id):null;if(recorded)return recorded;
 const st=t?.stats[c.id]||{attendance:0,homework:0},weeks=Math.max(1,t?.weeks||0);
 const attendance=cap(st.attendance/weeks),assignments=cap(st.homework/(c.homework*weeks));
 const mastery=Object.entries(c.subjects).reduce((n,[id,weight])=>n+Math.min(100,s.skills[id])*weight,0)/(Object.values(c.subjects).reduce((a,b)=>a+b,0));
 const grade=mastery*.45+attendance*25+assignments*30;
 const examWeek=s.week===(t?.term===0?15:39),sat=!examWeek||s.university.examPolicy!=='skip',examScore=mastery*.75+assignments*25-Math.max(0,60-s.health)*.2;
 const passed=sat&&examScore>=50&&attendance>=(c.lab?.75:.65)&&assignments>=(c.lab?.7:.4)&&grade>=60;
 return {id:c.id,attendance,assignments,grade,examScore,sat,passed,credits:c.credits,reason:!sat?'試験欠席':examScore<50?'試験の得点不足':attendance<(c.lab?.75:.65)?'出席不足':assignments<(c.lab?.7:.4)?'課題不足':grade<60?'成績不足':'取得圏内'};
}
export function universityStep(s,blocks,eff){
 ensureTerm(s);const cs=activeCourses(s),gains={};if(termIndex(s.week)===null||s.university.status!=='enrolled'){s.campusDebt=0;return {gains,notes:[]};}
 const t=s.university.current,total=cs.reduce((n,c)=>n+c.homework,0),focus=cs.find(c=>c.id===s.university.focus);
 for(const c of cs){const st=t.stats[c.id],present=attends(s,c);st.attendance+=present?1:0;
  const share=cs.length===1?1:focus?(c.id===focus.id?.6:.4*c.homework/Math.max(.01,total-focus.homework)):c.homework/total;
  const homework=Math.min(blocks*share,Math.max(0,c.homework*16-st.homework));st.homework+=homework;
  for(const [id,weight]of Object.entries(c.subjects)){const gain=(.18*(present?1:0)+.32*homework)*weight*eff/(1+Math.max(0,s.skills[id]-65)/70);s.skills[id]=s.skills[id]+gain;gains[id]=(gains[id]||0)+gain;}
  if(c.lab)s.writing=s.writing+homework*.24*eff;
 }
 t.weeks++;s.campusDebt=cs.reduce((n,c)=>n+Math.max(0,c.homework*t.weeks-t.stats[c.id].homework),0);
 const notes=[];
 if([15,39].includes(s.week)){
  const results=cs.map(c=>courseStatus(s,c));let earned=0;
  for(const r of results)if(r.passed&&!s.university.earned[key(s,t.term,r.id)]){s.university.earned[key(s,t.term,r.id)]=r.credits;earned+=r.credits;}
  s.university.terms.push({year:s.yearIndex,grade:s.university.grade,term:t.term,results,earned});t.closed=true;
  s.credits=universityCredits(s);notes.push(`${t.term===0?'前期':'後期'}の成績：${earned}単位取得。${results.filter(r=>!r.passed).length}科目が再履修。`);
 }
 return {gains,notes};
}
export function promotion(s){
 const u=s.university;if(u.status==='graduated')return {earned:0,labs:false,ok:false,label:'卒業済み',nextGrade:u.grade};
 const earned=Object.entries(u.earned).filter(([k])=>k.startsWith(u.grade+':')).reduce((n,[,v])=>n+v,0)+(u.grade===1?u.legacyCredits:0);
 const labs=(u.grade===1&&u.legacyCredits>=24)||Boolean(u.earned[`${u.grade}:0:lab`]&&u.earned[`${u.grade}:1:lab`]);
 const ok=earned>=24&&labs;
 return {earned,labs,ok,label:u.status==='leave'?'休学中':ok?'進級条件を達成':'留年・再履修',nextGrade:u.grade+(ok?1:0)};
}
// The game records yearly progress rather than a real university's degree requirements.
function hasYearEvidence(s,grade){
 const u=s.university,earned=Object.entries(u.earned||{}).filter(([k])=>k.startsWith(grade+':')).reduce((n,[,v])=>n+v,0)+(grade===1?u.legacyCredits||0:0);
 const labs=(grade===1&&(u.legacyCredits||0)>=24)||Boolean(u.earned?.[`${grade}:0:lab`]&&u.earned?.[`${grade}:1:lab`]);
 return earned>=24&&labs||(s.pastYears||[]).some(y=>y.promotion?.ok&&y.promotion.nextGrade===grade+1);
}
export function graduationEligibility(s){
 if(s.university.status==='graduated')return 'graduated';
 if(s.phase!=='ending'||s.university.status!=='enrolled'||s.university.grade<4||!promotion(s).ok)return 'ineligible';
 return [1,2,3].every(grade=>hasYearEvidence(s,grade))?'ready':'missing-history';
}
export function canGraduate(s){return graduationEligibility(s)==='ready';}
export function changeUniversity(state,{policy,focus,enrolled,examPolicy}={}){
 if(state.university.status==='graduated')throw new Error('理学部は卒業しています。');
 if(state.phase!=='study'||state.pending)throw new Error('出来事を確認してから大学の予定を変更してください。');
 const s=JSON.parse(JSON.stringify(state));ensureTerm(s);
 if(examPolicy){if(!['sit','skip'].includes(examPolicy))throw new Error('試験の方針が不正です。');s.university.examPolicy=examPolicy;}
 if(policy){if(!['all','core','skip'].includes(policy))throw new Error('通学方針が不正です。');s.university.policy=policy;}
 if(focus){if(focus!=='balanced'&&!COURSES.some(c=>c.id===focus))throw new Error('課題の科目が不正です。');s.university.focus=focus;}
 if(enrolled){if(![0,1,24,25].includes(s.week)||s.university.status==='leave')throw new Error('履修登録は各学期の最初の2週間です。');if(enrolled.some(id=>!COURSES.some(c=>c.id===id)||s.university.earned[key(s,termIndex(s.week),id)]))throw new Error('履修できない科目です。');s.university.current.enrolled=[...new Set(enrolled)];}
 return s;
}
export function jobError(s,id){if(!JOBS[id])return '仕事が見つかりません。';if(id==='tutor'&&s.skills.math<55)return '中学数学の担当は数学55以上で応募できます。';return null;}
export function changeJob(state,id){const e=jobError(state,id);if(e)throw new Error(e);const s=JSON.parse(JSON.stringify(state));s.job=id;if(id==='short')s.journey.work.contract='flex';return s;}
export function workIncome(s,blocks){return shiftWage(s)*3*blocks;}
