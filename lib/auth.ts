"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Real Supabase when .env.local provides plausible keys; demo fallback
// otherwise so the flow works offline at the event. Malformed values fall
// back to demo mode instead of crashing client creation.
function buildClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseKey) return null;
  const urlOk = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(supabaseUrl.trim());
  const keyOk = /^(eyJ|sb_publishable_)/.test(supabaseKey.trim());
  if (!urlOk || !keyOk) {
    console.warn("Supabase env values look invalid, staying in demo mode.");
    return null;
  }
  try {
    return createClient(supabaseUrl.trim(), supabaseKey.trim());
  } catch {
    console.warn("Supabase client creation failed, staying in demo mode.");
    return null;
  }
}

export const supabase: SupabaseClient | null = buildClient();

export const isSupabaseConfigured = supabase !== null;

export const DEMO_EMAIL = "demo@esper.care";
export const DEMO_PASSWORD = "esper2026";

const DEMO_SESSION_KEY = "esper-organizer-session";
const DEMO_ACCOUNTS_KEY = "esper-demo-accounts";

function demoAccounts(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(DEMO_ACCOUNTS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function setDemoSession(email: string): void {
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({ email, at: Date.now() }));
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return;
  }
  const key = email.trim().toLowerCase();
  if ((key === DEMO_EMAIL && password === DEMO_PASSWORD) || demoAccounts()[key] === password) {
    setDemoSession(key);
    return;
  }
  throw new Error("Invalid email or password.");
}

/** Returns true if the user is signed in right away, false if email confirmation is pending. */
export async function signUpWithPassword(email: string, password: string): Promise<boolean> {
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  if (supabase) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    return data.session !== null;
  }
  const key = email.trim().toLowerCase();
  const accounts = demoAccounts();
  if (key === DEMO_EMAIL || accounts[key]) {
    throw new Error("An account with this email already exists. Sign in instead.");
  }
  accounts[key] = password;
  localStorage.setItem(DEMO_ACCOUNTS_KEY, JSON.stringify(accounts));
  setDemoSession(key);
  return true;
}

/**
 * Returns true when the sign-in was handled locally (demo mode) and the caller
 * should navigate; false when a real OAuth redirect has been started.
 */
export async function signInWithGoogle(): Promise<boolean> {
  if (!supabase) {
    // Demo mode: simulate the Google sign-in so the button works offline.
    setDemoSession(DEMO_EMAIL);
    return true;
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/globe` },
  });
  if (error) throw new Error(error.message);
  return false;
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
