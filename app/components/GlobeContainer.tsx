"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { patients, statusColor } from "../data/patients";
import type { PersonaDot } from "./ThreeJSGlobeWithDots";

const Globe = dynamic(() => import("./ThreeJSGlobeWithDots"), {
  ssr: false,
  loading: () => (
    <div className="w-[620px] h-[620px] max-w-full bg-[var(--ds-background-100)] animate-pulse rounded-full" />
  ),
});

export default function GlobeContainer() {
  const router = useRouter();

  const dots: PersonaDot[] = useMemo(
    () =>
      patients.map((patient, index) => ({
        id: index,
        lat: patient.lat,
        lon: patient.lon,
        color: statusColor[patient.status],
        size: 1,
        interactive: true,
        persona: patient,
      })),
    []
  );

  return (
    <Globe
      size={620}
      color="#444444"
      speed={0.002}
      dots={dots}
      onDotClick={(dot) => router.push(`/patient/${dot.persona.id}`)}
    />
  );
}
