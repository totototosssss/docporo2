// A fixed, private learning trait. Old saves without it keep their previous rate.
function mix(x){x=(x^(x>>>16))>>>0;x=Math.imul(x,0x7feb352d);x=(x^(x>>>15))>>>0;x=Math.imul(x,0x846ca68b);return (x^(x>>>16))>>>0;}
export function newTalent(seed){return {version:1,seed:seed>>>0};}
export function validTalent(s){const t=s.talent;return t==null||!!t&&t.version===1&&Number.isInteger(t.seed)&&t.seed>=0&&t.seed<=0xffffffff;}
export function learningTalent(s){if(!validTalent(s))throw Error('学習特性の記録を確認できません。');if(!s.talent)return 1;const seed=s.talent.seed,u=(mix(seed^0x74e39d21)+.5)/4294967296,v=(mix(seed^0xa39b517c)+.5)/4294967296,z=Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);return Math.exp(.1*z-.005);}
