"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionEmail, signOut } from "@/lib/auth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    getSessionEmail().then((sessionEmail) => {
      if (!sessionEmail) {
        router.replace("/login");
        return;
      }
      setEmail(sessionEmail);
      setChecked(true);
    });
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-sm text-gray-900 uppercase">
        Checking session...
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-3 right-4 z-50 flex items-center gap-2 font-mono text-xs bg-gray-alpha-100 border border-gray-alpha-200 rounded-full px-3 py-1.5 backdrop-blur">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
        <span className="text-gray-900">{email}</span>
        <button
          onClick={() => signOut().then(() => router.replace("/login"))}
          className="text-gray-1000 hover:underline underline-offset-2 uppercase cursor-pointer bg-transparent border-none p-0"
        >
          Sign out
        </button>
      </div>
      {children}
    </>
  );
}
