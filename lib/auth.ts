"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Real Supabase when .env.local provides keys; demo fallback otherwise so the
// flow works offline at the event.
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const isSupabaseConfigured = supabase !== null;

export const DEMO_EMAIL = "demo@esper.care";
export const DEMO_PASSWORD = "esper2026";

const DEMO_SESSION_KEY = "esper-organizer-session";

export async function signInWithPassword(email: string, password: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return;
  }
  if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({ email: DEMO_EMAIL, at: Date.now() }));
    return;
  }
  throw new Error(`Invalid credentials. Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

export async function signInWithGoogle(): Promise<void> {
  if (!supabase) {
    throw new Error("Google sign-in requires Supabase keys in .env.local (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY).");
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/globe` },
  });
  if (error) throw new Error(error.message);
}

export async function getSessionEmail(): Promise<string | null> {
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.email ?? null;
  }
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY);
    return raw ? (JSON.parse(raw).email as string) : null;
  } catch {
    return null;
  }
}

export async function signOut(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut();
    return;
  }
  localStorage.removeItem(DEMO_SESSION_KEY);
}
