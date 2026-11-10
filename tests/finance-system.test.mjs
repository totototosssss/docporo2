import assert from 'node:assert/strict';
import * as E from '../engine.js';
import * as F from '../finance-system.js';
const original=E.newGame(501),initial=JSON.stringify(original);original.loan=30000;original.loanType='friend';
const q=F.quoteEducationLoan(original,'interestFree');assert.equal(q.monthly,30000);assert.equal(q.totalMaximum,720000);assert.equal(original.financeSystem,undefined);
let s=F.startEducationLoan(original,'interestFree');assert.equal(original.financeSystem,undefined);assert.equal(s.loan,30000);assert.equal(s.cash,original.cash);assert.throws(()=>F.startEducationLoan(s,'interestBearing'));
function step(state,month){state={...state,yearIndex:Math.floor(month/12),week:(month%12)*4};return F.advanceEducationLoan(state);}
let preview=step(s,1),repeat=step(s,1);assert.deepEqual(preview,repeat);assert.equal(s.cash,original.cash);assert.equal(preview.state.cash,s.cash+30000);assert.equal(F.educationLoanView(preview.state).balance,30000);assert.equal(step(preview.state,1).events.length,0);s=preview.state;
for(let m=2;m<=24;m++)s=step(s,m).state;
let view=F.educationLoanView(s);assert.equal(view.paidOut,720000);assert.equal(view.monthsPaid,24);assert.equal(view.status,'waiting');assert.equal(view.nextDueMonth,31);assert.equal(s.loan,30000);assert.equal(s.loanType,'friend');
const saved=E.migrateGame(JSON.parse(JSON.stringify(s)));assert.deepEqual(F.educationLoanView(saved),view);
for(let m=25;m<=30;m++)s=step(s,m).state;
const before=s.cash;let first=step(s,31);assert.equal(first.events[0].due,12000);assert.equal(first.events[0].paid,12000);assert.equal(first.state.cash,before-12000);s=first.state;assert.equal(F.educationLoanView(s).principal,708000);
let cash0=E.copy(s);cash0.cash=0;let miss=step(cash0,32);assert.equal(miss.state.cash,0);assert.equal(miss.events[0].paid,0);assert.equal(miss.events[0].overdue,12000);let later=step(miss.state,33);assert.equal(later.events[0].lateFee,30);assert.equal(later.state.cash,0);assert.equal(F.educationLoanView(later.state).principal,708000);
let recovery={...later.state,cash:10000};recovery=F.repayEducationLoan(recovery,10000);assert.equal(recovery.cash,0);assert.equal(F.educationLoanView(recovery).balance,F.educationLoanView(later.state).balance-10000);assert.equal(recovery.loan,30000);
let relief=F.requestLoanRelief(recovery);assert.equal(relief.cash,recovery.cash);const prev=F.educationLoanView(relief);for(let m=34;m<=36;m++){const o=step(relief,m);assert.equal(o.events[0].kind,'relief');relief=o.state;}assert.equal(F.educationLoanView(relief).principal,prev.principal);assert.equal(F.educationLoanView(relief).remainingPayments,prev.remainingPayments);assert.notEqual(step(relief,37).events[0].kind,'relief');
let stopped=F.startEducationLoan(original,'interestBearing');stopped=step(stopped,1).state;stopped=F.stopEducationLoan(stopped);assert.equal(F.educationLoanView(stopped).nextDueMonth,8);for(let m=2;m<8;m++)stopped=step(stopped,m).state;const paid=step(stopped,8);assert.equal(paid.events[0].interest,63);assert.equal(paid.events[0].due,897);assert.equal(F.educationLoanView(paid.state).paidOut,50000);
let graduation=F.startEducationLoan(original,'interestFree');graduation=step(graduation,1).state;graduation.university.status='graduated';graduation=step(graduation,2).state;assert.equal(F.educationLoanView(graduation).paidOut,30000);assert.equal(F.educationLoanView(graduation).status,'waiting');
let reserved=F.startEducationLoan(original,'interestFree');reserved=step(reserved,1).state;reserved=F.stopEducationLoan(reserved);for(let m=2;m<8;m++)reserved=step(reserved,m).state;reserved.cash=0;reserved.market.orders=[{side:'buy',reservedCash:999999}];const unpaid=step(reserved,8);assert.equal(unpaid.events[0].paid,0);assert.equal(unpaid.state.market.orders[0].reservedCash,999999);assert.equal(unpaid.state.cash,0);
assert.equal(JSON.parse(initial).financeSystem,undefined);console.log('finance: contracts, deposits, cross-year, preview, idempotence, legacy debt, interest, overdue, relief and reserved cash passed');
// Full repayment takes 60 installments with adequate funds, including year rollovers.
let full=F.startEducationLoan(original,'interestFree');for(let m=1;m<=24;m++)full=step(full,m).state;for(let m=25;m<=30;m++)full=step(full,m).state;full.cash=10000000;let charged=0;
for(let m=31;m<=90;m++){const o=step(full,m);assert.equal(o.events[0].paid,12000);charged+=o.events[0].paid;full=o.state;assert.ok(F.validateFinanceSystem(full));}
assert.equal(charged,720000);assert.equal(F.educationLoanView(full).status,'settled');assert.equal(F.educationLoanView(full).balance,0);assert.equal(step(full,91).events.length,0);
let early=F.startEducationLoan(original,'interestFree');early=step(early,1).state;early=F.stopEducationLoan(early);early.cash=100000;early=F.repayEducationLoan(early,100000);assert.equal(early.cash,70000);assert.equal(F.educationLoanView(early).status,'settled');
let malformed=E.copy(s);malformed.financeSystem.educationLoan.arrearsPrincipal=1e9;assert.equal(F.validateFinanceSystem(malformed),false);assert.throws(()=>F.advanceEducationLoan(malformed));
let skipped=F.startEducationLoan(original,'interestFree');assert.throws(()=>step(skipped,2),/月次処理/);assert.equal(skipped.cash,original.cash);
let insufficient=F.startEducationLoan(original,'interestFree');insufficient=F.stopEducationLoan(insufficient);assert.equal(F.educationLoanView(insufficient).status,'settled');
console.log('finance: full payoff, early payoff, validation and missing-month guard passed');
for(const id of ['__proto__','constructor','toString','hasOwnProperty']){
 assert.throws(()=>F.quoteEducationLoan(original,id),/貸与の種類/);
 assert.throws(()=>F.startEducationLoan(original,id),/貸与の種類/);
 const corrupted=E.copy(s);corrupted.financeSystem.educationLoan.offer=id;
 assert.equal(F.validateFinanceSystem(corrupted),false);
 assert.throws(()=>F.educationLoanView(corrupted),/貸与の記録/);
}
console.log('finance: inherited property names rejected as offer ids');
