import assert from 'node:assert/strict';
import {normalizeSearch,searchTokens,matchesItem,findShopItems} from '../search.js';
const items=[
 {id:'a',name:'ＡＢＣ ノート',category:'文房具',tags:['記録'],description:'青い表紙',price:400},
 {id:'b',name:'ｺｰﾋｰ',category:'飲み物',tags:['休憩'],description:'温かい',price:300},
 {id:'c',name:'鉛筆セット',category:'文房具',tags:['筆記'],description:'書く道具',price:400},
 {id:'d',name:'数学の基礎',subject:'math',category:'参考書',tags:['基礎'],description:'演習',price:1800},
 {id:'e',name:'数学演習',subject:'math',category:'参考書',tags:['発展'],description:'基礎から',price:1800}
];
const ids=x=>x.map(i=>i.id);
assert.equal(normalizeSearch(' ＡＢＣ　ｺｰﾋｰ '),' abc こーひー ');
assert.deepEqual(searchTokens('  数学　   基礎 '),['数学','基礎']);
assert.deepEqual(ids(findShopItems(items,{query:'ａｂｃ　青い'})),['a']);
assert.deepEqual(ids(findShopItems(items,{query:'こーひー'})),['b']);
assert.deepEqual(ids(findShopItems(items,{query:'えんぴつ'})),['c']);
assert.deepEqual(ids(findShopItems(items,{query:'すうがく きそ'})),['d','e']);
assert.deepEqual(ids(findShopItems(items,{query:'すうがく 基礎'})),['d','e']);
assert.deepEqual(ids(findShopItems(items,{query:' 　 '})),['a','b','c','d','e']);
assert(!matchesItem({name:'foo',category:'bar'},['foobar']));
assert.deepEqual(ids(findShopItems(items,{category:'参考書',query:'数学 基礎',budget:1800,sort:'price-down'})),['d','e']);
assert.deepEqual(ids(findShopItems(items,{category:'参考書',budget:1799})),[]);
assert.deepEqual(ids(findShopItems(items,{category:'持ちもの',inventory:{a:1,b:0,d:2},budget:1000})),['a']);
assert.deepEqual(ids(findShopItems(items,{category:'参考書',subject:'math',ownedOnly:true,inventory:{d:1,e:0}})),['d']);
assert.deepEqual(ids(findShopItems(items,{category:'文房具',ownedOnly:true,inventory:{a:1,b:1}})),['a']);
assert.deepEqual(ids(findShopItems(items,{subject:'physics'})),[]);
assert.deepEqual(ids(findShopItems(items,{sort:'price-up'})),['b','a','c','d','e']);
assert.deepEqual(ids(findShopItems(items,{sort:'price-down'})),['d','e','a','c','b']);
assert.deepEqual(ids(findShopItems(items,{query:'存在しない'})),[]);
assert.deepEqual(ids(findShopItems(items,{category:'存在しない'})),[]);
const grouped=[{id:'f1',category:'食べもの',price:100},{id:'f2',category:'食べ物・飲み物',price:200},{id:'g1',category:'運動',price:300},{id:'g2',category:'運動・暮らし',price:400},{id:'g3',category:'暮らし',price:500}];
assert.deepEqual(ids(findShopItems(grouped,{category:'group:food'})),['f1','f2']);
assert.deepEqual(ids(findShopItems(grouped,{category:'group:exercise-life'})),['g1','g2','g3']);
assert.deepEqual(ids(findShopItems(grouped,{category:'運動・暮らし'})),['g2']);
assert.deepEqual(ids(findShopItems(items,{budget:300,priceOf:i=>i.price===400?250:i.price})),['a','b','c']);
console.log('shop search, normalization, filters and stable sorting: passed');
