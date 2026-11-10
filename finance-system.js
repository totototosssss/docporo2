// A game-specific education loan; no real institution or eligibility is modeled.
const copy=s=>structuredClone(s);
const monthOf=s=>s.yearIndex*12+Math.floor(Math.min(s.week,47)/4);
const OFFERS={interestFree:{monthly:30000,annualRate:0},interestBearing:{monthly:50000,annualRate:.015}};
export const EDUCATION_LOAN_OFFERS=Object.freeze(Object.fromEntries(Object.entries(OFFERS).map(([id,o])=>[id,Object.freeze({...o,maxMonths:24,repaymentMonths:60,graceMonths:6})])));
function loanOf(s){return s.financeSystem?.educationLoan||null;}
export function validateFinanceSystem(s){
 if(s.financeSystem==null)return true;
 if(typeof s.financeSystem!=='object'||Array.isArray(s.financeSystem))return false;
 if(s.financeSystem.educationLoan==null)return true;
 if(typeof s.financeSystem.educationLoan!=='object'||Array.isArray(s.financeSystem.educationLoan))return false;
 const l=loanOf(s),o=Object.hasOwn(EDUCATION_LOAN_OFFERS,l.offer)?EDUCATION_LOAN_OFFERS[l.offer]:null,nonnegative=x=>Number.isSafeInteger(x)&&x>=0;
 if(!o||!['lending','waiting','repaying','settled'].includes(l.status)||l.monthly!==o.monthly||l.annualRate!==o.annualRate)return false;
 if(!['principal','interest','lateFees','arrearsPrincipal','paidOut','paid','monthsPaid','startedMonth','lastProcessedMonth','remainingPayments','reliefMonthsUsed'].every(k=>nonnegative(l[k])))return false;
 if(l.monthsPaid>24||l.paidOut!==l.monthsPaid*l.monthly||l.principal>l.paidOut||l.arrearsPrincipal>l.principal||l.remainingPayments>60||l.reliefMonthsUsed>36||l.startedMonth>l.lastProcessedMonth||l.lastProcessedMonth>monthOf(s))return false;
 if(!['endedMonth','nextDueMonth','reliefStarts','reliefUntil'].every(k=>l[k]===null||nonnegative(l[k])))return false;
 if((l.reliefStarts===null)!==(l.reliefUntil===null)||l.reliefStarts!==null&&l.reliefUntil-l.reliefStarts!==3)return false;
 if(l.status==='lending'&&(l.endedMonth!==null||l.nextDueMonth!==null)||l.status!=='lending'&&l.endedMonth===null||l.status==='settled'&&(l.principal||l.interest||l.lateFees||l.nextDueMonth!==null))return false;
 return true;
}
function check(s){if(!validateFinanceSystem(s))throw Error('貸与の記録を確認できません。');}
function amount(n){if(!Number.isSafeInteger(n)||n<=0)throw Error('返済額を確認してください。');return n;}
function canUse(s){if(s.phase!=='study'||s.pending)throw Error('今の出来事を確認してから手続きしてください。');}
function endLending(l,month){l.status=l.principal?'waiting':'settled';l.endedMonth=month;l.nextDueMonth=l.principal?month+7:null;l.remainingPayments=l.principal?60:0;}
function pay(l,cash,limit){
 let left=Math.min(cash,limit,l.principal+l.interest+l.lateFees),paid=left;
 const fees=Math.min(left,l.lateFees);l.lateFees-=fees;left-=fees;
 const interest=Math.min(left,l.interest);l.interest-=interest;left-=interest;
 const overdue=Math.min(left,l.arrearsPrincipal);l.arrearsPrincipal-=overdue;l.principal-=overdue;left-=overdue;
 const extra=Math.min(left,l.principal);l.principal-=extra;left-=extra;
 if(!l.principal&&!l.interest&&!l.lateFees){l.status='settled';l.nextDueMonth=null;l.remainingPayments=0;l.arrearsPrincipal=0;}
 return paid-left;
}
export function educationLoanView(s){
 check(s);
 const l=loanOf(s);if(!l)return null;
 return {...copy(l),balance:l.principal+l.interest+l.lateFees,totalOverdue:l.arrearsPrincipal+l.interest+l.lateFees};
}
export function quoteEducationLoan(s,id){
 check(s);
 const offer=Object.hasOwn(EDUCATION_LOAN_OFFERS,id)?EDUCATION_LOAN_OFFERS[id]:null;if(!offer)throw Error('貸与の種類を選んでください。');
 const reason=s.phase!=='study'||s.pending?'今の出来事を確認してください。':s.university?.status!=='enrolled'?'在学中に申し込めます。':loanOf(s)?'貸与契約は一人一件です。':null;
 let principal=offer.monthly*offer.maxMonths,total=0,first=0;
 for(let remaining=offer.repaymentMonths;remaining>0;remaining--){const principalPart=Math.ceil(principal/remaining),payment=principalPart+Math.round(principal*offer.annualRate/12);if(!first)first=payment;total+=payment;principal-=principalPart;}
 return {id,...offer,totalMaximum:offer.monthly*offer.maxMonths,firstDepositMonth:monthOf(s)+1,firstRepaymentMonthOffset:7,exampleFirstPayment:first,exampleTotalPayment:total,lateFeeMonthlyRate:.0025,reliefMonthsPerRequest:3,maxReliefMonths:36,reliefCashLimit:30000,available:!reason,reason};
}
export function startEducationLoan(state,id){
 canUse(state);const q=quoteEducationLoan(state,id);if(!q.available)throw Error(q.reason);
 const s=copy(state),m=monthOf(s);s.financeSystem=s.financeSystem||{};
 s.financeSystem.educationLoan={offer:id,status:'lending',monthly:q.monthly,annualRate:q.annualRate,principal:0,interest:0,lateFees:0,arrearsPrincipal:0,paidOut:0,paid:0,monthsPaid:0,startedMonth:m,lastProcessedMonth:m,endedMonth:null,nextDueMonth:null,remainingPayments:0,reliefStarts:null,reliefUntil:null,reliefMonthsUsed:0};return s;
}
export function stopEducationLoan(state){
 canUse(state);check(state);const s=copy(state),l=loanOf(s);if(!l||l.status!=='lending')throw Error('貸与中の契約がありません。');endLending(l,monthOf(s));return s;
}
export function requestLoanRelief(state){
 canUse(state);check(state);const s=copy(state),l=loanOf(s),m=monthOf(s);if(!l||!['waiting','repaying'].includes(l.status))throw Error('猶予を相談できる返済がありません。');
 if(s.cash>30000)throw Error('手持ちが3万円以下のときに相談できます。');
 if(l.reliefUntil!==null&&m+1<l.reliefUntil)throw Error('すでに猶予期間があります。');
 if(l.reliefMonthsUsed+3>36)throw Error('猶予期間の上限です。');
 l.reliefStarts=m+1;l.reliefUntil=m+4;l.reliefMonthsUsed+=3;return s;
}
export function repayEducationLoan(state,requested){
 canUse(state);check(state);amount(requested);const s=copy(state),l=loanOf(s);if(!l||l.status==='settled'||l.status==='lending')throw Error('返済できる貸与がありません。');
 const paid=pay(l,s.cash,requested);if(!paid)throw Error('返済できる手持ちがありません。');s.cash-=paid;l.paid+=paid;return s;
}
// Call every week before investment orders; only the first week of a month is processed.
// The input is never mutated, including preview. Cash excludes order reservations already.
export function advanceEducationLoan(state){
 check(state);const s=copy(state),l=loanOf(s),events=[];if(!l||s.week%4!==0||l.status==='settled')return {state:s,events};
 const m=monthOf(s);if(m<=l.lastProcessedMonth)return {state:s,events};
 if(m!==l.lastProcessedMonth+1)throw Error('貸与の月次処理が抜けています。');
 l.lastProcessedMonth=m;
 if(l.status==='lending'){
  if(s.university?.status!=='enrolled'){endLending(l,m);events.push({kind:'lending-ended',month:m});}
  else {if(!Number.isSafeInteger(s.cash+l.monthly))throw Error('手持ちの上限を超えます。');s.cash+=l.monthly;l.principal+=l.monthly;l.paidOut+=l.monthly;l.monthsPaid++;events.push({kind:'deposit',month:m,amount:l.monthly});if(l.monthsPaid>=24){endLending(l,m);events.push({kind:'lending-ended',month:m});}}
 }
 if(l.status==='waiting'&&m>=l.nextDueMonth)l.status='repaying';
 if(l.status==='repaying'){
  if(l.reliefStarts!==null&&m>=l.reliefStarts&&m<l.reliefUntil){l.nextDueMonth=m+1;events.push({kind:'relief',month:m});return {state:s,events};}
  const financeCharge=Math.round(l.principal*l.annualRate/12);l.interest+=financeCharge;
  const lateFee=Math.round(l.arrearsPrincipal*.0025);l.lateFees+=lateFee;
  const fresh=l.remainingPayments>0?Math.ceil((l.principal-l.arrearsPrincipal)/l.remainingPayments):0;
  if(l.remainingPayments>0)l.remainingPayments--;
  l.arrearsPrincipal+=fresh;
  const due=l.arrearsPrincipal+l.interest+l.lateFees;
  const paid=pay(l,s.cash,due);s.cash-=paid;l.paid+=paid;
  if(l.status!=='settled')l.nextDueMonth=m+1;
  events.push({kind:'repayment',month:m,due,paid,interest:financeCharge,lateFee,overdue:l.arrearsPrincipal+l.interest+l.lateFees});
 }
 return {state:s,events};
}
