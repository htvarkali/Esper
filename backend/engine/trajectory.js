// Chart + replay API. Two jobs:
// 1. trajectory(): the data the frontend draws Dorothy's curve from -
//    daily wellness points, the concern-zone line, and the projected
//    dashed path forward.
// 2. replay(): re-runs the assessment as-of each past day using only the
//    data that existed then. This converts simulated data into a live
//    proof: "SilverGuard would have first flagged her N days ago."
//    No future data ever leaks into a past assessment.

import { DemoClock, dateOf } from './clock.js';
import { assess, buildDailySeries, wellnessOf, SCORING_CONFIG } from './scoring.js';

const r1 = x => Math.round(x * 10) / 10;

// Daily wellness history + forward projection for the trend chart.
export function trajectory(senior, checkins, clock, cfg = SCORING_CONFIG) {
  const series = buildDailySeries(checkins, clock, cfg);
  const points = series.map(e => ({
    date: e.date,
    present: e.present,
    wellness: e.present ? r1(wellnessOf(e)) : null,
  }));

  const a = assess(senior, checkins, clock, cfg);
  const present = points.filter(p => p.present);
  const anchor = present.slice(-3);
  const projection = [];
  if (anchor.length >= 1 && a.trendSlope < -0.2) {
    let w = anchor.reduce((s, p) => s + p.wellness, 0) / anchor.length;
    for (let d = 1; d <= 14; d++) {
      w += a.trendSlope;
      projection.push({ date: clock.dateStr(d), wellness: r1(w) });
      if (w <= cfg.wellnessConcern) break;
    }
  }

  return {
    points,                                  // 28 daily points, null where missed
    projection,                              // dashed forward path (empty if not declining)
    concernWellness: cfg.wellnessConcern,    // horizontal band the curve crosses
    trendSlope: a.trendSlope,
    outlook: a.outlook,
  };
}

// As-of assessment series: for each of the last `days` days, assess using
// only check-ins that existed by the end of that day.
export function replay(senior, checkins, clock, { days = 21, cfg = SCORING_CONFIG } = {}) {
  const series = [];
  for (let back = days - 1; back >= 0; back--) {
    const date = clock.dateStr(-back);
    const asOfClock = new DemoClock(`${date}T23:59:00.000Z`);
    const visible = checkins.filter(c => dateOf(c.at) <= date);
    const a = assess(senior, visible, asOfClock, cfg);
    series.push({
      date,
      combined: a.combined,
      healthScore: a.healthScore,
      isolationScore: a.isolationScore,
      status: a.status,
      confidence: a.confidence.level,
    });
  }

  // First flagged: earliest day where (a) the trajectory reads declining,
  // (b) it still reads declining the next day (a one-day blip is not an
  // onset), and (c) a real gap vs baseline has opened (combined >= 20).
  // Without (c), a perfectly stable senior's noise can fake an onset.
  const isOnset = (s) => (s.status === 'declining' || s.status === 'declining_fast') && s.combined >= 20;
  let firstFlaggedDate = null;
  for (let i = 0; i < series.length; i++) {
    if (isOnset(series[i]) && (i === series.length - 1 || isOnset(series[i + 1]))) {
      firstFlaggedDate = series[i].date;
      break;
    }
  }
  const daysAgo = firstFlaggedDate
    ? Math.round((Date.parse(clock.dateStr()) - Date.parse(firstFlaggedDate)) / 86400000)
    : null;

  return { series, firstFlaggedDate, firstFlaggedDaysAgo: daysAgo };
}
