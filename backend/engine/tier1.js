// Tier 1: the deterministic missed-check-in rule. No AI anywhere in this file.
// Silence is the trigger. One active flag per senior, ever. The response
// ladder starts with a neighbor's knock, never an ambulance.

import { dateOf, minutesOfDayOf } from './clock.js';
import { median } from './stats.js';

export const TIER1_CONFIG = {
  graceMinutes: 150,            // window past the senior's usual time
  defaultDeadlineMin: 14 * 60,  // 14:00 for seniors with under 3 days of history
  minHistoryForDeadline: 3,
  buddyToCoordinatorHours: 2,   // unanswered buddy ping escalates after 2h
  toEmergencyHours: 6,          // emergency contact only after 6h total
  historyDaysForMedian: 14,
};

// Deadline (minutes of day, UTC) derived from the senior's own habit:
// median check-in time over their recent history, plus the grace window.
export function checkinDeadlineMin(checkins, cfg = TIER1_CONFIG) {
  const times = checkins
    .slice(-cfg.historyDaysForMedian)
    .map(c => minutesOfDayOf(c.at));
  if (times.length < cfg.minHistoryForDeadline) {
    return cfg.defaultDeadlineMin;
  }
  // Cap below 23:59 so a late-evening senior's deadline is still crossable
  // by the end of the day; overnight rollover is caught by the full-missed-
  // day rule in tick().
  return Math.min(median(times) + cfg.graceMinutes, 23 * 60 + 58);
}

export class FlagManager {
  constructor(cfg = TIER1_CONFIG) {
    this.cfg = cfg;
    this.flags = [];
    this._nextId = 1;
  }

  activeFlag(seniorId) {
    return this.flags.find(f => f.seniorId === seniorId && f.state !== 'resolved') || null;
  }

  allFlags() { return [...this.flags]; }

  // Called by the engine whenever a check-in arrives: a late check-in
  // visibly clears the senior's active flag.
  onCheckin(seniorId, clock) {
    const f = this.activeFlag(seniorId);
    if (f) this._resolve(f, 'checked_in_late', clock, 'Senior checked in late. Flag cleared automatically.');
  }

  resolveManually(flagId, how, clock) {
    const f = this.flags.find(x => x.id === flagId);
    if (!f || f.state === 'resolved') return null;
    const label = how === 'buddy_confirmed_ok'
      ? 'Buddy confirmed the senior is okay.'
      : `Resolved: ${how}.`;
    this._resolve(f, how, clock, label);
    return f;
  }

  _resolve(flag, how, clock, label) {
    flag.state = 'resolved';
    flag.resolution = how;
    flag.resolvedAt = clock.iso();
    flag.timeline.push({ at: clock.iso(), event: label });
  }

  // Evaluate every senior at the clock's current moment. Fires new flags,
  // escalates old ones. Safe to call repeatedly and after multi-day jumps:
  // a senior can never accumulate more than one active flag.
  tick(store, clock) {
    const today = clock.dateStr();
    for (const senior of store.seniors) {
      const checkins = store.checkins
        .filter(c => c.seniorId === senior.id)
        .sort((a, b) => a.at.localeCompare(b.at));
      const active = this.activeFlag(senior.id);

      // Timeline scrubbed backward past the flag's own birth: leave the
      // flag alone rather than fabricating a resolution that never happened.
      if (active && Date.parse(active.firedAt) > Date.parse(clock.iso())) continue;

      const checkedInToday = checkins.some(c => dateOf(c.at) === today);
      if (checkedInToday) {
        if (active) this._resolve(active, 'checked_in_late', clock, 'Senior checked in late. Flag cleared automatically.');
        continue;
      }

      if (active) {
        this._escalate(active, senior, clock);
        continue;
      }

      // A resolution earlier today holds for the rest of the day: once the
      // buddy has confirmed the senior is okay, the same silence must not
      // re-ping them fifteen minutes later.
      const resolvedToday = this.flags.some(f =>
        f.seniorId === senior.id && f.state === 'resolved' &&
        (f.resolvedAt || '').slice(0, 10) === today);
      if (resolvedToday) continue;

      const deadline = checkinDeadlineMin(checkins, this.cfg);
      const dueToday = clock.minutesOfDay() > deadline;
      // Whole silent days before today fire regardless of the current
      // time-of-day; otherwise stepping the clock a day at a time from a
      // morning start would never trip anyone's deadline.
      const priorMissed = this._priorMissedDays(checkins, clock, senior);
      if (dueToday || priorMissed >= 1) {
        const missedDays = Math.max(1, priorMissed + (dueToday ? 1 : 0));
        this.flags.push({
          id: `flag-${this._nextId++}`,
          seniorId: senior.id,
          type: 'missed_checkin',
          state: 'buddy_pinged',
          firedAt: clock.iso(),
          missedDays,
          deadlineMin: deadline,
          resolution: null,
          resolvedAt: null,
          timeline: [{
            at: clock.iso(),
            event: `Missed check-in (${missedDays} day${missedDays > 1 ? 's' : ''} silent). Ping sent to buddy ${senior.buddy} (simulated).`,
          }],
        });
      }
    }
  }

  _escalate(flag, senior, clock) {
    const hoursSince = (Date.parse(clock.iso()) - Date.parse(flag.firedAt)) / 3600000;
    if (flag.state === 'buddy_pinged' && hoursSince >= this.cfg.buddyToCoordinatorHours) {
      flag.state = 'coordinator_notified';
      flag.timeline.push({
        at: clock.iso(),
        event: `No response from buddy after ${this.cfg.buddyToCoordinatorHours}h. Coordinator notified.`,
      });
    }
    if (flag.state === 'coordinator_notified' && hoursSince >= this.cfg.toEmergencyHours) {
      flag.state = 'emergency_contacted';
      flag.timeline.push({
        at: clock.iso(),
        event: `Unresolved after ${this.cfg.toEmergencyHours}h. Emergency contact ${senior.emergencyContact} notified (simulated).`,
      });
    }
    // Track the growing silence without creating duplicate flags.
    const streak = this._missedStreakFromFlag(flag, clock);
    if (streak > flag.missedDays) {
      flag.missedDays = streak;
      flag.timeline.push({ at: clock.iso(), event: `Still no check-in (${streak} days).` });
    }
  }

  // Consecutive fully-missed days BEFORE today. Days before enrollment are
  // not silence; a senior enrolled this morning must never read as
  // "14 days silent".
  _priorMissedDays(checkins, clock, senior = null) {
    const dates = new Set(checkins.map(c => dateOf(c.at)));
    let streak = 0;
    for (let d = 1; d <= 14; d++) {
      const day = clock.dateStr(-d);
      if (dates.has(day)) break;
      if (senior?.enrolledAt && day < senior.enrolledAt) break;
      streak++;
    }
    return streak;
  }

  _missedStreakFromFlag(flag, clock) {
    const daysSinceFired = Math.floor(
      (Date.parse(clock.iso()) - Date.parse(flag.firedAt)) / 86400000
    );
    return flag.missedDays + Math.max(0, daysSinceFired);
  }
}
