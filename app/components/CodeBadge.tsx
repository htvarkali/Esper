"use client";

import { useEffect, useState } from "react";
import { patients } from "../data/patients";

// Shows one patient's check-in code, picked at random on the client so the
// server render stays deterministic.
export default function CodeBadge() {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const patient = patients[Math.floor(Math.random() * patients.length)];
    setCode(patient.checkinCode);
  }, []);

  return (
    <p className="font-mono text-xs uppercase border border-gray-alpha-400 rounded px-3 py-1.5 text-gray-1000 tracking-[0.25em] w-fit my-0">
      Code: {code ?? "····"}
    </p>
  );
}
