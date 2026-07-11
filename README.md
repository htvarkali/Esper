# SilverGuard

SilverGuard is an early-warning system for seniors who live alone. A senior completes a twenty-second daily check-in, and the system looks for missed check-ins and gradual changes in sleep, meals, mood, timing, and engagement. The goal is simple: catch the decline while it is still a phone call, before it becomes an ambulance.

## How it works

- **Tier 1 — the bad day:** a missed personal check-in deadline triggers a neighborhood buddy response, followed by coordinator and emergency-contact escalation when needed.
- **Tier 2 — the bad month:** deterministic health and isolation scores compare recent behavior with the senior's own lagging baseline.
- **Coordinator support:** ranked alerts explain what changed, state their confidence, suggest an action, and provide an offline outreach brief.
- **Privacy by design:** seniors choose their buddy and emergency contacts, and the system is designed to keep data local to the senior center.

Detection is deterministic and traceable. The language layer explains results after the scoring engine has made its decision.

## Repository structure

```text
app/         Next.js landing page
components/  Shared interface components
public/      Site assets
backend/     Offline scoring engine, simulated personas, demo, and tests
```

## Run the website

Requirements: Node.js 18+ and pnpm.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Create a production build with:

```bash
pnpm build
```

## Run the engine

The backend is framework-free, uses ES modules, and has no runtime dependencies.

```bash
cd backend
npm test
npm run demo
```

The test suite covers the missed-check-in rule, escalation ladder, lagging baseline, trend scoring, confidence, projection, replay, coordinator actions, serialization, and simulated senior personas.

## Product principle

> Catch the decline while it is still a phone call, before it becomes an ambulance.
