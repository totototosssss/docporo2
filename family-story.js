// Fictional family conversations record what the player chose to share, not a personality score.
const empty=()=>({shared:{schedule:false,feelings:false,costs:false},history:[]});
function context(s){const x=s.journey?.familyContext;if(!x||typeof x!=='object')return empty();return {shared:{schedule:x.shared?.schedule===true,feelings:x.shared?.feelings===true,costs:x.shared?.costs===true},history:Array.isArray(x.history)?x.history:[]};}
const option=(label,hint,after,echo,action,share=null,commitment=null)=>({label,hint,after,echo,effect:{},familyRecord:{action,share},...(commitment?{commitment}:{})});
const make=(week,title,body,lines,choices)=>({id:`family:${week}`,week,title,body,lines,image:'snack',choices});
export function familyStory(s,week){
 if(!s.yearIndex)return null;
 if(Array.isArray(s.household?.people)&&!s.household.people.some(p=>p.alive))return null;
 const f=context(s),shared=f.shared;
 if(week===7){
  const history=shared.schedule?'以前、一週間の予定を話したことがある。':shared.feelings?'以前、気になっていたことを少し話した。':'';
  const temporary=s.housing?.status==='shelter';
  return make(week,temporary?'連絡と、予定表':'食卓の、予定表',`${temporary?'家族から「今週はどんな感じ？」と連絡が来た。':'食卓に置いた手帳を見て、家族から「今週はどんな感じ？」と聞かれた。'}${history} 何を話すか、話さないかは自分で決める。`,[['家族','今週、忙しい？'],['自分','ちょっと予定を見てから。']],[
   option('一週間の予定を話す','伝えるのは今の予定だけ。','先に決まっている予定を指で示した。受験の話をどこまで続けるかは、その場で決める。','数日後、家族が手帳を見て「この日は遅いんだっけ」と聞いた。前に話した予定のことだった。','share_schedule','schedule'),
   option('気になっていることを少し話す','話す範囲は自分で選ぶ。','全部を説明しようとせず、今ひっかかっていることを一つだけ話した。','家族から短い返事が来た。続きは今すぐでなくてもよさそうだ。','share_feelings','feelings'),
   option('今日は話さず、自分で考える','今は共有せず、いつもの予定へ。','「ちょっと考えてからにする」と伝えた。話す日を今ここで決める必要はなかった。',temporary?'翌日、手帳を開いた。話すかどうかは、また自分で選べる。':'翌日も食卓はいつもどおりだった。話すかどうかは、また自分で選べる。','pause')
  ]);
 }
 if(week===19){
  const intro=shared.schedule?'以前話した予定表を開く。変わった部分も、そのままの部分もある。':shared.feelings?'以前話した気がかりを思い出す。予定の話は、まだしていなくてもよい。':'予定表と、これから必要になりそうな費用を並べた。';
  return make(week,'予定と費用のあいだ',`${intro} 家族と話すか、自分で整理するか。`,[['家族','何から見ようか。'],['自分','まずは一つずつ。']],[
   option(shared.schedule?'前に見せた予定表を開く':'今の予定表を一緒に見る','予定を共有する。資金や時間の変更なし。','今の予定を一緒に見た。決まっていないところは、空白のままにした。','前に見た予定表と今のものを比べ、変わったところだけ話した。','review_schedule','schedule'),
   option('来週、費用を一緒に確かめる','来週3時間・ストレス −3。受験支援額は変わりません。','来週、手持ちと受験に必要な費用を確かめる時間を取ることにした。','一緒に確認した表には、まだ決まっていない費用も残してあった。','plan_costs',null,{name:'家族と費用を確かめる',blocks:1,effect:{stress:-3},familyCompletion:{share:'costs',action:'reviewed_costs'}}),
   option('今は自分で整理する','今は共有せず、自分のペースで考える。','まず自分のノートに必要な項目を書いた。相談するかどうかは後で決められる。','自分で書いた項目を見直した。相談の予定は、まだ決めていない。','organize_alone')
  ]);
 }
 if(week===31){
  const intro=shared.costs?'以前一緒に確認した費用の表がある。今の額と違うところを見直せそうだ。':shared.schedule?'前に共有した予定表を見ながら、受験にかかる費用も考える。':'受験に必要な費用を書き出す。家族に今話すか、自分で考えるかは決めていない。';
  const choices=[
   option('今の受験費を話す','費用について共有する。受験支援額は変わりません。','今分かっている費用だけ話した。追加の支援を頼むかどうかは、この会話では決めない。','あとから、未定だった費用を一つ書き足した。','share_costs','costs'),
   option('今年は自分で整理する','今は共有せず、支援額も変えない。','手持ちと支援枠を別々に書き出した。家族に相談する道は残したままだ。','自分で整理した表を、必要なときに開ける場所へしまった。','winter_alone')
  ];
  if(shared.costs)choices.push(option('前に確認した表を一緒に見る','前に共有した表を使う。資金や時間の変更なし。','前の表を開き、変わった箇所だけ確認した。支援額の変更はしていない。','前に確認したことが、今回の会話の出発点になった。','reuse_costs','costs'));
  return make(week,'冬の費用のメモ',`${intro} 追加支援の相談は資金画面で別に選べる。`,[['家族','交通費も見ておく？'],['自分','今分かる分から。']],choices);
 }
 return null;
}
function ensure(s){s.journey.familyContext=context(s);return s.journey.familyContext;}
export function recordFamilyChoice(s,event,choice){
 const r=choice.familyRecord;if(!r)return;
 const f=ensure(s),share=['schedule','feelings','costs'].includes(r.share)?r.share:null;
 if(share)f.shared[share]=true;
 f.history.push({year:s.yearIndex,week:event.week,action:r.action});f.history=f.history.slice(-40);
}
export function completeFamilyCommitments(s,commitments){
 for(const c of commitments){const r=c.familyCompletion;if(!r||!['schedule','feelings','costs'].includes(r.share))continue;
  const f=ensure(s);f.shared[r.share]=true;f.history.push({year:s.yearIndex,week:s.week,action:r.action||'completed'});f.history=f.history.slice(-40);
 }
}
