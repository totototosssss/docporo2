import {draw} from './exams.js?v=8.6';

// Fictional parameters: not market data, an investment forecast, or a calibrated estimate.
export const STOCKS=[
 {id:'rail',name:'白波鉄道',sector:'鉄道',price:320,vol:.035,dividend:2},
 {id:'food',name:'こもれび食品',sector:'食品',price:480,vol:.028,dividend:3},
 {id:'tech',name:'灯ラボ',sector:'情報',price:180,vol:.085,dividend:0}
];
export const MARKET_RULES={shares:100,fee:100,spread:1,daysPerWeek:5,dividendWeeks:[15,39],
 description:'架空の銘柄・価格とゲーム用の仮定です。実在市場の予測ではありません。',
 orders:'成行は表示するゲーム上の売買価格で成立。指値は次の週の各ゲーム日の終値に基づく売買価格で判定し、成立しなければ週末に失効します。',
 omissions:'板情報・部分約定・実際の休場日・税金・受渡し（T+2）は再現していません。手数料と売買価格の差はゲーム上の設定です。',
 sources:[{title:'東証の売買単位',url:'https://www.jpx.co.jp/equities/trading/domestic/03.html'},{title:'売買成立の方法',url:'https://www.jpx.co.jp/equities/trading/domestic/04.html'}]};
const stock=id=>STOCKS.find(x=>x.id===id);
const integer=x=>Number.isSafeInteger(x)&&x>=0;
const absolute=s=>s.yearIndex*48+s.week;

export function newMarket(){return {prices:Object.fromEntries(STOCKS.map(x=>[x.id,x.price])),holdings:{},basis:{},trades:[],history:[],realized:0,pachinkoBudget:3000,pachinkoNet:0,lastPachinko:null,orders:[],orderHistory:[],orderSeq:0,dailyHistory:[],volatility:'normal',dividendHistory:[],dividendIncome:0,lastDividendWeek:null};}
// Existing games retain every original price, holding, basis, trade and history.
export function ensureMarket(s){
 if(!s.market)s.market=newMarket();
 const m=s.market;
 if(m.orders===undefined)m.orders=[];if(m.orderHistory===undefined)m.orderHistory=[];
 if(m.orderSeq===undefined)m.orderSeq=0;if(m.dailyHistory===undefined)m.dailyHistory=[];
 if(m.volatility===undefined)m.volatility='normal';
 if(m.dividendHistory===undefined)m.dividendHistory=[];if(m.dividendIncome===undefined)m.dividendIncome=0;if(m.lastDividendWeek===undefined)m.lastDividendWeek=null;
 return m;
}
export function marketValue(s){return STOCKS.reduce((n,x)=>n+(s.market?.holdings?.[x.id]||0)*(s.market?.prices?.[x.id]??x.price),0);}
export function reservedCash(s){return (s.market?.orders||[]).filter(o=>o.side==='buy').reduce((n,o)=>n+o.reservedCash,0);}
export function reservedShares(s,id){return (s.market?.orders||[]).filter(o=>o.id===id&&o.side==='sell').reduce((n,o)=>n+o.shares,0);}
export function availableShares(s,id){return Math.max(0,(s.market?.holdings?.[id]||0)-reservedShares(s,id));}
function quoteAt(price,side){return side==='buy'?price+MARKET_RULES.spread:Math.max(1,price-MARKET_RULES.spread);}
export function tradeQuote(s,id,side){
 const x=stock(id);if(!x||!['buy','sell'].includes(side))throw Error('銘柄と売買を選んでください。');
 const reference=s.market?.prices?.[id]??x.price;if(!integer(reference)||reference<1)throw Error('株価を確認できません。');
 const price=quoteAt(reference,side),shares=MARKET_RULES.shares,fee=MARKET_RULES.fee,gross=price*shares,total=side==='buy'?gross+fee:gross-fee;
 if(!Number.isSafeInteger(total)||total<0)throw Error('取引金額を確認できません。');
 return {id,side,reference,price,shares,fee,gross,total,availableShares:availableShares(s,id),cash:s.cash};
}
function allowed(s){if(s.phase!=='study'||s.pending)throw Error('今週の出来事を先に確認してください。');}
function recordTrade(s,m,{id,side,shares,price,fee,day=null,orderId=null,source=null},reserved=0){
 const gross=shares*price,held=m.holdings[id]||0;
 if(side==='buy'){
  const total=gross+fee;if(!Number.isSafeInteger(held+shares)||!Number.isFinite((m.basis[id]||0)+total))throw Error('保有数または取得額の上限です。');if(reserved){if(reserved<total)throw Error('注文の予約金が不足しています。');s.cash+=reserved-total;}else{if(s.cash<total)throw Error('100株分の手持ちと手数料が必要です。');s.cash-=total;}
  m.basis[id]=(m.basis[id]||0)+total;m.holdings[id]=held+shares;
 }else{
  if(held<shares)throw Error('売れる株を持っていません。');
  const allocated=(m.basis[id]||0)*shares/held;s.cash+=gross-fee;m.realized+=gross-fee-allocated;
  m.basis[id]-=allocated;m.holdings[id]=held-shares;
 }
 m.trades.push({id,side,shares,price,fee,week:s.week,year:s.yearIndex,...(day===null?{}:{day}),...(orderId===null?{}:{orderId}),...(source===null?{}:{source})});s.spent+=fee;
}
export function trade(state,id,side){
 allowed(state);const q=tradeQuote(state,id,side);
 if(side==='sell'&&q.availableShares<q.shares)throw Error('売れる株を持っていないか、指値売りに予約済みです。');
 const s=structuredClone(state),m=ensureMarket(s);recordTrade(s,m,q);return s;
}
export function limitQuote(s,id,side,limit){
 const q=tradeQuote(s,id,side);
 if(!Number.isSafeInteger(limit)||limit<1||!Number.isSafeInteger(limit*q.shares+q.fee))throw Error('指値は1円以上の整数で入力してください。');
 const reservedCash=side==='buy'?limit*q.shares+q.fee:0;
 return {...q,limit,reservedCash,maximumBuy:reservedCash,minimumSell:side==='sell'?Math.max(0,limit*q.shares-q.fee):0};
}
export function placeLimitOrder(state,id,side,limit){
 allowed(state);const q=limitQuote(state,id,side,limit),s=structuredClone(state),m=ensureMarket(s);
 if(m.orders.some(o=>o.id===id))throw Error('この銘柄には未決の指値注文があります。');
 if(side==='buy'&&s.cash<q.reservedCash)throw Error('指値の上限額と手数料を確保できません。');
 if(side==='sell'&&availableShares(s,id)<q.shares)throw Error('指値売りに必要な株を確保できません。');
 if(!Number.isSafeInteger(m.orderSeq+1))throw Error('注文番号を作成できません。');
 m.orderSeq++;const order={orderId:String(absolute(s))+':'+id+':'+m.orderSeq,id,side,limit,shares:q.shares,reservedCash:q.reservedCash,year:s.yearIndex,week:s.week};
 if(side==='buy')s.cash-=q.reservedCash;m.orders.push(order);return s;
}
export function cancelLimitOrder(state,orderId){
 allowed(state);const s=structuredClone(state),m=ensureMarket(s),index=m.orders.findIndex(o=>o.orderId===orderId);
 if(index<0)throw Error('取り消せる注文がありません。');
 const [o]=m.orders.splice(index,1);if(o.side==='buy')s.cash+=o.reservedCash;
 m.orderHistory.push({...o,status:'cancelled',closedYear:s.yearIndex,closedWeek:s.week,day:null});return s;
}
// Explicit opt-in only; a missing configuration in a legacy save means stopped.
export function autoInvestmentInfo(state){
 const a=state.market?.autoInvestment;
 return a?structuredClone(a):{enabled:false,id:null,budget:0,reserve:0,nextWeek:null,lastRun:null,log:[]};
}
export function configureAutoInvestment(state,{id,budget,reserve}){
 allowed(state);
 if(!stock(id)||!integer(budget)||!integer(reserve))throw Error('銘柄・上限額・残す現金を確認してください。');
 const s=structuredClone(state),m=ensureMarket(s),prev=autoInvestmentInfo(s),now=absolute(s);
 const nextWeek=prev.nextWeek!==null&&prev.nextWeek>now?prev.nextWeek:(prev.lastRun===now?now+4:now);
 m.autoInvestment={enabled:true,id,budget,reserve,nextWeek,lastRun:prev.lastRun,log:prev.log};return s;
}
export function stopAutoInvestment(state){
 const s=structuredClone(state),m=ensureMarket(s),prev=autoInvestmentInfo(s);
 if(prev.id!==null)m.autoInvestment={...prev,enabled:false};return s;
}
function autoInvestmentStep(s,m,blocked,notes){
 const a=m.autoInvestment,now=absolute(s);
 if(!a?.enabled||a.nextWeek>now||a.lastRun===now)return null;
 const x=stock(a.id),q=tradeQuote(s,a.id,'buy');let status='skipped',reason='';
 if(blocked.has(a.id))reason='同じ銘柄の指値注文があるため見送り';
 else if(q.total>a.budget)reason='1回の上限額を超えたため見送り';
 else if(s.cash-q.total<a.reserve)reason='残す現金を確保するため見送り';
 else {recordTrade(s,m,{...q,day:1,source:'auto'});status='filled';}
 const event={year:s.yearIndex,week:s.week,id:a.id,status,price:q.price,fee:q.fee,total:q.total,reason};
 a.log.push(event);a.lastRun=now;a.nextWeek=now+4;
 notes.push(status==='filled'?`${x.name}の定期買付が${q.total.toLocaleString('ja-JP')}円で成立。`:`${x.name}の定期買付：${reason}。`);
 return event;
}
function normal(seed,key){const u=draw(seed,key+':a'),v=draw(seed,key+':b');return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function settleOrders(s,m,day,notes){
 const now=absolute(s),remaining=[];
 for(const o of m.orders){
  const orderWeek=o.year*48+o.week;
  if(orderWeek!==now){remaining.push(o);continue;}
  const price=quoteAt(m.prices[o.id],o.side),filled=o.side==='buy'?price<=o.limit:price>=o.limit;
  if(!filled){remaining.push(o);continue;}
  recordTrade(s,m,{id:o.id,side:o.side,shares:o.shares,price,fee:MARKET_RULES.fee,day:day+1,orderId:o.orderId},o.reservedCash);
  m.orderHistory.push({...o,status:'filled',fillPrice:price,fee:MARKET_RULES.fee,closedYear:s.yearIndex,closedWeek:s.week,day:day+1});
  notes.push(`${stock(o.id).name}の指値${o.side==='buy'?'買い':'売り'}が${price.toLocaleString('ja-JP')}円で成立。`);
 }
 m.orders=remaining;
}
function expireOrders(s,m,notes){
 const now=absolute(s),remaining=[];
 for(const o of m.orders){if(o.year*48+o.week>now){remaining.push(o);continue;}if(o.side==='buy')s.cash+=o.reservedCash;
  m.orderHistory.push({...o,status:'expired',closedYear:s.yearIndex,closedWeek:s.week,day:null});notes.push(`${stock(o.id).name}の指値注文は成立せず失効。`);
 }
 m.orders=remaining;
}
// Entitlement is determined before the first game day. Adjust prices even if unowned.
// Dividend settings and timing are fictional game parameters, not a market forecast.
export function processDividends(s){
 const m=ensureMarket(s),abs=absolute(s);
 if(!MARKET_RULES.dividendWeeks.includes(s.week)||m.lastDividendWeek===abs)return [];
 const changes=STOCKS.map(x=>{
  const price=m.prices[x.id],perShare=Math.min(x.dividend,Math.max(0,price-10)),shares=m.holdings[x.id]||0,total=perShare*shares;
  if(!Number.isSafeInteger(total)||!Number.isSafeInteger(s.cash+total)||!Number.isSafeInteger(m.dividendIncome+total))throw Error('配当金額を確認できません。');
  return {id:x.id,year:s.yearIndex,week:s.week,perShare,shares,total};
 });
 const total=changes.reduce((sum,x)=>sum+x.total,0);
 if(!Number.isSafeInteger(total)||!Number.isSafeInteger(s.cash+total)||!Number.isSafeInteger(m.dividendIncome+total))throw Error('配当金額を確認できません。');
 for(const item of changes)m.prices[item.id]-=item.perShare;
 const paid=changes.filter(item=>item.total>0);s.cash+=total;m.dividendIncome+=total;m.dividendHistory.push(...paid);m.lastDividendWeek=abs;return paid;
}
// Called once by the real weekly simulation on its private state copy, never in preview.
export function marketWeek(s){
 const m=ensureMarket(s),notes=[],abs=absolute(s),weekStart=m.orderHistory.length;let autoResult=null;
 const dividends=processDividends(s);for(const d of dividends)notes.push(`${stock(d.id).name}の配当 ${d.total.toLocaleString('ja-JP')}円。`);
 // Stale orders from interrupted or old saves expire without being executed later.
 for(const o of m.orders.filter(o=>o.year*48+o.week<abs)){if(o.side==='buy')s.cash+=o.reservedCash;m.orderHistory.push({...o,status:'expired',closedYear:s.yearIndex,closedWeek:s.week,day:null});notes.push(`${stock(o.id).name}の指値注文は期限切れ。`);}
 m.orders=m.orders.filter(o=>o.year*48+o.week>=abs);
 const blocked=new Set(m.orders.map(o=>o.id));
 for(let day=0;day<MARKET_RULES.daysPerWeek;day++){
  const r=draw(s.seed,`market:regime:${abs}:${day}`);
  m.volatility=m.volatility==='stress'?(r<.30?'normal':'stress'):(r<.04?'stress':'normal');
  const multiplier=m.volatility==='stress'?1.6:.8,common=normal(s.seed,`market:common:${abs}:${day}`);
  for(const x of STOCKS){const sigma=x.vol*Math.sqrt(3.25/12)*multiplier,individual=normal(s.seed,`market:${x.id}:${abs}:${day}`),z=Math.sqrt(.31)*common+Math.sqrt(.69)*individual;
   const next=m.prices[x.id]*Math.exp(-.5*sigma*sigma+sigma*z),maxPrice=Math.floor((Number.MAX_SAFE_INTEGER-MARKET_RULES.fee)/MARKET_RULES.shares)-MARKET_RULES.spread;m.prices[x.id]=Math.min(maxPrice,Math.max(10,Math.round(next)));}
  settleOrders(s,m,day,notes);if(day===0)autoResult=autoInvestmentStep(s,m,blocked,notes);m.dailyHistory.push({week:abs,day:day+1,prices:{...m.prices}});
 }
 expireOrders(s,m,notes);m.dailyHistory=m.dailyHistory.slice(-260);
 m.history.push({week:abs,prices:{...m.prices},value:marketValue(s)});m.history=m.history.slice(-52);
 m.weekReport={week:abs,orders:m.orderHistory.slice(weekStart),autoInvestment:autoResult,dividends};
 return notes;
}
// Structural validation is used before importing JSON; it cannot authenticate user-edited saves.
export function validateMarketState(s){
 const m=s.market;if(m==null)return true;
 if(!m||typeof m!=='object'||Array.isArray(m)||!m.prices||!m.holdings||!m.basis||!Array.isArray(m.trades)||!Array.isArray(m.history)||!Number.isFinite(m.realized))return false;
 for(const x of STOCKS){if(!integer(m.prices[x.id])||m.prices[x.id]<1||!Number.isSafeInteger((m.prices[x.id]+MARKET_RULES.spread)*MARKET_RULES.shares+MARKET_RULES.fee)||!integer(m.holdings[x.id]??0)||!Number.isFinite(m.basis[x.id]??0)||(m.basis[x.id]??0)<0)return false;}
 if(m.orders===undefined)return m.orderHistory===undefined&&m.dailyHistory===undefined&&m.orderSeq===undefined&&m.volatility===undefined&&m.autoInvestment===undefined&&m.dividendHistory===undefined&&m.dividendIncome===undefined&&m.lastDividendWeek===undefined;
 if(!Array.isArray(m.orders)||!Array.isArray(m.orderHistory)||!Array.isArray(m.dailyHistory)||!integer(m.orderSeq)||!['normal','stress'].includes(m.volatility))return false;
 const ids=new Set(),orders=new Set();
 for(const o of m.orders){if(!o||typeof o.orderId!=='string'||orders.has(o.orderId)||!stock(o.id)||ids.has(o.id)||!['buy','sell'].includes(o.side)||!integer(o.limit)||o.limit<1||o.shares!==MARKET_RULES.shares||!integer(o.reservedCash)||o.reservedCash!==(o.side==='buy'?o.limit*o.shares+MARKET_RULES.fee:0)||!integer(o.year)||o.year>s.yearIndex||!integer(o.week)||o.week>=48||(o.year===s.yearIndex&&o.week>s.week))return false;
  if(o.side==='sell'&&o.shares>(m.holdings[o.id]||0))return false;ids.add(o.id);orders.add(o.orderId);
 }
 for(const r of m.orderHistory){if(!r||typeof r.orderId!=='string'||!stock(r.id)||!['buy','sell'].includes(r.side)||!integer(r.limit)||r.limit<1||r.shares!==MARKET_RULES.shares||!integer(r.reservedCash)||!['filled','expired','cancelled'].includes(r.status)||!integer(r.year)||!integer(r.week)||r.week>=48||!integer(r.closedYear)||!integer(r.closedWeek)||r.closedWeek>=48||r.status==='filled'&&(!integer(r.fillPrice)||r.fillPrice<1||!integer(r.fee)||!integer(r.day)||r.day<1||r.day>5))return false;}
 for(const row of m.dailyHistory){if(!row||!integer(row.week)||!integer(row.day)||row.day<1||row.day>5||!row.prices||STOCKS.some(x=>!integer(row.prices[x.id])||row.prices[x.id]<1))return false;}
 const hasDividend=m.dividendHistory!==undefined||m.dividendIncome!==undefined||m.lastDividendWeek!==undefined;
 if(hasDividend){
  if(!Array.isArray(m.dividendHistory)||!integer(m.dividendIncome)||!(m.lastDividendWeek===null||integer(m.lastDividendWeek))||m.lastDividendWeek!==null&&m.lastDividendWeek>absolute(s))return false;
  const seen=new Set();for(const d of m.dividendHistory){const k=d&&`${d.year}:${d.week}:${d.id}`;if(!d||!stock(d.id)||!integer(d.year)||d.year>s.yearIndex||!integer(d.week)||!MARKET_RULES.dividendWeeks.includes(d.week)||d.year===s.yearIndex&&d.week>s.week||!integer(d.perShare)||d.perShare<1||!integer(d.shares)||d.shares<1||!integer(d.total)||d.total!==d.shares*d.perShare||seen.has(k))return false;seen.add(k);}
  const dividendTotal=m.dividendHistory.reduce((sum,d)=>sum+d.total,0);if(!Number.isSafeInteger(dividendTotal)||dividendTotal!==m.dividendIncome)return false;
 }
 if(m.autoInvestment!==undefined){
  const a=m.autoInvestment;if(!a||typeof a!=='object'||Array.isArray(a)||typeof a.enabled!=='boolean'||!stock(a.id)||!integer(a.budget)||!integer(a.reserve)||!(a.nextWeek===null||integer(a.nextWeek))||!(a.lastRun===null||integer(a.lastRun))||!Array.isArray(a.log)||a.enabled&&a.nextWeek===null||a.lastRun!==null&&a.lastRun>absolute(s))return false;
  for(const e of a.log)if(!e||!stock(e.id)||!integer(e.year)||!integer(e.week)||e.week>=48||e.year>s.yearIndex||e.year===s.yearIndex&&e.week>s.week||!['filled','skipped'].includes(e.status)||!integer(e.price)||e.price<1||!integer(e.fee)||!integer(e.total)||typeof e.reason!=='string')return false;
 }
 return true;
}
