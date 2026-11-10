import assert from 'node:assert/strict';
import * as E from '../engine.js';
import * as M from '../market.js';
const fresh=seed=>E.newGame(seed);
const advanceMarket=(s,n)=>{for(let i=0;i<n;i++){M.marketWeek(s);if(++s.week===48){s.week=0;s.yearIndex++;}}return s;};
const plain=E.blankPlan();
// Old saves have no market-model fields. Upgrading preserves values verbatim.
let old=fresh(1);old.market={prices:{rail:401,food:499,tech:205},holdings:{rail:100},basis:{rail:40200},trades:[{id:'rail',side:'buy'}],history:[{week:0,prices:{rail:401}}],realized:0,pachinkoBudget:3000,pachinkoNet:0,lastPachinko:null};
const oldCopy=JSON.parse(JSON.stringify(old.market));assert.equal(M.validateMarketState(old),true);M.ensureMarket(old);for(const key of Object.keys(oldCopy))assert.deepEqual(old.market[key],oldCopy[key]);assert.equal(M.validateMarketState(old),true);
// A market order quotes the exact fictional execution amount and fee in advance.
let s=fresh(2),q=M.tradeQuote(s,'rail','buy'),initial=s.cash;s=M.trade(s,'rail','buy');assert.equal(initial-s.cash,q.total);assert.equal(s.market.basis.rail,q.total);assert.equal(s.market.holdings.rail,100);
q=M.tradeQuote(s,'rail','sell');s=M.trade(s,'rail','sell');assert.equal(s.cash-initial,-2*100-2*100);assert.equal(s.market.realized,-400);assert.equal(s.market.basis.rail,0);assert.equal(s.market.holdings.rail,0);assert.throws(()=>M.trade(s,'rail','sell'));
// Buy limits reserve cash; cancel/expiry return it exactly and cannot duplicate it.
s=fresh(3);initial=s.cash;s=M.placeLimitOrder(s,'rail','buy',1);assert.equal(initial-s.cash,200);assert.equal(M.reservedCash(s),200);assert.throws(()=>M.placeLimitOrder(s,'rail','buy',1));let order=s.market.orders[0];s=M.cancelLimitOrder(s,order.orderId);assert.equal(s.cash,initial);assert.equal(M.reservedCash(s),0);assert.equal(s.market.orderHistory.at(-1).status,'cancelled');assert.throws(()=>M.cancelLimitOrder(s,order.orderId));
s=M.placeLimitOrder(s,'rail','buy',1);const beforeExpiry=s.cash;M.marketWeek(s);assert.equal(s.market.orders.length,0);assert.equal(s.cash,beforeExpiry+200);assert.equal(s.market.orderHistory.at(-1).status,'expired');assert.equal(s.market.trades.length,0);
// Matching a buy returns unspent reservation; held assets are never created for free.
s=fresh(4);s.cash=2_000_000;initial=s.cash;s=M.placeLimitOrder(s,'food','buy',9999);order=s.market.orders[0];const reservation=order.reservedCash;assert.equal(initial-s.cash,reservation);M.marketWeek(s);const filled=s.market.orderHistory.at(-1);assert.equal(filled.status,'filled');assert.equal(initial-s.cash,filled.fillPrice*100+filled.fee);assert.equal(s.market.basis.food,filled.fillPrice*100+filled.fee);assert.equal(s.market.holdings.food,100);assert.equal(s.market.trades.length,1);assert.equal(s.market.weekReport.orders.length,1);
// Reserved sell shares remain in valuation but cannot be sold twice.
initial=s.cash;const value=M.marketValue(s);s=M.placeLimitOrder(s,'food','sell',1);assert.equal(M.marketValue(s),value);assert.equal(M.availableShares(s,'food'),0);assert.throws(()=>M.trade(s,'food','sell'));assert.throws(()=>M.placeLimitOrder(s,'food','sell',1));M.marketWeek(s);const sold=s.market.orderHistory.at(-1);assert.equal(sold.status,'filled');assert.equal(s.cash-initial,sold.fillPrice*100-sold.fee);assert.equal(s.market.holdings.food,0);assert.equal(M.availableShares(s,'food'),0);
// Stale orders expire rather than secretly filling in a later year.
s=fresh(5);s=M.placeLimitOrder(s,'rail','buy',20);initial=s.cash;s.yearIndex=1;M.marketWeek(s);assert.equal(s.cash,initial+2100);assert.equal(s.market.orderHistory.at(-1).status,'expired');
// Real game week validates the order, reports fills and does not mutate preview input.
s=fresh(6);s.cash=2_000_000;s=M.placeLimitOrder(s,'rail','buy',9999);const original=JSON.stringify(s);const preview=E.simulateWeek(s,plain,{preview:true});assert.equal(JSON.stringify(s),original);assert.equal(preview.market.orders.length,1);const played=E.simulateWeek(s,plain);assert.equal(played.market.orders.length,0);assert.equal(played.market.orderHistory.at(-1).status,'filled');assert.ok(played.lastReport.notes.some(x=>x.includes('指値買い')));assert.equal(JSON.stringify(s),original);
for(const bad of [0,-1,1.5,Number.NaN,Number.MAX_SAFE_INTEGER])assert.throws(()=>M.placeLimitOrder(fresh(10),'rail','buy',bad));
s=fresh(10);s.cash=0;assert.throws(()=>M.placeLimitOrder(s,'rail','buy',10));assert.throws(()=>M.trade(s,'rail','buy'));s.pending={kind:'story'};assert.throws(()=>M.placeLimitOrder(s,'rail','buy',10));
const bad=fresh(1);bad.market.orders=[{id:'rail',side:'sell',shares:100,limit:1,orderId:'x',year:0,week:0,reservedCash:0}];assert.equal(M.validateMarketState(bad),false);
// Fixed seed reproduction and statistical sanity across distinct seeds; no market calibration claimed.
assert.deepEqual(advanceMarket(fresh(123),20).market,advanceMarket(fresh(123),20).market);
let count=0,means=[0,0,0],squares=[0,0,0],cross=0;
for(let seed=0;seed<300;seed++){
 const game=fresh(seed),prev={...game.market.prices};advanceMarket(game,12);assert.ok(game.market.prices.rail>0&&game.market.prices.food>0&&game.market.prices.tech>0);
 for(const row of game.market.dailyHistory){const vals=M.STOCKS.map(x=>Math.log(row.prices[x.id]/prev[x.id]));for(let i=0;i<3;i++){means[i]+=vals[i];squares[i]+=vals[i]*vals[i];prev[M.STOCKS[i].id]=row.prices[M.STOCKS[i].id];}cross+=vals[0]*vals[1];count++;}
}
const std=means.map((v,i)=>Math.sqrt(squares[i]/count-(v/count)**2));const corr=(cross/count-(means[0]/count)*(means[1]/count))/(std[0]*std[1]);
assert.ok(std[2]>std[0]&&std[0]>std[1]);assert.ok(corr>.15&&corr<.5);assert.ok(std.every(x=>x>0&&x<.15));
console.log('market: tests passed; fictional daily log-return std=',std.map(x=>x.toFixed(4)).join(', '),'common correlation=',corr.toFixed(3),'samples=',count);
// Automatic purchases are opt-in, capped, and never use reserved cash or protected cash.
let auto=fresh(100);assert.equal(M.autoInvestmentInfo(auto).enabled,false);let baseline=JSON.stringify(auto.market);M.marketWeek(auto);assert.equal(auto.market.trades.length,0);assert.equal(M.autoInvestmentInfo(auto).enabled,false);
auto=fresh(101);auto.cash=200000;auto=M.configureAutoInvestment(auto,{id:'rail',budget:50000,reserve:100000});assert.equal(M.validateMarketState(auto),true);assert.equal(M.autoInvestmentInfo(auto).enabled,true);
let autoStart=auto.cash;M.marketWeek(auto);let ae=auto.market.autoInvestment.log.at(-1);assert.equal(ae.status,'filled');assert.equal(autoStart-auto.cash,ae.total);assert.ok(auto.cash>=100000);assert.equal(auto.market.trades.at(-1).source,'auto');assert.equal(auto.market.weekReport.autoInvestment.status,'filled');
const cnt=auto.market.trades.length;M.marketWeek(auto);assert.equal(auto.market.trades.length,cnt);assert.equal(auto.market.autoInvestment.log.length,1);
auto=M.stopAutoInvestment(auto);assert.equal(M.autoInvestmentInfo(auto).enabled,false);auto=M.configureAutoInvestment(auto,{id:'rail',budget:50000,reserve:100000});assert.equal(auto.market.autoInvestment.nextWeek,4);M.marketWeek(auto);assert.equal(auto.market.trades.length,cnt);
let resumed=JSON.parse(JSON.stringify(auto));assert.equal(M.validateMarketState(resumed),true);resumed.week=4;M.marketWeek(resumed);assert.equal(resumed.market.autoInvestment.log.length,2);
let capped=fresh(102);capped=M.configureAutoInvestment(capped,{id:'rail',budget:1,reserve:0});autoStart=capped.cash;M.marketWeek(capped);assert.equal(capped.cash,autoStart);assert.equal(capped.market.autoInvestment.log[0].status,'skipped');assert.match(capped.market.autoInvestment.log[0].reason,/上限/);
let protectedCash=fresh(103);protectedCash=M.configureAutoInvestment(protectedCash,{id:'rail',budget:50000,reserve:protectedCash.cash});autoStart=protectedCash.cash;M.marketWeek(protectedCash);assert.equal(protectedCash.cash,autoStart);assert.match(protectedCash.market.autoInvestment.log[0].reason,/現金/);
let blocked=fresh(104);blocked=M.placeLimitOrder(blocked,'rail','buy',1);blocked=M.configureAutoInvestment(blocked,{id:'rail',budget:50000,reserve:0});M.marketWeek(blocked);assert.match(blocked.market.autoInvestment.log[0].reason,/指値/);assert.equal(blocked.market.trades.length,0);
let game=fresh(105);game.week=1;game.cash=40000;game=M.configureAutoInvestment(game,{id:'rail',budget:50000,reserve:39000});const frozen=JSON.stringify(game);let previewAuto=E.simulateWeek(game,plain,{preview:true});assert.equal(JSON.stringify(game),frozen);assert.equal(previewAuto.market.autoInvestment.log.length,0);let actualAuto=E.simulateWeek(game,plain);assert.equal(actualAuto.market.autoInvestment.log[0].status,'skipped');assert.equal(actualAuto.cash,39250);assert.ok(actualAuto.lastReport.notes.some(n=>n.includes('定期買付')));
let yearly=fresh(106);yearly.week=47;yearly=M.configureAutoInvestment(yearly,{id:'food',budget:1,reserve:0});M.marketWeek(yearly);assert.equal(yearly.market.autoInvestment.nextWeek,51);yearly.week=0;yearly.yearIndex=1;for(let i=0;i<3;i++){M.marketWeek(yearly);yearly.week++;}assert.equal(yearly.market.autoInvestment.log.length,1);M.marketWeek(yearly);assert.equal(yearly.market.autoInvestment.log.length,2);
let pending=fresh(107);pending=M.configureAutoInvestment(pending,{id:'rail',budget:50000,reserve:0});pending.pending={kind:'story'};assert.equal(M.autoInvestmentInfo(M.stopAutoInvestment(pending)).enabled,false);assert.throws(()=>M.configureAutoInvestment(pending,{id:'rail',budget:10,reserve:0}));
assert.throws(()=>M.configureAutoInvestment(fresh(1),{id:'bad',budget:10,reserve:0}));assert.throws(()=>M.configureAutoInvestment(fresh(1),{id:'rail',budget:-1,reserve:0}));
console.log('automatic investing: all tests passed');
// A limit exactly equal to the first simulated quote executes at that quote.
let exact=fresh(120);exact.cash=100000;let expected=structuredClone(exact);M.marketWeek(expected);const day1=expected.market.dailyHistory[0].prices.rail,limit=day1+M.MARKET_RULES.spread;exact=M.placeLimitOrder(exact,'rail','buy',limit);M.marketWeek(exact);assert.equal(exact.market.orderHistory[0].day,1);assert.equal(exact.market.orderHistory[0].fillPrice,limit);assert.equal(M.validateMarketState(exact),true);
let duplicate=fresh(121);duplicate.cash=2000000;duplicate=M.placeLimitOrder(duplicate,'rail','buy',9999);duplicate=M.configureAutoInvestment(duplicate,{id:'rail',budget:50000,reserve:0});M.marketWeek(duplicate);assert.equal(duplicate.market.orderHistory.at(-1).status,'filled');assert.equal(duplicate.market.trades.length,1);assert.match(duplicate.market.autoInvestment.log[0].reason,/指値/);assert.equal(M.validateMarketState(duplicate),true);
assert.equal(M.validateMarketState(actualAuto),true);
const damaged=fresh(1);damaged.market.autoInvestment={enabled:true,id:'rail',budget:1,reserve:0,nextWeek:0,lastRun:null,log:[null]};assert.equal(M.validateMarketState(damaged),false);
console.log('market order and saved-state integrity: all tests passed');
// Dividend entitlement precedes the first simulated day; ex adjustment preserves total value.
let div=fresh(201);div.week=15;div.cash=100000;div.market.holdings={rail:100,food:200,tech:100};div.market.basis={rail:32100,food:96200,tech:18100};let totalBefore=div.cash+M.marketValue(div),events=M.processDividends(div);assert.equal(events.length,2);assert.deepEqual(events.map(x=>x.total),[200,600]);assert.equal(div.cash+M.marketValue(div),totalBefore);assert.equal(div.market.dividendIncome,800);assert.equal(div.market.prices.rail,318);assert.equal(div.market.prices.food,477);assert.equal(div.market.prices.tech,180);const snap=JSON.stringify(div);assert.deepEqual(M.processDividends(div),[]);assert.equal(JSON.stringify(div),snap);assert.equal(M.validateMarketState(div),true);
// Quotes adjust even with no holdings, and price floors cannot manufacture cash.
let unowned=fresh(202);unowned.week=15;totalBefore=unowned.cash;assert.deepEqual(M.processDividends(unowned),[]);assert.equal(unowned.cash,totalBefore);assert.equal(unowned.market.prices.rail,318);assert.equal(unowned.market.prices.food,477);
let floor=fresh(203);floor.week=39;floor.market.prices.rail=10;floor.market.prices.food=11;floor.market.holdings={rail:100,food:100};floor.market.basis={rail:1000,food:1100};totalBefore=floor.cash+M.marketValue(floor);events=M.processDividends(floor);assert.equal(floor.market.prices.rail,10);assert.equal(floor.market.prices.food,10);assert.equal(events.length,1);assert.equal(events[0].total,100);assert.equal(floor.cash+M.marketValue(floor),totalBefore);
// Reserved sell shares are held on the entitlement date; purchases after it are not.
let sellDiv=fresh(204);sellDiv.week=15;sellDiv.cash=200000;sellDiv=M.trade(sellDiv,'rail','buy');sellDiv=M.placeLimitOrder(sellDiv,'rail','sell',1);M.marketWeek(sellDiv);assert.equal(sellDiv.market.dividendHistory.find(x=>x.id==='rail').total,200);assert.equal(sellDiv.market.orderHistory.at(-1).status,'filled');assert.equal(sellDiv.market.holdings.rail,0);assert.equal(sellDiv.market.weekReport.dividends.length,1);
let buyDiv=fresh(205);buyDiv.week=15;buyDiv.cash=2000000;buyDiv=M.placeLimitOrder(buyDiv,'food','buy',9999);M.marketWeek(buyDiv);assert.equal(buyDiv.market.orderHistory.at(-1).status,'filled');assert.equal(buyDiv.market.holdings.food,100);assert.equal(buyDiv.market.dividendHistory.length,0);
let autoDiv=fresh(206);autoDiv.week=15;autoDiv.cash=200000;autoDiv=M.configureAutoInvestment(autoDiv,{id:'food',budget:100000,reserve:0});M.marketWeek(autoDiv);assert.equal(autoDiv.market.autoInvestment.log.at(-1).status,'filled');assert.equal(autoDiv.market.dividendHistory.length,0);
// Game-week previews cannot pay dividends or change the original.
let previewDiv=fresh(207);previewDiv.week=15;previewDiv.market.holdings.rail=100;previewDiv.market.basis.rail=32000;const previewSnapshot=JSON.stringify(previewDiv);E.simulateWeek(previewDiv,plain,{preview:true});assert.equal(JSON.stringify(previewDiv),previewSnapshot);let finishedDiv=E.simulateWeek(previewDiv,plain);assert.equal(finishedDiv.market.dividendHistory[0].total,200);assert.ok(finishedDiv.lastReport.notes.some(x=>x.includes('配当')));assert.equal(M.validateMarketState(finishedDiv),true);
let invalidDividend=fresh(208);invalidDividend.market.lastDividendWeek=100;assert.equal(M.validateMarketState(invalidDividend),false);
console.log('dividends: entitlement, ex adjustment, conservation, floor, order/auto timing, idempotence, preview and legacy passed');
// Fictional multi-year sanity check: dividends are paid, with corresponding ex adjustments.
let sums=0,cashSums=0,min=Infinity,max=0;
for(let seed=300;seed<600;seed++){
 const long=fresh(seed);long.cash=0;for(const x of M.STOCKS){long.market.holdings[x.id]=100;long.market.basis[x.id]=x.price*100;}
 const start=M.marketValue(long);advanceMarket(long,48*5);const wealth=long.cash+M.marketValue(long),ratio=wealth/start;
 assert.ok(Number.isFinite(wealth)&&wealth>=0);assert.equal(M.validateMarketState(long),true);sums+=ratio;cashSums+=long.cash;min=Math.min(min,ratio);max=Math.max(max,ratio);
}
const avg=sums/300;assert.ok(avg>.7&&avg<1.3);
console.log('dividends: 300 seeds × 5 game-years, mean ending wealth/start=',avg.toFixed(3),'mean payout=',Math.round(cashSums/300),'yen; model only');
