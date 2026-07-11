# Esper — Global Patient Monitor

Senior early-warning network. The rule catches the bad day, the AI catches the bad month.

This app is the organizer-facing globe view plus the senior-facing check-in flow:

- **/** — landing page with the two entry points
- **/login** — organizer sign-in (Supabase email/password + Google when configured, offline demo mode otherwise)
- **/globe** — auth-guarded 3D globe of every monitored patient (drag to rotate, scroll to zoom, click a dot), live fleet stats, and the patient check-in code list
- **/patient/[id]** — auth-guarded frosted-glass dashboard per patient: vitals, readings, risk and recovery, care plan, alerts, care team, and that patient's check-in code
- **/checkin** — senior-friendly screen: type the 4-character code your care team gave you, answer five big-button questions plus an optional note

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Auth

Without configuration the app runs in demo mode: sign in with `demo@esper.care` / `esper2026`.

To use real Supabase auth (email/password + Google OAuth), create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

Enable the Google provider in the Supabase dashboard for the Google button.

## Check-in codes

Each patient has a 4-character code (see the codes panel at the bottom of /globe, or the
patient's own dashboard). A senior enters it at /checkin to answer their daily questions.
Answers are stored locally under the `esper-checkins` localStorage key.

## Data

All 12 patients are simulated seed data in `app/data/patients.ts` (deterministic, no
backend required). The Esper scoring engine lives on the `Backend` branch / the separate
backend workspace.

## Stack

Next.js 16, React 19, Tailwind 4, Three.js globe (plain three, no react-three-fiber),
shadcn/ui components, Supabase JS for auth.
