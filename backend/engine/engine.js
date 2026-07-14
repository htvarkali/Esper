// Facade the frontend talks to. Everything runs off one injected clock.
//
// The on-stage loop is ONE call: engine.advanceTo(iso) (or advanceHours /
// advanceDays). It moves the clock, applies any simulated check-ins that
// have come due, and evaluates Tier 1. No three-call ritual to get wrong.

import { DemoClock, dateOf, minutesToClock } from './clock.js';
import { FlagManager, TIER1_CONFIG, checkinDeadlineMin } from './tier1.js';
import { assess, SCORING_CONFIG } from './scoring.js';
import { buildBrief, suggestedAction } from './brief.js';
import { trajectory, replay } from './trajectory.js';
import { validationReport } from './validation.js';
import { ActionLog } from './actions.js';
import { analyzeNote } from './text.js';

export { analyzeNote };

export class EsperEngine {
  constructor({ clock, tier1Config = TIER1_CONFIG, scoringConfig = SCORING_CONFIG }) {
    if (!clock) throw new Error('EsperEngine needs a clock');
    this.clock = clock;
    this.tier1Config = tier1Config;
    this.scoringConfig = scoringConfig;
    this.store = { seniors: [], checkins: [] };
    this.flagManager = new FlagManager(tier1Config);
    this.actions = new ActionLog(clock);
    this.plans = [];
  }

  // ---------- seniors ----------

  addSenior(senior) {
    if (!senior.id || !senior.name) throw new Error('senior needs id and name');
    if (this.store.seniors.some(s => s.id === senior.id)) throw new Error(`duplicate senior ${senior.id}`);
    this.store.seniors.push({
      buddy: 'no buddy on file',
      emergencyContact: 'no emergency contact on file',
      enrolledAt: this.clock.dateStr(),
      ...senior,
    });
  }

  getSenior(id) {
    const s = this.store.seniors.find(s => s.id === id);
    if (!s) throw new Error(`unknown senior ${id}`);
    return s;
  }

  // ---------- check-ins ----------

  hasCheckin(seniorId, date) {
    return this.store.checkins.some(c => c.seniorId === seniorId && dateOf(c.at) === date);
  }

  addCheckin({ seniorId, at, sleep, meals, mood, note = '' }) {
    this.getSenior(seniorId);
    // Strict: one malformed live check-in must throw here, not permanently
    // NaN a senior's scores or brick the dashboard with a bad timestamp.
    if (![sleep, meals, mood].every(Number.isFinite)) throw new Error('sleep, meals, mood must be numbers');
    if (sleep < 1 || sleep > 5 || mood < 1 || mood > 5) throw new Error('sleep/mood must be 1-5');
    if (meals < 0 || meals > 3) throw new Error('meals must be 0-3');
    if (typeof at !== 'string' || Number.isNaN(Date.parse(at))) throw new Error(`bad timestamp: ${at}`);
    this.store.checkins.push({ seniorId, at, sleep, meals, mood, note: String(note ?? '') });
    // A check-in visibly clears any active missed-check-in flag.
    this.flagManager.onCheckin(seniorId, this.clock);
  }

  checkinsFor(seniorId) {
    return this.store.checkins
      .filter(c => c.seniorId === seniorId)
      .sort((a, b) => a.at.localeCompare(b.at));
  }

  // ---------- simulated-time control ----------

  // Register scripted future check-ins (personas/population supply these).
  registerPlan(entries) { this.plans.push(...entries); }

  applyDuePlans() {
    const nowMs = Date.parse(this.clock.iso());
    for (const entry of this.plans) {
      if (Date.parse(entry.at) <= nowMs && !this.hasCheckin(entry.seniorId, dateOf(entry.at))) {
        this.addCheckin(entry);
      }
    }
  }

  advanceTo(iso) { this.clock.setTime(iso); this.applyDuePlans(); this.tick(); }
  advanceHours(h) { this.clock.advanceHours(h); this.applyDuePlans(); this.tick(); }
  advanceDays(d) { this.clock.advanceDays(d); this.applyDuePlans(); this.tick(); }

  // Evaluate Tier 1 for everyone at the current clock time.
  tick() { this.flagManager.tick(this.store, this.clock); }

  // ---------- assessment ----------

  assess(seniorId) {
    return assess(this.getSenior(seniorId), this.checkinsFor(seniorId), this.clock, this.scoringConfig);
  }

  // Read-only "what did it say then": never touches the live clock.
  assessAsOf(seniorId, iso) {
    const asOf = new DemoClock(iso);
    const visible = this.checkinsFor(seniorId).filter(c => Date.parse(c.at) <= Date.parse(iso));
    return assess(this.getSenior(seniorId), visible, asOf, this.scoringConfig);
  }

  // What-if sandbox: score an edited copy of the check-ins without touching
  // the store. Proof on demand that the engine is live math, not canned.
  assessWhatIf(seniorId, editedCheckins) {
    return assess(this.getSenior(seniorId), [...editedCheckins].sort((a, b) => a.at.localeCompare(b.at)), this.clock, this.scoringConfig);
  }

  trajectory(seniorId) {
    const t = trajectory(this.getSenior(seniorId), this.checkinsFor(seniorId), this.clock, this.scoringConfig);
    return { ...t, concernRisk: this.scoringConfig.concernRisk };
  }

  replay(seniorId, opts = {}) {
    return replay(this.getSenior(seniorId), this.checkinsFor(seniorId), this.clock, { ...opts, cfg: this.scoringConfig });
  }

  validationReport(opts = {}) { return validationReport(this, opts); }

  brief(seniorId) {
    return buildBrief({
      senior: this.getSenior(seniorId),
      assessment: this.assess(seniorId),
      flag: this.flagManager.activeFlag(seniorId),
      openVisit: this.actions.openVisits(seniorId)[0] || null,
      lastContact: this.actions.lastContact(seniorId),
    });
  }

  // ---------- flags ----------

  activeFlag(seniorId) { return this.flagManager.activeFlag(seniorId); }
  flags() { return this.flagManager.allFlags(); }
  resolveFlag(flagId, how) { return this.flagManager.resolveManually(flagId, how, this.clock); }

  deadlineFor(seniorId) {
    const min = checkinDeadlineMin(this.checkinsFor(seniorId), this.tier1Config);
    return { minutes: min, clock: minutesToClock(min) };
  }

  // ---------- coordinator actions ----------

  assignVisit(seniorId, opts = {}) { this.getSenior(seniorId); return this.actions.assignVisit(seniorId, opts); }
  logContact(seniorId, opts = {}) { this.getSenior(seniorId); return this.actions.logContact(seniorId, opts); }
  completeVisit(actionId, outcomeNote = '') { return this.actions.completeVisit(actionId, outcomeNote); }
  actionsFor(seniorId) { return this.actions.for(seniorId); }

  // ---------- dashboard ----------

  // Ranked cards: active flags float to the top (oldest first), then by risk.
  // Each card carries everything its buttons and clocks need.
  dashboard() {
    const nowMs = Date.parse(this.clock.iso());
    const today = this.clock.dateStr();
    const cards = this.store.seniors.map(senior => {
      const assessment = this.assess(senior.id);
      const flag = this.flagManager.activeFlag(senior.id);
      const openVisit = this.actions.openVisits(senior.id)[0] || null;
      const checkedInToday = this.hasCheckin(senior.id, today);
      let deadline = null;
      if (!flag && !checkedInToday) {
        const min = checkinDeadlineMin(this.checkinsFor(senior.id), this.tier1Config);
        deadline = { clock: minutesToClock(min), minutesRemaining: Math.max(0, Math.round(min - this.clock.minutesOfDay())) };
      }
      return {
        senior,
        assessment,
        flag,
        flagAgeMinutes: flag ? Math.max(0, Math.round((nowMs - Date.parse(flag.firedAt)) / 60000)) : null,
        checkedInToday,
        deadline,
        openVisit,
        lastContact: this.actions.lastContact(senior.id),
        suggestedAction: suggestedAction(assessment, flag, openVisit),
      };
    });
    cards.sort((a, b) => {
      if (a.flag && !b.flag) return -1;
      if (!a.flag && b.flag) return 1;
      if (a.flag && b.flag) return a.flag.firedAt.localeCompare(b.flag.firedAt);
      return b.assessment.combined - a.assessment.combined;
    });
    return cards;
  }

  // ---------- persistence ----------

  toJSON() {
    return {
      clock: this.clock.iso(),
      seniors: this.store.seniors,
      checkins: this.store.checkins,
      flags: this.flagManager.flags,
      nextFlagId: this.flagManager._nextId,
      actions: this.actions.actions,
      nextActionId: this.actions._nextId,
      plans: this.plans,
    };
  }

  static fromJSON(data) {
    const clock = new DemoClock(data.clock);
    const engine = new EsperEngine({ clock });
    engine.store.seniors = data.seniors ?? [];
    engine.store.checkins = data.checkins ?? [];
    engine.flagManager.flags = data.flags ?? [];
    engine.flagManager._nextId = data.nextFlagId ?? 1;
    engine.actions.actions = data.actions ?? [];
    engine.actions._nextId = data.nextActionId ?? 1;
    engine.plans = data.plans ?? [];
    return engine;
  }
}
