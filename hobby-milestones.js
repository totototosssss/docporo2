// Optional, once-only moments earned through the existing hobby progress.
// The player must still spend the required time in the actual weekly plan.
import {hobbyRestriction} from './world.js?v=8.3';
export const HOBBY_MILESTONES = {
 photo:[['今日の一枚','同じ道で撮った写真を並べ、いつも通り過ぎる角の一枚を選んだ。'],['小さな写真集','季節ごとの写真を並べると、同じ場所の光が少しずつ違っていた。']],
 music:[['二小節の録音','つまずいていた二小節を録音し、音の間が揃ったところだけ残した。'],['一曲の記録','弾き直した箇所も含めて一曲を録った。速さより最後まで聴けることを選んだ。']],
 cook:[['作り置きの一皿','火の通りを見ながらいつもの作り置きを皿に盛り、味の違いを書き留めた。'],['献立を組む','作る順番と片付けまで考え、数日分の献立を一枚にまとめた。']],
 game:[['もう一度あの場面','負けた場面を見返し、別の手を試した。勝敗より理由が気になった。'],['遊び方を決める','時間を区切って遊ぶルールを決め、最後の一戦を笑って終えた。']],
 club:[['片付けのあと','道具を戻したあとも話が続き、次に集まる時の役割を一つ引き受けた。'],['集まりの記録','集まりの段取りと、途中で変わった予定をメモに残した。']],
 puzzle:[['別解の途中','正解にたどり着く前の途中式を残し、条件を一つ変えて考え直した。'],['問題を作る','解けた問題の条件を削り、どこまで成り立つか確かめる問題にした。']],
 reading:[['読み返した場面','読み終えた本の一場面に戻り、最初とは違って見えた返事に付箋を貼った。'],['本をつなぐ','読み終えた二冊を並べ、違う話なのに似たところで立ち止まったと気づいた。']],
 cinema:[['帰り道の感想','見終えてすぐは言葉にならず、帰り道で一つの場面だけ思い出した。'],['二度目の発見','前に見た時とは別の人物の動きが気になり、感想を短く書き直した。']],
 rhythm:[['つながった小節','繰り返し止まっていた小節が一度だけつながり、その前後の押し方を覚えた。'],['最後まで聴く','難しいところだけを追わず、一曲を通して音を聴きながら遊んだ。']],
 othello:[['終盤の三手','盤面を残して最後の三手を並べ直し、取らない手の意味を確かめた。'],['分岐を並べる','同じ盤面から二通りを試し、角を取る前に変わった選択肢を比べた。']],
 sketch:[['線を残す','消し跡の多い一枚から、よく見て描けた輪郭を一つ選んだ。'],['並べて見る','前に描いた絵と今日の絵を並べ、形より見ていた場所の違いに気づいた。']],
 bath:[['湯上がりの余白','湯上がりの飲み物を用意し、通知を見ない時間を最後まで取った。'],['休み方の手順','疲れた日に慌てず休めるよう、湯を張る前からの段取りを決めた。']]
};
export const MILESTONE_LEVELS=[4,12];
export const MILESTONE_MODES={
 solo:{name:'ひとりでまとめる',hobby:1,talk:0,extra:0,after:'今日は自分のための記録にした。'},
 share:{name:'誰かに話す',hobby:1,talk:1,extra:0,after:'あとでライブトークで話してみた。'},
 together:{name:'一緒に形にする',hobby:2,talk:1,extra:1500,after:'準備の時間と費用を使い、一緒に残す形を考えた。'}
};
const recordList=s=>Array.isArray(s.hobbyMilestones?.records)?s.hobbyMilestones.records:[];
const pending=s=>s.hobbyMilestones?.pending||null;
const validId=id=>Object.hasOwn(HOBBY_MILESTONES,id);
const validStage=stage=>Number.isInteger(stage)&&stage>=0&&stage<MILESTONE_LEVELS.length;
const validMode=mode=>Object.hasOwn(MILESTONE_MODES,mode);
const key=(id,stage)=>id+':'+stage;

export function validateHobbyMilestones(s){
 const data=s.hobbyMilestones;if(data==null)return true;
 if(typeof data!=='object'||Array.isArray(data)||!Array.isArray(data.records))return false;
 const valid=x=>x&&typeof x==='object'&&!Array.isArray(x)&&validId(x.id)&&validStage(x.stage)&&validMode(x.mode)&&Number.isInteger(x.year)&&x.year>=0&&x.year<=s.yearIndex&&Number.isInteger(x.week)&&x.week>=0&&x.week<48;
 const keys=new Set(),byKey=new Map();
 for(const r of data.records){
  if(!valid(r)||keys.has(key(r.id,r.stage))||(r.year===s.yearIndex&&r.week>=s.week))return false;
  keys.add(key(r.id,r.stage));byKey.set(key(r.id,r.stage),r);
 }
 for(const r of data.records){if(r.stage>0){const previous=byKey.get(key(r.id,r.stage-1));if(!previous||previous.year>r.year||previous.year===r.year&&previous.week>=r.week)return false;}}
 if(data.pending==null)return true;
 const p=data.pending;
 return valid(p)&&!(p.year===s.yearIndex&&p.week>s.week)&&!keys.has(key(p.id,p.stage))&&(p.stage===0||keys.has(key(p.id,p.stage-1)));
}
export function milestoneInfo(s,id=s.world?.hobby){
 if(!validId(id))return null;
 const records=recordList(s),stage=MILESTONE_LEVELS.findIndex((_,i)=>!records.some(r=>r.id===id&&r.stage===i));
 if(stage<0)return {id,complete:true,records:records.filter(r=>r.id===id)};
 const value=Number.isFinite(s.world?.hobbyProgress?.[id])?Math.max(0,s.world.hobbyProgress[id]):0;
 const blockReason=hobbyRestriction(s,id),blocked=!!blockReason;
 return {id,stage,threshold:MILESTONE_LEVELS[stage],progress:value,title:HOBBY_MILESTONES[id][stage][0],ready:value>=MILESTONE_LEVELS[stage]&&!blocked,blocked,blockReason};
}
export function bookMilestone(state,mode){
 if(state.phase!=='study'||state.pending)throw Error('先に今の出来事を確認してください。');
 if(!validMode(mode))throw Error('節目の過ごし方を選んでください。');
 const info=milestoneInfo(state);if(!info||!info.ready)throw Error('この節目はまだ選べません。');
 const prior=pending(state);if(prior&&prior.year===state.yearIndex&&prior.week===state.week)throw Error('今週はすでに節目を選んでいます。');
 const s=structuredClone(state);s.hobbyMilestones={records:recordList(s).slice(),pending:{id:info.id,stage:info.stage,mode,year:s.yearIndex,week:s.week}};return s;
}
export function cancelMilestone(state){
 const s=structuredClone(state);s.hobbyMilestones={records:recordList(s).slice(),pending:null};return s;
}
export function milestonePlan(state,plan){
 const choice=pending(state);if(!choice)return {ready:false,reason:'選択なし',extra:0};
 if(!validId(choice.id)||!validStage(choice.stage)||!validMode(choice.mode))return {ready:false,reason:'予約の内容が不正です。',extra:0};
 const mode=MILESTONE_MODES[choice.mode],info=milestoneInfo(state,choice.id);
 if(choice.year!==state.yearIndex||choice.week!==state.week)return {ready:false,reason:'予約した週が過ぎました。',extra:0};
 if(choice.id!==state.world?.hobby)return {ready:false,reason:'予約した趣味を選んでください。',extra:0};
 if(!info?.ready||info.stage!==choice.stage)return {ready:false,reason:info?.blockReason||'この節目は選べません。',extra:0};
 if((plan?.counts?.hobby||0)<mode.hobby||(plan?.counts?.talk||0)<mode.talk)return {ready:false,reason:`趣味 ${mode.hobby}コマ${mode.talk?'・ライブトーク '+mode.talk+'コマ':''}が必要です。`,extra:0};
 return {ready:true,reason:'今週実行します。',extra:mode.extra,choice:{...choice},mode};
}
export function milestoneCost(state,plan){return milestonePlan(state,plan).extra;}
// Called on the simulation's private copy, after plan validation and never for previews.
export function finishMilestone(result,before,plan){
 const choice=pending(before);if(!choice)return null;
 const decision=milestonePlan(before,plan);
 result.hobbyMilestones={records:recordList(result).slice(),pending:null};
 if(!decision.ready)return {cancelled:true,reason:decision.reason};
 const {id,stage,mode,year,week}=decision.choice,[title,detail]=HOBBY_MILESTONES[id][stage];
 if(result.hobbyMilestones.records.some(r=>r.id===id&&r.stage===stage))return null;
 const record={id,stage,mode,year,week};result.hobbyMilestones.records.push(record);
 const text=detail+MILESTONE_MODES[mode].after;
 result.world.journal.push({id:'hobby-milestone:'+key(id,stage),title,text,image:'idle-dance',year,week});
 result.world.journal=result.world.journal.slice(-180);
 return {record,title,text};
}
