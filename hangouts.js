import {OUTING_STORIES} from './outing-stories.js?v=8.6';
import {FRIENDS} from './social.js?v=8.6';
import {LIVE_SCENES as live} from './open-chat-scenes.js?v=8.6';
import {draw} from './exams.js?v=8.6';
import {justiceBlocked} from './justice-story.js?v=8.6';
export const TABLE_STYLES={cooperate:'協力して同じ目標へ',light:'短いルールで何度も遊ぶ',bluff:'駆け引きと正体隠匿',strategy:'じっくり作戦を練る'};
const cap=(x)=>Math.max(0,Math.min(100,x));
export function validateSocial(s){const x=s.social;if(x==null)return true;if(typeof x!=='object'||Array.isArray(x))return false;
 if(x.bonds!==undefined&&(!x.bonds||typeof x.bonds!=='object'||Array.isArray(x.bonds)))return false;
 if(x.bonds!==undefined&&Object.values(x.bonds).some(n=>!Number.isFinite(n)||n<0||n>100))return false;
 for(const k of ['seen','trips','messages'])if(x[k]!==undefined&&!Array.isArray(x[k]))return false;
 if(x.messages?.some(m=>!m||typeof m!=='object')||x.trips?.some(t=>!t||typeof t!=='object'))return false;
 if(x.liveCount!==undefined&&(!Number.isSafeInteger(x.liveCount)||x.liveCount<0))return false;
 if(x.liveSeed!==undefined&&(!Number.isSafeInteger(x.liveSeed)||x.liveSeed<0||x.liveSeed>0xffffffff))return false;
 if(x.liveCounts!==undefined&&(!x.liveCounts||typeof x.liveCounts!=='object'||Array.isArray(x.liveCounts)||Object.values(x.liveCounts).some(n=>!Number.isSafeInteger(n)||n<0)))return false;
 if(x.lastLive!==undefined&&x.lastLive!==null&&(!x.lastLive||typeof x.lastLive!=='object'||!Array.isArray(x.lastLive.lines)))return false;
 return true;}
export function ensureSocial(s){if(!validateSocial(s))throw Error('交流の記録を確認できません。');if(s.social==null)s.social={};const x=s.social;for(const [k,initial] of Object.entries({bonds:{},seen:[],trips:[],messages:[],liveCount:0,liveSeed:s.seed>>>0,liveCounts:{},lastLive:null}))if(x[k]===undefined)x[k]=initial;return x;}
const priorities={lead:['meme','patsu','roiko','shiro','tsuchida'],quiet:['deme','airi','roiko','gechimake','shiro'],think:['nanku','kota','sasami','yumaru','nyama']};
// Resolve all explicit names first; generic speakers use other attendees. No absent actor is invented.
export function dialogLines(lines,people){const ids=people.map(x=>typeof x==='string'?x:x.id),explicit=new Set(lines.map(x=>x[0]).filter(r=>ids.includes(r))),assigned={},used=new Set(explicit);for(const [r]of lines){if(assigned[r])continue;if(ids.includes(r))assigned[r]=r;else {const candidates=[...(priorities[r]||[]),...ids].filter(id=>ids.includes(id));assigned[r]=candidates.find(id=>!used.has(id))||candidates[0];used.add(assigned[r]);}}
 let last=null;return lines.map(([r,text],i)=>{let id=assigned[r];if(id===last&&lines[i-1]?.[0]!==r){if(!ids.includes(r))id=ids.find(x=>x!==last)||id;else if(i){/* explicit roles were reserved before assigning generic roles */}}last=id;return {id,name:FRIENDS.find(x=>x.id===id)?.name||'友人',text};});}
function category(s,q){return q.venue?.category||({walk:'街歩き',food:'食べ歩き',culture:'美術館',spa:'温泉',park:'遊園地',badminton:'スポーツ',pingpong:'スポーツ',bouldering:'スポーツ',bowling:'スポーツ',karaoke:'カラオケ',board:'ボードゲームカフェ'})[s.lifestyle.outing.kind]||'街歩き';}
export function beginHangout(s,q,m){const social=ensureSocial(s),ids=m.people.map(x=>x.id),cat=category(s,q),kind=s.lifestyle.outing.kind,game=s.lifestyle.meetup.game||'cooperate',key=s.yearIndex+':'+s.week;const eligible=OUTING_STORIES.filter(x=>(x.category===cat||x.category==='any')&&(!x.requires||x.requires.every(id=>ids.includes(id)))&&(!x.kind||x.kind===kind)&&(!x.game||x.game===game));const unseen=eligible.filter(x=>!social.seen.includes(x.id)),pool=unseen.length?unseen:eligible,special=pool.filter(x=>x.category===cat),choices=special.length?special:pool,story=choices[Math.floor(draw(s.seed,'hangout:'+key)*choices.length)];return {key,story:story.id,title:story.title,place:q.venue?.name||q.kind.name,pref:q.pref.name,category:cat,people:ids,stage:0,week:s.week,year:s.yearIndex,image:cat==='ボードゲームカフェ'?'idle-dance':cat==='水族館'?'peek':'celebrate',cost:q.cost,transcript:[],decisions:[],changes:{stress:0,spirit:0,health:0,writing:0},vibe:m.vibe};}
export function hangoutView(s){const h=s.pending?.hangout;if(!h)return null;const st=OUTING_STORIES.find(x=>x.id===h.story),lines=h.stage===0?dialogLines(st.lines,h.people):h.stage===1?dialogLines(st.secondLines,h.people):[];
 if(h.stage===0){
  // A callback must come from an actual previous outing with a present attendee.
  const previous=[...(s.social?.trips||[])].reverse().find(t=>t.key!==h.key&&Array.isArray(t.people)&&t.people.some(id=>h.people.includes(id)));
  const id=previous?.people.find(id=>h.people.includes(id)),person=FRIENDS.find(p=>p.id===id);
  if(person){const decision=Array.isArray(previous.decisions)?previous.decisions.at(-1):null,place=typeof previous.place==='string'&&previous.place?previous.place:'この前の場所';
   const answer=[...(s.social?.messages||[])].reverse().find(m=>m.person===id&&m.reply&&Number.isFinite(m.due)&&m.due<=s.yearIndex*48+s.week);
   const text=answer?.replyMode==='later'?'前は忙しい中で返事ありがとう。今日はゆっくり話そう。':typeof decision==='string'&&decision?'「'+place+'」で、あなたが「'+decision+'」って言ったのを思い出した。':'「'+place+'」のときの話、また聞かせて。';
   lines.push({id:person.id,name:person.name,text});}}

 return {...h,body:h.stage===0?st.body:h.stage===1?st.second:'帰り道の話を、今日のページに残した。次に会った時には、また違う続きがある。',lines,choices:h.stage===0?st.choices:h.stage===1?st.secondChoices:[],previous:h.transcript.slice(-2)};}
const effects={reason:{stress:1,spirit:1,health:-.5,writing:.16},listen:{stress:-1,spirit:1,health:0,writing:.06},play:{stress:-1,spirit:4,health:-2,writing:0},quiet:{stress:-3,spirit:0,health:1,writing:0},share:{stress:0,spirit:3,health:-.5,writing:0},observe:{stress:-1,spirit:2,health:-1,writing:.08},promise:{stress:-2,spirit:1,health:0,writing:0}};
export const CHOICE_HINTS={reason:'考える時間を使って、理由を確かめる。',listen:'自分の話は後にして、相手の話を聞く。',play:'もう少し遊ぶ。帰る頃の疲れも考えたい。',quiet:'ペースを落とす。見られるものは少なくなる。',share:'自分の話を出して、会話を広げる。',observe:'足を止めて、細かいところを見る。',promise:'今日の続きは、次に持ち越す。'};
function followup(h,id){const name=FRIENDS.find(g=>g.id===id).name;const selected=h.decisions.at(-1);return {id:h.key+':'+id,person:id,name,due:h.year*48+h.week+3,place:h.place,body:id==='nanku'?(h.category==='ボードゲームカフェ'?'あの手番、帰ってからもう一回ルールを読んだ。次は説明の順番を変えると伝わりそう。':'あの話、帰ってからもう少し調べてた。次会ったら、続き聞いて。'):id==='kota'?(h.category==='ボードゲームカフェ'?'あの時選ばなかった一手、まだ考えてる。写真、撮っておいてよかった。':'写真を見返してた。次は、今回見なかったところも見たいな。'):id==='meme'?'この前の「'+selected+'」の話、覚えてる。次も、無理のない時間で会おう。':id==='nyama'?'この前、何を比べてたんだろうって帰ってから考えてた。結論よりそこが気になった。':id==='patsu'?'写真見返した。あの一枚、いいね。':id==='deme'?'感想を一つにまとめないで話せたの、よかった。':id==='roiko'?'次、どこにする？ 近い所もいいね。':id==='yumaru'?'この前の話、見方を変えるともう一つ続きがありそう。また聞いてほしい。':id==='sasami'?'この前の話から、ちょっと面白い問題を思いついた。すぐ答えなくていいから、今度見て。':'「'+h.place+'」の話、写真を見て思い出した。次はもう少しゆっくり回ってもいいね。',reply:null};}
export function resolveHangout(state,index){if(state.pending?.kind!=='hangout')throw Error('先に今の出来事を読もう。');const s=structuredClone(state),h=s.pending.hangout,view=hangoutView(s),social=ensureSocial(s);if(h.stage<2){const choice=view.choices[index];if(!choice)throw Error('どう過ごすか選ぼう。');h.transcript.push(...view.lines,{id:'player',name:'自分',text:choice.label},{id:h.people[(h.stage+1)%h.people.length],name:FRIENDS.find(x=>x.id===h.people[(h.stage+1)%h.people.length]).name,text:choice.reply});h.decisions.push(choice.label);for(const[k,v]of Object.entries(effects[choice.style]))h.changes[k]+=v;h.stage++;return s;}
 if(index!==-1)throw Error('帰り道へ進もう。');s.stress=cap(s.stress+h.changes.stress);s.health=cap(s.health+h.changes.health);s.lifestyle.spirit=cap(s.lifestyle.spirit+h.changes.spirit);s.writing+=h.changes.writing;social.trips.push({...h});social.trips=social.trips.slice(-40);social.seen=[...new Set([...social.seen,h.story])];for(const id of h.people)social.bonds[id]=Math.min(100,(social.bonds[id]??20)+(h.vibe>=3?3:1));const author=h.people[Math.floor(draw(s.seed,'followup:'+h.key)*h.people.length)];social.messages.push(followup(h,author));while(social.messages.length>50){const answered=social.messages.findIndex(x=>x.reply);if(answered<0)break;social.messages.splice(answered,1);}const memory=s.lifestyle.memories.find(x=>x.socialKey===h.key);if(memory)memory.text=h.title+'。'+h.decisions.join('。')+'。';s.world.journal.push({week:h.week,year:h.year,title:h.title,text:h.transcript.at(-1).text,image:h.image});s.world.journal=s.world.journal.slice(-180);s.pending=s.pending.next||null;return s;}
export function nextMessage(s){return ensureSocial(s).messages.find(m=>!m.reply&&m.due<=s.yearIndex*48+s.week)||null;}
const replies={continue:[['覚えてる。あの話、もう少し聞きたい。','うん、次に話せるときに続きを。'],['話してくれてありがとう。続きはまた今度。','こちらこそ。またゆっくり話そう。'],['あの日の続きを聞けるの、楽しみにしてる。','じゃあ、そのときに思い出しながら話そう。']],later:[['今は少し忙しいけど、また落ち着いたら話そう。','分かった。返事は急がなくて大丈夫。'],['覚えてるよ。今日は短い返事でごめんね。','読んでもらえただけでうれしい。またね。'],['今は手が離せないから、また時間のあるときに。','了解。続きはそのときにしよう。']]};
function messageVariant(id,mode){let h=2166136261;for(const c of String(id))h=Math.imul(h^c.charCodeAt(0),16777619);return replies[mode][(h>>>0)%replies[mode].length];}
function continuationBody(trip,mode){const place=typeof trip.place==='string'&&trip.place?trip.place:'この前の場所',endings={'ボードゲームカフェ':'あの遊び、帰ってからもう一度考えた。','水族館':'あの水槽を思い出して、写真を見返した。','食べ歩き':'あの日のおいしかったもの、また思い出してた。','スポーツ':'あの日の体の動かし方、少し思い出してた。','美術館':'あの展示のことを、もう少し考えてた。'},ending=Object.hasOwn(endings,trip.category)?endings[trip.category]:'あの日のことを、ふと思い出した。';return '「'+place+'」のあと、'+ending+(mode==='later'?' 返事は急がなくていいからね。':' 今度、続きを聞かせて。');}
export function answerMessage(state,id,mode){if(state.pending||state.phase!=='study'||justiceBlocked(state))throw Error('今の出来事を先に確認しよう。');const s=structuredClone(state),social=ensureSocial(s),matches=social.messages.filter(x=>x.id===id),m=matches[0];if(matches.length!==1||!m||m.reply||!Number.isSafeInteger(m.due)||m.due>s.yearIndex*48+s.week||!Object.hasOwn(replies,mode))throw Error('この連絡にはもう返事をした。');[m.reply,m.answer]=messageVariant(id,mode);m.replyMode=mode;m.answeredAt=s.yearIndex*48+s.week;
 // Only a recorded attendee may gain a relationship effect; legacy messages without evidence still work.
 const person=FRIENDS.find(p=>p.id===m.person),trip=person&&social.trips.find(t=>typeof t.key==='string'&&m.id===t.key+':'+m.person&&Array.isArray(t.people)&&t.people.includes(m.person));
 if(trip){social.bonds[m.person]=cap((social.bonds[m.person]??20)+(mode==='continue'?2:1));const nextId=m.id+':after',due=s.yearIndex*48+s.week+(mode==='continue'?3:5);if(Number.isSafeInteger(due)&&!social.messages.some(x=>x.id===nextId)){social.messages.push({id:nextId,person:m.person,name:person.name,due,place:trip.place,body:continuationBody(trip,mode),reply:null});while(social.messages.length>50){const answered=social.messages.findIndex(x=>x.reply);if(answered<0)break;social.messages.splice(answered,1);}}}
 s.lifestyle.spirit=cap(s.lifestyle.spirit+1);return s;}
// Shuffle each complete cycle deterministically; no scene repeats within a cycle.
function liveSceneIndex(seed,topic,n,length){
 const cycle=Math.floor(n/length),position=n%length;
 const orderFor=c=>{const order=Array.from({length},(_,i)=>i);for(let i=length-1;i>0;i--){const j=Math.floor(draw(seed,'live:'+topic+':'+c+':'+i)*(i+1));[order[i],order[j]]=[order[j],order[i]];}return order;};
 const order=orderFor(cycle);if(cycle>0&&length>2&&order[0]===orderFor(cycle-1).at(-1))[order[0],order[1]]=[order[1],order[0]];
 return order[position];
}
function liveCallback(s,social,topic,speakers,n){
 const now=s.yearIndex*48+s.week,ids=new Set(speakers.map(p=>p.id)),candidates=[];
 const m=[...social.messages].reverse().find(x=>ids.has(x.person)&&x.reply&&Number.isSafeInteger(x.answeredAt)&&now>=x.answeredAt&&now-x.answeredAt<=8);
 if(m){const p=speakers.find(p=>p.id===m.person),variants=m.replyMode==='later'?['この前は忙しい中、返事ありがとう。今日は少し話せる？','この前の返事、急がなくて大丈夫って伝えたかった。']:['この前の返事ありがとう。話の続きを考えてた。','この前の連絡、読んでくれてうれしかった。'];candidates.push({id:p.id,name:p.name,text:variants[n%variants.length]});}
 const trip=[...social.trips].reverse().find(t=>Array.isArray(t.people)&&t.people.some(id=>ids.has(id))&&Number.isFinite(t.year)&&Number.isFinite(t.week)&&now>=t.year*48+t.week&&now-(t.year*48+t.week)<=16);
 if(trip){const p=speakers.find(p=>trip.people.includes(p.id)),place=typeof trip.place==='string'&&trip.place?trip.place:'この前の場所',decision=Array.isArray(trip.decisions)&&typeof trip.decisions.at(-1)==='string'?trip.decisions.at(-1):null;const variants=['そういえば「'+place+'」でのこと、まだ覚えてる。','また「'+place+'」の話もしたいね。'];if(decision)variants.push('あの日「'+decision+'」って決めたの、今でも覚えてる。');candidates.push({id:p.id,name:p.name,text:variants[n%variants.length]});}
 const previous=social.lastLive,previousAt=previous?.year*48+previous?.week;
 if(previous?.room===topic&&Number.isFinite(previousAt)&&previousAt<=now&&now-previousAt<=8&&Array.isArray(previous.lines)){
  const p=speakers.find(p=>previous.lines.some(line=>line.id===p.id)),first=previous.lines.find(line=>typeof line.text==='string'&&line.text.length>0&&line.text.length<=80);
  if(p&&first)candidates.push({id:p.id,name:p.name,text:'前に「'+first.text+'」って話したの、後から思い出してた。'});
 }
 return candidates.length?candidates[n%candidates.length]:null;
}
export function liveConversation(s){const social=ensureSocial(s),topic=s.lifestyle.talk,n=social.liveCounts[topic]??0,scenes=live[topic]||live.friends;if(!Number.isSafeInteger(n+1)||!Number.isSafeInteger(social.liveCount+1))throw Error('会話の記録が上限に達しました。');// Keep broad conversational roles consistent without attributing fixed traits to a real person.
 const roles=topic==='exam'?['think','quiet','lead']:topic==='hobby'?['lead','think','quiet']:['lead','quiet','think'];
 const used=new Set(),speakers=roles.map((role,i)=>{const candidates=priorities[role],offset=(n+i)%candidates.length,id=[...candidates.slice(offset),...candidates.slice(0,offset)].find(id=>!used.has(id)&&FRIENDS.some(p=>p.id===id));used.add(id);return FRIENDS.find(p=>p.id===id);});
 const sceneIndex=liveSceneIndex(social.liveSeed,topic,n,scenes.length);const lines=scenes[sceneIndex].map((text,i)=>{const p=speakers[i%speakers.length];return {id:p.id,name:p.name,text};});if(n%scenes.length===0){const last=lines.at(-1),text={friends:'ちょっと気になる。',hobby:'まず試そう。',exam:'一行ずつで。'}[topic]||'ちょっと気になる。';lines.push({id:last.id,name:last.name,text});}const callback=n%2===1?liveCallback(s,social,topic,speakers,n):null;if(callback)lines.push(callback);social.liveCount++;social.liveCounts[topic]=n+1;social.lastLive={week:s.week,year:s.yearIndex,room:topic,lines};return lines;}
