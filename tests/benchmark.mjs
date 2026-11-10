// Repeatable game-model scenarios. These numbers are not real-world forecasts.
import * as E from '../engine.js';
import * as P from '../planner.js';
import {SCHOOLS} from '../data.js';
import {chooseHousehold} from '../household.js';
import * as Housing from '../housing.js';
import * as Justice from '../justice-story.js';
import * as Custody from '../custody.js';
import * as Finance from '../finance-system.js';
import * as Market from '../market.js';

const seeds = Number(process.argv[2] || 2), years = Number(process.argv[3] || 7), scenario = process.argv[4] || 'baseline';
if (!Number.isInteger(seeds) || seeds < 1 || seeds > 100) throw Error('seed count must be 1–100');
if (!Number.isInteger(years) || years < 1 || years > 50) throw Error('year count must be 1–50');
if (!['baseline','justice','forced-custody'].includes(scenario)) throw Error('scenario must be baseline, justice, or forced-custody');

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
    case 'housing': return Housing.chooseHousing(s, 0);
    case 'afterStory': return E.dismissNarrative(s);
    case 'encounter': return firstAvailable(i => E.resolveEncounter(s, i));
    case 'caught': return E.resolveCaught(s, 'apology');
    case 'hangout': return E.resolveHangout(s, s.pending.hangout.stage < 2 ? 0 : -1);
    case 'applications': {
      const available = SCHOOLS.filter(school => !E.applicationError(s, school) && !['jichi', 'uoeh'].includes(school.id));
      available.sort((a, b) => E.predict(s, b).probability - E.predict(s, a).probability);
      if (available[0]) s = E.applySchool(s, available[0].id);
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
  let s = initial, count = 0, scheduledWorkWeeks = 0;
  while (s.phase !== 'ending' && s.phase !== 'deceased') {
    if (++count > 350) throw Error(`Event loop did not finish at week ${s.week}`);
    if (s.pending) { s = resolve(s); if (!s.pending && s.phase === 'study') s = Housing.advanceHousing(s); continue; }
    if (s.justice?.event) { s = Justice.acknowledgeJustice(s); continue; }
    if (s.phase === 'custody') {
      if (s.week === 48) break;
      s = E.simulateCustodyWeek(s); continue;
    }
    if (Justice.justiceBlocked(s)) { s = Justice.declineCounsel(s); continue; }
    if (scenario === 'justice' && s.yearIndex === 0 && s.week === 40 && !s.justice) s = Justice.chooseJustice(s, 'participate');
    // Explicitly force a guilty verdict only to exercise an eight-week term over New Year.
    // This scenario is not an estimate of real-world legal outcomes.
    if (scenario === 'forced-custody' && s.yearIndex === 0 && s.week === 44 && !s.custody) {
      // Exercise real housing cost and possible rent arrears during custody.
      if ((!s.housing || s.housing.status === 'housed') && s.cash >= Housing.RENT_DEPOSIT) {
        s = Housing.beginHousingNotice(s); s = Housing.advanceHousing(s); s = Housing.chooseHousing(s, 2);
      }
      s = Justice.chooseJustice(s, 'participate');
      Object.assign(s.justice, {action:'done',scheduled:null,caseStatus:'arrested',exposureDue:40,event:{type:'guilty',createdAt:44,arrestAfter:false},criminal:{arrested:true,convicted:null},procedure:{stage:'hearing',counsel:'declined',scheduled:null,hearingDue:44,verdict:null}});
      if (!Justice.validateJustice(s)) throw Error('Invalid forced justice scenario');
      continue;
    }
    // A reproducible, deliberately simple strategy, not an optimized policy.
    s.weekly = {...s.weekly, style: s.week < 20 ? 'weak' : s.week < 34 ? 'balanced' : 'secondary', work: 0};
    let plan = P.automaticPlan(s), error = E.validatePlan(s, plan);
    if (s.justice?.action === 'scheduled') {
      const study = ['math','english','physics','chemistry','japanese','social','info'].find(id => plan.counts[id]>0);
      if (study) { plan.counts[study]--; plan = E.bestSchedule(s, plan); error = E.validatePlan(s, plan); }
    }
    if (error) {
      for (let work=1;work<=4&&error;work++) { s.weekly.work = work; plan = P.automaticPlan(s); error = E.validatePlan(s, plan); }
      scheduledWorkWeeks++;
    }
    if (error && s.housing?.status === 'rental') { s = Housing.housingAction(s, 'leave-rental'); plan = P.automaticPlan(s); error = E.validatePlan(s, plan); }
    if (error) throw Error(`Week ${s.week}: ${error}`);
    s = E.simulateWeek(s, plan);
  }
  return {state: s, scheduledWorkWeeks};
}

function snapshot(s, seed, year, workWeeks) {
  const round = n => Math.round(n * 10) / 10;
  return {
    seed, year, phase: s.phase === 'custody' ? 'custody' : s.phase === 'deceased' ? 'deceased' : year === 1 ? 'first-year' : s.university.status === 'graduated' ? 'after-graduation' : s.university.status,
    completed: s.week === 48 && ['ending','custody'].includes(s.phase),
    grade: s.university.grade, universityStatus: s.university.status, credits: s.credits,
    historyWeeks: s.history.length, previousYears: s.pastYears.length, householdEvents: s.household?.history?.length || 0, livingFamily: s.household?.people?.filter(person => person.alive).length ?? null, narrativeEntries: (s.journey.narrative || []).filter(x => x.year === s.yearIndex).length,
    health: round(s.health), stress: round(s.stress), spirit: round(s.lifestyle.spirit),
    skills: Object.fromEntries(Object.entries(s.skills).map(([id, value]) => [id, round(value)])),
    cash: Math.round(s.cash), examBudget: Math.round(s.examBudget), income: Math.round(s.income), workWeeks,
    commonScore: s.ct?.missed ? null : s.ct?.score ?? null,
    housing: s.housing?.status || 'housed', justiceStatus: s.justice?.procedure?.stage || s.justice?.caseStatus || 'none', custodyWeeks: s.custody?.history?.filter(x=>x.kind==='week').length || 0, custodyRemaining: s.custody?.remainingWeeks ?? null, rentArrears: s.custody?.rentArrears || 0,
    schools: s.results.map(result => ({id: result.id, selectionIndex: result.score, passed: result.passed})),
    stateJsonBytes: Buffer.byteLength(JSON.stringify(s), 'utf8'),
  };
}

console.log(JSON.stringify({description: 'Game-model benchmark; not a real-world prediction', seeds, years, scenario, strategy: 'standard support; weak → balanced → secondary; first valid event choice; housing consultation; decline counsel; one eligible school per application period; work only when needed; forced-custody explicitly adds a rental and guilty verdict'}));
for (let seed = 1; seed <= seeds; seed++) {
  let s = E.newGame(seed);
  for (let year = 1; year <= years; year++) {
    const result = playYear(s);
    s = result.state;
    const numbers = [s.cash,s.examBudget,s.health,s.stress,s.lifestyle.spirit,...Object.values(s.skills)];
    if (!numbers.every(Number.isFinite) || s.cash < 0 || s.examBudget < 0) throw Error(`Seed ${seed}: invalid numeric state in year ${year}`);
    if (!Housing.validateHousing(s) || !Justice.validateJustice(s) || !Custody.validateCustody(s) || !Finance.validateFinanceSystem(s) || !Market.validateMarketState(s)) throw Error(`Seed ${seed}: invalid game state in year ${year}`);
    console.log(JSON.stringify(snapshot(s, seed, year, result.scheduledWorkWeeks)));
    if (year === years || s.phase === 'deceased') break;
    if (s.phase === 'custody') s = E.continueCustodyYear(s);
    else s = E.continueYear(s, s.university.status === 'graduated' || E.canGraduate(s) ? 'graduate' : 'enrolled');
    s = E.migrateGame(JSON.parse(JSON.stringify(s)));
    if (!s) throw Error(`Seed ${seed}: save migration failed`);
    if (!Housing.validateHousing(s) || !Justice.validateJustice(s) || !Custody.validateCustody(s)) throw Error(`Seed ${seed}: invalid saved state after year ${year}`);
  }
}
