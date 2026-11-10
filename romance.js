import {draw} from './exams.js?v=8.6';

// These adults and all conversations below are invented for this game.
// They do not use the existing friends, chat exports, contacts, or a real app.
export const FICTIONAL_PEOPLE=[
 {id:'fictional-shiori',name:'栞',age:'20代後半',intro:'休日は小さな映画館や書店に行く。話す日と一人の時間をどちらも大切にしたい。'},
 {id:'fictional-haru',name:'晴',age:'20代後半',intro:'散歩しながら新しい喫茶店を探す。予定を詰め込みすぎない方が落ち着く。'},
 {id:'fictional-sumi',name:'澄',age:'30代前半',intro:'音楽と料理が好き。知らないことを教え合えると楽しい。'},
 {id:'fictional-ren',name:'蓮',age:'20代後半',intro:'美術館とボードゲームが好き。まずは気軽に話してみたい。'}
];
const PEOPLE=Object.fromEntries(FICTIONAL_PEOPLE.map(p=>[p.id,p]));
export const ROMANCE_ACTIONS={
 introduce:{name:'はじめの連絡',blocks:1,cost:300},
 message:{name:'やり取りする',blocks:1,cost:0},
 meet:{name:'会う相談をする',blocks:1,cost:1200},
 ask:{name:'交際について話す',blocks:1,cost:0}
};
export const ROMANCE_TOPICS={daily:'近況を話す',listen:'相手に聞く',brief:'短く連絡する'};
// Short original exchanges, distinct from the existing friend conversations.
const exchanges={
 'fictional-shiori':{
  daily:[['今日は帰りに本屋をのぞいた。','栞','表紙で選んだ本、あとで読んだら当たりだった？'],['予定より遅く机を片付けた。','栞','私も映画のあと、本屋に寄ると時間を忘れる。']],
  listen:[['最近観た映画、どうだった？','栞','最後より、途中で黙る場面が残った。'],['本はどこから読む？','栞','あとがきを先に見る日もある。秘密にはしてない。']],
  brief:[['今日は短く、おやすみ。','栞','おやすみ。続きはまた今度。'],['今週は少し忙しそう。','栞','了解。返事は落ち着いてからでいいよ。']]
 },
 'fictional-haru':{
  daily:[['帰り道を少し遠回りした。','晴','曲がる角を一つ変えるだけでも景色が違うよね。'],['今日はあたたかい飲み物にした。','晴','散歩の途中で買うと、持って帰る頃にちょうど飲める。']],
  listen:[['最近歩いた場所は？','晴','川のそば。途中に座れるところがあって助かった。'],['喫茶店は何で選ぶ？','晴','長くいられそうか、窓の外を見て決めることが多い。']],
  brief:[['今日はここまでにする。','晴','うん、続きは歩ける日に。'],['今週もおつかれさま。','晴','そっちも。まずゆっくり休んで。']]
 },
 'fictional-sumi':{
  daily:[['今日は料理を一つ作った。','澄','何を入れた？ 分量より順番を聞きたい。'],['帰りに音楽を聴いた。','澄','一曲だけ選ぶとしたら、どの場面で流したい？']],
  listen:[['最近よく作るものは？','澄','野菜を焼くだけの日もある。片付けが少なくて済む。'],['練習はどこから始める？','澄','うまく弾けたところから。手を温めてから難しいところへ。']],
  brief:[['返事は短くするね。','澄','大丈夫。また聞きたい時に聞くよ。'],['今日はもう休もうと思う。','澄','いいね。残りの話は取っておく。']]
 },
 'fictional-ren':{
  daily:[['今日は少し寄り道した。','蓮','予定にない場所？ それなら何が目に入った？'],['ゲームのルールを読み直した。','蓮','一回遊んでから読むと、気になる行が変わるよね。']],
  listen:[['展示では何を先に見る？','蓮','入口に戻って、最初に目が止まったものをもう一度見る。'],['ゲームを選ぶ時は？','蓮','勝つまでの時間より、終わったあと話せるかを考える。']],
  brief:[['今日はこの辺で。','蓮','了解。また話せる時に。'],['今週は少し余裕がない。','蓮','返事は後で大丈夫。おつかれさま。']]
 }
};
const moreExchanges={
 'fictional-shiori':{
  daily:[['読みかけの本にしおりを挟んだ。','栞','続きが楽しみなところで閉じるのもいいね。']],
  listen:[['映画は一人でも観に行く？','栞','行くよ。誰かと話したい時は後で誘う。']],
  brief:[['今日は少し眠い。','栞','それなら、続きより睡眠を優先しよう。'],['返事は明日になるかも。','栞','了解。空いた時で大丈夫。']]
 },
 'fictional-haru':{
  daily:[['雨が降る前に帰れた。','晴','ちょうどよかったね。私は傘だけ持って出た。']],
  listen:[['散歩の行き先は決める？','晴','決めない日もある。帰り道だけは覚えておくけど。']],
  brief:[['少しだけ外の空気を吸った。','晴','それだけでも、机の前とは違うね。'],['明日は朝が早い。','晴','じゃあ今日はこの辺で。またね。']]
 },
 'fictional-sumi':{
  daily:[['今日は野菜を切るだけで終わった。','澄','次に作る時の準備が一つ減ったね。']],
  listen:[['音楽を聴く時間は決めてる？','澄','料理中が多いかな。途中で止めても困らないから。']],
  brief:[['今日は返事が遅くなった。','澄','気にしなくていいよ。届いた時に読むから。'],['短く近況だけ。元気です。','澄','こちらも。知らせてくれてありがとう。']]
 },
 'fictional-ren':{
  daily:[['小さな展示の案内を見かけた。','蓮','規模が小さいと、一つずつ長く見られるね。']],
  listen:[['ゲームは何人くらいが好き？','蓮','人数より、ルールを聞き直せる雰囲気が好き。']],
  brief:[['今日はここまでにして寝る。','蓮','おやすみ。続きは残しておこう。'],['週末の予定はまだ未定。','蓮','決まってからでも、決まらなくても大丈夫。']]
 }
};
for(const [id,topics] of Object.entries(moreExchanges))for(const [topic,rows] of Object.entries(topics))exchanges[id][topic].push(...rows);
const partnerClosings=['次に会う日も、互いの予定を見てから決めよう。','話せる時に話す。それくらいで続けよう。'];
export const newRomance=()=>({version:1,auto:false,selected:null,queued:null,people:{},log:[],lastWeek:null});
const absoluteWeek=s=>s.yearIndex*48+s.week;
const person=(r,id)=>r.people[id]||null;
export function validateRomance(state){
 const r=state?.romance;if(r==null)return true;
 if(typeof r!=='object'||Array.isArray(r)||r.version!==1||typeof r.auto!=='boolean'||!r.people||typeof r.people!=='object'||Array.isArray(r.people)||!Array.isArray(r.log)||r.log.length>80)return false;
 if(r.selected!==null&&(typeof r.selected!=='string'||!Object.hasOwn(PEOPLE,r.selected)))return false;
 if(r.lastWeek!==null&&(!Number.isInteger(r.lastWeek)||r.lastWeek<0))return false;
 for(const [id,p] of Object.entries(r.people)){if(!Object.hasOwn(PEOPLE,id)||!p||!['talking','partner','declined','closed'].includes(p.status)||!Number.isInteger(p.messages)||p.messages<0||!Number.isInteger(p.meetings)||p.meetings<0)return false;}
 if(r.queued!==null&&(!r.queued||r.queued.id!==r.selected||typeof r.queued.kind!=='string'||!Object.hasOwn(ROMANCE_ACTIONS,r.queued.kind)||(r.queued.topic!==undefined&&(typeof r.queued.topic!=='string'||!Object.hasOwn(ROMANCE_TOPICS,r.queued.topic)))))return false;
 return r.log.every(x=>x&&Number.isInteger(x.year)&&x.year>=0&&Number.isInteger(x.week)&&x.week>=0&&x.week<48&&typeof x.id==='string'&&Object.hasOwn(PEOPLE,x.id)&&typeof x.kind==='string'&&Object.hasOwn(ROMANCE_ACTIONS,x.kind)&&typeof x.outcome==='string'&&typeof x.text==='string'&&(x.topic===undefined||typeof x.topic==='string'&&Object.hasOwn(ROMANCE_TOPICS,x.topic))&&(x.lines===undefined||Array.isArray(x.lines)&&x.lines.every(l=>l&&typeof l.name==='string'&&typeof l.text==='string')));
}
function read(state){if(!validateRomance(state))throw Error('出会いの記録が不正です。');return state.romance||newRomance();}
export function ensureRomance(state){if(!validateRomance(state))throw Error('出会いの記録が不正です。');if(!state.romance)state.romance=newRomance();return state;}
export function romanceView(state){
 const r=read(state),p=person(r,r.selected),profile=PEOPLE[r.selected]||null;
 return {auto:!!r.auto,selected:profile,relationship:p?{...p}:null,queued:r.queued?{...r.queued}:null,log:(r.log||[]).map(x=>({...x,...(x.lines?{lines:x.lines.map(l=>({...l}))}:{})})).reverse()};
}
export function setRomanceAuto(state,enabled){
 if(typeof enabled!=='boolean')throw Error('自動連絡の設定を選んでください。');
 const s=structuredClone(state);ensureRomance(s);s.romance.auto=enabled;return s;
}
export function cancelRomanceAction(state){const s=structuredClone(state);ensureRomance(s);s.romance.queued=null;return s;}
export function endRomance(state){
 const s=structuredClone(state);ensureRomance(s);const r=s.romance,p=person(r,r.selected);
 if(p)p.status='closed';r.queued=null;r.selected=null;r.auto=false;return s;
}
export function queueRomanceAction(state,id,kind,topic='daily'){
 if(state.phase!=='study'||state.pending)throw Error('先に今の出来事を確認してください。');
 if(typeof id!=='string'||typeof kind!=='string'||!Object.hasOwn(PEOPLE,id)||!Object.hasOwn(ROMANCE_ACTIONS,kind))throw Error('相手と行動を選んでください。');
 if(kind==='message'&&(typeof topic!=='string'||!Object.hasOwn(ROMANCE_TOPICS,topic)))throw Error('話題を選んでください。');
 const s=structuredClone(state);ensureRomance(s);const r=s.romance,p=person(r,id);
 if(r.queued)throw Error('先に予定した行動を取り消してください。');
 if(r.selected&&r.selected!==id)throw Error('今の相手との連絡を終えてから選んでください。');
 if(kind==='introduce'&&p)throw Error('この相手への最初の連絡は済んでいます。');
 if(kind!=='introduce'&&(!p||!['talking','partner'].includes(p.status)))throw Error('まず、お互いに話すことを選んでください。');
 if(kind==='meet'&&p.messages<2)throw Error('会う相談は、少しやり取りしてから選べます。');
 if(kind==='ask'&&(!p.meetings||p.status==='partner'))throw Error('交際の話は、会った後に選べます。');
 r.selected=id;r.queued={id,kind,...(kind==='message'?{topic}:{})};return s;
}
export function quoteRomance(state,{freeBlocks=0,availableCash=state.cash}={}){
 const r=read(state),p=person(r,r.selected),action=r.queued||(r.auto&&p&&['talking','partner'].includes(p.status)?{id:r.selected,kind:'message',topic:'brief'}:null);
 if(!action)return {available:false,reason:'予定された連絡はありません。',action:null,blocks:0,cost:0};
 if(!Object.hasOwn(PEOPLE,action.id)||!Object.hasOwn(ROMANCE_ACTIONS,action.kind))return {available:false,reason:'予定を確認してください。',action:null,blocks:0,cost:0};
 const eligible=action.id===r.selected&&(action.kind==='introduce'?!p:(!!p&&['talking','partner'].includes(p.status)&&(action.kind==='message'||action.kind==='meet'&&p.messages>=2||action.kind==='ask'&&p.meetings>0&&p.status==='talking')));
 if(!eligible)return {available:false,reason:'相手との予定を確認してください。',action:null,blocks:0,cost:0};
 const details=ROMANCE_ACTIONS[action.kind],result={action:{...action,...(action.kind==='message'?{topic:action.topic||'daily'}:{})},...details};
 if(r.lastWeek===absoluteWeek(state))return {...result,available:false,reason:'今週の連絡は済んでいます。'};
 if(!Number.isFinite(freeBlocks)||freeBlocks<details.blocks)return {...result,available:false,reason:'今週の空き時間が足りません。'};
 if(!Number.isFinite(availableCash)||availableCash<details.cost)return {...result,available:false,reason:'今週の手持ちが足りません。'};
 return {...result,available:true,reason:null};
}
// Called on the engine's cloned state, after its ordinary income and expenses.
// A preview never changes anything. The caller accounts for the returned cost in its report.
export function advanceRomance(state,{freeBlocks=0,preview=false}={}){
 const q=quoteRomance(state,{freeBlocks,availableCash:state.cash});
 if(preview||!q.available)return {...q,executed:false,preview:!!preview};
 ensureRomance(state);const r=state.romance,{id,kind}=q.action,key=`romance:${state.yearIndex}:${state.week}:${id}:${kind}`,chance=draw(state.seed,key);let p=person(r,id),text,outcome,lines;
 const charged=kind==='meet'&&chance>=.8?0:q.cost;state.cash-=charged;state.spent+=charged;r.lastWeek=absoluteWeek(state);r.queued=null;
 if(kind==='introduce'){
  if(chance<.75){p=r.people[id]={status:'talking',messages:0,meetings:0};text='お互いに、少しずつ話してみることにした。';outcome='accepted';}
  else{p=r.people[id]={status:'declined',messages:0,meetings:0};text='今回は相手が見送ることにした。返事を受け止めて、ここで終える。';outcome='declined';r.selected=null;r.auto=false;}
 }else if(kind==='message'){
  p.messages++;const topic=q.action.topic||'daily',variants=exchanges[id][topic],pair=variants[(p.messages-1+state.yearIndex)%variants.length];lines=[{name:'自分',text:pair[0]},{name:pair[1],text:pair[2]}];if(p.status==='partner')lines.push({name:PEOPLE[id].name,text:partnerClosings[(p.messages+state.yearIndex)%partnerClosings.length]});text=p.status==='partner'?'二人の近況を話した。互いの予定も大切にする。':'少し話して、返事を急がずに会話を終えた。';outcome='message';
 }else if(kind==='meet'){
  if(chance<.8){p.meetings++;text=p.status==='partner'?'二人の予定を確かめて会った。次に会う日は、今日決めずに帰った。':'都合を確かめ、無理のない時間に会った。帰る時間も先に決めた。';outcome='accepted';}
  else{text='今回は会う予定を見送ることになった。返事を急がず、連絡は続けられる。';outcome='declined';r.auto=false;}
 }else{
  if(chance<.65){p.status='partner';text='交際について話し、二人とも付き合ってみたいと伝えた。';outcome='accepted';}
  else{text='交際は今は選ばないと相手が伝えた。返事を尊重し、距離を考える。';outcome='declined';r.auto=false;}
 }
 const entry={year:state.yearIndex,week:state.week,id,kind,outcome,text,...(kind==='message'?{topic:q.action.topic,lines}:{})};r.log.push(entry);r.log=r.log.slice(-80);
 return {...q,cost:charged,maximumCost:q.cost,executed:true,outcome,text,entry};
}
