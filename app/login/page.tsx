"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  signInWithPassword,
  signInWithGoogle,
  getSessionEmail,
  isSupabaseConfigured,
  DEMO_EMAIL,
  DEMO_PASSWORD,
} from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSessionEmail().then((session) => {
      if (session) router.replace("/globe");
    });
  }, [router]);

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
    <main className="min-h-screen flex items-center justify-center font-mono px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <Link href="/" className="text-xs uppercase text-gray-900 hover:underline underline-offset-2">
            ← Esper
          </Link>
          <h1 className="text-2xl uppercase tracking-tight text-gray-1000">Organizer sign in</h1>
          <p className="text-sm text-gray-900">Care team access to the global patient monitor.</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-xs uppercase text-gray-900">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={DEMO_EMAIL}
              className="w-full bg-gray-alpha-100 border border-gray-alpha-200 rounded-md px-3 py-2.5 text-sm text-gray-1000 outline-none focus:border-gray-alpha-400 placeholder:text-gray-900/50"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs uppercase text-gray-900">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-alpha-100 border border-gray-alpha-200 rounded-md px-3 py-2.5 text-sm text-gray-1000 outline-none focus:border-gray-alpha-400 placeholder:text-gray-900/50"
            />
          </label>

          {error && (
            <p className="text-sm text-[var(--ds-red-900)] leading-snug">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-gray-1000 text-[var(--ds-background-100)] rounded-md py-2.5 text-sm uppercase tracking-tight cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-gray-alpha-200" />
          <span className="text-xs uppercase text-gray-900">or</span>
          <span className="h-px flex-1 bg-gray-alpha-200" />
        </div>

        <button
          onClick={google}
          className="w-full border border-gray-alpha-400 rounded-md py-2.5 text-sm uppercase tracking-tight text-gray-1000 cursor-pointer hover:bg-gray-alpha-100 transition-colors flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.02.15 3.5 2.7.24.03c2.2-2.1 3.5-5.1 3.5-8.6z" />
            <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.2 0-5.8-2.1-6.8-5l-.14.01-3.7 2.8-.05.13C3.3 21.3 7.3 24 12 24z" />
            <path fill="#FBBC05" d="M5.2 14.4c-.3-.7-.4-1.5-.4-2.4 0-.8.2-1.6.4-2.4l-.01-.16-3.7-2.9-.12.06C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l3.9-3z" />
            <path fill="#EB4335" d="M12 4.6c2.3 0 3.8 1 4.7 1.8l3.4-3.3C18 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l3.8 3c1-2.9 3.7-5 6.9-5z" />
          </svg>
          Continue with Google
        </button>

        {!isSupabaseConfigured && (
          <p className="text-xs text-gray-900 leading-relaxed">
            Supabase keys not set, running in demo mode.
            <br />
            Sign in with <span className="text-gray-1000">{DEMO_EMAIL}</span> /{" "}
            <span className="text-gray-1000">{DEMO_PASSWORD}</span>. Add
            NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local to enable
            real email + Google auth.
          </p>
        )}
      </div>
    </main>
  );
}
