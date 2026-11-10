// Presentation only: game values and saved records remain untouched.
export function feelingStatus(value){
 if(!Number.isFinite(value))return '気持ちの様子はまだ分かりません。';
 if(value>65)return '気持ちが張りつめている。少し休む時間がほしい。';
 if(value>=35)return '少し気が張っている。';
 return '気持ちは落ち着いている。';
}
export function feelingChange(delta,{forecast=false}={}){
 if(!Number.isFinite(delta))return '気持ちの変化はまだ分かりません。';
 if(delta>0.05)return forecast?'気疲れが増えるかもしれません。':'少し気疲れが増えた。';
 if(delta< -0.05)return forecast?'気分転換になりそうです。':'少し気持ちが和らいだ。';
 return forecast?'気持ちに大きな変化はなさそうです。':'気持ちに大きな変化はなかった。';
}
// Convert only explicitly labelled stress numbers in plain text, not nearby
// amounts, durations, skills, or the game's underlying numeric state.
export function hideStressNumbers(value){
 const text=String(value??'');
 return text.replace(/ストレス(?:の)?(回復|軽減|目安)?\s*[:：]?\s*([+＋\-−－]?)\s*(\d+(?:[.．]\d+)?)(?:\s*\/\s*100)?(?:\s*[%％])?/g,(_all,kind,sign,number)=>{
  const amount=Number(number.replace('．','.'));
  if(amount===0)return '気持ちへの変化は少なめ';
  const negative=['-','−','－'].includes(sign);
  const relief=kind==='回復'||kind==='軽減';
  if(!sign&&!relief)return '気持ちの様子';
  return (relief?!negative:negative)?'気分転換になりそう':'気疲れすることも';
 });
}

// These labels describe a game variable, not a prediction of someone's feelings.
// Deliberately target labelled relationship values only; money and time stay visible.
export function hideRelationshipNumbers(value){
 const text=String(value??'');
 return text.replace(/((?:友人|先輩|家族|職場)(?:との|の))?(信頼度?|好感度?|友好度?|親密度?|関係値|相手の気持ち)\s*[:：]?\s*([+＋\-−－]?)\s*([0-9０-９]+(?:[.．][0-9０-９]+)?)(?:\s*\/\s*[0-9０-９]+)?(?:\s*[%％])?(?![0-9０-９.．円時間コマ週年回])/g,(_all,person,_label,sign,number)=>{
  const subject=person?person.replace(/(?:との|の)$/,''):'';
  if(!sign||Number(number.normalize('NFKC'))===0)return subject?`${subject}との関係を考える`:'関係を考える';
  if(['-','−','－'].includes(sign))return subject?`${subject}との関係に影響することも`:'関係に影響することも';
  return subject?`${subject}とのやり取りにつながる`:'関係を築くきっかけに';
 });
}
export function workRelationshipStatus(value,{regular=false}={}){
 if(!Number.isFinite(value))return '職場との関係はまだ分かりません。';
 if(regular&&value<=25)return '固定シフトを守れないと、契約が終了する可能性があります。';
 if(regular)return '固定シフトを約束しています。';
 return '勤務の予定をその都度調整しています。';
}
