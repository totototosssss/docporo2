// Search only information already present in the catalog. Readings are aliases,
// not product claims, and are used only when their written form is present.
export const SHOP_CATEGORY_GROUPS={
 'group:food':['食べもの','食べ物・飲み物'],
 'group:exercise-life':['運動','運動・暮らし','暮らし']
};
const readings=[['鉛筆','えんぴつ'],['消しゴム','けしごむ'],['参考書','さんこうしょ'],['数学','すうがく'],['英語','えいご'],['物理','ぶつり'],['化学','かがく'],['国語','こくご'],['基礎','きそ'],['文房具','ぶんぼうぐ'],['飲み物','のみもの'],['復習','ふくしゅう'],['問題集','もんだいしゅう']];
export function normalizeSearch(value){
 return String(value??'').normalize('NFKC').toLocaleLowerCase('ja').replace(/[\u30a1-\u30f6]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
}
export function searchTokens(query){return normalizeSearch(query).trim().split(/\s+/u).filter(Boolean);}
export function matchesItem(item,tokens){
 if(!tokens.length)return true;
 const fields=[item.name,item.category,...(Array.isArray(item.tags)?item.tags:[]),item.description].filter(x=>typeof x==='string').map(normalizeSearch);
 const expanded=fields.flatMap(field=>[field,...readings.filter(([word])=>field.includes(normalizeSearch(word))).map(([,reading])=>normalizeSearch(reading))]);
 return tokens.every(token=>expanded.some(field=>field.includes(token)));
}
export function findShopItems(items,{query='',category='すべて',subject='all',ownedOnly=false,budget='all',sort='default',inventory={},priceOf=item=>item.price}={}){
 const tokens=searchTokens(query),limit=budget==='all'?Infinity:Number(budget);
 return items.map((item,index)=>({item,index,price:priceOf(item)}))
  .filter(({item,price})=>(category==='すべて'||(category==='持ちもの'?(inventory[item.id]||0)>0:SHOP_CATEGORY_GROUPS[category]?SHOP_CATEGORY_GROUPS[category].includes(item.category):item.category===category))&&(subject==='all'||item.subject===subject)&&(!ownedOnly||(inventory[item.id]||0)>0)&&Number.isFinite(price)&&price<=limit&&matchesItem(item,tokens))
  .sort((a,b)=>sort==='price-up'?a.price-b.price||a.index-b.index:sort==='price-down'?b.price-a.price||a.index-b.index:a.index-b.index)
  .map(row=>row.item);
}
