// Esper backend test suite. Run: node tests/run_tests.js
import { DemoClock } from '../engine/clock.js';
import { analyzeNote } from '../engine/text.js';
import { EsperEngine } from '../engine/engine.js';
import { generatePersonas, loadPersonas, applyDue } from '../engine/personas.js';
import { loadPopulation } from '../engine/population.js';

let pass = 0, fail = 0;
const failures = [];
function t(name, fn) {
  try { fn(); pass++; console.log(`PASS  ${name}`); }
  catch (e) { fail++; failures.push(`${name}: ${e.message}`); console.log(`FAIL  ${name} -> ${e.message}`); }
}
const ok = (cond, msg) => { if (!cond) throw new Error(msg || 'assertion failed'); };
const eq = (a, b, msg) => { if (a !== b) throw new Error(`${msg || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };
const throws = (fn, msg) => { try { fn(); } catch { return; } throw new Error(msg || 'expected a throw'); };

const START = '2026-07-11T07:00:00Z';

// Helper: a senior with `days` of steady history ending yesterday.
function stableEngine({ days = 21, missedOffsets = [], moodFn = null, sleepFn = null, mealsFn = null, noteFn = null, timeFn = null } = {}) {
  const clock = new DemoClock(START);
  const engine = new EsperEngine({ clock });
  engine.addSenior({
    id: 's1', name: 'Test Senior', buddy: 'Buddy B',
    emergencyContact: 'EC (555-0000)', enrolledAt: clock.dateStr(-days),
  });
  for (let offset = -days; offset <= -1; offset++) {
    if (missedOffsets.includes(offset)) continue;
    const i = days + offset; // 0..days-1 chronological
    const timeMin = timeFn ? timeFn(i) : 510;
    const hh = String(Math.floor(timeMin / 60)).padStart(2, '0');
    const mm = String(timeMin % 60).padStart(2, '0');
    engine.addCheckin({
      seniorId: 's1',
      at: `${clock.dateStr(offset)}T${hh}:${mm}:00.000Z`,
      sleep: sleepFn ? sleepFn(i) : 4,
      meals: mealsFn ? mealsFn(i) : 3,
      mood: moodFn ? moodFn(i) : 4,
      note: noteFn ? noteFn(i) : '',
    });
  }
  return engine;
}

// ---------- text analysis ----------
t('negation guard: "no dizziness today, feeling better" is not a health hit', () => {
  const r = analyzeNote('no dizziness today, feeling much better');
  eq(r.healthHits.length, 0, 'health hits');
  ok(r.negatedHits.includes('dizziness'), 'dizziness should be recorded as negated');
  ok(r.sentiment > 0, `sentiment should be positive, got ${r.sentiment}`);
});

t('keyword detection: "felt dizzy this morning" is a health hit', () => {
  const r = analyzeNote('felt dizzy this morning');
  ok(r.healthHits.includes('dizzy'), 'should detect dizzy');
});

t('empty note is neutral', () => {
  const r = analyzeNote('');
  eq(r.healthHits.length, 0); eq(r.sentiment, 0);
});

t('idiom safety: seasonal/idiomatic words are not symptoms', () => {
  const r1 = analyzeNote('fall is coming, sick of this heat, going to miss summer');
  eq(r1.healthHits.length, 0, `health hits: ${r1.healthHits.join(',')}`);
  const r2 = analyzeNote('walked down to the park, the sky was so blue');
  eq(r2.isolationHits.length, 0, `isolation hits: ${r2.isolationHits.join(',')}`);
});

// ---------- Tier 2 scoring ----------
t('lagging baseline catches a 28-day slow decline', () => {
  const engine = stableEngine({
    days: 27,
    moodFn: i => (i < 14 ? 4 : Math.max(2, Math.round(4 - (i - 13) * 0.18))),
    sleepFn: i => (i < 14 ? 4 : Math.max(2, Math.round(4 - (i - 13) * 0.16))),
    mealsFn: i => (i < 14 ? 3 : (i > 20 ? 1 : 2)),
  });
  const a = engine.assess('s1');
  ok(['declining', 'declining_fast'].includes(a.status), `status was ${a.status}`);
  ok(a.healthScore >= 25, `health score too low to notice: ${a.healthScore}`);
  ok(a.changeNotes.some(n => n.includes('mood') || n.includes('eating') || n.includes('sleep')),
    `change notes missing specifics: ${a.changeNotes.join(' | ')}`);
});

t('stable senior stays stable with low scores', () => {
  const engine = stableEngine({ days: 21 });
  const a = engine.assess('s1');
  eq(a.status, 'stable', 'status');
  ok(a.healthScore <= 15, `health ${a.healthScore}`);
  ok(a.isolationScore <= 15, `isolation ${a.isolationScore}`);
});

t('variance floor: +30min latency shift on a perfectly regular senior stays finite and modest', () => {
  const engine = stableEngine({ days: 21, timeFn: i => (i >= 14 ? 540 : 510) });
  const a = engine.assess('s1');
  ok(Number.isFinite(a.isolationScore), 'isolation must be finite');
  ok(a.isolationScore < 40, `a 30min shift should be modest, got ${a.isolationScore}`);
});

t('missed days feed Tier 2 as a rate, not an alarm', () => {
  const engine = stableEngine({ days: 21, missedOffsets: [-2, -5] });
  const a = engine.assess('s1');
  ok(a.isolationScore > 0, 'missing days should register');
  ok(a.isolationScore < 50, `missing days alone should not dominate: ${a.isolationScore}`);
  ok(a.changeNotes.some(n => n.includes('missed')), 'should mention the missed check-ins');
});

t('short history lowers confidence with a reason', () => {
  const engine = stableEngine({ days: 5 });
  const a = engine.assess('s1');
  eq(a.confidence.level, 'low', 'confidence level');
  ok(a.confidence.reasons.some(r => r.includes('days of history')), a.confidence.reasons.join('; '));
});

t('isolation words move the Isolation score', () => {
  const engine = stableEngine({
    days: 21,
    noteFn: i => (i >= 15 ? 'so lonely, nobody comes by, feeling alone' : ''),
  });
  const a = engine.assess('s1');
  ok(a.isolationScore >= 15, `lonely notes should register: ${a.isolationScore}`);
  ok(a.changeNotes.some(n => n.includes('feeling')), `notes: ${a.changeNotes.join(' | ')}`);
});

t('midnight wraparound: a 23:50-habit senior drifting past midnight reads as minutes, not hours', () => {
  const engine = stableEngine({ days: 21, timeFn: i => (i >= 14 ? 30 : 1430) });
  const a = engine.assess('s1');
  ok(Number.isFinite(a.isolationScore), 'finite');
  ok(a.isolationScore < 40, `40min shift across midnight should be modest, got ${a.isolationScore}`);
});

t('long silence reads as "no recent data", never fake-precise scores', () => {
  const engine = stableEngine({ days: 27 });
  engine.clock.advanceDays(10); // ten silent days
  const a = engine.assess('s1');
  eq(a.confidence.level, 'low', 'confidence must drop');
  ok(a.confidence.reasons.some(r => r.includes('no check-ins in the last')),
    `reasons: ${a.confidence.reasons.join('; ')}`);
  ok(!a.confidence.reasons.some(r => r.includes('days of history')),
    'must not claim short history about a senior with a month of data');
});

t('new bad news cannot improve any score (check-in-anchored recent window)', () => {
  const engine = stableEngine({
    days: 27,
    moodFn: i => (i < 14 ? 4 : Math.max(2, Math.round(4 - (i - 13) * 0.18))),
    sleepFn: i => (i < 14 ? 4 : Math.max(2, Math.round(4 - (i - 13) * 0.16))),
    mealsFn: i => (i < 14 ? 3 : 2),
  });
  const before = engine.assess('s1');
  engine.clock.setTime('2026-07-11T10:00:00Z');
  engine.addCheckin({ seniorId: 's1', at: '2026-07-11T10:00:00.000Z', sleep: 2, meals: 1, mood: 2, note: 'felt dizzy and exhausted' });
  const after = engine.assess('s1');
  ok(after.healthScore >= before.healthScore, `health went ${before.healthScore} -> ${after.healthScore} after bad news`);
});

// ---------- enrollment fence ----------
t('a senior enrolled today reads as brand new, not as a crisis', () => {
  const clock = new DemoClock('2026-07-11T10:00:00Z');
  const engine = new EsperEngine({ clock });
  engine.addSenior({ id: 'judge', name: 'Judge Demo' });
  const a0 = engine.assess('judge');
  eq(a0.healthScore, 0, 'health'); eq(a0.isolationScore, 0, 'isolation');
  eq(a0.historyDays, 0, 'historyDays');
  ok(a0.confidence.reasons.some(r => r.includes('enrolled recently')), a0.confidence.reasons.join('; '));
  ok(!a0.changeNotes.some(n => n.includes('missed')), `no phantom misses: ${a0.changeNotes.join(' | ')}`);
  engine.addCheckin({ seniorId: 'judge', at: '2026-07-11T10:05:00.000Z', sleep: 4, meals: 3, mood: 4, note: '' });
  const a1 = engine.assess('judge');
  ok(a1.isolationScore <= 10, `first check-in must not read as hours late: ${a1.isolationScore}`);
  eq(a1.baseline.usualCheckinMin, null, 'no fake baseline time');
  ok(engine.brief('judge').text.includes('Baseline still forming'), 'brief must say baseline forming');
});

t('day-zero Tier 1 flag says 1 day silent with a safe buddy default', () => {
  const clock = new DemoClock('2026-07-11T15:00:00Z'); // past the 14:00 default deadline
  const engine = new EsperEngine({ clock });
  engine.addSenior({ id: 'judge', name: 'Judge Demo' });
  engine.tick();
  const f = engine.activeFlag('judge');
  ok(f, 'flag should fire for a no-show on day zero');
  eq(f.missedDays, 1, 'one day silent, never fourteen');
  ok(f.timeline[0].event.includes('no buddy on file'), f.timeline[0].event);
});

// ---------- Tier 1 ----------
t('Tier 1 does not fire before the deadline', () => {
  const engine = stableEngine({ days: 21 }); // usual 8:30 -> deadline 11:00
  engine.clock.setTime('2026-07-11T10:30:00Z');
  engine.tick();
  eq(engine.activeFlag('s1'), null, 'no flag before deadline');
});

t('Tier 1 fires after the deadline passes with no check-in', () => {
  const engine = stableEngine({ days: 21 });
  engine.clock.setTime('2026-07-11T11:15:00Z'); // past 8:30 + 150min grace
  engine.tick();
  const f = engine.activeFlag('s1');
  ok(f, 'flag should exist');
  eq(f.state, 'buddy_pinged', 'first state is the buddy ping');
  ok(f.timeline[0].event.includes('Buddy B'), 'ping names the buddy');
});

t('day-stepping from a morning time still fires (whole missed days count)', () => {
  const engine = stableEngine({ days: 21 });
  engine.clock.advanceDays(1); // now tomorrow 07:00, before the deadline
  engine.tick();
  const f = engine.activeFlag('s1');
  ok(f, 'yesterday was fully silent; the flag must fire regardless of time-of-day');
  ok(f.missedDays >= 1, `missedDays ${f.missedDays}`);
});

t('late-evening senior is still reachable by Tier 1', () => {
  const engine = stableEngine({ days: 21, timeFn: () => 1350 }); // 22:30 habit
  engine.clock.setTime('2026-07-11T23:59:00Z');
  engine.tick();
  ok(engine.activeFlag('s1'), 'deadline cap must leave the deadline crossable');
});

t('one active flag per senior, even across a multi-day silence', () => {
  const engine = stableEngine({ days: 21 });
  engine.clock.setTime('2026-07-11T11:15:00Z');
  engine.tick();
  engine.clock.advanceDays(1); engine.tick();
  engine.clock.advanceDays(1); engine.tick();
  const active = engine.flags().filter(f => f.state !== 'resolved');
  eq(active.length, 1, 'exactly one active flag');
  ok(active[0].missedDays >= 3, `missedDays should grow, got ${active[0].missedDays}`);
});

t('a late check-in visibly clears the flag', () => {
  const engine = stableEngine({ days: 21 });
  engine.clock.setTime('2026-07-11T11:15:00Z');
  engine.tick();
  ok(engine.activeFlag('s1'), 'flag fired');
  engine.clock.setTime('2026-07-11T13:00:00Z');
  engine.addCheckin({ seniorId: 's1', at: '2026-07-11T13:00:00.000Z', sleep: 4, meals: 3, mood: 4, note: 'overslept, all fine' });
  eq(engine.activeFlag('s1'), null, 'flag should be resolved');
  const f = engine.flags()[0];
  eq(f.resolution, 'checked_in_late');
});

t('escalation ladder: buddy -> coordinator -> emergency contact', () => {
  const engine = stableEngine({ days: 21 });
  engine.clock.setTime('2026-07-11T11:15:00Z');
  engine.tick();
  engine.clock.advanceHours(2.5); engine.tick();
  eq(engine.activeFlag('s1').state, 'coordinator_notified', 'after 2.5h');
  engine.clock.advanceHours(4); engine.tick();
  eq(engine.activeFlag('s1').state, 'emergency_contacted', 'after 6.5h total');
});

t('manual buddy resolution works AND holds for the rest of the day', () => {
  const engine = stableEngine({ days: 21 });
  engine.clock.setTime('2026-07-11T11:15:00Z');
  engine.tick();
  const f = engine.activeFlag('s1');
  engine.resolveFlag(f.id, 'buddy_confirmed_ok');
  eq(engine.activeFlag('s1'), null);
  eq(f.resolution, 'buddy_confirmed_ok');
  // the same silent day must NOT re-ping the buddy fifteen minutes later
  engine.clock.advanceHours(0.25); engine.tick();
  eq(engine.activeFlag('s1'), null, 'resolution must survive the next tick');
  // but a NEW silent day fires fresh
  engine.clock.advanceDays(1); engine.tick();
  ok(engine.activeFlag('s1'), 'next day silence is a new event');
});

t('scrubbing the clock backward does not fabricate a resolution', () => {
  const engine = stableEngine({ days: 21 });
  engine.clock.setTime('2026-07-11T11:45:00Z');
  engine.tick();
  ok(engine.activeFlag('s1'), 'flag fired');
  engine.clock.setTime('2026-07-10T12:00:00Z'); // presenter scrubs back a day
  engine.tick();
  const f = engine.flags()[0];
  ok(f.state !== 'resolved', `flag must not auto-resolve in the past, state: ${f.state}`);
});

t('malformed check-ins are rejected, not stored', () => {
  const engine = stableEngine({ days: 21 });
  const n = engine.store.checkins.length;
  throws(() => engine.addCheckin({ seniorId: 's1', at: '2026-07-11T09:00:00.000Z', sleep: 4, mood: 4 }), 'missing meals must throw');
  throws(() => engine.addCheckin({ seniorId: 's1', sleep: 4, meals: 3, mood: 4 }), 'missing timestamp must throw');
  throws(() => engine.addCheckin({ seniorId: 's1', at: 'not-a-date', sleep: 4, meals: 3, mood: 4 }), 'bad timestamp must throw');
  eq(engine.store.checkins.length, n, 'nothing stored');
  ok(Number.isFinite(engine.assess('s1').healthScore), 'scores stay finite');
});

// ---------- personas end to end ----------
t('persona generation is deterministic (same seed, identical data)', () => {
  const a = generatePersonas(new DemoClock(START), 42);
  const b = generatePersonas(new DemoClock(START), 42);
  eq(JSON.stringify(a), JSON.stringify(b), 'same seed must give identical output');
});

t('Dorothy reads as declining; Frank stable; Maria not declining', () => {
  const engine = new EsperEngine({ clock: new DemoClock(START) });
  loadPersonas(engine);
  const dorothy = engine.assess('dorothy');
  const frank = engine.assess('frank');
  const maria = engine.assess('maria');
  ok(['declining', 'declining_fast'].includes(dorothy.status), `dorothy: ${dorothy.status}`);
  ok(dorothy.healthScore >= 25 && dorothy.isolationScore >= 25,
    `dorothy scores H${dorothy.healthScore}/I${dorothy.isolationScore}`);
  eq(frank.status, 'stable', `frank: ${frank.status}`);
  ok(frank.healthScore <= 20, `frank health ${frank.healthScore}`);
  ok(!['declining', 'declining_fast'].includes(maria.status), `maria: ${maria.status}`);
});

t('Maria non-alert is explained by the engine (upbeat notes)', () => {
  const engine = new EsperEngine({ clock: new DemoClock(START) });
  loadPersonas(engine);
  engine.advanceTo('2026-07-11T12:00:00Z');
  const maria = engine.assess('maria');
  ok(maria.changeNotes.some(n => n.includes('upbeat')), maria.changeNotes.join(' | '));
});

t('Dorothy gets a concrete outlook (days to concern zone or in zone)', () => {
  const engine = new EsperEngine({ clock: new DemoClock(START) });
  loadPersonas(engine);
  const a = engine.assess('dorothy');
  ok(a.outlook.inZone || (a.outlook.daysToConcern >= 1 && a.outlook.daysToConcern <= 14),
    `outlook: ${JSON.stringify(a.outlook)}`);
});

t('Sam: silent past his deadline -> Tier 1 flag fires; others do not', () => {
  const engine = new EsperEngine({ clock: new DemoClock(START) });
  loadPersonas(engine);
  engine.advanceTo('2026-07-11T11:45:00Z');
  ok(engine.activeFlag('sam'), 'sam should be flagged');
  eq(engine.activeFlag('dorothy'), null, 'dorothy checked in at 10:45');
  eq(engine.activeFlag('frank'), null, 'frank checked in');
  eq(engine.activeFlag('maria'), null, 'maria checked in');
  const cards = engine.dashboard();
  eq(cards[0].senior.id, 'sam', 'active flag floats to the top of the dashboard');
  ok(cards[0].flagAgeMinutes !== null && cards[0].flagAgeMinutes >= 0, 'flag age is provided');
});

t('the simulated world continues: tomorrow does not flag the whole roster', () => {
  const engine = new EsperEngine({ clock: new DemoClock(START) });
  loadPersonas(engine);
  loadPopulation(engine);
  engine.advanceTo('2026-07-12T12:00:00Z');
  const active = engine.flags().filter(f => f.state !== 'resolved');
  eq(active.length, 0, `tomorrow noon: everyone checked in, got ${active.length} flags`);
  eq(engine.assess('frank').status, 'stable', 'frank stays stable tomorrow');
});

t("Dorothy's projection comes true when time advances", () => {
  const engine = new EsperEngine({ clock: new DemoClock(START) });
  loadPersonas(engine);
  engine.advanceTo('2026-07-14T18:00:00Z'); // three days later
  const a = engine.assess('dorothy');
  ok(a.outlook.inZone || a.combined >= 60,
    `three days on, dorothy should be in the concern zone: combined ${a.combined}, ${JSON.stringify(a.outlook)}`);
});

t('outreach brief is structured AND built from the computed numbers', () => {
  const engine = new EsperEngine({ clock: new DemoClock(START) });
  loadPersonas(engine);
  const brief = engine.brief('dorothy');
  ok(brief.text.includes('Dorothy Alvarez'), 'names the senior');
  ok(brief.text.includes('Linda'), 'names the buddy');
  ok(/\d+\/100/.test(brief.text), 'includes the scores');
  ok(brief.text.toLowerCase().includes('confidence'), 'states confidence');
  ok(Array.isArray(brief.whatChanged) && brief.whatChanged.length > 0, 'structured whatChanged');
  ok(typeof brief.suggestedOpening === 'string', 'structured opening');
  ok(brief.suggested && brief.suggested.urgency, 'suggested action attached');
});

t('applyDue is idempotent', () => {
  const engine = new EsperEngine({ clock: new DemoClock(START) });
  const { todaysPlan } = loadPersonas(engine);
  engine.clock.setTime('2026-07-11T12:00:00Z');
  applyDue(engine, todaysPlan);
  const n1 = engine.store.checkins.length;
  applyDue(engine, todaysPlan);
  eq(engine.store.checkins.length, n1, 'no duplicate check-ins');
});

// ---------- advanced APIs ----------
t('trajectory API: 28 chartable points, projection, both thresholds', () => {
  const engine = new EsperEngine({ clock: new DemoClock(START) });
  loadPersonas(engine);
  const traj = engine.trajectory('dorothy');
  eq(traj.points.length, 28, 'points');
  ok(traj.points.filter(p => p.present).length >= 20, 'present days plotted');
  ok(Array.isArray(traj.projection), 'projection array');
  eq(traj.concernWellness, 50, 'wellness threshold');
  eq(traj.concernRisk, 60, 'risk threshold');
});

t('replay: Dorothy flagged days before today; Frank never; report says so', () => {
  const engine = new EsperEngine({ clock: new DemoClock(START) });
  loadPersonas(engine);
  const d = engine.replay('dorothy');
  ok(d.firstFlaggedDaysAgo >= 3, `dorothy lead time: ${d.firstFlaggedDaysAgo}`);
  eq(engine.replay('frank').firstFlaggedDate, null, 'frank must never flag in replay');
  const vr = engine.validationReport();
  ok(vr.summary.includes('never flagged'), vr.summary);
  ok(vr.flagged.some(f => f.name.includes('Dorothy')), 'dorothy in flagged list');
});

t('assessAsOf answers "what did it say two weeks ago" without touching the clock', () => {
  const engine = new EsperEngine({ clock: new DemoClock(START) });
  loadPersonas(engine);
  const before = engine.clock.iso();
  const past = engine.assessAsOf('dorothy', '2026-06-27T12:00:00Z');
  eq(past.status, 'stable', `dorothy was stable on jun 27, got ${past.status}`);
  eq(engine.clock.iso(), before, 'live clock untouched');
});

t('what-if sandbox: better inputs, lower score, store untouched', () => {
  const engine = new EsperEngine({ clock: new DemoClock(START) });
  loadPersonas(engine);
  const real = engine.assess('dorothy');
  const edited = engine.checkinsFor('dorothy').map(c => ({ ...c, meals: 3, mood: 4, sleep: 4, note: '' }));
  const whatIf = engine.assessWhatIf('dorothy', edited);
  ok(whatIf.healthScore < real.healthScore, `what-if ${whatIf.healthScore} vs real ${real.healthScore}`);
  eq(engine.assess('dorothy').healthScore, real.healthScore, 'real data unchanged');
});

t('score components visibly sum to the displayed score', () => {
  const engine = new EsperEngine({ clock: new DemoClock(START) });
  loadPersonas(engine);
  const a = engine.assess('dorothy');
  const hSum = Object.values(a.components.health).reduce((s, p) => s + p.points, 0);
  const iSum = Object.values(a.components.isolation).reduce((s, p) => s + p.points, 0);
  eq(hSum, a.healthScore, 'health points sum');
  eq(iSum, a.isolationScore, 'isolation points sum');
  ok(Object.values(a.components.health).every(p => typeof p.weight === 'number'), 'weights exposed');
});

t('coordinator actions: assign visit, complete it, card reflects it', () => {
  const engine = new EsperEngine({ clock: new DemoClock(START) });
  loadPersonas(engine);
  const v = engine.assignVisit('dorothy', { volunteer: 'Linda', reason: 'declining trend' });
  let card = engine.dashboard().find(c => c.senior.id === 'dorothy');
  ok(card.openVisit && card.openVisit.id === v.id, 'open visit on the card');
  ok(card.suggestedAction.urgency === 'scheduled', `action shows pending: ${JSON.stringify(card.suggestedAction)}`);
  engine.clock.advanceHours(3);
  engine.completeVisit(v.id, 'visited, all okay');
  card = engine.dashboard().find(c => c.senior.id === 'dorothy');
  ok(card.lastContact && card.lastContact.daysAgo === 0, 'last contact recorded');
  ok(engine.brief('dorothy').text.includes('Last contact'), 'brief mentions the contact');
});

t('serialization: toJSON/fromJSON round-trips live state', () => {
  const engine = new EsperEngine({ clock: new DemoClock(START) });
  loadPersonas(engine);
  engine.advanceTo('2026-07-11T11:45:00Z');
  engine.assignVisit('dorothy', { volunteer: 'Linda' });
  const snapshot = JSON.stringify(engine.toJSON());
  const restored = EsperEngine.fromJSON(JSON.parse(snapshot));
  eq(restored.clock.iso(), engine.clock.iso(), 'clock');
  eq(restored.store.checkins.length, engine.store.checkins.length, 'checkins');
  ok(restored.activeFlag('sam'), 'sam flag survives');
  ok(restored.actions.openVisits('dorothy').length === 1, 'open visit survives');
  eq(restored.dashboard().length, engine.dashboard().length, 'dashboard renders');
  ok(restored.brief('dorothy').text.length > 0, 'brief renders after restore');
});

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) { console.log(failures.map(f => `  - ${f}`).join('\n')); process.exit(1); }
