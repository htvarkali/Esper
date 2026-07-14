// Background population: eight extra simulated seniors so the coordinator
// dashboard reads like a real deployment, not a four-person toy. Same rule
// as the core personas: raw check-ins only, seeded, every score computed
// by the real engine. One is recovering (improving), one has a mild dip
// (watch, not alarm), the rest are ordinary stable variety.

const HISTORY_DAYS = 27;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const atOn = (clock, offsetDays, minutesOfDay) => {
  const hh = String(Math.floor(minutesOfDay / 60)).padStart(2, '0');
  const mm = String(Math.round(minutesOfDay % 60)).padStart(2, '0');
  return `${clock.dateStr(offsetDays)}T${hh}:${mm}:00.000Z`;
};

export const POPULATION = [
  { id: 'harold', name: 'Harold Kim', age: 76, buddy: 'Dave (next door)', emergencyContact: 'daughter Suji (555-0201)', pattern: 'stable', base: 480 },
  { id: 'betty', name: 'Betty Nguyen', age: 84, buddy: 'Rosa (downstairs)', emergencyContact: 'son Minh (555-0202)', pattern: 'stable', base: 525 },
  { id: 'ravi', name: 'Ravi Patel', age: 71, buddy: 'Tom (across the hall)', emergencyContact: 'wife at work (555-0203)', pattern: 'stable', base: 435 },
  { id: 'gloria', name: 'Gloria Santos', age: 79, buddy: 'Nina (next block)', emergencyContact: 'nephew Leo (555-0204)', pattern: 'improving', base: 570 },
  { id: 'walt', name: 'Walt Freeman', age: 88, buddy: 'Sy (same floor)', emergencyContact: 'granddaughter Kim (555-0205)', pattern: 'stable_late', base: 660 },
  { id: 'ida', name: 'Ida Rosen', age: 82, buddy: 'Mira (next door)', emergencyContact: 'son Ben (555-0206)', pattern: 'mild_dip', base: 500 },
  { id: 'chen', name: 'Chen Wei', age: 74, buddy: 'Arthur (garden club)', emergencyContact: 'daughter Lan (555-0207)', pattern: 'stable', base: 450 },
  { id: 'alma', name: 'Alma Diaz', age: 80, buddy: 'Paloma (church group)', emergencyContact: 'sister Rosa (555-0208)', pattern: 'stable', base: 545 },
];

const NOTES_OK = ['all fine', 'nice quiet day', 'good morning walk', 'saw the neighbors', ''];
const NOTES_IMPROVING = ['finally over that flu', 'feeling stronger every day', 'appetite is back', 'slept well again'];
const NOTES_DIP = ['a little tired lately', 'did not sleep great', ''];

export function generatePopulation(clock, seed = 7) {
  const rng = mulberry32(seed);
  const between = (lo, hi) => lo + rng() * (hi - lo);
  const jitter = r => Math.round(between(-r, r));
  const chance = p => rng() < p;
  const pick = arr => arr[Math.floor(rng() * arr.length)];
  const clampi = (x, lo, hi) => Math.max(lo, Math.min(hi, Math.round(x)));

  const checkins = [];
  const todaysPlan = [];

  for (const s of POPULATION) {
    for (let offset = -HISTORY_DAYS; offset <= -1; offset++) {
      const dayIdx = HISTORY_DAYS + offset;
      // everyone occasionally misses a day; that's real life, not decline
      if (chance(0.04)) continue;

      let sleep = 4, meals = 3, mood = 4, note = chance(0.2) ? pick(NOTES_OK) : '';
      if (s.pattern === 'stable') {
        sleep = chance(0.5) ? 4 : chance(0.5) ? 3 : 5;
        mood = chance(0.6) ? 4 : 5;
      } else if (s.pattern === 'stable_late') {
        sleep = chance(0.5) ? 3 : 4; mood = chance(0.5) ? 3 : 4;
      } else if (s.pattern === 'improving') {
        // recovering from the flu: rough first half, healthy second half
        const t = dayIdx / HISTORY_DAYS;
        sleep = clampi(2.5 + t * 2 + between(-0.4, 0.4), 2, 5);
        mood = clampi(2.5 + t * 2.2 + between(-0.4, 0.4), 2, 5);
        meals = t < 0.4 && chance(0.4) ? 2 : 3;
        if (t > 0.6 && chance(0.35)) note = pick(NOTES_IMPROVING);
      } else if (s.pattern === 'mild_dip') {
        // a watch-list case: modest recent dip, deliberately NOT an alarm
        const recent = dayIdx >= 20;
        sleep = recent ? (chance(0.6) ? 3 : 4) : 4;
        mood = recent ? (chance(0.5) ? 3 : 4) : (chance(0.6) ? 4 : 5);
        if (recent && chance(0.3)) note = pick(NOTES_DIP);
      }
      checkins.push({
        seniorId: s.id,
        at: atOn(clock, offset, s.base + jitter(18)),
        sleep, meals, mood, note,
      });
    }
    // everyone except Walt has checked in by late morning today
    if (s.id !== 'walt') {
      todaysPlan.push({
        seniorId: s.id, at: atOn(clock, 0, s.base + jitter(15)),
        sleep: 4, meals: 3, mood: 4, note: '',
      });
    } else {
      // Walt checks in late (within his grace window; no flag, just realism)
      todaysPlan.push({
        seniorId: s.id, at: atOn(clock, 0, s.base + 60),
        sleep: 3, meals: 3, mood: 4, note: '',
      });
    }
    // and the future stays ordinary: 14 more scripted days per senior so
    // time-jumps past today do not flag the whole roster
    for (let d = 1; d <= 14; d++) {
      todaysPlan.push({
        seniorId: s.id, at: atOn(clock, d, s.base + jitter(15)),
        sleep: chance(0.5) ? 4 : 3, meals: 3, mood: chance(0.6) ? 4 : 5,
        note: chance(0.15) ? pick(NOTES_OK) : '',
      });
    }
  }

  return { seniors: POPULATION.map(({ pattern, base, ...s }) => s), checkins, todaysPlan };
}

export function loadPopulation(engine, seed = 7) {
  const { seniors, checkins, todaysPlan } = generatePopulation(engine.clock, seed);
  const enrolledAt = engine.clock.dateStr(-HISTORY_DAYS);
  for (const s of seniors) engine.addSenior({ ...s, enrolledAt });
  for (const c of checkins) engine.addCheckin(c);
  if (typeof engine.registerPlan === 'function') engine.registerPlan(todaysPlan);
  return { todaysPlan };
}
