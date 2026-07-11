// The "response agent": drafts the coordinator's outreach brief AFTER the
// deterministic scoring has decided. Offline template filling, no API calls.
// The numbers decide; this layer only phrases them. A wobble here costs an
// awkward sentence, never a missed or false alert.
//
// Returns a STRUCTURED object (each field renderable on its own) plus
// `text`, the joined plain-text version.

import { minutesToClock } from './clock.js';

// Shared decision logic for "what should the coordinator do next". Used by
// both the brief and the dashboard cards so button and prose never disagree.
export function suggestedAction(assessment, flag = null, openVisit = null) {
  if (openVisit) {
    return { action: `volunteer visit pending (assigned ${openVisit.assignedAt.slice(11, 16)} UTC)`, urgency: 'scheduled' };
  }
  if (flag && flag.state !== 'resolved') {
    const map = {
      buddy_pinged: 'buddy pinged; awaiting the knock on the door',
      coordinator_notified: 'call the senior now, then send the buddy',
      emergency_contacted: 'emergency contact engaged; coordinate by phone',
    };
    return { action: map[flag.state] || 'follow the escalation ladder', urgency: 'now' };
  }
  const a = assessment;
  if (a.confidence.level === 'low' && (a.status === 'declining' || a.status === 'declining_fast')) {
    return { action: 'friendly phone call first (confidence is low)', urgency: 'soft' };
  }
  // A steep slope with tiny scores is a watch case, not a dispatch case:
  // the visit requires both the trend and a real gap vs baseline.
  if (a.combined >= 60 || (a.status === 'declining_fast' && a.combined >= 25)) {
    return { action: 'assign a volunteer visit within 24h', urgency: 'high' };
  }
  if (a.status === 'declining' || a.status === 'declining_fast') {
    return { action: 'phone call today; schedule a visit if anything feels off', urgency: 'medium' };
  }
  return { action: 'no action needed', urgency: 'none' };
}

export function buildBrief({ senior, assessment, flag = null, openVisit = null, lastContact = null }) {
  const a = assessment;
  const first = senior.name.split(' ')[0];

  const situation = `${a.status.replace('_', ' ')} | Health ${a.healthScore}/100, Isolation ${a.isolationScore}/100`;
  const confidence = `${a.confidence.level}${a.confidence.reasons.length ? ` (${a.confidence.reasons.join('; ')})` : ''}`;
  const flagLine = flag && flag.state !== 'resolved'
    ? `ACTIVE FLAG: missed check-in, ${flag.missedDays} day(s) silent, state: ${flag.state.replace(/_/g, ' ')}`
    : null;
  const usualVsRecent = a.baseline.usualCheckinMin === null
    ? 'Baseline still forming (enrolled recently); no usual check-in time yet.'
    : `Usual check-in time: around ${minutesToClock(a.baseline.usualCheckinMin)}; recently around ${a.recentWeek.checkinMin === null ? 'n/a' : minutesToClock(a.recentWeek.checkinMin)}.`;
  const suggestedOpening = `Hi ${first}, it's the team at the senior center - we noticed your mornings have been a little different lately and just wanted to hear how you're doing.`;
  const askAbout = a.changeNotes
    .filter(n => !n.startsWith('no significant') && !n.startsWith('recent notes are upbeat'))
    .slice(0, 2);
  const act = suggestedAction(a, flag, openVisit);
  const nextStep = act.urgency === 'high'
    ? `${act.action}. Buddy ${senior.buddy} is closest.`
    : act.urgency === 'none'
      ? act.action
      : `${act.action}. Buddy ${senior.buddy} is available.`;
  const lastContactLine = lastContact
    ? `Last contact: ${lastContact.type} ${lastContact.daysAgo === 0 ? 'today' : `${lastContact.daysAgo} day(s) ago`}.`
    : null;

  const lines = [
    `OUTREACH BRIEF - ${senior.name}`,
    `(drafted by the response agent from the computed scores; simulated offline)`,
    '',
    `Situation: ${situation}`,
    `Confidence: ${confidence}`,
    `Outlook: ${a.outlook.text}`,
    ...(flagLine ? [flagLine] : []),
    ...(lastContactLine ? [lastContactLine] : []),
    '',
    'What changed:',
    ...a.changeNotes.map(n => `  - ${n}`),
    '',
    usualVsRecent,
    '',
    `Suggested opening: "${suggestedOpening}"`,
    '',
    ...(askAbout.length ? [`Ask about: ${askAbout.join('; ')}.`] : []),
    `Next step: ${nextStep}`,
  ];

  return {
    seniorName: senior.name,
    situation,
    confidence,
    outlook: a.outlook.text,
    flagLine,
    lastContactLine,
    whatChanged: a.changeNotes,
    usualVsRecent,
    suggestedOpening,
    askAbout,
    nextStep,
    suggested: act,
    text: lines.join('\n'),
  };
}
