import * as Market from './market.js?v=8.5';
import * as Finance from './finance-system.js?v=8.5';
import * as Housing from './housing.js?v=8.5';
import * as Household from './household.js?v=8.5';
import {ensureAging} from './aging.js?v=8.5';
import * as Memory from './memory.js?v=8.5';

const clone=s=>structuredClone(s), abs=s=>s.yearIndex*48+s.week;
const nonnegative=n=>Number.isSafeInteger(n)&&n>=0;
export function validateCustody(s){
 const c=s.custody;if(c==null)return true;
 if(!c||c.version!==1||!['serving','release-pending','released'].includes(c.status)||!nonnegative(c.sentenceWeeks)||c.sentenceWeeks<1||c.sentenceWeeks>2400||!nonnegative(c.remainingWeeks)||c.remainingWeeks>c.sentenceWeeks||!nonnegative(c.rentArrears)||!(c.lastProcessedWeek===null||nonnegative(c.lastProcessedWeek)&&c.lastProcessedWeek<=abs(s))||!Array.isArray(c.history)||!c.entry||!nonnegative(c.entry.cancelledOrders)||!nonnegative(c.entry.refundedCash)||typeof c.entry.autoStopped!=='boolean'||typeof c.entry.loanStopped!=='boolean'||!nonnegative(c.entry.cancelledCommitments)||!nonnegative(c.entry.cancelledShifts))return false;
 if(c.entry.cancelledHobbyMilestones!==undefined&&(!nonnegative(c.entry.cancelledHobbyMilestones)||c.entry.cancelledHobbyMilestones>1)||c.entry.cancelledRomanceActions!==undefined&&(!nonnegative(c.entry.cancelledRomanceActions)||c.entry.cancelledRomanceActions>1)||c.entry.romanceAutoStopped!==undefined&&typeof c.entry.romanceAutoStopped!=='boolean')return false;
 if(c.status==='serving'&&c.remainingWeeks===0||c.status!=='serving'&&c.remainingWeeks!==0)return false;
 let debt=0,previous=-1,processed=0,lastWeek=null;for(const x of c.history){if(!x||!['week','rent-payment'].includes(x.kind)||!nonnegative(x.year)||!nonnegative(x.week)||x.week>=48)return false;const when=x.year*48+x.week;if(!nonnegative(when)||when>abs(s)||when<previous)return false;previous=when;if(x.kind==='week'){if(lastWeek===when)return false;lastWeek=when;processed++;if(![x.rent,x.paid,x.unpaid,x.rentArrears,x.loanInterest,x.dividend,x.remainingWeeks].every(nonnegative)||x.paid+x.unpaid!==x.rent||!Array.isArray(x.financeEvents)||!Array.isArray(x.notes))return false;debt+=x.unpaid;if(!nonnegative(debt)||x.rentArrears!==debt)return false;}else{if(!nonnegative(x.amount)||x.amount===0||x.amount>debt)return false;debt-=x.amount;}}return debt===c.rentArrears&&processed===c.sentenceWeeks-c.remainingWeeks&&lastWeek===c.lastProcessedWeek;
}
function checked(s){if(!validateCustody(s))throw Error('服役の記録を確認できません。');}
// Existing custody saves can contain appointments created before this rule.
function clearOrdinaryPlans(s){
 const entry=s.custody.entry,hobby=s.hobbyMilestones?.pending?1:0,romance=s.romance?.queued?1:0,automatic=!!s.romance?.auto;
 entry.cancelledHobbyMilestones=Math.max(entry.cancelledHobbyMilestones||0,hobby);entry.cancelledRomanceActions=Math.max(entry.cancelledRomanceActions||0,romance);entry.romanceAutoStopped=!!entry.romanceAutoStopped||automatic;
 if(hobby)s.hobbyMilestones.pending=null;if(s.romance){s.romance.queued=null;s.romance.auto=false;}
}
// Reconcile older or imported custody data before market simulation; no order
// or recurring purchase may execute during a custodial week.
function clearMarketPlans(s){
 const orders=s.market?.orders||[],enabled=!!s.market?.autoInvestment?.enabled;if(!orders.length&&!enabled)return s;
 const refund=orders.reduce((n,o)=>n+(o.side==='buy'?o.reservedCash:0),0),entry=s.custody.entry;
 if(!nonnegative(refund)||!nonnegative(s.cash+refund)||!nonnegative(entry.cancelledOrders+orders.length)||!nonnegative(entry.refundedCash+refund))throw Error('注文の予約金を確認できません。');
 const phase=s.phase,week=s.week,ids=orders.map(o=>o.orderId);s.phase='study';if(week===48)s.week=47;for(const id of ids)s=Market.cancelLimitOrder(s,id);if(enabled)s=Market.stopAutoInvestment(s);s.phase=phase;s.week=week;
 s.custody.entry.cancelledOrders+=ids.length;s.custody.entry.refundedCash+=refund;s.custody.entry.autoStopped=!!s.custody.entry.autoStopped||enabled;return s;
}
export function custodyView(s){checked(s);const c=s.custody;if(!c)return null;return clone(c);}
// The ordinary pending queue and justice notice have to be resolved before entry.
export function enterCustody(state,{weeks}={}){
 checked(state);if(!Number.isSafeInteger(weeks)||weeks<1||weeks>2400)throw Error('期間を確認してください。');
 if(state.phase!=='study'||state.pending||state.justice?.event)throw Error('先に今の出来事を確認してください。');
 if(state.custody)throw Error('服役の記録があります。');
 if(![state.cash,state.spent,state.loan].every(nonnegative))throw Error('資金の記録を確認できません。');
 let s=clone(state),orders=(s.market?.orders||[]).map(o=>o.orderId),refund=(s.market?.orders||[]).reduce((n,o)=>n+(o.side==='buy'?o.reservedCash:0),0),autoStopped=!!s.market?.autoInvestment?.enabled,loanStopped=s.financeSystem?.educationLoan?.status==='lending';
 if(!nonnegative(refund)||!nonnegative(s.cash+refund))throw Error('注文の予約金を確認できません。');
 for(const id of orders)s=Market.cancelLimitOrder(s,id);
 if(autoStopped)s=Market.stopAutoInvestment(s);
 if(loanStopped)s=Finance.stopEducationLoan(s);
 if(s.university.status==='enrolled'){s.university.status='leave';s.university.policy='skip';}
 const until=abs(s)+weeks,commitments=s.journey.commitments.filter(x=>x.week>=s.week&&s.yearIndex*48+x.week<until),shifts=(s.journey.work.bookings||[]).filter(x=>x.year*48+x.week>=abs(s)&&x.year*48+x.week<until);
 s.journey.commitments=s.journey.commitments.filter(x=>!commitments.includes(x));s.journey.work.bookings=(s.journey.work.bookings||[]).filter(x=>!shifts.includes(x));
 if(s.journey.work.contract==='regular')s.journey.work.contract='flex';
 const cancelledHobbyMilestones=s.hobbyMilestones?.pending?1:0,cancelledRomanceActions=s.romance?.queued?1:0,romanceAutoStopped=!!s.romance?.auto;
 if(cancelledHobbyMilestones)s.hobbyMilestones.pending=null;
 if(s.romance){s.romance.queued=null;s.romance.auto=false;}
 s.custody={version:1,status:'serving',sentenceWeeks:weeks,remainingWeeks:weeks,lastProcessedWeek:null,rentArrears:0,history:[],entry:{cancelledOrders:orders.length,refundedCash:refund,autoStopped,loanStopped,cancelledCommitments:commitments.length,cancelledShifts:shifts.length,cancelledHobbyMilestones,cancelledRomanceActions,romanceAutoStopped}};
 s.phase='custody';return s;
}
// Rent is paid only from cash that exists at the start of the week. The unpaid
// remainder is recorded separately; no automatic debt cancellation or clamping.
export function advanceCustodyWeek(state,{preview=false}={}){
 checked(state);const c=state.custody;
 if(!c||c.status!=='serving'||state.phase!=='custody'||state.week>=48)throw Error('今は服役中の週を進められません。');
 if(state.pending||state.justice?.event)throw Error('先に今の出来事を確認してください。');
 if(c.lastProcessedWeek===abs(state))throw Error('この週は処理済みです。');
 if(![state.cash,state.spent,state.loan].every(nonnegative))throw Error('資金の記録を確認できません。');
 let s=clone(state);if(preview)return s;s=clearMarketPlans(s);clearOrdinaryPlans(s);ensureAging(s);
 // Advance the same passive forgetting as an ordinary week with no study or review.
 // There is no catch-up on load: legacy saves begin with their existing memory values.
 Memory.memoryStep(s,s,{}, {methods:{}},1);
 const w=s.week,year=s.yearIndex,now=abs(s),rent=Housing.housingWeeklyCost(s),paid=Math.min(s.cash,rent),unpaid=rent-paid;
 if(!nonnegative(s.custody.rentArrears+unpaid))throw Error('家賃の未払い額を確認できません。');
 if(!nonnegative(s.spent+paid))throw Error('支出の記録を確認できません。');
 s.cash-=paid;s.spent+=paid;s.custody.rentArrears+=unpaid;
 const loanBefore=s.loan;if(s.loan>0)s.loan=Math.round(s.loan*(1+(s.loanType==='consumer'?.15/52:0)));
 if(!nonnegative(s.loan))throw Error('借入の記録を確認できません。');
 const finance=Finance.advanceEducationLoan(s);Object.assign(s,finance.state);
 const marketNotes=Market.marketWeek(s),dividend=(s.market.weekReport.dividends||[]).reduce((n,d)=>n+d.total,0),loanPaid=finance.events.filter(e=>e.kind==='repayment').reduce((n,e)=>n+e.paid,0),loanReceived=finance.events.filter(e=>e.kind==='deposit').reduce((n,e)=>n+e.amount,0);
 const report={week:w,year,kind:'custody',rent,paid,unpaid,rentArrears:s.custody.rentArrears,loanInterest:Math.max(0,s.loan-loanBefore),financeEvents:finance.events,dividend,remainingWeeks:s.custody.remainingWeeks-1,notes:[...marketNotes]};
 s.journey.ledger.push({week:w,year,work:0,payout:0,materials:paid,loanReceived,loanPaid,support:0,loanInterest:report.loanInterest,rentCharged:rent,rentPaid:paid,rentUnpaid:unpaid,cash:s.cash});
 s.custody.remainingWeeks--;s.custody.lastProcessedWeek=now;s.custody.history.push({...report,kind:'week'});
 if(s.custody.remainingWeeks===0)s.custody.status='release-pending';
 s.lastReport=report;s.week++;
 // Queue family developments without dispatching choices that require ordinary life.
 const oldPending=s.pending;s.pending={kind:'custodyDeferred'};Household.advanceHousehold(s);s.pending=oldPending;
 return s;
}
export function releaseCustody(state){
 checked(state);if(state.custody?.status!=='release-pending'||state.pending||state.justice?.event)throw Error('出所の知らせを先に確認してください。');
 let s=clearMarketPlans(clone(state));clearOrdinaryPlans(s);s.custody.status='released';s.phase=s.week===48?'ending':'study';if(s.week===48){s.results=[...(s.examResults||[]),...(s.applications||[]).filter(id=>!(s.examResults||[]).some(r=>r.id===id)).map(id=>({id,score:null,secondary:null,common:null,subjectScores:{},passed:false,missing:[],range:[],reason:'服役期間中のため未受験',week:48}))];s.accepted=s.results.find(r=>r.passed)?.id||null;}return s;
}
export function payRentArrears(state,amount){
 checked(state);if(state.phase!=='study'||state.week>=48||state.pending||state.justice?.event||state.custody?.status!=='released')throw Error('今は家賃の未払いを支払えません。');
 if(![state.cash,state.spent].every(nonnegative)||!Number.isSafeInteger(amount)||amount<=0||amount>state.cash||amount>state.custody.rentArrears||!nonnegative(state.spent+amount))throw Error('支払う金額を確認してください。');
 const s=clone(state);s.cash-=amount;s.spent+=amount;s.custody.rentArrears-=amount;s.custody.history.push({kind:'rent-payment',year:s.yearIndex,week:s.week,amount});return s;
}
