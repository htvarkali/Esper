import Link from "next/link";
import { ClipboardCheck, Globe2 } from "lucide-react";
import { StatusLegend } from "./components/StatsDisplay";

export default function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black">
      <video
        src="/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-70 pointer-events-none"
      />
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 font-mono max-w-3xl mx-auto flex flex-col justify-center px-6 py-16 gap-12 min-h-screen">
        <header className="space-y-4">
          <h1 className="text-5xl md:text-6xl tracking-tight text-white uppercase">Esper</h1>
          <p className="text-neutral-400 text-sm md:text-base uppercase leading-relaxed">
            Senior early-warning network.
            <br />
            The rule catches the bad day. The AI catches the bad month.
          </p>
          <StatusLegend />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/checkin"
            className="group bg-white/[0.04] backdrop-blur-sm border border-white/15 hover:border-white/40 rounded-md p-8 transition-colors space-y-3"
          >
            <ClipboardCheck className="w-6 h-6 text-white" strokeWidth={1.5} />
            <h2 className="text-xl uppercase tracking-tight text-white">I&apos;m checking in</h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Enter the 4-character code from your care team and answer a few quick questions.
            </p>
            <p className="text-sm text-white uppercase group-hover:underline underline-offset-4">
              Start check-in →
            </p>
          </Link>

          <Link
            href="/login"
            className="group bg-white/[0.04] backdrop-blur-sm border border-white/15 hover:border-white/40 rounded-md p-8 transition-colors space-y-3"
          >
            <Globe2 className="w-6 h-6 text-white" strokeWidth={1.5} />
            <h2 className="text-xl uppercase tracking-tight text-white">Care team</h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Sign in to the live globe of every monitored patient, open any patient&apos;s
              dashboard, and manage check-in codes.
            </p>
            <p className="text-sm text-white uppercase group-hover:underline underline-offset-4">
              Organizer sign in →
            </p>
          </Link>
        </div>

        <footer className="text-xs text-neutral-500 uppercase">
          Esper · Vakathon 2026 · Demo data, simulated patients
        </footer>
      </div>
    </main>
  );
}
