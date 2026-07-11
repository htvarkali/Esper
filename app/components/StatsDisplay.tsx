"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { stats, formatNumber, statusBreakdown, highestRisk } from "../data/country-data";
import { statusColor } from "../data/patients";

function useAnimatedNumber(baseValue: number, incrementRatePerSecond: number) {
  const [value, setValue] = useState(baseValue);
  const [displayRate, setDisplayRate] = useState(incrementRatePerSecond);

  useEffect(() => {
    if (incrementRatePerSecond <= 0) return;

    const updatesPerSecond = 20;
    const baseIncrement = incrementRatePerSecond / updatesPerSecond;

    const interval = setInterval(() => {
      const variation = 0.7 + Math.random() * 0.6;
      const increment = Math.max(1, Math.floor(baseIncrement * variation));
      setValue((v) => v + increment);

      const rateVariation = 0.85 + Math.random() * 0.3;
      setDisplayRate(Math.floor(incrementRatePerSecond * rateVariation));
    }, 1000 / updatesPerSecond);

    return () => clearInterval(interval);
  }, [incrementRatePerSecond]);

  return { value, rate: displayRate };
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="5" r="0.75" fill="currentColor" />
    </svg>
  );
}

function PixelGridTransition({
  firstContent,
  secondContent,
  isActive,
  gridSize = 30,
  animationStepDuration = 0.3,
  className,
}: {
  firstContent: React.ReactNode;
  secondContent: React.ReactNode;
  isActive: boolean;
  gridSize?: number;
  animationStepDuration?: number;
  className?: string;
}) {
  const [showPixels, setShowPixels] = useState(false);
  const [animState, setAnimState] = useState<"idle" | "growing" | "shrinking">("idle");
  const hasActivatedRef = useRef(false);

  const pixels = useMemo(() => {
    const total = gridSize * gridSize;
    const result = [];
    for (let n = 0; n < total; n++) {
      const row = Math.floor(n / gridSize);
      const col = n % gridSize;
      const color = Math.random() > 0.85 ? "var(--ds-blue-800, #0070f3)" : "var(--ds-gray-200, #333)";
      result.push({ id: n, row, col, color });
    }
    return result;
  }, [gridSize]);

  const [shuffledOrder, setShuffledOrder] = useState<number[]>([]);

  useEffect(() => {
    if (!hasActivatedRef.current && !isActive) return;
    if (isActive) hasActivatedRef.current = true;

    const indices = pixels.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setShuffledOrder(indices);

    setShowPixels(true);
    setAnimState("growing");

    const shrinkTimer = setTimeout(() => setAnimState("shrinking"), animationStepDuration * 1000);
    const hideTimer = setTimeout(() => {
      setShowPixels(false);
      setAnimState("idle");
    }, animationStepDuration * 2000);

    return () => {
      clearTimeout(shrinkTimer);
      clearTimeout(hideTimer);
    };
  }, [isActive, animationStepDuration, pixels]);

  const delayPerPixel = useMemo(() => animationStepDuration / pixels.length, [animationStepDuration, pixels.length]);
  const orderMap = useMemo(() => {
    const map = new Map<number, number>();
    shuffledOrder.forEach((idx, order) => map.set(idx, order));
    return map;
  }, [shuffledOrder]);

  return (
    <div className={`w-full overflow-hidden max-w-full relative ${className || ""}`}>
      <motion.div
        className="h-full"
        aria-hidden={isActive}
        initial={{ opacity: 1 }}
        animate={{ opacity: isActive ? 0 : 1 }}
        transition={{ duration: 0, delay: animationStepDuration }}
      >
        {firstContent}
      </motion.div>

      <motion.div
        className="absolute inset-0 w-full h-full z-[2] overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ duration: 0, delay: animationStepDuration }}
        style={{ pointerEvents: isActive ? "auto" : "none" }}
        aria-hidden={!isActive}
      >
        {secondContent}
      </motion.div>

      <div
        className="absolute inset-0 w-full h-full pointer-events-none z-[3]"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        }}
      >
        <AnimatePresence>
          {showPixels &&
            pixels.map((pixel) => {
              const order = orderMap.get(pixel.id) ?? 0;
              return (
                <motion.div
                  key={pixel.id}
                  style={{
                    backgroundColor: pixel.color,
                    aspectRatio: "1 / 1",
                    gridArea: `${pixel.row + 1} / ${pixel.col + 1}`,
                  }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: animState === "growing" ? 1 : 0,
                    scale: animState === "growing" ? 1 : 0,
                  }}
                  transition={{ duration: 0.01, delay: order * delayPerPixel }}
                />
              );
            })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatCard({
  title,
  baseValue,
  incrementRate,
  children,
  infoContent,
  className,
}: {
  title: string;
  baseValue?: number;
  incrementRate?: number;
  children?: React.ReactNode;
  infoContent?: string;
  className?: string;
}) {
  const [showInfo, setShowInfo] = useState(false);
  const { value } = useAnimatedNumber(baseValue || 0, incrementRate || 0);

  const statsContent = (
    <div className="bg-gray-alpha-100 p-4 md:p-6 w-full min-h-[120px] h-full">
      <div className="space-y-2">
        <h2 className="my-0 font-mono font-medium text-sm tracking-tight uppercase text-gray-1000 pr-6">
          {title}
        </h2>
        {baseValue !== undefined && (
          <div className="text-3xl md:text-4xl tracking-normal font-mono tabular-nums">
            {formatNumber(value)}
          </div>
        )}
        {children}
      </div>
    </div>
  );

  const infoContentView = (
    <div className="bg-gray-alpha-100 p-4 md:p-6 w-full h-full overflow-y-auto flex flex-col gap-y-2">
      <span className="my-0 font-mono font-medium text-sm tracking-tight uppercase text-gray-1000 shrink-0">
        {title}
      </span>
      <span className="tracking-tight text-sm text-gray-900 leading-relaxed line-clamp-6">
        {infoContent}
      </span>
    </div>
  );

  return (
    <div
      className={`relative group rounded-md overflow-hidden border border-gray-alpha-200 backdrop-blur-md ${className || ""}`}
    >
      <PixelGridTransition
        firstContent={statsContent}
        secondContent={infoContentView}
        isActive={showInfo}
        gridSize={30}
        animationStepDuration={0.3}
        className="h-full"
      />
      {infoContent && (
        <div className={`absolute top-2 right-2 transition-opacity duration-150 z-[20] isolate ${showInfo ? "opacity-100" : "opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"}`}>
          <button
            aria-label={`Learn more about ${title}`}
            type="button"
            onClick={() => setShowInfo(!showInfo)}
            className="p-1 m-0 bg-transparent text-gray-alpha-600 md:text-gray-900 border-none md:border md:border-solid border-gray-alpha-400 hover:text-gray-1000 hover:bg-gray-alpha-200 transition-colors duration-150 flex items-center justify-center outline-none focus-visible:ring cursor-pointer"
          >
            <InfoIcon />
          </button>
        </div>
      )}
    </div>
  );
}

function MetricRow({ label, baseValue, incrementRate, showRate = false }: { label: string; baseValue: number; incrementRate: number; showRate?: boolean }) {
  const { value, rate } = useAnimatedNumber(baseValue, incrementRate);

  return (
    <li className="flex flex-wrap items-center justify-between gap-x-3">
      <h3 className="m-0 font-mono font-normal text-sm text-gray-900 uppercase">
        {label}
      </h3>
      <div className="flex items-center gap-3 md:gap-4 text-right">
        <div className="text-gray-1000 text-sm font-mono tabular-nums">
          {formatNumber(value)}
        </div>
        {showRate && (
          <div className="w-16 text-gray-900 text-right text-sm font-mono tabular-nums">
            <span>{formatNumber(rate)}</span>
            <span aria-label="per second">/s</span>
          </div>
        )}
      </div>
    </li>
  );
}

export function TotalRequests() {
  const { value, rate } = useAnimatedNumber(stats.totalReadings, stats.readingsPerSecond);

  return (
    <div className="space-y-2">
      <h2 className="my-0 font-mono font-medium text-sm tracking-tight uppercase text-gray-900">
        Vitals readings processed
      </h2>
      <div className="text-4xl md:text-5xl tracking-normal font-mono tabular-nums">
        {formatNumber(value)}
      </div>
      <div className="text-sm text-gray-900 font-mono tabular-nums">
        {formatNumber(rate)}/s
      </div>
    </div>
  );
}

export function TopCountries() {
  return (
    <div className="space-y-2">
      <h2 className="my-0 font-mono font-medium text-sm tracking-tight uppercase text-gray-900">
        Highest risk patients
      </h2>
      <ul className="list-none pl-0 space-y-1">
        {highestRisk.map((patient) => (
          <li key={patient.id} className="flex items-center w-full md:w-fit justify-between md:justify-start">
            <span aria-hidden="true" className="inline-block translate-y-[-2px] translate-x-[2px]">
              <span style={{ color: statusColor[patient.status], opacity: 1 }}>■</span>
            </span>
            <div className="text-left">
              <Link
                href={`/patient/${patient.id}`}
                className="inline-block my-0 font-medium text-[16px] hover:underline underline-offset-2 normal-case"
                style={{ color: statusColor[patient.status] }}
              >
                &nbsp;{patient.name}
              </Link>
            </div>
            <div className="w-[12ch] text-right">
              <span className="inline-flex tabular-nums">{patient.riskScore}</span>
              <span className="text-gray-900">&nbsp;risk</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RegionCount() {
  return (
    <div className="flex items-center w-full md:w-fit justify-between md:justify-start mt-2">
      <span aria-hidden="true" className="inline-block translate-y-[-2px] translate-x-[2px]">
        <span className="text-[10px]">▲</span>
      </span>
      <div className="text-left">
        <span className="inline-block my-0 font-medium text-[16px]">&nbsp;{stats.patientCount}</span>
        <span className="font-medium text-[16px] text-gray-900 tracking-tight">
          &nbsp;Patients across {stats.cityCount} cities
        </span>
      </div>
    </div>
  );
}

export function StatusLegend() {
  return (
    <div className="flex items-center gap-4 font-mono text-xs uppercase">
      {statusBreakdown.map((entry) => (
        <span key={entry.status} className="flex items-center gap-1.5">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-900">
            {entry.label} ({entry.count})
          </span>
        </span>
      ))}
    </div>
  );
}

export function StatsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5">
      <div className="flex flex-col gap-1.5">
        <StatCard
          title="Active alerts"
          baseValue={stats.activeAlerts}
          incrementRate={0}
          infoContent="Unresolved alerts across the monitored population, raised when a patient's vitals or behavior deviate from their personal baseline."
          className="flex-1"
        >
          <ul className="space-y-1 list-none pl-0 mt-4">
            <MetricRow label="Critical patients" baseValue={stats.criticalPatients} incrementRate={0} />
            <MetricRow label="Watch patients" baseValue={stats.watchPatients} incrementRate={0} />
          </ul>
        </StatCard>
        <StatCard
          title="Medication adherence"
          baseValue={stats.avgAdherence}
          incrementRate={0}
          infoContent="Average share of scheduled doses confirmed on time across all patients, from smart dispensers and caregiver check-ins."
          className="flex-1"
        >
          <p className="text-gray-900 text-sm font-mono mt-1">Average % across patients</p>
          <ul className="space-y-1 list-none pl-0 mt-2">
            <MetricRow label="Doses confirmed today" baseValue={stats.dosesConfirmedToday} incrementRate={0} />
          </ul>
        </StatCard>
      </div>

      <div className="flex flex-col gap-1.5">
        <StatCard
          title="Monitoring engine"
          baseValue={stats.anomalyChecks}
          incrementRate={4}
          infoContent="Every incoming reading is compared against the patient's rolling baseline. Deviations are scored and escalated to the care team when sustained."
          className="flex-1"
        >
          <ul className="space-y-1 list-none pl-0 mt-4">
            <MetricRow label="Vitals streams" baseValue={stats.vitalsStreams} incrementRate={0} />
            <MetricRow label="Anomaly checks" baseValue={stats.anomalyChecks} incrementRate={4} showRate />
          </ul>
        </StatCard>
      </div>

      <div className="flex flex-col gap-1.5">
        <StatCard
          title="Device fleet"
          infoContent="Wearables, bedside sensors, and smart dispensers reporting in. Devices that miss two sync windows are flagged for battery or connectivity checks."
          className="flex-1"
        >
          <ul className="space-y-1 list-none pl-0 mt-2">
            <MetricRow label="Sensors online" baseValue={stats.sensorsOnline} incrementRate={0} />
            <MetricRow label="Battery healthy" baseValue={stats.batteryHealthy} incrementRate={0} />
          </ul>
        </StatCard>
        <StatCard
          title="Check-ins completed"
          baseValue={stats.checkinsThisWeek}
          incrementRate={0}
          infoContent="Daily wellness check-ins completed by patients or caregivers this week, by voice, tablet, or in person."
          className="flex-1"
        >
          <p className="text-gray-900 text-sm font-mono mt-1">This week, all patients</p>
        </StatCard>
      </div>
    </div>
  );
}
