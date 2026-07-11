// Coordinator action loop: the "one-click way to send a volunteer" from the
// pitch, plus the manual last-contact field that replaced the old Support
// score. Deterministic, timestamped off the injected clock.

export class ActionLog {
  constructor(clock) {
    this.clock = clock;
    this.actions = [];
    this._nextId = 1;
  }

  assignVisit(seniorId, { volunteer = 'volunteer', reason = '' } = {}) {
    const action = {
      id: `visit-${this._nextId++}`,
      type: 'visit',
      seniorId,
      volunteer,
      reason,
      status: 'assigned',
      assignedAt: this.clock.iso(),
      completedAt: null,
      outcomeNote: null,
    };
    this.actions.push(action);
    return action;
  }

  logContact(seniorId, { how = 'phone call', note = '' } = {}) {
    const action = {
      id: `contact-${this._nextId++}`,
      type: 'contact',
      seniorId,
      how,
      note,
      status: 'done',
      assignedAt: this.clock.iso(),
      completedAt: this.clock.iso(),
      outcomeNote: note || null,
    };
    this.actions.push(action);
    return action;
  }

  completeVisit(actionId, outcomeNote = '') {
    const a = this.actions.find(x => x.id === actionId);
    if (!a || a.type !== 'visit' || a.status === 'completed') return null;
    a.status = 'completed';
    a.completedAt = this.clock.iso();
    a.outcomeNote = outcomeNote || null;
    return a;
  }

  for(seniorId) {
    return this.actions.filter(a => a.seniorId === seniorId);
  }

  openVisits(seniorId = null) {
    return this.actions.filter(a =>
      a.type === 'visit' && a.status === 'assigned' && (seniorId === null || a.seniorId === seniorId));
  }

  // The card's "last contacted" field: most recent completed contact/visit.
  lastContact(seniorId) {
    const done = this.actions
      .filter(a => a.seniorId === seniorId && (a.completedAt !== null))
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
    if (done.length === 0) return null;
    const daysAgo = Math.floor(
      (Date.parse(this.clock.iso()) - Date.parse(done[0].completedAt)) / 86400000);
    return { at: done[0].completedAt, type: done[0].type, daysAgo };
  }
}
