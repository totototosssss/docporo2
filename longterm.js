import {familyStory} from './family-story.js?v=8.3';
import {twistStory} from './twists.js?v=8.3';
// Continuing-year scenes use only retained game records. Each id is selected once.
const pick=(label,hint,effect,after,echo,commitment=null)=>({label,hint,effect,after,echo,...(commitment?{commitment}:{})});
const scene=(id,week,title,body,choices,image='study-focused',lines=[])=>({id,week,title,body,image,lines,choices});
const pair=(a,b)=>[a,b];
const once=(text,after,echo,effect,hint)=>pick(text,hint,effect,after,echo);
const later=(text,after,echo,name,effect,hint)=>pick(text,hint,{},after,echo,{name,blocks:1,effect});
const previous=s=>s.pastYears?.at(-1);
const examLine=s=>{const r=previous(s)?.results||[],passed=r.filter(x=>x.passed).length;return r.length?`去年の結果は${r.length}校分あり、合格は${passed}校だった。`:'去年は受験校の記録がない。';};
const courseLine=s=>{const p=previous(s)?.promotion;if(s.university.status==='graduated'){return s.university.graduatedYear==null?'理学部を卒業している。':s.university.graduatedYear===s.yearIndex-1?'去年、理学部を卒業した。':'去年は理学部を卒業していた。';}if(!p)return '去年の大学の記録を開く。';return p.label==='休学中'?'去年は大学を休んでいた。':p.ok?'去年は進級条件を満たした。':'去年は進級条件を満たせなかった。';};
const jobLine=s=>{const n=previous(s)?.income;return Number.isFinite(n)?`去年の仕事の収入は ${Math.round(n).toLocaleString('ja-JP')}円。`:'去年の収入記録を見直す。';};
const spokeWithFriend=s=>(s.journey.choices||[]).some(x=>x.choice==='来週、一題ずつ説明し合う')||(s.journey.narrative||[]).some(x=>x.id==='library'&&x.choice==='来週、一題ずつ説明し合う');
const candidates={
 1:[
  s=>scene('return-spring',1,'去年の答案を、机に戻す',`${examLine(s)} 去年使っていたノートを開く。今年の進め方は、まだ決めなくていい。`,pair(
   once('間違えた答案を一枚選ぶ','解答を隠して、途中まで書き直した。全部の問題を今日やり直そうとはしなかった。','選んだ一枚に、前より詳しい途中式が残った。',{debt:-3,habit:1},'復習残り −3・習慣 +1'),
   later('家族と今年の予定を話す','結果だけでなく、今年の時間の使い方も話す約束をした。','家族は去年の結果を聞き直さず、今の予定表を見ていた。','今年の予定を家族と話す',{stress:-5,family:5},'来週3時間・ストレス −5・家族との信頼 +5'))),
  s=>scene('return-desk',1,'空けておいた席',spokeWithFriend(s)?'以前、一題ずつ説明し合った席にまた座った。前と同じ問題を開くか、今年の悩みから話すか。':'久しぶりに、大学の友人と同じ机に座った。前に話せなかったことを今話すか、まずは目の前の一題を開くか。',pair(
   later('一題を持ち寄る','来週、互いに一題だけ持ってくることにした。','同じ問題でも、最初に迷う場所は二人で違った。','一題ずつ持ち寄る',{debt:-3,friend:5},'来週3時間・復習残り −3・友人との信頼 +5'),
   once('今日は自分で進める','話す約束は増やさず、自分のノートを開いた。','向かいの席が空いていても、声をかけられる相手はいる。',{habit:1,stress:-2},'習慣 +1・ストレス −2')),'peek'),
  s=>scene('return-routine',1,'予定表の余白を残す',`また春の予定表を開いた。${examLine(s)} 今年は、予定どおりに進まない日も考えておきたい。`,pair(
   once('終える時刻を先に決める','翌朝も戻れるよう、今日閉じる時刻を書いた。','閉じる時刻の印が、翌週の予定表にも残っていた。',{habit:2,health:3},'習慣 +2・体調 +3'),
   later('今年の予定を誰かに見せる','自分だけでは気づかない詰め込みを、来週一緒に見直す。','予定を全部増やすのではなく、一つ減らしてから書き直した。','予定表の見直し',{stress:-4,mentor:5},'来週3時間・ストレス −4・先輩との信頼 +5')))
 ],
 13:[
  s=>scene('return-campus',13,'予定を紙に並べる',`${courseLine(s)} ${s.university.status==='enrolled'?'今の大学の時間割と、受験に使う時間':'今週の受験や仕事に使う時間'}を同じ紙に書き出した。`,pair(
   once('優先する課題を一つ決める','今週取りかかるものに印をつけた。先に決めると、残りの範囲も見えた。','課題の印の隣に、次に開くページも書き足した。',{habit:2,stress:-2},'習慣 +2・ストレス −2'),
   later('友人に予定を相談する','来週、抱えている予定を書き出してから話すことにした。','互いに引き受けられる範囲を確認できた。','予定の相談',{stress:-4,friend:5},'来週3時間・ストレス −4・友人との信頼 +5')),'peek'),
  s=>scene('return-work',13,'働いた時間の、その先',`${jobLine(s)} ${Number(previous(s)?.income)>0?'働いた日の帰り道や準備の時間も、今年の表に書き足した。':'働く場合の移動や準備の時間も、今年の表に書き足した。'}`,pair(
   once('収入と勉強時間を整理する','収入の欄と空いている時間を一緒に見直した。仕事を変えるかどうかは後で決める。','次のシフト表を見る前に、必要な支出を書き出した。',{habit:2,stress:-2},'習慣 +2・ストレス −2'),
   later('家族と必要な費用を話す','来週、手持ちと受験費の見通しを一緒に確かめる。','必要な額と、今すぐ買わなくてもいいものを分けられた。','費用の相談',{stress:-4,family:5},'来週3時間・ストレス −4・家族との信頼 +5')),'snack'),
  s=>scene('return-health',13,'疲れた日の予定',`今の体調は ${Math.round(s.health)}。予定を立てるとき、調子のいい日だけを基準にしていなかったか考えた。`,pair(
   once('今夜は早めに机を閉じる','残りの問題に印をつけて、今日は閉じた。','次の日に開く場所が決まっていたので、戻りやすかった。',{health:5,stress:-3},'体調 +5・ストレス −3'),
   later('来週の休みを先に決める','何をするかは決めず、来週の余白だけ確保した。','休みの予定を埋め直さずに済んだ。','休む時間を取る',{health:5,stress:-4},'来週3時間・体調 +5・ストレス −4')),'sleeping')
 ],
 25:[
  s=>scene('return-autumn',25,'違う時間割の秋',`${courseLine(s)} この秋、机に向かう時間と、${s.university.status==='enrolled'?'大学や仕事':'仕事や生活'}に使う時間をもう一度並べた。`,pair(
   once('一週間の優先順を書き直す','先に動かせない予定を確認し、残る時間に優先順をつけた。','予定がずれた日も、次に何を開くかは決めてあった。',{habit:2,stress:-2},'習慣 +2・ストレス −2'),
   later('友人と近況を話す','来週会う時間だけ決め、話題は決めなかった。','受験以外の話もした。予定表に残した時間の使い道は、それだけでもよかった。','友人と近況を話す',{stress:-5,friend:5},'来週3時間・ストレス −5・友人との信頼 +5')),'idle-dance'),
  s=>scene('return-hobby',25,'途中でしまったもの',Object.values(s.world.hobbyProgress||{}).some(x=>x>0)?'続けてきた楽しみの道具を取り出した。前に使ったままのところから始めるか、今日は眺めるだけにするか。':'勉強の合間に何をしたいか考える。新しく始めても、まだ決めずにいてもいい。',pair(
   once('少し手を動かす','時間を区切って触った。上達を確かめるより、続きがあることがうれしかった。','次に触る場所を決めてから、道具をしまった。',{stress:-4,health:1},'ストレス −4・体調 +1'),
   later('誰かと好きな話をする','来週、勉強以外の話もできる時間を取る。','結論のない話のまま、待ち合わせの時間が終わった。','好きな話をする',{stress:-5,friend:4},'来週3時間・ストレス −5・友人との信頼 +4')),'idle-dance'),
  s=>scene('return-paper',25,'前より書けるようになった行',`${examLine(s)} 古い答案を開き、今の自分なら違う書き方をする箇所を探した。`,pair(
   once('途中式を一行足す','以前は飛ばしていた理由を、今の言葉で書き足した。','同じ説明を別の問題でも使えるか、印をつけた。',{writing:2,habit:1},'記述 +2・習慣 +1'),
   later('先輩に一枚見てもらう','正解した答案も含めて一枚選んだ。','先輩の質問で、伝わると思っていた部分をもう一度書いた。','答案を見てもらう',{writing:3,mentor:4},'来週3時間・記述 +3・先輩との信頼 +4')))
 ],
 33:[
  s=>scene('return-winter',33,'冬の予算に線を引く',`${jobLine(s)} 今の受験支援枠と手持ちを確認し、何に使うか考える。`,pair(
   once('費用の順番を決める','申し込みに必要なものを先に書いた。金額を増やすのではなく、使う順番を決めた。','買う前に、今あるものを確かめる習慣が残った。',{habit:2,stress:-2},'習慣 +2・ストレス −2'),
   later('家族と受験費を確認する','出願先を決める前に、今の資金を一緒に確認する。','必要な費用を一つずつ確認し、未定のものは未定のまま残した。','受験費の確認',{stress:-4,family:5},'来週3時間・ストレス −4・家族との信頼 +5')),'snack'),
  s=>scene('return-voice',33,'受験の話をしない夜',`今の余白は ${Math.round(s.lifestyle.spirit)}。話すことを全部、受験に結びつけなくてもいいかもしれない。`,pair(
   once('早めに休む','連絡は明日返すことにして、今日は眠る準備をした。','返事を一晩置いても、会話が終わるわけではなかった。',{health:5,stress:-3},'体調 +5・ストレス −3'),
   later('友人と話す時間を取る','来週、短い話でもできるよう時間を空けた。','話題は行ったり来たりした。話せなかったことを無理に埋めなかった。','友人と話す',{stress:-5,friend:5},'来週3時間・ストレス −5・友人との信頼 +5')),'peek'),
  s=>scene('return-choice',33,'来年のことを決める前に',`${examLine(s)} 今決められることと、本番が終わってから考えることを分けて書いた。`,pair(
   once('今週の答案に戻る','先の予定表を閉じ、今日取り組む答案を一枚決めた。','未来の結論はまだ出ていない。今日の答案には書き直した跡が残った。',{writing:2,habit:1},'記述 +2・習慣 +1'),
   later('先輩と選択肢を整理する','来週、結論を出すためではなく、選べる道を並べるために会う。','決めなくてよい時期もあると分かり、今週の予定へ戻った。','選択肢を整理する',{stress:-4,mentor:5},'来週3時間・ストレス −4・先輩との信頼 +5')))
 ]
};
const dialogue={
 'return-spring':[['家族','一枚だけ、見てみる？'],['自分','うん。まずはそこから。']],
 'return-desk':[['友人','この席、空いてるよ。'],['自分','じゃあ、少しだけ。']],
 'return-routine':[['先輩','閉じる時間も書いとく？'],['自分','忘れてた。そこから決めよう。']],
 'return-campus':[['友人','今週、何が残ってる？'],['自分','ちょっと待って、書き出す。']],
 'return-work':[['自分','準備の時間、入れてなかった。'],['友人','帰り道もあるよ。']],
 'return-health':[['友人','今日はもう眠そう。'],['自分','ばれてたか。']],
 'return-autumn':[['友人','最近どう？'],['自分','話すと長くなりそう。']],
 'return-hobby':[['友人','それ、まだやってる？'],['自分','しまったままだった。']],
 'return-paper':[['先輩','前の答案、ある？'],['自分','ある。ちょっと恥ずかしいけど。']],
 'return-winter':[['家族','先に必要なものから見よう。'],['自分','交通費も書いておく。']],
 'return-voice':[['友人','ごはん食べた？'],['自分','まだ。先に食べようかな。']],
 'return-choice':[['先輩','今日決める話？'],['自分','いや、まだ違うかも。']]
};
// These are fictional group-chat moments, not quotations from real people.
// A season's last two variants are excluded, even across different years.
const seasonal={
 spring:[
  {title:'新しいページの余白',body:'ノートの写真から、今日の話題が始まった。',lines:[['めめ','もう新しいノート？'],['コタ','まだ前の最後、空いてる。'],['自分','そこから使おうかな。']]},
  {title:'パン屋の前で',body:'朝の写真が届き、問題集の話がいったん止まった。',lines:[['パツ','パンの写真だけ先に来た。'],['めめ','名前は後で送る。'],['自分','場所もお願い。']]},
  {title:'解き方の手前',body:'一問の話が、どこから考え始めたかに移った。',lines:[['ささみ','最初の一行、どう出た？'],['コタ','そこを説明しようとして止まった。'],['自分','そこから見てみたい。']]}
 ],
 summer:[
  {title:'冷たい飲み物の話',body:'暑さの話をしていたはずが、飲み物の写真が並び始めた。',lines:[['めめ','これ、思ったより大きい。'],['パツ','氷多くない？ 飲み終わる頃に薄くなってそう。'],['自分','溶ける前に飲もう。']]},
  {title:'短いルールのはずが',body:'遊びの説明を読んだ人から、順番に疑問符が届いた。',lines:[['なんく','最初の手番だけやってみる？'],['にゃま','説明はその後でもよさそう。'],['自分','一回なら分かるかも。']]},
  {title:'夕方の帰り道',body:'空の写真と一緒に、今日の予定が終わったという連絡が来た。',lines:[['ロイコ','帰り、暑くなかった？'],['自分','日陰を探して歩いた。'],['めめ','寄り道はできた？']]}
 ],
 autumn:[
  {title:'途中式の写真',body:'途中で消した式の写真を見ながら、どこで考えが変わったか話していた。',lines:[['コタ','消した方もちょっと見たい。'],['ささみ','こっちから入ってたんだ。'],['自分','最後までは行けなかった。']]},
  {title:'予定の合間の一杯',body:'集まるなら何時がよいか、食べるものの話と一緒に流れてきた。',lines:[['めめ','短い時間でもいい？'],['ロイコ','帰り、何時？'],['自分','それなら行ける日がありそう。']]},
  {title:'そもそも何を比べる',body:'二つの選択肢を比べ始めたところで、何を基準にするかという話になった。',lines:[['にゃま','何を比べたいんだっけ。'],['なんく','そこを決めてなかった。'],['自分','紙に書いてみる。']]}
 ],
 winter:[
  {title:'帰る時間の相談',body:'集まる話が出た。場所より先に、それぞれ帰る時間を確かめる。',lines:[['ロイコ','帰り、遅くならない？'],['めめ','先に抜けても大丈夫。'],['自分','時間を見て返す。']]},
  {title:'最後の一問のあと',body:'机に残った問題の話から、夕飯を何にするかへ会話が移った。',lines:[['ささみ','その一問、続き気になる。'],['パツ','先に何か食べよう。'],['自分','それはそう。']]},
  {title:'年末の写真を見返す',body:'今年の写真が一枚届いた。何を話していた日だったか、すぐには思い出せない。',lines:[['めめ','これ、いつだっけ。'],['コタ','帰りに雨だった日？'],['自分','その後の写真も探してみる。']]}
 ]
};
const seasonByWeek={1:'spring',5:'spring',13:'summer',17:'summer',25:'autumn',29:'autumn',33:'winter',41:'winter'};
function seasonalStory(s,week){
 const season=seasonByWeek[week];if(!season)return null;
 const prefix='loop:'+season+':',history=(s.journey.narrative||[]).filter(x=>String(x.id||'').startsWith(prefix));
 const recent=new Set(history.slice(-2).map(x=>x.id)),pool=seasonal[season].map((x,i)=>({...x,id:prefix+i})).filter(x=>!recent.has(x.id));
 const e=pool[((s.seed>>>0)+s.yearIndex+week)%pool.length],previous=history.at(-1);
 const previousLine=previous?previous.choice==='少し話に加わる'?'前は、少しだけ自分の話をした。':previous.choice==='返事を急がず、今日は読む'?'前は返事を急がず、読んでいた。':'前は区切りをつけて、机に戻った。':'';
 const moodLine=s.stress>=65?'今日は少し疲れがある。':s.health<55?'体調を見ながら、今夜の時間を決めたい。':'';
 return scene(e.id,week,e.title,[e.body,previousLine,moodLine].filter(Boolean).join(' '),pair(
  once('少し話に加わる','ひとこと送ると、別の話も返ってきた。全部に返事をする必要はなかった。','前に話したことを、あとで少し思い出した。',{friend:3,stress:1},'友人との信頼 +3・ストレス +1'),
  once('返事を急がず、今日は読む','流れていく話を読んだ。今日は途中から入らず、そのまま聞いていた。','読んでいた話の続きを、次に見かけた。',{friend:2,stress:-2},'友人との信頼 +2・ストレス −2')
 ).concat([once('区切りをつけて机に戻る','会話を閉じて、今日は予定していたページに戻った。','次に開くページには、小さな印が残っていた。',{habit:1},'習慣 +1')]),'peek',e.lines);
}
function withBounds(e){
 if(!e)return null;
 return {...e,choices:e.choices.map(c=>{const effects={...(c.effect||{}),...(c.commitment?.effect||{})},hasNumbers=Object.values(effects).some(v=>typeof v==='number'&&v!==0);return {...c,hint:c.hint+(hasNumbers?'（各値は上限・下限まで）':'')};})};
}
export function longTermStory(s,week){
 if(!s.yearIndex)return null;
 const used=new Set((s.journey.choices||[]).map(x=>x.title));
 for(const build of candidates[week]||[]){const e=build(s);if(!used.has(e.title)){let lines=e.id==='return-hobby'&&!Object.values(s.world.hobbyProgress||{}).some(x=>x>0)?[['友人','何かやってみたいことある？'],['自分','まだ決めてない。']]:dialogue[e.id]||[];const noFamily=Array.isArray(s.household?.people)&&!s.household.people.some(p=>p.alive);if(noFamily){if(e.body.includes('家族'))continue;e.choices=e.choices.filter(c=>!`${c.label}${c.hint}${c.after}${c.echo}`.includes('家族'));lines=lines.filter(([speaker])=>speaker!=='家族');if(!e.choices.length)continue;}return withBounds({...e,lines});}}
 return withBounds(familyStory(s,week)||twistStory(s,week)||seasonalStory(s,week));
}
