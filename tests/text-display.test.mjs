import assert from 'node:assert/strict';
import {hideStressNumbers,feelingStatus,feelingChange} from '../text-display.js';
const cases=[
 ['来週3時間・ストレス −3。受験支援額は変わりません。','来週3時間・気分転換になりそう。受験支援額は変わりません。'],
 ['手持ち −2,000円／翌週1コマ／ストレス −12・友人との信頼 +10','手持ち −2,000円／翌週1コマ／気分転換になりそう・友人との信頼 +10'],
 ['その週に使う。ストレス −5、余白 +3。','その週に使う。気分転換になりそう、余白 +3。'],
 ['毎週ストレス −0.6。','毎週気分転換になりそう。'],
 ['ライブトークのストレス回復 +2。','ライブトークの気分転換になりそう。'],
 ['ストレス +10 · 信頼 −12 · 次週3時間使用','気疲れすることも · 信頼 −12 · 次週3時間使用'],
 ['ストレス目安：＋3.5％／費用 3,000円','気疲れすることも／費用 3,000円'],
 ['ストレス: 67 / 100、体調 55 / 100','気持ちの様子、体調 55 / 100'],
 ['今週はストレスを感じた。3時間使う。','今週はストレスを感じた。3時間使う。'],
];
for(const [before,after] of cases)assert.equal(hideStressNumbers(before),after);
assert.equal(feelingStatus(20),'気持ちは落ち着いている。');assert.equal(feelingStatus(65),'少し気が張っている。');assert.match(feelingStatus(66),/休む/);
assert.match(feelingChange(-2,{forecast:true}),/そう/);assert.match(feelingChange(2),/増えた/);assert.match(feelingChange(0),/大きな変化はなかった/);
console.log('text display tests passed');

const {hideRelationshipNumbers,workRelationshipStatus}=await import('../text-display.js');
const relationships=[
 ['ストレス +10 · 信頼 −12 · 次週3時間使用','ストレス +10 · 関係に影響することも · 次週3時間使用'],
 ['翌週1コマ／面接 +3・先輩との信頼 +10','翌週1コマ／面接 +3・先輩とのやり取りにつながる'],
 ['家族との信頼 ＋１０ · 手持ち −2,000円','家族とのやり取りにつながる · 手持ち −2,000円'],
 ['職場の信頼 −25、ストレス +4。','職場との関係に影響することも、ストレス +4。'],
 ['友人との信頼: 68 / 100','友人との関係を考える'],
 ['親密度 ＋3.5％／費用 3,000円','関係を築くきっかけに／費用 3,000円'],
 ['相手の気持ち −0','関係を考える'],
 ['信頼 20円・好感度 3時間・関係値 4コマ','信頼 20円・好感度 3時間・関係値 4コマ'],
 ['信頼している。3時間の予約と費用2,000円','信頼している。3時間の予約と費用2,000円'],
 ['固定シフト週6時間・時給 +150円・契約終了まで4週間','固定シフト週6時間・時給 +150円・契約終了まで4週間'],
];
for(const [input,expected] of relationships)assert.equal(hideRelationshipNumbers(input),expected,input);
assert.match(workRelationshipStatus(25,{regular:true}),/終了する可能性/);
assert.doesNotMatch(workRelationshipStatus(26,{regular:true}),/終了/);
assert.match(workRelationshipStatus(25),/その都度/);
assert.match(workRelationshipStatus(NaN),/分かりません/);
console.log('relationship display: qualitative labels, contract warning and preservation of time/money passed');
