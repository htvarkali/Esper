import { patients, statusColor, statusLabel, type PatientStatus } from "./patients";

export const formatNumber = (num: number): string => {
  return num.toLocaleString("en-US");
};

export const statusBreakdown = (["critical", "watch", "stable"] as PatientStatus[]).map(
  (status) => ({
    status,
    label: statusLabel[status],
    color: statusColor[status],
    count: patients.filter((p) => p.status === status).length,
  })
);

export const highestRisk = [...patients]
  .sort((a, b) => b.riskScore - a.riskScore)
  .slice(0, 5);

const avgAdherence = Math.round(
  patients.reduce((sum, p) => sum + p.adherence, 0) / patients.length
);

export const stats = {
  totalReadings: 4218904,
  readingsPerSecond: 38,
  activeAlerts: patients.reduce((n, p) => n + p.alerts.length, 0),
  criticalPatients: patients.filter((p) => p.status === "critical").length,
  watchPatients: patients.filter((p) => p.status === "watch").length,
  avgAdherence,
  dosesConfirmedToday: 23,
  anomalyChecks: 412882,
  vitalsStreams: patients.length * 3,
  sensorsOnline: 34,
  batteryHealthy: 31,
  checkinsThisWeek: 148,
  patientCount: patients.length,
  cityCount: new Set(patients.map((p) => p.city)).size,
};
