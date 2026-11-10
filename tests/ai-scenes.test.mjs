import assert from 'node:assert/strict';
import * as E from '../engine.js';import * as H from '../hangouts.js';import {OUTING_STORIES} from '../outing-stories.js';
for(const [id,kind] of [['board-ai-rules','board'],['walk-ai-study','walk']]){
 const scene=OUTING_STORIES.find(x=>x.id===id);assert.ok(scene);assert.equal(scene.choices.length,2);assert.equal(scene.secondChoices.length,2);let s=E.newGame(1);s.lifestyle.outing.kind=kind;let h;for(let seed=0;seed<500;seed++){s.seed=seed;h=H.beginHangout(s,E.tripQuote(s),E.meetupQuote(s));if(h.story===id)break;}assert.equal(h.story,id);s.pending={kind:'hangout',hangout:h,next:null};
 for(let first=0;first<2;first++)for(let second=0;second<2;second++){let x=H.resolveHangout(s,first);x=E.migrateGame(JSON.parse(JSON.stringify(x)));assert.equal(H.hangoutView(x).story,id);x=H.resolveHangout(x,second);x=H.resolveHangout(x,-1);assert.equal(x.pending,null);assert.equal(x.social.trips.at(-1).story,id);assert.ok(x.social.seen.includes(id));assert.ok(x.social.trips.at(-1).transcript.length>=4);}
}
assert.equal(new Set(OUTING_STORIES.map(x=>x.id)).size,OUTING_STORIES.length);console.log('AI scenes: encounter selection, all choices, save reload and transcript passed');
