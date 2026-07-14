// The mini validation study: replay the whole month for every senior and
// report, factually, who the engine would have flagged and when, and who it
// never flagged. This is the live answer to "your data is simulated":
// Dorothy caught days before today, Maria's grandkids trip never misread
// as decline, the stable seniors never alerted.

import { replay } from './trajectory.js';

export function validationReport(engine, { days = 21 } = {}) {
  const rows = engine.store.seniors.map(senior => {
    const rp = replay(senior, engine.checkinsFor(senior.id), engine.clock, { days });
    const decliningDays = rp.series.filter(
      s => s.status === 'declining' || s.status === 'declining_fast').length;
    return {
      id: senior.id,
      name: senior.name,
      firstFlaggedDate: rp.firstFlaggedDate,
      firstFlaggedDaysAgo: rp.firstFlaggedDaysAgo,
      decliningDays,
      currentStatus: rp.series[rp.series.length - 1]?.status ?? 'stable',
    };
  });

  const flagged = rows.filter(r => r.firstFlaggedDate !== null);
  const neverFlagged = rows.filter(r => r.firstFlaggedDate === null);

  return {
    windowDays: days,
    rows,
    flagged: flagged.map(r => ({ name: r.name, date: r.firstFlaggedDate, daysAgo: r.firstFlaggedDaysAgo })),
    neverFlagged: neverFlagged.map(r => r.name),
    summary:
      `Replayed the last ${days} days for ${rows.length} seniors using only the data that existed each day: ` +
      (flagged.length
        ? `${flagged.map(r => `${r.name} first flagged ${r.firstFlaggedDaysAgo} day${r.firstFlaggedDaysAgo === 1 ? '' : 's'} ago`).join('; ')}. `
        : 'no one flagged. ') +
      `${neverFlagged.length} of ${rows.length} seniors never flagged.`,
  };
}
