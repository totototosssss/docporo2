// Small, bounded game rules; these coefficients are not individual medical predictions.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function hash(text){let h=2166136261;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
function initialTrait(s){
 const original=s.pastYears?.find(y=>Number.isInteger(y.seed))?.seed;
 const seed=original??s.seed??0;
 return .8+hash(`${seed}:aging`)/4294967295*.4;
}
export function agingView(s){
 const age=21+Math.max(0,Number.isSafeInteger(s.yearIndex)?s.yearIndex:0);
 const saved=s.aging?.trait;
 const trait=Number.isFinite(saved)&&saved>=.8&&saved<=1.2?saved:initialTrait(s);
 const fitness=clamp(Number.isFinite(s.world?.health?.fitness)?s.world.health.fitness:0,0,100);
 return {age,trait,forgettingFactor:1+Math.min(.20,Math.max(0,age-35)*.0035*trait),recoveryPenalty:Math.min(1,Math.max(0,age-40)*.02*trait)*(1-.25*fitness/100)};
}
// Called only on an actual week advance; reading a legacy save does not change it.
export function ensureAging(s){if(!Number.isFinite(s.aging?.trait)||s.aging.trait<.8||s.aging.trait>1.2)s.aging={trait:agingView(s).trait};return s.aging;}
