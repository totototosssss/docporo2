// Reviewed 2026-09-22. Published border bands are facts; all game thresholds are original model parameters.
export const RANK_DATE='2027年度予想・2026年9月7日更新';
const bands={
 '72.5':['utokyo','keio'],
 '70':['science-tokyo','kyoto','osaka','jikei','juntendo','nms'],
 '67.5':['hokkaido','tohoku','chiba','yokohama','nagoya','osaka-public','kobe','kyushu','yamanashi','iuhw','jichi','showa','tokyo-med','ompu','kansai'],
 '65':['tsukuba','niigata','kanazawa','gifu','hamamatsu','mie','shiga','nagoya-city','kyoto-pref','okayama','hiroshima','nagasaki','tohoku-mpu','kyorin','teikyo','tokai','toho','nihon','aichi','fujita','kindai','uoeh'],
 '60':['twmu','kawasaki']
};
export const BORDER=Object.fromEntries(Object.entries(bands).flatMap(([n,ids])=>ids.map(id=>[id,+n])));
// Representative front schedule unless expressly marked otherwise. Nara uses the later schedule.
export const COMMON_BORDER={utokyo:90,'science-tokyo':89,kyoto:89,osaka:87,chiba:86,nagoya:86,yokohama:86,kobe:86,tohoku:85,'osaka-public':85,tsukuba:85,kyushu:85,yamanashi:85,hokkaido:84,niigata:84,okayama:84,shinshu:83,'nagoya-city':83,'kyoto-pref':83,hiroshima:83,kanazawa:82,gifu:82,hamamatsu:82,mie:82,shiga:82,tottori:82,tokushima:82,kagawa:82,kumamoto:82,yamagata:81,gunma:81,wakayama:81,yamaguchi:81,saga:81,nagasaki:81,miyazaki:81,kagoshima:81,akita:80,kochi:80,oita:80,sapporo:79,toyama:79,fukui:79,fukushima:79,shimane:79,ehime:79,ryukyu:79,asahikawa:78,hirosaki:78,nara:88};
export function modelSchool(s){
 const border=s.id==='defense'?null:s.id==='nara'?70:(BORDER[s.id]??62.5),privateSchool=s.type==='私立';
 const tier=border===null?3:(border-60)/2.5;
 const difficulty=s.id==='utokyo'?97.6:s.id==='keio'?97.2:privateSchool?90+tier*1.4:90.2+(tier-1)*1.6;
 return {...s,ctShare:s.id==='kyoto'?275/1275:s.ctShare,border,commonBorder:COMMON_BORDER[s.id]??null,difficulty,ctGate:s.id==='utokyo'?94:(s.ctShare?Math.max(80,(COMMON_BORDER[s.id]??83)-1):0),schedule:s.id==='nara'?'後期':s.schedule,profile:s.id==='nara'?'science':s.profile};
}
export const EXAM_STYLES={
 balanced:{name:'英数理・総合',short:'総合',tasks:['英数理の標準問題を分野ごとに採点する','解けた問題も48時間後に白紙から再現','4科目の最低点を先に引き上げる'],paper:'4科目を同じ水準にそろえる演習'},
 science:{name:'理数・記述',short:'理数',tasks:['微積分と力学を途中式込みで完答する','条件・単位・有効数字の失点を分類する','難問は方針と式を残して部分点を取る'],paper:'数学・理科の記述を採点する演習'},
 common:{name:'共通テスト',short:'共テ',tasks:['国語・地歴公民・情報の空白分野を埋める','資料読み取りの根拠に線を引く','各大問の打切り時刻を決めて通し演習'],paper:'7科目を時間内に処理する演習'},
 english:{name:'英語・読解',short:'英語',tasks:['段落の役割を一文で要約する','構文の誤読と語彙不足を分けて記録','英作文は論点・文法・語数を別々に点検'],paper:'読解速度と英作文の精度を両立する演習'},
 speed:{name:'標準完答・速度',short:'速度',tasks:['一周目は即答できる設問だけを拾う','計算のやり直しに使った時間を記録','難問を追わず標準問題の正答を安定させる'],paper:'時間制限付きの英数理セット'},
 elite:{name:'最難関・論証',short:'論証',tasks:['答案だけで論理が伝わるか第三者に点検を頼む','整数・確率・電磁気の条件分けを省略しない','国語を使うルートは、その記述も仕上げる'],paper:'難関記述・論証の通し演習（国語型も含む）'},
 choice:{name:'選択3科目',short:'選択',tasks:['英語と選択候補の3科目を比較する','得意科目でも時間制限下の失点を測る','科目選択は点数の再現性で決める'],paper:'英語＋数学・理科から2科目の演習'},
 'one-science':{name:'理科1科目',short:'理1',tasks:['物理と化学のうち得点を再現できる方を育てる','英数を落として理科だけで補おうとしない','1科目の理科を全分野仕上げる'],paper:'英語・数学・得意理科の演習'}
};
export const DOSSIERS={
 kyoto:{url:'https://www.kyoto-u.ac.jp/sites/default/files/inline-files/senbatsuyokoR9_all-22d87b752c22c5b9d7bcb8ef94505625.pdf',year:'2027年度入学者選抜要項・医学科',facts:['共通テスト275点、個別学力検査1000点、合計1275点。','個別は国語150・数学250・理科300・外国語300点。面接も総合判定に使う。','面接の評価によっては、学科試験の成績にかかわらず不合格となる場合がある。'],strategy:['数学だけに集中せず、個別の大きい英語と理科を両立。国語の記述も捨てられない。','ゲームにも個別配点の比率と共通テスト比率を反映。最難関・論証の演習を育てる。','今の理学部で何を学び、なぜ医師を目指すのか、面接の説明を具体的にする。']},
 keio:{url:'https://www.keio.ac.jp/ja/admissions/faculty/examinations/general-admissions/',year:'2027年度日程・試験教科科目表',facts:['一般選抜募集66人（うち栃木県地域枠1人）。一次2月9日、二次3月1日。','一次は理科200・数学150・外国語150点。理科は物理・化学・生物から2科目。二次に小論文と面接。','数学には数Bの統計的な推測、数Cの平面上の曲線・複素数平面も含まれる。'],strategy:['理科の長い問題を途中で投げず、数学と英語も時間内に仕上げる。','理科の配点は合わせて40%。2科目とも高い習熟を揃える。','ゲームは生物未収録。物理・化学を使う4科目型として準備する。']},

 utokyo:{url:'https://www.u-tokyo.ac.jp/ja/admissions/undergraduate/e01_02_01.html',year:'2027年度概要／配点は2026年度要項',facts:['2027年の前期募集は理科三類92人。二次は2月25〜27日、27日は理三のみ。','2027年出願は1月25日〜2月3日。理三は面接も含め総合判定。','2026年度要項の配点は共通110・個別440。個別は国語80、数学120、理科120、外国語120。'],strategy:['国語を最後に足すと間に合わない。春から古典と記述の復習枠を維持。','最難関・論証の答案を添削し、解答の論理の飛躍を見つける。','一題の難問に時間を使い切らず、部分点を残す答案と解く順番を練習する。']},
 teikyo:{url:'https://www.teikyo-u.ac.jp/applicants/faculty/medicine_d',year:'2027年度・一般選抜',facts:['英語必須＋数学・物理・化学・生物・国語から2科目。各100点、計300点。','数学は数Ⅰ・Ⅱ・A・B（数列）・C（ベクトル）。一次は1月21〜23日の自由選択。','二次は300字以内の課題作文と面接。複数日受験では日ごとの最高合計点を採用。'],strategy:['ゲームは英語＋数学・物理・化学から上位2科目に簡略化。生物・現代文選択と複数日受験は未収録。','科目が少なくても、標準問題の失点と時間切れは重い。3科目とも時間を測って練習する。','文章を短くまとめる記述練習と、受験を続ける理由を説明する面接を準備。']},
 tokai:{url:'https://www.u-tokai.ac.jp/examination-admissions/examination-system/undergraduate-academic-medicine/',year:'2027年度・一般選抜日程',facts:['Web登録は1月4日〜1月16日。一次試験は2月2日・3日、受験日を選べる。','2日とも受けた場合は高い合計点の日を採用。一次は標準化採点、二次は小論文と面接。'],strategy:['理科2科目を均等に育てるルートとは必要時間が異なる。得意理科に集中できる。','一方で国公立への変更にはもう一方の理科と共通科目の準備が必要。','理科を絞った分、英語と数学の取りこぼしも減らす。']},
 kawasaki:{url:'https://m.kawasaki-m.ac.jp/examination/youkou.php',year:'2027年度・一般選抜',facts:['一般選抜の募集は約45人。検定料60,000円。','Web出願は12月1日〜1月7日15時。一次は2月1日、二次は2月10日・11日の指定日。','一次は英語・数学・理科・小論文。最終判定は学力・小論文・面接・調査書等を総合評価。'],strategy:['国公立の出願時期まで待つと私立の締切を逃す。ゲームでも私立は12月末に選ぶ。','難度表で下の帯でも英数理4科目が必要。標準問題を時間内に解き切る力を育てる。','小論文と面接は、医学への関心を具体的に説明できるよう準備する。']},
 jichi:{url:'https://www.jichi.ac.jp/exam/medicine/backup/',year:'修学資金制度・2026年9月確認',facts:['修学資金の貸与と、卒後の指定勤務に基づく返還免除の制度がある。'],strategy:['学費だけで選ばず、地域医療で働く理由を面接の言葉にする。','ゲームは都道府県別の実際の競争・勤務先配属を再現しない。条件確認を伴う代表ルート。']},
 uoeh:{url:'https://www.uoeh-u.ac.jp/view.php?pageId=6547',year:'修学資金制度・2026年9月確認',facts:['産業医等としての指定勤務と関わる修学資金制度がある。'],strategy:['産業医の仕事と返還免除条件を読んでから出願。','方式別に条件が異なるため、ゲームの配点・共通テスト比率は代表モデル。']}
};
export const ROADMAP=[
 {months:'4–5月',title:'「読めば分かる」を終わらせる',body:'基礎教材で英文構造、数学の典型解法、力学、物質量を点検。弱い単元を選んで学び、復習で白紙再現する。大学の履修は第2週までに決める。',check:'基本方針：全科目の習熟50、毎週の復習、大学レポートの提出'},
 {months:'6–7月',title:'大学の期末と、受験の基礎完成',body:'7月末の大学試験には2コマ必要。実験は出席75%・課題70%が条件。課題を後回しにすると学習効率も落ちる。最初の模試から弱点を特定。',check:'点検：英数理の穴、模試の誤答、単位取得見込み'},
 {months:'8–9月',title:'標準問題を時間内に解く',body:'基礎例題を白紙から解ける科目は標準へ。演習スタイルを選び、志望校を固定せず答案の形式に慣れる。初見の年度を増やすだけでなく、答案分析と解き直しの時間を取る。9月末の共通テスト登録も確認。',check:'点検：標準セットの正答、理科の未履修分野、国語・情報の放置'},
 {months:'10–11月',title:'答案に点数を残す',body:'後期履修を確認し、9月に済ませた共通テスト登録を点検。論証・英作文・小論文を添削に出す。高難度の学校は記述力と全単元の定着が必要。面接は医師像・大学での学び・再受験の理由を整理。',check:'点検：複数回の通し演習、最低科目、家族との受験費相談'},
 {months:'12月',title:'私立の願書を選ぶ',body:'私立の出願は共通テスト前にも締切が来る。ゲームは12月最終週に最大3校を選び、願書・写真・科目・費用を確定する。出願先と合う演習スタイルへの蓄積が引き継がれる。',check:'点検：出願条件、併願費用、対策形式の一致'},
 {months:'1月',title:'自己採点から国公立を決める',body:'共通テスト後に国公立の前期1校・後期1校を選ぶ。ゲームは全日程を48週に圧縮。国公立で使う科目を冬から新しく始めるのは厳しい。',check:'点検：共通テスト条件、個別の不足点、大学の後期期末'},
 {months:'2–3月',title:'増やさず、仕上げる',body:'出願先の過去問、時間配分、面接を仕上げる。試験では標準を固める・順番を守る・難問を攻めるの3方針を選ぶ。落ちた場合は単位、学力、貯金、買った道具を翌年へ。',check:'点検：疲労、復習残り、答案の再現性、翌年の進級・再履修'}
];
export const RESEARCH_SOURCES=[
 {title:'入試難易度の定義と更新日',url:'https://www.keinet.ne.jp/exam/ranking/',note:'方式別ボーダーは河合塾の50%ライン。個人のゲーム合格率への換算はしない。'},
 {title:'国公立・医学系の方式別難度',url:'https://www.keinet.ne.jp/exam/ranking/2027/h_kei_k10.pdf',note:'2027年度・9月版。代表日程の偏差値帯と共通得点率を照合。奈良県立医科・山梨は後期モデル。'},
 {title:'私立・医学系の方式別難度',url:'https://www.keinet.ne.jp/exam/ranking/2027/h_kei_s10.pdf',note:'2027年度・9月版。一般枠の代表方式。私立と国公立の偏差値は科目構成が異なる。'},
 {title:'共通テスト・令和9年度公式案内',url:'https://www.dnc.ac.jp/kyotsu/shiken_jouhou/r9/index.html',note:'ゲーム内は1年48週に圧縮。実際の出願締切・手続きを代替しない。'},
 ...Object.entries(DOSSIERS).map(([id,d])=>({title:id==='kyoto'?'京都大学・2027年度選抜要項':id==='keio'?'慶應義塾大学・2027年度一般選抜':id==='utokyo'?'東京大学・2027年度一般選抜':id==='kawasaki'?'川崎医科大学・2027年度一般選抜':id==='teikyo'?'帝京大学・2027年度医学部':id==='tokai'?'東海大学・医学科入試':id==='jichi'?'自治医科大学・修学資金':'産業医科大学・修学資金',url:d.url,note:d.year}))
];
