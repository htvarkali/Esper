"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  signInWithPassword,
  signInWithGoogle,
  isSupabaseConfigured,
  DEMO_EMAIL,
  DEMO_PASSWORD,
} from "@/lib/auth";

const STEPS = [
  "Enter your 4-character code",
  "Answer five quick questions",
  "Your care team sees it instantly",
];

export default function Landing() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signInWithPassword(email, password);
      router.push("/globe");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    }
  };

  return (
    <main className="min-h-screen bg-black flex flex-col lg:flex-row font-sans text-white">
      {/* Patient side */}
      <section className="relative overflow-hidden lg:w-1/2 lg:m-4 lg:mr-2 lg:rounded-[2.5rem] min-h-[70vh] lg:min-h-[calc(100vh-2rem)]">
        <video
          src="/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/80 via-purple-700/80 to-purple-950/95" />

        <div className="relative z-10 h-full flex flex-col items-center justify-center gap-8 px-8 py-16 text-center">
          <p className="font-mono uppercase tracking-[0.35em] text-white/90 text-lg">Esper</p>
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">Check In With Esper</h1>
            <p className="text-white/80 text-lg">
              For seniors. Three easy steps, about two minutes.
            </p>
          </div>

          <div className="w-full max-w-md space-y-3 text-left">
            {STEPS.map((step, index) => (
              <div
                key={step}
                className={`flex items-center gap-4 rounded-2xl px-5 py-4 border border-white/10 ${
                  index === 0 ? "bg-white/20" : "bg-white/10"
                }`}
              >
                <span className="w-9 h-9 shrink-0 rounded-full bg-white text-purple-900 font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-lg font-medium">{step}</span>
              </div>
            ))}
          </div>

          <Link
            href="/checkin"
            className="bg-white text-purple-950 text-xl font-bold rounded-2xl px-12 py-4 hover:bg-purple-100 transition-colors"
          >
            Start check-in →
          </Link>
        </div>
      </section>

      {/* Organizer side */}
      <section className="lg:w-1/2 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-bold">Organizer Sign In</h2>
            <p className="text-neutral-400">Enter your details to open the care dashboard.</p>
          </div>

          <button
            onClick={google}
            className="w-full bg-white text-black font-semibold rounded-xl py-3.5 flex items-center justify-center gap-3 hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.02.15 3.5 2.7.24.03c2.2-2.1 3.5-5.1 3.5-8.6z" />
              <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.2 0-5.8-2.1-6.8-5l-.14.01-3.7 2.8-.05.13C3.3 21.3 7.3 24 12 24z" />
              <path fill="#FBBC05" d="M5.2 14.4c-.3-.7-.4-1.5-.4-2.4 0-.8.2-1.6.4-2.4l-.01-.16-3.7-2.9-.12.06C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l3.9-3z" />
              <path fill="#EB4335" d="M12 4.6c2.3 0 3.8 1 4.7 1.8l3.4-3.3C18 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l3.8 3c1-2.9 3.7-5 6.9-5z" />
            </svg>
            Google
          </button>

          <div className="flex items-center gap-4 text-neutral-500 text-sm">
            <span className="h-px flex-1 bg-neutral-800" />
            Or
            <span className="h-px flex-1 bg-neutral-800" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={DEMO_EMAIL}
              aria-label="Email"
              className="w-full bg-neutral-900/70 border border-neutral-800 focus:border-neutral-500 rounded-xl px-4 py-3.5 outline-none placeholder:text-neutral-500"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              aria-label="Password"
              className="w-full bg-neutral-900/70 border border-neutral-800 focus:border-neutral-500 rounded-xl px-4 py-3.5 outline-none placeholder:text-neutral-500"
            />
            {error && <p className="text-red-400 text-sm leading-snug">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-white text-black font-semibold rounded-xl py-3.5 hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {busy ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {!isSupabaseConfigured && (
            <p className="text-sm text-neutral-500 leading-relaxed">
              Demo mode: <span className="text-neutral-300">{DEMO_EMAIL}</span> /{" "}
              <span className="text-neutral-300">{DEMO_PASSWORD}</span>. Add Supabase keys to
              .env.local for real email and Google auth.
            </p>
          )}

          <p className="text-neutral-400 text-sm text-center">
            Checking in as a senior?{" "}
            <Link href="/checkin" className="text-white hover:underline underline-offset-4">
              Start here
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
