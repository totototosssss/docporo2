import {enrichBook} from './books.js?v=8.0';
import * as H from './hangouts.js?v=8.0';
import {VENUE_MAP,VENUE_EFFECTS,venueFee,venueMemory,activeExhibitions} from './venues.js?v=8.0';
import {EXPANDED_CATALOG} from './expanded-catalog.js?v=8.0';
import {FRIENDS,MEETUP_TOPICS,GUEST_LEGACY,SOCIAL_LINES} from './social.js?v=8.0';
import {draw} from './exams.js?v=8.0';
export {MEETUP_TOPICS} from './social.js?v=8.0';
import {CATALOG} from './catalog.js?v=8.0';
// Game effects are fictional. Item and venue metadata distinguish sourced prices from estimates.
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,v));
const clone=s=>JSON.parse(JSON.stringify(s));
function roll(seed){let t=(seed+0x6D2B79F5)|0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}
const prefRows=[
 ['北海道',0,'港町を歩く','広い空と、温かいスープ。'],['青森県',1,'湖畔で深呼吸','水面を見て、頭の中を空っぽに。'],['岩手県',1,'盛岡の喫茶店','手帳を閉じて、ゆっくり一杯。'],['宮城県',1,'松島を眺める','島を数えていたら、悩みが少し小さくなった。'],['秋田県',1,'温泉でひと休み','時計を外すだけで、休日になる。'],['山形県',1,'山寺の石段','上った先の景色を、しばらく見ていた。'],['福島県',1,'会津の町並み','古い町を、目的もなく歩く。'],
 ['茨城県',2,'海の見える公園','潮風の中では、通知を見なくて済む。'],['栃木県',2,'日光の緑を歩く','木陰で、今週のことを話した。'],['群馬県',2,'温泉街で足湯','帰ったらもう少し頑張れそう。'],['埼玉県',2,'川越で食べ歩き','今日は正答率より、おいしいもの。'],['千葉県',2,'海辺の夕暮れ','夕日が沈むまで、何もしない。'],['東京都',2,'神保町から美術館へ','本を探したつもりが、気分転換になった。'],['神奈川県',2,'海沿いの散歩','帰りの電車で、よく眠れた。'],
 ['新潟県',3,'海とおにぎり','いつもの昼ご飯が、旅先では特別。'],['富山県',3,'運河沿いの散歩','遠くの山まで見えた。'],['石川県',3,'庭園と甘味','歩いたあとの甘いものが沁みる。'],['福井県',3,'博物館を巡る','受験と関係ないことを、夢中で読んだ。'],['山梨県',3,'湖畔の休日','山の輪郭が、よく見える日だった。'],['長野県',3,'高原のカフェ','涼しい風で、気持ちを切り替えた。'],['岐阜県',3,'古い町で寄り道','いつもの道と違うだけで、少し楽しい。'],['静岡県',3,'海辺でお茶','温かいお茶を飲みながら、ぼんやり。'],['愛知県',3,'喫茶店のモーニング','一日の始まりを、少し贅沢に。'],['三重県',3,'参道を歩く','願い事の前に、まずはお昼ご飯。'],
 ['滋賀県',4,'湖沿いを走る','大きな湖が、遠くまで続いていた。'],['京都府',4,'小道と喫茶店','有名な場所より、静かな小道がよかった。'],['大阪府',4,'街歩きと粉もの','くだらない話で、久しぶりに笑った。'],['兵庫県',4,'港で夜景を見る','明かりが一つずつ灯っていく。'],['奈良県',4,'公園でのんびり','歩く速さを、いつもより落としてみた。'],['和歌山県',4,'海辺の温泉','波の音だけ聞いていた。'],
 ['鳥取県',5,'砂丘を歩く','足跡をつけて、帰ってきた。'],['島根県',5,'湖の夕日','話さなくても、気まずくない時間。'],['岡山県',5,'運河と喫茶店','水辺のベンチが、ちょうどよかった。'],['広島県',5,'島へ小さな旅','船に乗ると、休日の実感がわく。'],['山口県',5,'橋と川の散歩','写真は少なめ、景色は長めに。'],['徳島県',5,'川辺で休む','水の流れを見て、深呼吸。'],['香川県',5,'うどんと港町','次の一杯を相談するのが楽しい。'],['愛媛県',5,'温泉街の休日','帰りに買った小さなお土産。'],['高知県',5,'市場と海','にぎやかな場所で、少し元気をもらう。'],
 ['福岡県',6,'屋台と街歩き','温かいご飯と、他愛ない話。'],['佐賀県',6,'焼き物の町','好きな色の器を、じっくり眺める。'],['長崎県',6,'坂の町と港','息が上がって、考え事が止まった。'],['熊本県',6,'草原の景色','空が、いつもより大きい。'],['大分県',6,'温泉で休養','今日は休むために出かけた。'],['宮崎県',6,'海沿いを歩く','海の色を、しばらく覚えていたい。'],['鹿児島県',6,'海と火山を眺める','湯気の向こうに、大きな山。'],['沖縄県',7,'海辺の小旅行','帰ったら、この景色を思い出そう。']
];
export const PREFECTURES=prefRows.map(([name,region,spot,line],id)=>({id,name,region,spot,line}));
export const OUTINGS={walk:{name:'散歩と喫茶店',cost:1600,health:5,stress:-13,spirit:15},food:{name:'食べ歩き',cost:3200,health:3,stress:-18,spirit:20},culture:{name:'美術館・博物館',cost:2500,health:2,stress:-15,spirit:19},spa:{name:'温泉で休養',cost:5200,health:12,stress:-21,spirit:18},badminton:{name:'バドミントン',cost:1000,health:1,stress:-17,spirit:20},pingpong:{name:'卓球',cost:1600,health:3,stress:-14,spirit:18},bouldering:{name:'ボルダリング',cost:2800,health:-3,stress:-18,spirit:22},bowling:{name:'ボウリング',cost:2600,health:1,stress:-16,spirit:22},karaoke:{name:'カラオケ',cost:2300,health:2,stress:-19,spirit:20},board:{name:'ボードゲームカフェ',cost:3600,health:1,stress:-16,spirit:20},park:{name:'遊園地で遊ぶ',cost:7800,health:-4,stress:-25,spirit:26}};
export const GUESTS=FRIENDS;
export const TALK_ROOMS={friends:{name:'気の合う常連',stress:-9,spirit:8,cost:0,description:'安心して近況を話せる。繰り返すと回復は控えめ。'},hobby:{name:'趣味の雑談',stress:-12,spirit:11,cost:0,description:'受験の話から離れてリセット。'},exam:{name:'受験の近況報告',stress:-4,spirit:5,cost:0,description:'面接 +0.5。比較疲れでストレスが少し増える週もある。'}};
export const MEETUP_VENUES={cafe:{name:'少人数カフェ',cost:2400,bonus:3},meal:{name:'ごはん会',cost:4000,bonus:1},karaoke:{name:'カラオケ',cost:3200,bonus:0}};
const item=(id,name,category,price,effect,description,kind='gear',extra={})=>({id,name,category,price,effect,description:({timer:'時間を区切って、最後まで手を動かす。',lamp:'夜の机を明るくする。',chair:'長い一日を支える、自分の席。',desk:'答案と問題を並べられる広さ。',pillow:'眠る場所を、自分に合わせて整える。',plant:'机の外で、ゆっくり育つもの。'})[id]||('机を離れる時間も、机に戻る時間も。'+name+'を暮らしに加える。'),kind,...extra});
export const ITEMS=[...EXPANDED_CATALOG,
 ...CATALOG,
 item('timer','学習タイマー','机まわり',1800,{study:.012},'学習効率 +1.2%。机の上の小さなペースメーカー。'),
 item('lamp','調光デスクライト','机まわり',6800,{study:.018},'学習効率 +1.8%。暗い机を整える。'),
 item('chair','長く座れるチェア','机まわり',29800,{health:1.5},'毎週の体調回復 +1.5。'),
 item('desk','広い学習机','机まわり',24800,{study:.025},'学習効率 +2.5%。教材を広げて使える。'),
 item('earplugs','耳栓','机まわり',900,{stress:-.6},'毎週ストレス −0.6。小さな騒音対策。'),
 item('headphones','ノイズキャンセルヘッドホン','デジタル',24800,{study:.025},'学習効率 +2.5%。'),
 item('tablet','答案整理タブレット','デジタル',49800,{review:1.5},'復習1コマあたり、復習残りを追加で −1.5。'),
 item('printer','答案印刷プリンター','デジタル',16800,{prep:.05},'形式別演習・過去問の効率 +5%。'),
 item('dictionary','電子辞書','デジタル',22800,{english:.05},'英語の学習効率 +5%。'),
 item('watch','試験用アナログ時計','デジタル',4800,{exam:.18},'試験当日の取りこぼし幅を0.18縮小。得点の直接加算なし。'),
 item('mathbook','数学の基本解法集','参考書',2400,{math:.04},'数学の学習効率 +4%。読む時間は別に必要。'),
 item('englishbook','英文構造の演習帳','参考書',2200,{english:.04},'英語の学習効率 +4%。'),
 item('physicsbook','物理の立式ノート','参考書',2600,{physics:.04},'物理の学習効率 +4%。'),
 item('chembook','化学の標準問題集','参考書',2500,{chemistry:.04},'化学の学習効率 +4%。'),
 item('japanesebook','古典と現代文の演習帳','参考書',2400,{japanese:.05},'国語の学習効率 +5%。'),
 item('socialbook','地歴公民・資料問題集','参考書',1800,{social:.05},'地歴公民の学習効率 +5%。'),
 item('infobook','情報Ⅰの演習ノート','参考書',1800,{info:.05},'情報Ⅰの学習効率 +5%。'),
 item('redpen','添削用ペンセット','参考書',1200,{writing:.04},'記述添削の効率 +4%。'),
 item('mistakes','間違いノートセット','参考書',1400,{review:1},'復習1コマあたり復習残りを追加で −1。'),
 item('pillow','自分に合う枕','暮らし',8800,{health:1.2},'毎週の体調回復 +1.2。'),
 item('curtains','遮光カーテン','暮らし',6400,{health:1},'毎週の体調回復 +1。'),
 item('kettle','電気ケトル','暮らし',4200,{stress:-.5},'毎週ストレス −0.5。'),
 item('plant','小さな観葉植物','暮らし',2200,{spirit:.8},'毎週の余白 +0.8。'),
 item('speaker','小さなスピーカー','暮らし',9800,{spirit:1.2},'毎週の余白 +1.2。'),
 item('shoes','歩きやすい靴','お出かけ',9800,{travelFatigue:2},'外出時の移動疲労を2軽減。'),
 item('bag','軽い旅行バッグ','お出かけ',12800,{travelDiscount:.08},'外出の交通費を8%軽減。'),
 item('camera','ポケットカメラ','お出かけ',32800,{outingSpirit:4},'外出で得る余白 +4。'),
 item('mic','通話用マイク','交流',8900,{talk:2},'ライブトークのストレス回復 +2。'),
 item('cards','会話カードゲーム','交流',1800,{meetup:2},'オフ会の相性点 +2。悪いメンツを帳消しにはできない。'),
 item('tea','お気に入りのお茶','消耗品',650,{stress:-5,spirit:3},'その週に使う。ストレス −5、余白 +3。','use'),
 item('meal','栄養のあるお弁当','消耗品',1200,{health:6},'その週に使う。体調 +6。','use'),
 item('bath','入浴剤','消耗品',700,{health:3,stress:-4},'その週に使う。体調 +3、ストレス −4。','use'),
 item('sweets','差し入れのお菓子','消耗品',1400,{meetupOnce:4},'その週のオフ会の相性点 +4。','use'),
 item('print','模擬答案用紙パック','消耗品',800,{prepOnce:.08},'その週の形式別演習効率 +8%。','use'),
 item('coffee','ちょっといいコーヒー','消耗品',500,{spirit:5,health:-1},'その週に使う。余白 +5、体調 −1。','use')
].map(enrichBook);
export const ITEM_MAP=Object.fromEntries(ITEMS.map(x=>[x.id,x]));
export function newLifestyle(home=12){return {home:Number(home),spirit:42,inventory:{},books:{},bookProgress:{},bookApproaches:{},usedWeek:[],effects:{},purchases:[],passport:[],memories:[],lastTalk:null,talkStreak:0,secret:{mode:'off',allocation:['math','english']},outing:{pref:Number(home),kind:'walk'},meetup:{guests:['meme','roiko','patsu'],venue:'outing',topic:'daily',mode:'solo',game:'cooperate'},talk:'friends',caught:0};}
export function gear(s,key){const values=ITEMS.filter(i=>i.kind==='gear'&&!i.subject&&s.lifestyle?.inventory[i.id]).map(i=>i.effect[key]||0).sort((a,b)=>Math.abs(b)-Math.abs(a));const n=values.slice(0,3).reduce((a,v,i)=>a+v/(i+1),0);const caps={study:.10,writing:.08,prep:.08,health:3,spirit:2,review:2,stress:1.5,meetup:2,talk:3};return Math.sign(n)*Math.min(caps[key]??(['math','english','physics','chemistry','japanese','social','info'].includes(key)?.08:10),Math.abs(n));}
export function equippedBook(s,id){const key=s.lifestyle.books?.[id];return key?ITEM_MAP[key]:null;}
export function equipBook(state,id){if(state.phase!=='study'||state.pending)throw Error('先に出来事を確認してください。');const item=ITEM_MAP[id];if(!item?.subject||!state.lifestyle.inventory[id])throw Error('持っている参考書を選んでください。');const s=clone(state);s.lifestyle.books=s.lifestyle.books||{};s.lifestyle.books[item.subject]=id;return s;}
export function bookBoost(s,id,method){const book=equippedBook(s,id);if(!book||book.track&&book.track!==s.curriculum.social)return 0;return book.method===method?.035:.008;}
export function shopPrice(s,i){return Math.round(i.price*(s.week%12===8&&i.category==='参考書'?.85:1));}
export function buyItem(state,id){const s=clone(state),i=ITEM_MAP[id];if(!i)throw new Error('品物が見つかりません。');if(s.phase!=='study'||s.pending)throw new Error('出来事を確認してから買い物へ。');if(i.kind==='gear'&&s.lifestyle.inventory[id])throw new Error('すでに持っています。');if((s.lifestyle.inventory[id]||0)>=5)throw new Error('消耗品は各5個まで持てます。');const price=shopPrice(s,i);if(s.cash<price)throw new Error('手持ちが足りません。');s.cash-=price;s.spent+=price;s.lifestyle.inventory[id]=(s.lifestyle.inventory[id]||0)+1;s.lifestyle.purchases.push({id,price,week:s.week,year:s.yearIndex});if(i.subject){s.lifestyle.books=s.lifestyle.books||{};if(!s.lifestyle.books[i.subject])s.lifestyle.books[i.subject]=id;}return s;}
export function useItem(state,id){const s=clone(state),i=ITEM_MAP[id];if(s.phase!=='study'||s.pending)throw new Error('出来事を確認してから使ってください。');if(!i||i.kind!=='use'||!s.lifestyle.inventory[id])throw new Error('使えるアイテムがありません。');if(s.lifestyle.usedWeek.length>=2)throw new Error('消耗品は週2個までです。');if(s.lifestyle.usedWeek.includes(id))throw new Error('同じ品は週1個までです。');s.lifestyle.inventory[id]--;s.lifestyle.usedWeek.push(id);for(const [k,v]of Object.entries(i.effect)){if(k==='spirit')s.lifestyle.spirit=clamp(s.lifestyle.spirit+v);else if(['health','stress'].includes(k))s[k]=clamp(s[k]+v);else s.lifestyle.effects[k]=(s.lifestyle.effects[k]||0)+v;}return s;}
export function configureLife(state,section,value){if(state.phase!=='study'||state.pending)throw new Error('先に出来事を確認してください。');const s=clone(state),l=s.lifestyle;
 if(section==='outing'){if(!PREFECTURES[value.pref]||!OUTINGS[value.kind])throw new Error('行き先と過ごし方を選んでください。');l.outing={pref:Number(value.pref),kind:value.kind};}
 else if(section==='talk'){if(!TALK_ROOMS[value])throw new Error('話す部屋を選んでください。');l.talk=value;}
 else if(section==='meetup'){if(!Array.isArray(value.guests)||value.guests.length<2||value.guests.length>4||new Set(value.guests).size!==value.guests.length||value.guests.some(id=>!GUESTS.some(g=>g.id===id)))throw new Error('参加者は2〜4人で選んでください。');l.meetup={venue:'outing',guests:[...value.guests],topic:MEETUP_TOPICS[value.topic]?value.topic:'daily',mode:value.mode==='group'?'group':'solo',game:H.TABLE_STYLES[value.game]?value.game:'cooperate'};}
 else if(section==='secret'){if(!['off','on'].includes(value.mode)||!Array.isArray(value.allocation)||value.allocation.length!==2||value.allocation.some(id=>!['math','english','physics','chemistry','japanese','social','info'].includes(id)))throw new Error('内職は2つの配分先を選んでください。');l.secret={mode:value.mode,allocation:[...value.allocation]};}
 else throw new Error('設定が見つかりません。');return s;}
export function tripQuote(s){const l=s.lifestyle,v=VENUE_MAP[l.outing.venue],p=PREFECTURES[v?.pref??l.outing.pref],home=PREFECTURES[l.home],exhibition=v?activeExhibitions(s,v.id).find(e=>e.id===l.outing.exhibition):null,kind=v?{name:v.category,...VENUE_EFFECTS[v.category],cost:venueFee(s,v)+(exhibition?.budget||0)+(v.foodBudget??900)}:OUTINGS[l.outing.kind],distance=Math.abs(home.region-p.region),same=p.id===home.id,far=!!v?.island||[0,7].includes(p.region)&&home.region!==p.region||[0,7].includes(home.region)&&home.region!==p.region;
 const blocks=far?4:same?2:distance<=1?3:4,base=v?.island?24000:far?26000:same?600:distance<=1?5200:distance<=3?12800:19800,discount=Math.min(.2,gear(s,'travelDiscount')+(same&&!far?gear(s,'localTravelDiscount'):0)),travel=Math.round(base*(1-discount));return {pref:p,kind,venue:v,exhibition,blocks,cost:travel+kind.cost,travel,entry:v?venueFee(s,v):null,food:v?(v.foodBudget??900):null,exhibitionCost:exhibition?.budget||0,fatigue:Math.max(0,(blocks-2)*3-gear(s,'travelFatigue')),novel:v?!(l.visits||[]).includes(v.id):!l.passport.includes(p.id)};}

export function meetupQuote(s){const l=s.lifestyle,people=l.meetup.guests.map(id=>GUESTS.find(g=>g.id===id)).filter(Boolean),venue={bonus:1},q=tripQuote(s),topic=l.meetup.topic||'daily',match={daily:'日常',hobby:'趣味',study:'勉強',debate:'考察'}[topic];let vibe=people.reduce((n,g)=>n+g.vibe+(g.topic===match?2:0)+(draw(s.seed,`mood:${s.yearIndex}:${s.week}:${g.id}`)-.5)*12,0)/Math.max(1,people.length)+venue.bonus+gear(s,'meetup')+(l.effects.meetupOnce||0);if(topic==='debate'&&people.some(g=>g.id==='nyama')&&people.some(g=>g.id==='yumaru'))vibe-=5;if(topic==='study'&&s.stress>65)vibe-=5;if(topic==='debate'&&people.length===4)vibe-=3;if(l.memories.slice(-2).every(m=>m.kind==='meetup')&&l.memories.length>=2)vibe-=2;return {people,vibe,cost:q.cost,blocks:q.blocks,venue:q.venue,stress:vibe>=7?-22:vibe>=3?-9:vibe>=0?4:12,spirit:vibe>=7?23:vibe>=3?12:vibe>=0?-2:-9,label:vibe>=7?'話が弾みそう':vibe>=3?'穏やかに話せそう':vibe>=0?'少し気疲れしそう':'今日は噛み合わないかも'};}
export function migrateSocial(s){const m=s.lifestyle.meetup;m.guests=[...new Set(m.guests.map(id=>GUEST_LEGACY[id]||id).filter(id=>GUESTS.some(g=>g.id===id)))];if(m.guests.length<2)m.guests=['meme','roiko'];m.topic=m.topic||'daily';m.venue='outing';m.mode=m.mode||'solo';m.game=m.game||'cooperate';H.ensureSocial(s);s.lifestyle.books=s.lifestyle.books||{};s.lifestyle.bookProgress=s.lifestyle.bookProgress||{};s.lifestyle.bookApproaches=s.lifestyle.bookApproaches||{};return s;}

export function lifestyleCost(s,c){return c.outing||c.meetup?tripQuote(s).cost:0;}
export function secretBudget(s,blocks){return s.job==='tutor'&&s.lifestyle.secret.mode==='on'?Math.min(4,blocks*2):0;}
export function caughtThisWeek(s,blocks){return secretBudget(s,blocks)>0&&roll((s.seed^Math.imul(s.week+1,2654435761)^0x39A18713)>>>0)<.005;}
export function lifestyleStep(s,c,eff,preview=false){const l=s.lifestyle,notes=[],memories=[];let hangout=null;l.spirit=clamp(l.spirit-4+gear(s,'spirit'));s.health=clamp(s.health+gear(s,'health'));s.stress=clamp(s.stress+gear(s,'stress'));
 if(c.outing||c.meetup){const t=tripQuote(s),m=c.meetup?meetupQuote(s):null,novelty=t.novel?1:.75,stress=m?t.kind.stress*.3*novelty+m.stress*.65:t.kind.stress*novelty,spirit=m?t.kind.spirit*.4*novelty+m.spirit*.55:t.kind.spirit*novelty;s.health=clamp(s.health+t.kind.health-t.fatigue);s.stress=clamp(s.stress+stress);l.spirit=clamp(l.spirit+spirit+gear(s,'outingSpirit'));if(!l.passport.includes(t.pref.id))l.passport.push(t.pref.id);if(t.venue){l.visits=l.visits||[];if(!l.visits.includes(t.venue.id))l.visits.push(t.venue.id);if(t.exhibition){l.exhibitions=l.exhibitions||[];l.exhibitions.push(t.exhibition.id);}}if(m){s.journey.bonds.friend=clamp(s.journey.bonds.friend+(m.vibe>=3?4:-2));if(!preview)hangout=H.beginHangout(s,t,m);}memories.push({kind:m?'meetup':'outing',socialKey:hangout?.key,venue:t.venue?.id,title:t.pref.name+' · '+(t.venue?.name||t.kind.name),text:m?'一緒に過ごした日の続きを、会話で選ぼう。':t.venue?venueMemory(s,t.venue,t.exhibition):t.pref.line,people:m?.people.map(g=>g.name),stress:Math.round(stress),spirit:Math.round(spirit),cost:t.cost});}
 if(c.talk){if(!preview)H.liveConversation(s);const room=TALK_ROOMS[l.talk],streak=l.lastTalk===l.talk?l.talkStreak+1:1,factor=streak>3?.65:1;let stress=(room.stress-gear(s,'talk'))*factor*c.talk;if(l.talk==='exam'&&!preview&&roll(s.seed^s.week^0x18B563)<.25)stress=5; s.stress=clamp(s.stress+stress);l.spirit=clamp(l.spirit+room.spirit*factor*c.talk);if(l.talk==='exam')s.interview+=.5*c.talk;l.lastTalk=l.talk;l.talkStreak=streak;memories.push({kind:'talk',title:'ライブトーク · '+room.name,text:stress>0?'成績の比べ合いになり、少し疲れてしまった。':'声に出して話したら、気持ちが軽くなった。',stress:Math.round(stress),spirit:Math.round(room.spirit*factor*c.talk),cost:0});}else l.talkStreak=0;
 const budget=secretBudget(s,c.work),gains={};if(budget){for(const id of l.secret.allocation){const gain=.07*(budget/2)*eff;s.skills[id]=s.skills[id]+gain;gains[id]=(gains[id]||0)+gain;}notes.push(`塾講の合間に内職 ${budget*15}分。小さく学習を進めた。`);}else if(c.work&&s.job==='tutor'){s.journey.work.reliability=clamp(s.journey.work.reliability+2);notes.push('授業に専念。職場の信頼 +2。');}
 if(l.spirit<20){s.stress=clamp(s.stress+3);notes.push('毎日が勉強と仕事だけになり、余白が減っている。');}
 for(const m of memories){notes.push(m.title+'：'+m.text);if(!preview)l.memories.push({...m,week:s.week,year:s.yearIndex});}l.memories=l.memories.slice(-80);const caught=!preview&&caughtThisWeek(s,c.work);if(caught)l.caught++;
 l.usedWeek=[];l.effects={};return {notes,memories,gains,caught,hangout};}
export function resolveCaught(state,response){const s=clone(state);if(s.pending?.kind!=='caught')throw new Error('塾長との話はありません。');const choices={apology:{name:'謝って、次の授業準備を手伝う',stress:10,trust:-12},explain:{name:'事情を説明し、今後は授業に専念する',stress:14,trust:-20},leave:{name:'謝罪して、塾講を辞める',stress:7,trust:-25}};const c=choices[response];if(!c)throw new Error('対応を選んでください。');s.stress=clamp(s.stress+c.stress);s.journey.work.reliability=clamp(s.journey.work.reliability+c.trust);s.lifestyle.secret.mode='off';if(response==='apology')s.journey.commitments.push({name:'塾の授業準備を手伝う',week:s.week,blocks:1,effect:{}});if(response==='leave'){s.job='short';s.journey.work.contract='flex';}s.journey.choices.push({week:s.week-1,year:s.yearIndex,title:'塾長に内職が見つかった',choice:c.name});s.log.unshift({week:s.week-1,year:s.yearIndex,text:'塾長に叱られた。'+c.name+'。'});s.pending=s.pending.next||null;return s;}
