// The demo clock is the ONLY source of time in the engine. Nothing else may
// call Date.now(). All engine time is UTC; the frontend passes ISO strings.
export class DemoClock {
  constructor(startIso) {
    this._ms = Date.parse(startIso);
    if (Number.isNaN(this._ms)) throw new Error(`DemoClock: bad start time "${startIso}"`);
  }
  now() { return new Date(this._ms); }
  iso() { return new Date(this._ms).toISOString(); }
  // 'YYYY-MM-DD' for today, or offset by whole days
  dateStr(offsetDays = 0) {
    return new Date(this._ms + offsetDays * 86400000).toISOString().slice(0, 10);
  }
  minutesOfDay() {
    const d = new Date(this._ms);
    return d.getUTCHours() * 60 + d.getUTCMinutes();
  }
  advanceHours(h) { this._ms += h * 3600000; }
  advanceDays(d) { this._ms += d * 86400000; }
  setTime(iso) {
    const ms = Date.parse(iso);
    if (Number.isNaN(ms)) throw new Error(`DemoClock: bad time "${iso}"`);
    this._ms = ms;
  }
}

export const dateOf = iso => iso.slice(0, 10);

export const minutesToClock = m => {
  const h = Math.floor(m / 60), mm = Math.round(m % 60);
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

export const minutesOfDayOf = iso => {
  const d = new Date(iso);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
};
