// End-to-end CLI demo of the SilverGuard backend. Run: node demo.js
// Mirrors the stage arc: Tier 1 fires live, the trend engine catches
// Dorothy's month, the replay proves the lead time, the agent drafts the
// brief, and three days later the projection visibly comes true.

import { DemoClock } from './engine/clock.js';
import { SilverGuardEngine } from './engine/engine.js';
import { loadPersonas } from './engine/personas.js';
import { loadPopulation } from './engine/population.js';

const clock = new DemoClock('2026-07-11T07:00:00Z');
const engine = new SilverGuardEngine({ clock });
loadPersonas(engine);
loadPopulation(engine); // 12 seniors total: a deployment, not a toy

const hr = () => console.log('-'.repeat(78));
const timeStamp = () => `[demo clock: ${clock.iso().slice(0, 16).replace('T', ' ')} UTC]`;
const step = (title) => { console.log(`\n=== ${title} ===`); };

function printDashboard(top = 5) {
  const cards = engine.dashboard();
  console.log(`\nCOORDINATOR DASHBOARD ${timeStamp()}  (${cards.length} seniors, all data simulated)`);
  hr();
  for (const card of cards.slice(0, top)) {
    const a = card.assessment;
    const flagStr = card.flag
      ? `  << FLAG: ${card.flag.state.replace(/_/g, ' ')} (${card.flagAgeMinutes}min ago, ${card.flag.missedDays}d silent)`
      : card.deadline ? `  [not in yet; due by ${card.deadline.clock}]` : '';
    console.log(
      `${card.senior.name.padEnd(18)} ${a.status.replace('_', ' ').padEnd(15)}` +
      `H:${String(a.healthScore).padStart(3)}  I:${String(a.isolationScore).padStart(3)}  ` +
      `conf:${a.confidence.level.padEnd(6)}${flagStr}`
    );
    console.log(`  ${a.outlook.text}  |  do: ${card.suggestedAction.action}`);
    console.log(`  why: ${a.changeNotes.join('; ')}`);
  }
  if (cards.length > top) console.log(`  ... and ${cards.length - top} more stable seniors below`);
  hr();
}

step('07:00 - morning state');
engine.tick();
printDashboard();

step('advance to 09:30 - most of the roster checks in (one call: advanceTo)');
engine.advanceTo('2026-07-11T09:30:00Z');
console.log(`Sam's personal deadline today: ${engine.deadlineFor('sam').clock} UTC (his usual time + grace window)`);

step('advance to 11:45 - Sam is silent past his deadline: TIER 1 FIRES');
engine.advanceTo('2026-07-11T11:45:00Z');
printDashboard();
const samFlag = engine.activeFlag('sam');
console.log('Flag timeline so far:');
for (const e of samFlag.timeline) console.log(`  ${e.at.slice(11, 16)}  ${e.event}`);

step('advance to 14:00 - buddy has not responded: escalates to coordinator');
engine.advanceTo('2026-07-11T14:00:00Z');
for (const e of engine.activeFlag('sam').timeline) console.log(`  ${e.at.slice(11, 16)}  ${e.event}`);

step('buddy Janet knocks: Sam was napping. Coordinator resolves the flag');
engine.resolveFlag(samFlag.id, 'buddy_confirmed_ok');
for (const e of samFlag.timeline) console.log(`  ${e.at.slice(11, 16)}  ${e.event}`);

step("the smart moment - Dorothy's month, caught by the trend engine");
const d = engine.assess('dorothy');
console.log(`status: ${d.status} | Health ${d.healthScore}/100, Isolation ${d.isolationScore}/100, trend slope ${d.trendSlope}/day`);
console.log(`outlook: ${d.outlook.text}`);
console.log(`confidence: ${d.confidence.level}${d.confidence.reasons.length ? ` (${d.confidence.reasons.join('; ')})` : ''}`);
console.log('score arithmetic (visible, sums exactly):');
for (const [k, p] of Object.entries(d.components.health)) console.log(`  health.${k.padEnd(13)} value ${String(p.value).padStart(4)} x weight ${p.weight} = ${p.points} pts`);
const traj = engine.trajectory('dorothy');
console.log(`chart data: ${traj.points.filter(p => p.present).length} plotted days, projection ${traj.projection.length} days to the zone (threshold ${traj.concernWellness})`);

step('the replay proof - answer to "your data is simulated"');
const rp = engine.replay('dorothy');
console.log(`Re-run day by day with only the data that existed then: SilverGuard would have`);
console.log(`first flagged Dorothy on ${rp.firstFlaggedDate}, ${rp.firstFlaggedDaysAgo} days before today.`);
console.log(engine.validationReport().summary);

step('the response agent drafts the outreach brief (offline, after scoring)');
const visit = engine.assignVisit('dorothy', { volunteer: 'volunteer via buddy Linda', reason: 'declining trend' });
console.log(`[coordinator clicked: assign visit -> ${visit.id}, status ${visit.status}]`);
console.log();
console.log(engine.brief('dorothy').text);

step('three days later - the projection comes true');
engine.advanceTo('2026-07-14T18:00:00Z');
const d3 = engine.assess('dorothy');
console.log(`Dorothy: ${d3.status} | H ${d3.healthScore} I ${d3.isolationScore} | ${d3.outlook.text}`);
console.log(`Frank:   ${engine.assess('frank').status} (the stable stay stable)`);
console.log(`Sam:     checked in daily since; flag history preserved (${engine.flags().length} total flags, ${engine.flags().filter(f => f.state !== 'resolved').length} active)`);

console.log('\nDemo complete. The engine is real; the data is simulated.');
