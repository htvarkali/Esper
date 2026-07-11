// Tier 2: the trend engine. Plain arithmetic against the senior's OWN
// baseline. Two scores only (Health, Isolation), a trajectory with an
// outlook, and a confidence statement with reasons for doubt.
//
// Two design constraints are load-bearing:
// 1. The baseline LAGS: it is built from days 8-28 back, never the last
//    7 days. A rolling baseline would absorb a slow decline and hide it.
// 2. Missed days feed Tier 2 only as a RATE over the window. "Missed today"
//    belongs to Tier 1 alone, so one silent day is never double-counted.

import { dateOf, minutesOfDayOf } from './clock.js';
import { analyzeNote } from './text.js';
import { mean, median, std, theilSenSlope, clamp01, round1 } from './stats.js';

export const SCORING_CONFIG = {
  windowRecentDays: 7,
  windowTotalDays: 28,
  concernRisk: 60,     // combined risk at/above this = in the concern zone now
  wellnessConcern: 50, // projected wellness at/below this = concern zone
  floors: { latency: 30, sleep: 0.6, mood: 0.6, meals: 0.5, msgLen: 8 },
  // The whole score is these eight weighted factors; they are surfaced
  // per-factor in `components` so the arithmetic is visible on screen.
  weights: {
    health: { mealsDrop: 0.30, sleepDrop: 0.25, healthWords: 0.30, negSentiment: 0.15 },
    isolation: { latencyZ: 0.25, moodDrop: 0.25, missRate: 0.20, isolationWords: 0.20, msgLenDrop: 0.10 },
  },
};

export function buildDailySeries(checkins, clock, cfg = SCORING_CONFIG) {
  const byDate = new Map(checkins.map(c => [dateOf(c.at), c]));
  const series = [];
  for (let back = cfg.windowTotalDays - 1; back >= 0; back--) {
    const date = clock.dateStr(-back);
    const c = byDate.get(date);
    if (!c) {
      series.push({ date, present: false });
    } else {
      series.push({
        date,
        present: true,
        latency: minutesOfDayOf(c.at),
        msgLen: (c.note || '').length,
        sleep: c.sleep,
        meals: c.meals,
        mood: c.mood,
        text: analyzeNote(c.note || ''),
      });
    }
  }
  return series;
}

export const wellnessOf = e => (e.sleep / 5 * 0.35 + e.meals / 3 * 0.3 + e.mood / 5 * 0.35) * 100;

export function assess(senior, checkins, clock, cfg = SCORING_CONFIG) {
  let series = buildDailySeries(checkins, clock, cfg);
  // Days before enrollment are not "missed"; a senior enrolled this morning
  // has zero history, not four weeks of silence.
  if (senior.enrolledAt) series = series.filter(e => e.date >= senior.enrolledAt);
  // Tier 1 owns "missed today": until the senior checks in today, today is
  // not part of the Tier 2 window at all. Otherwise every senior's miss
  // count would inflate each morning before their usual check-in time.
  const last = series[series.length - 1];
  if (last && !last.present && last.date === clock.dateStr()) series.pop();
  const presentAll = series.filter(e => e.present);
  const historyDays = presentAll.length;

  // "Recent" = the last up-to-7 PRESENT check-ins, not calendar days.
  // With a calendar window, a new below-baseline check-in could push an
  // equally bad day off the back edge and make every number drift toward
  // reassuring right after bad news. Anchored to check-ins, new bad news
  // can only hold or worsen the picture.
  let presentRecent = presentAll.slice(-cfg.windowRecentDays);
  const cutoffDate = presentRecent.length ? presentRecent[0].date : clock.dateStr();
  let presentBase = series.filter(e => e.present && e.date < cutoffDate);
  let baselineForming = false;

  // Fallback for short histories: split what exists in half. Flagged in
  // the confidence reasons; never silent.
  if (presentBase.length < 4) {
    const half = Math.floor(presentAll.length / 2);
    presentBase = presentAll.slice(0, half);
    presentRecent = presentAll.slice(half);
    baselineForming = true;
  }

  // Miss rate stays calendar-based: it is the one factor where absence
  // itself is the signal.
  const recentCalendar = series.slice(-cfg.windowRecentDays);

  const lastPresent = presentAll[presentAll.length - 1] || null;
  const daysSinceLastCheckin = lastPresent
    ? Math.round((Date.parse(clock.dateStr()) - Date.parse(lastPresent.date)) / 86400000)
    : null;

  const f = cfg.floors;
  const bl = {
    latencyMed: median(presentBase.map(e => e.latency)),
    latencyStd: std(presentBase.map(e => e.latency), f.latency),
    sleep: mean(presentBase.map(e => e.sleep)),
    meals: mean(presentBase.map(e => e.meals)),
    mood: mean(presentBase.map(e => e.mood)),
    msgLen: mean(presentBase.map(e => e.msgLen)),
  };
  const rc = {
    latency: presentRecent.length ? mean(presentRecent.map(e => e.latency)) : bl.latencyMed,
    sleep: presentRecent.length ? mean(presentRecent.map(e => e.sleep)) : bl.sleep,
    meals: presentRecent.length ? mean(presentRecent.map(e => e.meals)) : bl.meals,
    mood: presentRecent.length ? mean(presentRecent.map(e => e.mood)) : bl.mood,
    msgLen: presentRecent.length ? mean(presentRecent.map(e => e.msgLen)) : bl.msgLen,
    sentiment: presentRecent.length ? mean(presentRecent.map(e => e.text.sentiment)) : 0,
  };

  const missedRecent = recentCalendar.filter(e => !e.present).length;
  const healthHitList = presentRecent.flatMap(e => e.text.healthHits);
  const healthHitsPerDay = healthHitList.length / Math.max(1, presentRecent.length);
  const isolationHitList = presentRecent.flatMap(e => e.text.isolationHits);
  const isolationHitsPerDay = isolationHitList.length / Math.max(1, presentRecent.length);

  // With no baseline at all (brand-new senior) there is nothing honest to
  // compare against: comparison factors stay zero until a baseline forms.
  const hasBaseline = presentBase.length > 0;

  // --- Health score: is the body okay? ---
  const wH = cfg.weights.health;
  const mealsDrop = hasBaseline ? clamp01((bl.meals - rc.meals) / 2) : 0;
  const sleepDrop = hasBaseline ? clamp01((bl.sleep - rc.sleep) / 2.5) : 0;
  const healthWords = clamp01(healthHitsPerDay / 1.5);
  const negSentiment = clamp01(-rc.sentiment);
  const comp = (value, weight) => ({ value: round1(value), weight, points: Math.round(value * weight * 100) });
  const healthParts = {
    mealsDrop: comp(mealsDrop, wH.mealsDrop),
    sleepDrop: comp(sleepDrop, wH.sleepDrop),
    healthWords: comp(healthWords, wH.healthWords),
    negSentiment: comp(negSentiment, wH.negSentiment),
  };
  // The score IS the sum of the visible per-factor points. No hidden math.
  const healthScore = Object.values(healthParts).reduce((s, p) => s + p.points, 0);

  // --- Isolation score: is the person still engaged? ---
  const wI = cfg.weights.isolation;
  // Signed shortest distance around midnight: a 23:50 check-in against an
  // 08:30 baseline is not "15 hours late".
  const rawDelta = rc.latency - bl.latencyMed;
  const latencyDelta = hasBaseline ? ((rawDelta + 720) % 1440 + 1440) % 1440 - 720 : 0;
  const latencyZ = hasBaseline ? clamp01(Math.max(0, latencyDelta) / bl.latencyStd / 3) : 0;
  const moodDrop = hasBaseline ? clamp01((bl.mood - rc.mood) / 2.5) : 0;
  const missComp = clamp01((missedRecent / cfg.windowRecentDays) * 1.5);
  const isoWords = clamp01(isolationHitsPerDay / 1.2);
  const msgLenDrop = hasBaseline ? clamp01((bl.msgLen - rc.msgLen) / Math.max(bl.msgLen, 10)) : 0;
  const isolationParts = {
    latencyZ: comp(latencyZ, wI.latencyZ),
    moodDrop: comp(moodDrop, wI.moodDrop),
    missRate: comp(missComp, wI.missRate),
    isolationWords: comp(isoWords, wI.isolationWords),
    msgLenDrop: comp(msgLenDrop, wI.msgLenDrop),
  };
  const isolationScore = Object.values(isolationParts).reduce((s, p) => s + p.points, 0);

  const combined = Math.round(healthScore * 0.5 + isolationScore * 0.5);

  // --- Trajectory: wellness slope over the last 14 days (present days only;
  // absences are Tier 1 / miss-rate business, not trend business). ---
  const trendWindow = series.slice(-14).filter(e => e.present);
  const points = trendWindow.map(e => ({
    x: series.findIndex(s => s.date === e.date),
    y: wellnessOf(e),
  }));
  // Theil-Sen (median of pairwise slopes): one weird self-reported day
  // cannot flip the trend the way it can with least squares.
  const slope = points.length >= 4 ? theilSenSlope(points) : 0;

  let status = 'stable';
  if (points.length >= 4) {
    // Asymmetric on purpose: quicker to call decline than improvement.
    if (slope <= -1.2) status = 'declining_fast';
    else if (slope <= -0.35) status = 'declining';
    else if (slope >= 0.7) status = 'improving';
  }

  // --- Outlook ---
  // The concern zone is crossable two ways: the risk gap opens wide
  // (combined >= concernRisk) or the wellness line itself sinks below the
  // zone the chart draws. Without the second check, a senior can visibly
  // cross the chart's zone while the text still promises "about 1 day".
  const wellNow = points.length ? mean(points.slice(-3).map(p => p.y)) : null;
  let outlook;
  if (combined >= cfg.concernRisk || (wellNow !== null && wellNow <= cfg.wellnessConcern)) {
    outlook = { inZone: true, daysToConcern: 0, text: 'In the concern zone now.' };
  } else if (slope < -0.2 && points.length >= 4) {
    const days = Math.max(1, Math.min(14, Math.ceil((wellNow - cfg.wellnessConcern) / -slope)));
    outlook = {
      inZone: false,
      daysToConcern: days,
      text: `If this pace continues, ${senior.name.split(' ')[0]} reaches the concern zone in about ${days} day${days > 1 ? 's' : ''}.`,
    };
  } else {
    outlook = { inZone: false, daysToConcern: null, text: 'No concerning trajectory at the current pace.' };
  }

  // --- Confidence: honest, rule-based, with reasons for doubt ---
  const reasons = [];
  if (historyDays === 0) {
    reasons.push('enrolled recently, no check-ins yet');
  } else if (daysSinceLastCheckin !== null && daysSinceLastCheckin >= 3) {
    // Long silence: the honest statement is "no recent data", never
    // "only N days of history" about a senior with a month of history.
    reasons.push(`no check-ins in the last ${daysSinceLastCheckin} days`);
  } else if (historyDays < 10) {
    reasons.push(`only ${historyDays} days of history`);
  }
  if (missedRecent >= 2) reasons.push(`${missedRecent} check-ins missing this past week`);
  if (baselineForming && historyDays > 0) reasons.push('baseline still forming');
  const notesRecent = presentRecent.filter(e => e.msgLen > 0).length;
  if (notesRecent < 2 && healthScore >= 25) reasons.push('few text notes this week');
  let level = reasons.length === 0 && historyDays >= 14 ? 'high' : reasons.length <= 1 ? 'medium' : 'low';
  if (historyDays < 7) level = 'low';
  if (daysSinceLastCheckin !== null && daysSinceLastCheckin >= 3) level = 'low';

  // --- Plain-English change notes, from the numbers only ---
  const changeNotes = [];
  if (latencyDelta >= 45) changeNotes.push(`check-ins arriving about ${round1(latencyDelta / 60)}h later than usual`);
  if (bl.mood - rc.mood >= 0.7) changeNotes.push(`mood answers down from ${round1(bl.mood)} to ${round1(rc.mood)} (1-5 scale)`);
  if (bl.meals - rc.meals >= 0.5) changeNotes.push(`eating less (about ${round1(rc.meals)} meals/day, was ${round1(bl.meals)})`);
  if (bl.sleep - rc.sleep >= 0.7) changeNotes.push(`sleep down from ${round1(bl.sleep)} to ${round1(rc.sleep)} (1-5 scale)`);
  if (healthHitList.length >= 2) {
    const counts = {};
    for (const w of healthHitList) counts[w] = (counts[w] || 0) + 1;
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([w]) => w);
    changeNotes.push(`mentioned ${top.join(' and ')} ${healthHitList.length} times recently`);
  }
  if (isolationHitList.length >= 2) {
    changeNotes.push(`notes mention feeling ${[...new Set(isolationHitList)].slice(0, 2).join(' and ')}`);
  }
  if (missedRecent >= 2) changeNotes.push(`${missedRecent} check-ins missed this past week`);
  // A non-alert should be explained by the engine too, not by the presenter:
  // Maria's grandkids trip reads "missed days, but notes are upbeat".
  if (rc.sentiment > 0.1 && healthHitList.length === 0 && presentRecent.length > 0) {
    changeNotes.push('recent notes are upbeat');
  }
  if (changeNotes.length === 0) changeNotes.push('no significant change from baseline');

  return {
    seniorId: senior.id,
    healthScore,
    isolationScore,
    combined,
    status,
    trendSlope: Number(slope.toFixed(2)),
    outlook,
    confidence: { level, reasons },
    changeNotes,
    components: { health: healthParts, isolation: isolationParts },
    baseline: {
      // null while no baseline exists; the UI says "baseline forming"
      // instead of comparing against midnight.
      usualCheckinMin: hasBaseline ? Math.round(bl.latencyMed) : null,
      sleep: hasBaseline ? round1(bl.sleep) : null,
      meals: hasBaseline ? round1(bl.meals) : null,
      mood: hasBaseline ? round1(bl.mood) : null,
    },
    recentWeek: {
      checkinMin: presentRecent.length ? Math.round(rc.latency) : null,
      sleep: presentRecent.length ? round1(rc.sleep) : null,
      meals: presentRecent.length ? round1(rc.meals) : null,
      mood: presentRecent.length ? round1(rc.mood) : null,
      missedDays: missedRecent,
    },
    daysSinceLastCheckin,
    historyDays,
  };
}
