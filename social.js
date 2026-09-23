// Familiar names supplied by the player. Descriptors use recovered conversational observations.
// Undocumented members have neutral roles; scenes, moods and compatibility are game fiction.
export const FRIENDS=[
 {id:'sasami',name:'ささみ',tag:'難問を持ち込む',topic:'勉強',vibe:5,line:'難しい問題や、AIへの出題から会話が広がる。'},
 {id:'nyama',name:'にゃま',tag:'その基準、何？',topic:'考察',vibe:5,line:'比較する前に、そもそもの評価基準を問い直す。'},
 {id:'meme',name:'めめ',tag:'人をつなぐ',topic:'日常',vibe:7,line:'話の輪をつなぎ、分からないところを丁寧に説明する。'},
 {id:'nanku',name:'なんく',tag:'説明の筋を追う',topic:'考察',vibe:5,line:'仕組みと検討の過程まで、納得するまで考える。'},
 {id:'patsu',name:'パツ',tag:'短いツッコミ',topic:'趣味',vibe:6,line:'短い反応の合間に、好きなことを具体的に話す。'},
 {id:'shiro',name:'シロ',tag:'オプチャのメンバー',topic:'自由',vibe:5,line:'いつものトークから、今日は同じテーブルへ。'},
 {id:'roiko',name:'ロイコ',tag:'具体的な相談',topic:'日常',vibe:6,line:'相談を具体的に考え、危ない話には待ったをかける。'},
 {id:'yumaru',name:'ユーマル',tag:'読んだ話の、その先へ',topic:'考察',vibe:4,line:'思いついた見方を詳しく話す。踏み込みすぎない距離も大切。'},
 {id:'kota',name:'コタ',tag:'別解も考えたい',topic:'勉強',vibe:5,line:'解法を比べ、思いつく理由まで考える。終わった問題にも別の入り口を探す。'},
 {id:'tsuchida',name:'土田',tag:'オプチャのメンバー',topic:'自由',vibe:5,line:'次はどこへ寄るか、みんなで話そう。'},
 {id:'deme',name:'デメ',tag:'決めつけは苦手',topic:'日常',vibe:5,line:'交流はしたい。でも価値観を一括りにされると話が噛み合わない。'},
 {id:'gechimake',name:'ゲチマケ',tag:'オプチャのメンバー',topic:'自由',vibe:5,line:'名前だけ知っていた相手とも、同じ机を囲む。'},
 {id:'airi',name:'アイリ',tag:'オプチャのメンバー',topic:'自由',vibe:5,line:'今日は集まりに参加。会話はその場から始まる。'}
];
export const MEETUP_TOPICS={daily:'近況とくだらない話',hobby:'趣味とゲーム',study:'一緒に問題を考える',debate:'考察をとことん話す'};
export const GUEST_LEGACY={haru:'meme',nagi:'roiko',sora:'patsu',mugi:'airi',kei:'sasami',rin:'kota',ao:'shiro',yuu:'tsuchida',ren:'nyama',tomo:'yumaru',maki:'deme',jun:'nanku'};
export const SOCIAL_LINES={
 daily:['近況から夕飯まで、話題が何度も脱線した。','受験の話をしないまま、二時間が過ぎた。','誰かが送ったスタンプの顔を、実際にやってみた。'],
 hobby:['ゲームの攻略を説明していたら、紙ナプキンが図で埋まった。','知らなかった作品の名前をメモした。積み問題集の隣に積み作品が増える。','好きなものの話になると、声の速度が変わる。'],
 study:['ささみの一題で、全員の飲み物が冷めた。','途中式を指で追って、同じところで止まった。','解けた人より、良いヒントを出した人が目立つ午後。'],
 debate:['定義を決めるだけでデザートが来た。','結論は出なかった。でもどこで意見が違うかは分かった。','「そもそも」が三回続いたところで、いったん休憩。']
};
