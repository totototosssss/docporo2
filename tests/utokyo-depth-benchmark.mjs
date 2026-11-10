import * as U from '../utokyo-depth.js';
import * as A from '../aspiration.js';
import * as X from '../exams.js';
// Repeatable counterfactuals using game-state snapshots at the front exam; not real admissions probabilities.
import * as E from '../engine.js';
import * as P from '../planner.js';
import {SCHOOLS} from '../data.js';
import {chooseHousehold} from '../household.js';

const seeds = Number(process.argv[2] || 1), years = Number(process.argv[3] || 20), mode=process.argv[4]||'untargeted', targeted=['targeted','early'].includes(mode), early=mode==='early';
if (!Number.isInteger(seeds) || seeds < 1 || seeds > 100) throw Error('seed count must be 1–100');
if (!Number.isInteger(years) || years < 1 || years > 50) throw Error('year count must be 1–50');

function firstAvailable(fn) {
  let last;
  for (let i = 0; i < 8; i++) {
    try { return fn(i); } catch (error) { last = error; }
  }
  throw last;
}

function resolve(s) {
  switch (s.pending.kind) {
    case 'story': return firstAvailable(i => E.chooseEvent(s, i));
    case 'household': return chooseHousehold(s, 0);
    case 'afterStory': return E.dismissNarrative(s);
    case 'encounter': return firstAvailable(i => E.resolveEncounter(s, i));
    case 'caught': return E.resolveCaught(s, 'apology');
    case 'hangout': return E.resolveHangout(s, s.pending.hangout.stage < 2 ? 0 : -1);
    case 'applications': {
      const available = SCHOOLS.filter(school => !E.applicationError(s, school) && !['jichi', 'uoeh'].includes(school.id));
      available.sort((a, b) => E.predict(s, b).probability - E.predict(s, a).probability);
      if(targeted && s.pending.scope==='public' && available.some(x=>x.id==='utokyo')) s=E.applySchool(s,'utokyo');else if (available[0]) s = E.applySchool(s, available[0].id);
      return E.finalizeApplications(s);
    }
    case 'common': return E.takeCommon(s);
    case 'commonResult': return E.dismissCommon(s);
    case 'individual': return E.takeIndividual(s);
    case 'individualResult': return E.dismissIndividual(s);
    case 'final': return E.takeFinal(s);
    default: throw Error(`Unknown pending event: ${s.pending.kind}`);
  }
}

function playYear(initial) {
  let s = initial, count = 0, scheduledWorkWeeks = 0;s._benchmark=null;if(early&&s.aspiration!=='utokyo')s=A.chooseAspiration(s,'utokyo');
  while (s.phase !== 'ending') {
    if (++count > 250) throw Error(`Event loop did not finish at week ${s.week}`);
    if (s.pending) {
      if(s.pending.kind==='individual'&&s.pending.scope==='front'){
        const depth=U.utokyoDepth(s),values=Object.fromEntries(['utokyo','kyoto','science-tokyo'].map(id=>[id,E.predict(s,SCHOOLS.find(x=>x.id===id)).probability]));
        const utokyo=SCHOOLS.find(x=>x.id==='utokyo'),attempt=s.pending.ids.includes('utokyo')?X.sitSecondary(s,utokyo,E.weights(s,utokyo),'steady'):null;
        s._benchmark={values,depth,ordinaryPass:attempt?attempt.score>=attempt.cut&&attempt.interviewOK:null,actualPass:attempt?.passed??null,focusPastHours:targeted?s.history.filter(h=>early||h.week>=40&&h.week<=43).reduce((n,h)=>n+3*h.plan.counts.past,0):0,totalPastHours:s.history.reduce((n,h)=>n+3*h.plan.counts.past,0), writingHours:s.history.reduce((n,h)=>n+3*h.plan.counts.writing,0)};
      }
      s = resolve(s); continue;
    }
    // A reproducible, deliberately simple strategy, not an optimized policy.
    s.weekly = {...s.weekly, style: s.week < 20 ? 'weak' : s.week < 34 ? 'balanced' : 'secondary', work: 0};
    if(targeted && (early||s.applications.includes('utokyo'))){
      if(s.training.focus!=='utokyo')s=E.setTraining(s,'elite','utokyo');
      const now=s.yearIndex*48+s.week,rows=s.papers.records.filter(r=>r.key==='utokyo');
      const mode=rows.some(r=>!r.analyzed)?'analysis':rows.some(r=>r.analyzed&&!r.retried&&now-r.week>=2)?'retry':'timed';
      if(s.papers.mode!==mode)s=E.setPaperMode(s,mode);
    }
    let plan = P.automaticPlan(s), error = E.validatePlan(s, plan);
    if (error) {
      s.weekly.work = 1;
      plan = P.automaticPlan(s);
      error = E.validatePlan(s, plan);
      scheduledWorkWeeks++;
    }
    if (error) throw Error(`Week ${s.week}: ${error}`);
    s = E.simulateWeek(s, plan);
  }
  return {state: s, scheduledWorkWeeks};
}

function snapshot(s, seed, year, workWeeks) {
  const round = n => Math.round(n * 10) / 10;
  return {
    seed, year, phase: year === 1 ? 'first-year' : s.university.status === 'graduated' ? 'after-graduation' : 'enrolled',
    completed: s.phase === 'ending' && s.week === 48,
    grade: s.university.grade, universityStatus: s.university.status, credits: s.credits,
    historyWeeks: s.history.length, previousYears: s.pastYears.length, householdEvents: s.household?.history?.length || 0, livingFamily: s.household?.people?.filter(person => person.alive).length ?? null, narrativeEntries: (s.journey.narrative || []).filter(x => x.year === s.yearIndex).length,
    health: round(s.health), stress: round(s.stress), spirit: round(s.lifestyle.spirit),
    skills: Object.fromEntries(Object.entries(s.skills).map(([id, value]) => [id, round(value)])),
    cash: Math.round(s.cash), examBudget: Math.round(s.examBudget), income: Math.round(s.income), workWeeks,
    commonScore: s.ct?.missed ? null : s.ct?.score ?? null,
    schools: s.results.map(result => ({id: result.id, selectionIndex: result.score, passed: result.passed})),
    examMoment:s._benchmark?{old:Object.fromEntries(Object.entries(s._benchmark.values).map(([id,v])=>[id,round(v/(id==='utokyo'?s._benchmark.depth.multiplier:1)*100)])),adjusted:Object.fromEntries(Object.entries(s._benchmark.values).map(([id,v])=>[id,round(v*100)])),depth:s._benchmark.depth,focusPastHours:s._benchmark.focusPastHours,totalPastHours:s._benchmark.totalPastHours,writingHours:s._benchmark.writingHours,ordinaryPass:s._benchmark.ordinaryPass,actualPass:s._benchmark.actualPass}:null,
    writing:round(s.writing), focusRecords:s.papers.records.filter(r=>r.key==='utokyo').length, focusAnalyzed:s.papers.records.filter(r=>r.key==='utokyo'&&r.analyzed).length, focusRetried:s.papers.records.filter(r=>r.key==='utokyo'&&r.retried).length,
    yearEndForecast:Object.fromEntries(['utokyo','kyoto','science-tokyo'].map(id=>[id,round(E.predict(s,SCHOOLS.find(x=>x.id===id)).probability*100)])), stateJsonBytes: Buffer.byteLength(JSON.stringify(s), 'utf8'),
  };
}

console.log(JSON.stringify({description: 'Game-model benchmark; not a real-world prediction', seeds, years, strategy: early?'select utokyo as aspiration and train before application; rotate first attempt, analysis and delayed retry':targeted?'target utokyo after application; rotate first attempt, analysis and delayed retry':'generic preparation and highest estimated school; no utokyo focus'}));
for (let seed = 1; seed <= seeds; seed++) {
  let s = E.newGame(seed);
  for (let year = 1; year <= years; year++) {
    const result = playYear(s);
    s = result.state;
    if([1,4,8,12,20].includes(year))console.log(JSON.stringify(snapshot(s, seed, year, result.scheduledWorkWeeks)));
    if (year === years) break;
    if (year === 4) {
      if (!E.canGraduate(s)) throw Error(`Seed ${seed}: graduation conditions not met after four years`);
      s = E.continueYear(s, 'graduate');
    } else {
      s = E.continueYear(s, s.university.status === 'graduated' ? 'graduate' : 'enrolled');
    }
    s = E.migrateGame(JSON.parse(JSON.stringify(s)));
    if (!s) throw Error(`Seed ${seed}: save migration failed`);
  }
}
