# SilverGuard Backend

The complete SilverGuard engine: Tier 1 (deterministic missed-check-in rule with
buddy escalation) plus Tier 2 (trend engine scoring each senior against their own
lagging baseline), with chart/replay/validation APIs, coordinator actions, and
serialization. Zero dependencies, framework-free ES modules, fully offline. Node 18+.

```
npm test      # 41-test suite (node tests/run_tests.js)
npm run demo  # full end-to-end CLI demo of the stage arc (node demo.js)
```

## How the frontend hooks in

Plain ES modules; a Vite/React app imports them directly. No server, no network.

```js
import { DemoClock } from './engine/clock.js';
import { SilverGuardEngine } from './engine/engine.js';
import { loadPersonas } from './engine/personas.js';
import { loadPopulation } from './engine/population.js';

const clock = new DemoClock('2026-07-11T07:00:00Z');
const engine = new SilverGuardEngine({ clock });
loadPersonas(engine);     // Dorothy/Frank/Maria/Sam + 15 days of scripted future
loadPopulation(engine);   // 8 background seniors -> 12-senior dashboard

// THE on-stage loop is ONE call (moves clock, applies due simulated
// check-ins, evaluates Tier 1):
engine.advanceTo('2026-07-11T11:45:00Z');   // or advanceHours(h) / advanceDays(d)

engine.dashboard();       // ranked cards, everything a card renders (see below)
engine.assess(id);        // full Tier 2 assessment
engine.trajectory(id);    // THE CHART: 28 daily wellness points + projection + thresholds
engine.replay(id);        // as-of series + firstFlaggedDate ("flagged 7 days before today")
engine.validationReport();// whole-roster replay: who flagged when, who never did
engine.brief(id);         // STRUCTURED outreach brief {whatChanged[], suggestedOpening, ..., text}
engine.assessAsOf(id, iso);        // read-only "what did it say then"
engine.assessWhatIf(id, checkins); // sandbox: edited copy, store untouched
engine.addCheckin({ seniorId, at, sleep, meals, mood, note }); // strict-validated
engine.addSenior({ id, name, buddy, emergencyContact });       // live enrollment: enrolledAt + safe defaults auto-set
engine.resolveFlag(flagId, 'buddy_confirmed_ok');  // holds for the rest of the day
engine.assignVisit(id, { volunteer }); engine.logContact(id, { how }); engine.completeVisit(actionId, note);
engine.toJSON(); SilverGuardEngine.fromJSON(data); // refresh-safe persistence
```

### Dashboard card shape

```
{ senior, assessment, flag, flagAgeMinutes, checkedInToday,
  deadline: {clock, minutesRemaining} | null,   // for not-yet-in seniors
  openVisit, lastContact: {type, daysAgo} | null,
  suggestedAction: {action, urgency} }          // urgency: now|high|medium|soft|scheduled|none
```

### Assessment object

```
healthScore / isolationScore / combined   0-100; score = exact sum of component points
status          stable | improving | declining | declining_fast   (Theil-Sen slope, noise-robust)
outlook         { inZone, daysToConcern, text }   in-zone via risk OR wellness crossing
confidence      { level, reasons[] }   honest: "enrolled recently", "no check-ins in the last N days"
changeNotes     plain-English with real numbers, incl. positive context ("recent notes are upbeat")
components      per-factor {value, weight, points}; points sum EXACTLY to the score
baseline / recentWeek   null fields while the baseline is still forming
daysSinceLastCheckin / historyDays / trendSlope
```

## Contract notes (do not break these)

- **All engine time is UTC** from the injected clock. Nothing may call
  `Date.now()`. Use `advanceTo/advanceHours/advanceDays` on the ENGINE (not the
  raw clock) so due check-ins and Tier 1 always run; scrubbing backward is safe
  (flags are never fabricated or falsely resolved in the past).
- **Tier 1 owns "missed today."** Until a senior checks in today, today is not
  in the Tier 2 window. Missed days feed Tier 2 only as a rate.
- **The baseline lags** behind the recent window. Do not "improve" it to a
  rolling average: a rolling baseline absorbs slow decline and hides it.
- **The recent window is the last 7 PRESENT check-ins**, so a new bad check-in
  can never move a score in the reassuring direction.
- **Enrollment fences everything.** Pre-enrollment days are neither "missed"
  nor "silent"; day-zero seniors read as brand new, honest low confidence.
- **Personas write raw check-ins only** (seeded, deterministic, 15 scripted
  future days). Every number on screen comes from the engine reading them.
- **The brief is offline template filling.** The numbers decide; the language
  layer only phrases it. No API calls at the venue.

## Files

```
engine/clock.js       DemoClock (single time source), minutesToClock
engine/text.js        keyword + sentiment, negation guard, idiom-safe lexicons
engine/stats.js       mean/median/floored-std, Theil-Sen + least-squares slopes
engine/tier1.js       deadlines, flag state machine, escalation, day-boundary rules
engine/scoring.js     Tier 2 scores, trajectory status, outlook, confidence
engine/trajectory.js  chart series + projection; day-by-day replay (no future leaks)
engine/validation.js  whole-roster replay report
engine/brief.js       structured response-agent brief + suggestedAction
engine/actions.js     coordinator action ledger (visits, contacts, last-contact)
engine/engine.js      SilverGuardEngine facade (incl. advanceTo, toJSON/fromJSON)
engine/personas.js    4 core simulated seniors + scripted future + applyDue
engine/population.js  8 background seniors for a deployment-scale dashboard
tests/run_tests.js    41 tests; every audited failure mode is pinned
demo.js               full stage-demo arc incl. replay proof and day+3 payoff
```
