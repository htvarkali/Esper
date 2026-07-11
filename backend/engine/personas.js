// Simulated seniors for the demo, honestly labeled as simulated everywhere.
// The generator writes RAW CHECK-INS ONLY; every score shown anywhere must
// come from the real engine reading them, so numbers and explanations
// always agree. Seeded RNG: same seed, identical data, reproducible demo.

const HISTORY_DAYS = 27; // days -27..-1; today unfolds live via todaysPlan

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

export const SENIORS = [
  { id: 'dorothy', name: 'Dorothy Alvarez', age: 81, buddy: 'Linda (next door)', emergencyContact: 'daughter Ana (555-0141)' },
  { id: 'frank', name: 'Frank Osei', age: 74, buddy: 'Miguel (two doors down)', emergencyContact: 'son Kwame (555-0192)' },
  { id: 'maria', name: 'Maria Chen', age: 78, buddy: 'Priya (across the street)', emergencyContact: 'niece Wen (555-0177)' },
  { id: 'sam', name: 'Sam Kowalski', age: 83, buddy: 'Janet (same building)', emergencyContact: 'nephew Pete (555-0129)' },
];

const DOROTHY_GOOD = [
  'went for a nice walk this morning',
  'had tea with linda, lovely time',
  'feeling good today',
  'watered the garden',
];
const DOROTHY_DECLINE = [
  'felt dizzy this morning',
  'very tired today',
  'did not feel like eating much',
  'legs ache when i stand up',
  'too tired to cook anything',
  'felt a bit faint after breakfast',
  'slept badly, aching all over',
];
const FRANK_NOTES = ['all good', 'walked to the park and back', 'fixed the squeaky door, good day'];
const MARIA_NOTES = ['quiet day at home', 'did some knitting'];
const SAM_NOTES = ['watched the game', 'worked on the fence out back'];

export function generatePersonas(clock, seed = 20260711) {
  const rng = mulberry32(seed);
  const between = (lo, hi) => lo + rng() * (hi - lo);
  const jitter = r => Math.round(between(-r, r));
  const chance = p => rng() < p;
  const pick = arr => arr[Math.floor(rng() * arr.length)];
  const clampi = (x, lo, hi) => Math.max(lo, Math.min(hi, Math.round(x)));

  const checkins = [];

  for (let offset = -HISTORY_DAYS; offset <= -1; offset++) {
    const dayIdx = HISTORY_DAYS + offset; // 0 (oldest) .. 26 (yesterday)

    // --- Dorothy: normal for ~2 weeks, then a slow slide. Missed days at
    // offsets -6 and -3 (already resolved; Tier 1 is about today's silence).
    {
      const declineDay = Math.max(0, dayIdx - 12); // 0 while healthy, 1..14 in decline
      const missed = offset === -6 || offset === -3;
      if (!missed) {
        const time = 510 + jitter(15) + declineDay * 8; // 8:30, drifting late
        const mood = clampi(4 - declineDay * 0.11 + between(-0.3, 0.3), 2, 5);
        const sleep = clampi(4 - declineDay * 0.10 + between(-0.3, 0.3), 2, 5);
        let meals = 3;
        if (declineDay >= 6 && chance(0.4)) meals = 2;
        if (declineDay >= 10 && chance(0.25)) meals = 1;
        let note = '';
        if (declineDay === 0) { if (chance(0.35)) note = pick(DOROTHY_GOOD); }
        else if (chance(Math.min(0.2 + declineDay * 0.045, 0.7))) note = pick(DOROTHY_DECLINE);
        checkins.push({ seniorId: 'dorothy', at: atOn(clock, offset, time), sleep, meals, mood, note });
      }
    }

    // --- Frank: rock steady. Includes one negation-guard showcase note.
    {
      const time = 465 + jitter(10); // ~7:45
      const note = offset === -9
        ? 'no dizziness today, feeling much better'
        : chance(0.3) ? pick(FRANK_NOTES) : '';
      checkins.push({
        seniorId: 'frank', at: atOn(clock, offset, time),
        sleep: chance(0.6) ? 4 : 5, meals: 3, mood: chance(0.5) ? 4 : 5, note,
      });
    }

    // --- Maria: steady, but gone days -6..-4 visiting the grandkids.
    // The gap must NOT read as decline; it reads as a miss-rate blip.
    {
      const away = offset >= -6 && offset <= -4;
      if (!away) {
        const time = 555 + jitter(12); // ~9:15
        const note = offset === -3
          ? 'back from visiting my grandkids, what a wonderful weekend'
          : chance(0.25) ? pick(MARIA_NOTES) : '';
        checkins.push({
          seniorId: 'maria', at: atOn(clock, offset, time),
          sleep: chance(0.5) ? 4 : 3, meals: 3, mood: chance(0.6) ? 4 : 5, note,
        });
      }
    }

    // --- Sam: steady history, but he will NOT check in today. Tier 1's case.
    {
      const time = 540 + jitter(15); // ~9:00
      checkins.push({
        seniorId: 'sam', at: atOn(clock, offset, time),
        sleep: chance(0.5) ? 4 : 3, meals: 3, mood: 4, note: chance(0.25) ? pick(SAM_NOTES) : '',
      });
    }
  }

  // Scripted future: today plus 14 more days, applied live as the demo
  // clock passes each timestamp. Sam has no entry TODAY (his silence is the
  // opening demo moment) but resumes tomorrow; Frank and Maria stay steady;
  // Dorothy keeps declining so the on-stage projection visibly comes true.
  const todaysPlan = [
    { seniorId: 'frank', at: atOn(clock, 0, 470), sleep: 5, meals: 3, mood: 5, note: 'all good' },
    { seniorId: 'maria', at: atOn(clock, 0, 555), sleep: 4, meals: 3, mood: 4, note: '' },
    { seniorId: 'dorothy', at: atOn(clock, 0, 645), sleep: 3, meals: 2, mood: 3, note: 'felt dizzy again this morning' },
  ];
  for (let d = 1; d <= 14; d++) {
    todaysPlan.push({
      seniorId: 'frank', at: atOn(clock, d, 465 + jitter(10)),
      sleep: chance(0.6) ? 4 : 5, meals: 3, mood: chance(0.5) ? 4 : 5,
      note: chance(0.3) ? pick(FRANK_NOTES) : '',
    });
    todaysPlan.push({
      seniorId: 'maria', at: atOn(clock, d, 555 + jitter(12)),
      sleep: chance(0.5) ? 4 : 3, meals: 3, mood: chance(0.6) ? 4 : 5,
      note: chance(0.25) ? pick(MARIA_NOTES) : '',
    });
    const j = 14 + d; // Dorothy's decline continues past today
    todaysPlan.push({
      seniorId: 'dorothy', at: atOn(clock, d, Math.min(510 + j * 8, 800) + jitter(10)),
      sleep: clampi(4 - j * 0.10, 2, 5), meals: d >= 2 ? 1 : 2,
      mood: clampi(4 - j * 0.11, 2, 5),
      note: chance(0.7) ? pick(DOROTHY_DECLINE) : '',
    });
    todaysPlan.push({
      seniorId: 'sam', at: atOn(clock, d, 540 + jitter(15)),
      sleep: chance(0.5) ? 4 : 3, meals: 3, mood: 4,
      note: d === 1 ? 'sorry about yesterday, was napping all afternoon' : (chance(0.25) ? pick(SAM_NOTES) : ''),
    });
  }

  return { seniors: SENIORS, checkins, todaysPlan };
}

// Apply the entries of todaysPlan whose time has passed on the demo clock.
// Idempotent: safe to call after every clock advance.
export function applyDue(engine, todaysPlan) {
  const nowMs = Date.parse(engine.clock.iso());
  for (const entry of todaysPlan) {
    if (Date.parse(entry.at) <= nowMs && !engine.hasCheckin(entry.seniorId, entry.at.slice(0, 10))) {
      engine.addCheckin(entry);
    }
  }
}

export function loadPersonas(engine, seed = 20260711) {
  const { seniors, checkins, todaysPlan } = generatePersonas(engine.clock, seed);
  const enrolledAt = engine.clock.dateStr(-HISTORY_DAYS);
  for (const s of seniors) engine.addSenior({ ...s, enrolledAt });
  for (const c of checkins) engine.addCheckin(c);
  if (typeof engine.registerPlan === 'function') engine.registerPlan(todaysPlan);
  return { todaysPlan };
}
