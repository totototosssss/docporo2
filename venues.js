import {VENUES as BASE_VENUES,EXHIBITIONS} from './venue-data.js?v=8.4';
import {CAFES} from './cafes.js?v=8.4';
export const VENUES=[...BASE_VENUES,...CAFES];
import {draw} from './exams.js?v=8.4';
export {EXHIBITIONS} from './venue-data.js?v=8.4';
export const VENUE_MAP=Object.fromEntries(VENUES.map(v=>[v.id,v]));
export const VENUE_CATEGORIES=['すべて','水族館','動物園','美術館','博物館','庭園','ボードゲームカフェ'];
const lines={
 'ボードゲームカフェ':['同じ机で、選ばなかった一手の話が続いた。','ゲームを片づけても、あの一手の相談は終わらなかった。'],
 '水族館':['水槽の前だけ、通知を見るのを忘れた。','魚と目が合った気がして、もう一周した。','泳ぐ影を追っていたら、帰りの時間だった。','暗い通路を出ると、外の光が少しまぶしい。'],
 '動物園':['寝ている動物を、寝不足の自分が見ている。','地図を折り直すたびに、違う道を歩いた。','写真より、実物を見ている時間の方が長かった。','売店のぬいぐるみと、しばらく無言で相談した。'],
 '美術館':['説明を読まずに好きになった一枚があった。','分かったふりをやめたら、見るのが楽しくなった。','出口の絵はがき売り場で、もう一度迷った。','絵を見た時間より、帰り道に思い出した時間が長い。'],
 '博物館':['一つの展示の前で、予定より長く立ち止まった。','受験に出ない話のメモが、いちばん長くなった。','昔の人も同じことで困っていた。少し安心した。','最後の展示を見終わるころには、頭の中が静かだった。'],
 '庭園':['ベンチで手帳を閉じた。今日は何も書かなくていい。','枝の影を踏まないように、子どもみたいに歩いた。','写真には写らない風を、しばらく覚えていたい。','道を一つ間違えたおかげで、いい景色が見つかった。']
};
export const VENUE_EFFECTS={'ボードゲームカフェ':{health:1,stress:-16,spirit:20},'水族館':{health:3,stress:-19,spirit:21},'動物園':{health:5,stress:-17,spirit:20},'美術館':{health:2,stress:-16,spirit:20},'博物館':{health:2,stress:-15,spirit:19},'庭園':{health:6,stress:-16,spirit:18}};
// Four playable weeks per month: exhibition availability uses the corresponding seven-day window.
export function gameDates(s){const month=(Math.floor(s.week/4)+3)%12+1,year=2026+s.yearIndex+(s.week>=36?1:0),day=(s.week%4)*7+1;return {start:Date.UTC(year,month-1,day),end:Date.UTC(year,month-1,day+6)};}
export function activeExhibitions(s,venue=null){const d=gameDates(s);return EXHIBITIONS.filter(e=>(!venue||e.venue===venue)&&Date.parse(e.start)<=d.end&&Date.parse(e.end)>=d.start);}
export function venueStatus(s,v){if(v.id==='grutto-3'&&gameDates(s).start>=Date.parse('2027-01-12')&&gameDates(s).end<=Date.parse('2027-03-19'))return '常設展は施設整備のため休室中';if(v.id==='jaza-39'&&gameDates(s).start>=Date.parse('2027-01-07'))return 'リニューアル休園中・2029年再開予定（日付未定）';if(v.id==='grutto-102'&&gameDates(s).end<Date.parse('2026-10-17'))return '改修休館中・10月17日再開予定';return null;}
export function venueFee(s,v){if(v.id==='jaza-46'){const month=(Math.floor(s.week/4)+3)%12+1;return [5,8,12].includes(month)?3200:month===3?3000:2800;}return s.university.status==='enrolled'&&v.studentFee?v.studentFee:v.fee;}
export function venueMemory(s,v,exhibition){const choices=lines[v.category];let text=choices[Math.floor(draw(s.seed,`venue-line:${v.id}:${s.yearIndex}:${s.week}`)*choices.length)];if(exhibition)text='「'+exhibition.name+'」を見た。'+text;return text;}
export function selectVenue(state,id,exhibition=null){if(state.phase!=='study'||state.pending)throw Error('先に出来事を確認してください。');const v=VENUE_MAP[id];if(!v)throw Error('行き先を選んでください。');const closed=venueStatus(state,v);if(closed)throw Error(closed);if(exhibition&&!activeExhibitions(state,id).some(e=>e.id===exhibition))throw Error('その展示は今週の開催期間外です。');const s=structuredClone(state);s.lifestyle.outing={pref:v.pref,kind:'culture',venue:id,exhibition};return s;}
