import {SCHOOL_MAP,SUBJECTS} from './data.js?v=8.2';
import {EXAM_STYLES} from './admissions.js?v=8.2';
import {weights,eligibility} from './engine.js?v=8.2';

// A school to keep in view is independent of applications and training settings.
export function chooseAspiration(state,id){
 if(typeof id!=='string'||!Object.hasOwn(SCHOOL_MAP,id))throw Error('学校が見つかりません。');
 const s=structuredClone(state);s.aspiration=id;return s;
}
export function clearAspiration(state){const s=structuredClone(state);s.aspiration=null;return s;}
export function aspirationView(state){
 const id=state?.aspiration;if(typeof id!=='string'||!Object.hasOwn(SCHOOL_MAP,id))return null;
 const school=SCHOOL_MAP[id],style=EXAM_STYLES[school.profile];if(!style)return null;
 const subjectIds=Object.keys(weights(state,school)),raw=state.training?.sessions?.[school.profile];
 return {id,name:school.name,profile:school.profile,profileName:style.name,
  subjects:subjectIds.map(id=>({id,name:SUBJECTS.find(x=>x.id===id)?.name||id})),
  profileBlocks:Number.isFinite(raw)?Math.max(0,raw):0,
  applied:Array.isArray(state.applications)&&state.applications.includes(id),
  eligibility:eligibility(state,school)};
}
