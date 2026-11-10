import assert from 'node:assert/strict';
import * as E from '../engine.js';
import * as M from '../market.js';
// Independent seeded choices; 150 weeks crosses three game years.
for(let seed=1;seed<=80;seed++){
 let s=E.newGame(seed),random=seed>>>0;const rand=()=>{random^=random<<13;random^=random>>>17;random^=random<<5;return(random>>>0)/4294967296;};
 s.cash=150000;const original=s.cash;
 for(let week=0;week<150;week++){
  const ticker=M.STOCKS[Math.floor(rand()*M.STOCKS.length)].id,action=Math.floor(rand()*8),q=M.tradeQuote(s,ticker,'buy');
  if(action===0&&s.cash>=q.total)s=M.trade(s,ticker,'buy');
  else if(action===1&&M.availableShares(s,ticker)>=100)s=M.trade(s,ticker,'sell');
  else if(action===2&&!s.market.orders.some(o=>o.id===ticker)){const limit=Math.max(1,Math.round(s.market.prices[ticker]*(.7+.6*rand())));if(s.cash>=limit*100+100)s=M.placeLimitOrder(s,ticker,'buy',limit);}
  else if(action===3&&!s.market.orders.some(o=>o.id===ticker)&&M.availableShares(s,ticker)>=100)s=M.placeLimitOrder(s,ticker,'sell',Math.max(1,Math.round(s.market.prices[ticker]*(.8+.4*rand()))));
  else if(action===4)s=M.configureAutoInvestment(s,{id:ticker,budget:50000,reserve:10000});
  else if(action===5)s=M.stopAutoInvestment(s);
  else if(action===6&&s.market.orders.length)s=M.cancelLimitOrder(s,s.market.orders[0].orderId);
  M.marketWeek(s);
  const book=Object.values(s.market.basis).reduce((n,x)=>n+x,0),expected=original+s.market.realized+s.market.dividendIncome;
  assert.ok(Math.abs(s.cash+M.reservedCash(s)+book-expected)<1e-5,`seed ${seed}, absolute week ${week}`);
  assert.ok(s.cash>=0&&Number.isSafeInteger(s.cash),`cash seed ${seed}, week ${week}`);
  assert.equal(M.validateMarketState(s),true,`save seed ${seed}, week ${week}`);
  if(++s.week===48){s.week=0;s.yearIndex++;}
 }
}
console.log('market conservation: 80 seeds × 150 weeks, trades, limits, dividends, auto and year transitions passed');
// An order left over from an earlier year is expired before the current week's auto decision.
let stale=E.newGame(314);stale.cash=100000;stale.week=47;stale=M.placeLimitOrder(stale,'rail','buy',1);stale=M.configureAutoInvestment(stale,{id:'rail',budget:60000,reserve:0});stale.yearIndex=1;stale.week=0;M.marketWeek(stale);assert.equal(stale.market.orderHistory.at(-1).status,'expired');assert.equal(stale.market.autoInvestment.log.at(-1).status,'filled');assert.equal(stale.market.holdings.rail,100);assert.equal(M.validateMarketState(stale),true);
console.log('market: expired prior-year order does not block this week’s auto purchase');
