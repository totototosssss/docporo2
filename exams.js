// Scores and distributions below are fictional gameplay calibration, never actual admissions predictions.
import {utokyoDepth,utokyoMultiplier,utokyoOutcomePass} from './utokyo-depth.js?v=8.0';
const cap=(x,a=0,b=100)=>Math.max(a,Math.min(b,x));
const sigmoid=x=>1/(1+Math.exp(-x));
export function hashText(t){let h=2166136261;for(const c of t)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
export function draw(seed,key){let x=((seed^hashText(key))+0x6D2B79F5)>>>0;x=Math.imul(x^x>>>15,x|1);x^=x+Math.imul(x^x>>>7,x|61);return (((x^x>>>14)>>>0)+.5)/4294967296;}
const logistic=(seed,key)=>Math.log(draw(seed,key)/(1-draw(seed,key)));
export const CT_WEIGHTS={math:.2,english:.2,physics:.1,chemistry:.1,japanese:.2,social:.1,info:.1};
export function commonSubject(s,id){const x=s.skills[id],row=s.journey.topics[id],coverage=Math.min(...row);return cap(98.2-91*Math.exp(-Math.max(0,x)/49)-Math.max(0,x-coverage)*.10-Math.max(0,45-s.health)*.035,0,98.2);}
export function commonExpected(s){return Object.entries(CT_WEIGHTS).reduce((n,[id,w])=>n+commonSubject(s,id)*w,0);}
export function sitCommon(s,tactic){const shared=logistic(s.seed,'common-day')*.45,scores={};for(const id of Object.keys(CT_WEIGHTS)){const mu=commonSubject(s,id),shake=logistic(s.seed,'common:'+id)*(tactic==='rush'?1.05:.68),bonus=tactic==='check'?.2:0;scores[id]=Math.round(cap(mu+shared+shake+bonus,0,98.8)*10)/10;}return {score:Math.round(Object.entries(CT_WEIGHTS).reduce((n,[id,w])=>n+scores[id]*w,0)*100)/100,scores,mean:commonExpected(s),tactic};}
export const PAPER_MODES={timed:{name:'初見を時間内に解く',hint:'新しい年度。捨て問と時間配分を記録する。'},analysis:{name:'答案を分析・添削する',hint:'取り組んだ答案から、失点の理由を分類する。'},retry:{name:'白紙から解き直す',hint:'分析した年度を、日を置いて再現する。'}};
export function newPapers(){return {mode:'timed',records:[],mastery:{},timing:{},mistakes:{}};}
export function setPaperMode(state,mode){if(!PAPER_MODES[mode])throw Error('過去問の取り組み方を選んでください。');const s=structuredClone(state);s.papers.mode=mode;return s;}
export const paperKey=s=>s.training.focus||s.training.style;
export function paperStep(s,blocks,eff){if(!blocks)return null;const key=paperKey(s),p=s.papers,mode=p.mode,records=p.records.filter(r=>r.key===key),now=s.yearIndex*48+s.week,last=(mode==='analysis'?records.filter(r=>!r.analyzed):mode==='retry'?records.filter(r=>r.analyzed&&!r.retried&&now-r.week>=2):records).at(-1)||records.at(-1);
 if(mode==='timed'){const year=2026+s.yearIndex-records.length,mean=['math','english','physics','chemistry'].reduce((n,id)=>n+s.skills[id],0)/4,score=cap(100*sigmoid((mean-78)/22)*(.72+Math.min(100,s.writing)*.0015)+(draw(s.seed,key+year)-.5)*7,0,98);const r={key,year,week:now,score:Math.round(score),analyzed:false,retried:false,errors:[score<55?'着眼点':'時間配分',s.writing<65?'説明不足':'計算・転記']};p.records.push(r);p.timing[key]=(p.timing[key]||0)+blocks*1.1*eff;p.mistakes[key]=(p.mistakes[key]||0)+blocks*2;p.mastery[key]=(p.mastery[key]||0)+blocks*.8*eff;return {style:s.training.style,ready:true,mode,key,reason:`${year}年度の初見演習。${r.score}点。${r.errors.join('と')}が次の課題。`,record:r};}
 if(!last)return {style:s.training.style,ready:false,mode,key,reason:'まだ答案がない。まず初見の年度を解こう。'};
 if(mode==='analysis'){if(last.analyzed)return {style:s.training.style,ready:false,mode,key,reason:'この答案の分析は済んでいる。日を置いて解き直そう。'};last.analyzed=true;p.mistakes[key]=Math.max(0,(p.mistakes[key]||0)-blocks*3);p.mastery[key]=(p.mastery[key]||0)+blocks*3.1*eff;s.writing+=blocks*.6*eff;return {style:s.training.style,ready:true,mode,key,reason:`${last.year}年度：失点を「知識・方針・計算・時間」に分け、答案を書き直した。`};}
 if(!last.analyzed)return {style:s.training.style,ready:false,mode,key,reason:'解答を覚える前に、最初の答案の失点を分析したい。'};
 if(last.retried||now-last.week<2)return {style:s.training.style,ready:false,mode,key,reason:last.retried?'この年度の解き直しは済んでいる。次の年度へ。':'まだ答えの記憶が新しい。もう少し日を置こう。'};
 last.retried=true;p.mastery[key]=(p.mastery[key]||0)+blocks*4.1*eff;p.timing[key]=(p.timing[key]||0)+blocks*1.4*eff;s.training.proofs[s.training.style]=(s.training.proofs[s.training.style]||0)+1;return {style:s.training.style,ready:true,mode,key,reason:`${last.year}年度を白紙から再現。解答を見ずに方針を立て直した。`};
}
export function paperReadiness(s,school){const p=s.papers;return cap((p.mastery[school.profile]||0)*.65+(p.mastery[school.id]||0)*1.15+(s.groups[school.profile]||0)*.18+(s.prep[school.id]||0)*.10);}
export function secondarySubject(s,id,school){const row=s.journey.topics[id],coverage=Math.min(...row),x=s.skills[id]*.78+coverage*.22;const writing=(s.writing/(s.writing+40)),prep=paperReadiness(s,school)/100;return cap(100*sigmoid((x-78)/22)*(.62+.22*writing+.18*prep));}
export function examForecast(s,school,weights,tactic='steady'){
 const scores=Object.fromEntries(Object.keys(weights).map(id=>[id,secondarySubject(s,id,school)]));const secondary=Object.entries(weights).reduce((n,[id,w])=>n+scores[id]*w,0),ct=s.ct?.score??commonExpected(s),mean=secondary*(1-school.ctShare)+ct*school.ctShare;
 const cut=81.5+(school.difficulty-90)*1.50,prep=paperReadiness(s,school),scale=1.6+Math.max(0,70-prep)*.012-(s.lifestyle.inventory.watch?.12:0);
 const tacticBonus=tactic==='check'?.35:tactic==='attack'?(s.writing-85)*.018:0;
 const interview=.12+.88*sigmoid((s.interview-40)/10),raw=sigmoid((mean+tacticBonus-cut)/scale)*interview;
 return {mean,secondary,ct,scores,cut,scale,probability:raw*utokyoMultiplier(s,school.id),interview,prep,tacticBonus,low:mean-scale*2.2,high:mean+scale*2.2};
}
export const CHANCE_BANDS=[[0,.05,'0–5%','かなり厳しい'],[.05,.15,'5–15%','厳しい'],[.15,.30,'15–30%','挑戦圏'],[.30,.50,'30–50%','届くかどうか'],[.50,.70,'50–70%','十分に勝負できる'],[.70,.85,'70–85%','合格圏が見える'],[.85,.95,'85–95%','有力'],[.95,1.01,'95%以上','非常に有力']];
export function chanceBand(p){return CHANCE_BANDS.find(([a,b])=>p>=a&&p<b)||CHANCE_BANDS[0];}
// These prompts describe game actions, not numeric thresholds or real admissions criteria.
export function utokyoAdvice(s){const q=utokyoDepth(s),advice=[];if(q.breadth<.7)advice.push('国語を含む各科目の単元を見直す');if(q.depth<.7)advice.push('理三の答案を書き、失点を分析する');if(q.reproduction<.7)advice.push('日を置いて、答案を白紙から再現する');if(!q.recentAttempt)advice.push('初見の答案に、時間を決めて取り組む');return advice;}
export function sitSecondary(s,school,weights,tactic){const f=examForecast(s,school,weights,tactic),shared=logistic(s.seed,'exam:'+school.id)*f.scale,score=f.mean+f.tacticBonus+shared,interviewOK=draw(s.seed,'interview:'+school.id)<f.interview,ordinaryPass=score>=f.cut&&interviewOK,depthOK=school.id==='utokyo'?utokyoOutcomePass(s,school.id,true,draw(s.seed,'utokyo-depth')):true,passed=ordinaryPass&&depthOK;return {...f,score,passed,interviewOK,...(school.id==='utokyo'?{depthOK}:{}),subjectScores:Object.fromEntries(Object.entries(f.scores).map(([id,x])=>[id,Math.round(cap(x+shared+logistic(s.seed,school.id+':'+id)*.4))]))};}
