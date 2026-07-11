import Link from "next/link";
import { StatusLegend } from "./components/StatsDisplay";

export default function Landing() {
  return (
    <main className="font-mono min-h-screen max-w-3xl mx-auto flex flex-col justify-center px-6 py-16 gap-12">
      <header className="space-y-4">
        <h1 className="text-5xl md:text-6xl tracking-tight text-gray-1000 uppercase">Esper</h1>
        <p className="text-gray-900 text-sm md:text-base uppercase leading-relaxed">
          Senior early-warning network.
          <br />
          The rule catches the bad day. The AI catches the bad month.
        </p>
        <StatusLegend />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/checkin"
          className="group bg-gray-alpha-100 border border-gray-alpha-200 hover:border-gray-alpha-400 rounded-md p-8 transition-colors space-y-3"
        >
          <p className="text-3xl">👋</p>
          <h2 className="text-xl uppercase tracking-tight text-gray-1000">I&apos;m checking in</h2>
          <p className="text-sm text-gray-900 leading-relaxed">
            For seniors. Enter your 4-character code and answer a few quick questions. Big
            buttons, two minutes.
          </p>
          <p className="text-sm text-gray-1000 uppercase group-hover:underline underline-offset-4">
            Start check-in →
          </p>
        </Link>

        <Link
          href="/login"
          className="group bg-gray-alpha-100 border border-gray-alpha-200 hover:border-gray-alpha-400 rounded-md p-8 transition-colors space-y-3"
        >
          <p className="text-3xl">🩺</p>
          <h2 className="text-xl uppercase tracking-tight text-gray-1000">Care team</h2>
          <p className="text-sm text-gray-900 leading-relaxed">
            For organizers. Sign in to the live globe of every monitored patient, drill into
            any patient&apos;s dashboard, and manage check-in codes.
          </p>
          <p className="text-sm text-gray-1000 uppercase group-hover:underline underline-offset-4">
            Organizer sign in →
          </p>
        </Link>
      </div>

      <footer className="text-xs text-gray-900 uppercase">
        Esper • Vakathon 2026 • Demo data, simulated patients
      </footer>
    </main>
  );
}
