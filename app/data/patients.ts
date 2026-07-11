export type PatientStatus = "stable" | "watch" | "critical";

export const statusColor: Record<PatientStatus, string> = {
  stable: "#22c55e",
  watch: "#f59e0b",
  critical: "#ef4444",
};

export const statusLabel: Record<PatientStatus, string> = {
  stable: "Stable",
  watch: "Watch",
  critical: "Critical",
};

export interface Reading {
  time: string;
  heartRate: number;
  bloodPressure: string;
  spo2: number;
  temp: number;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  mrn: string;
  checkinCode: string;
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  status: PatientStatus;
  conditions: string[];
  riskScore: number; // 0-100, higher = worse
  adherence: number; // % medication adherence
  mobility: number; // % of daily mobility goal
  sleepQuality: number; // %
  vitals: {
    heartRate: number;
    bloodPressure: string;
    spo2: number;
    temperature: number;
  };
  vitalsTrend: {
    heartRate: string;
    bloodPressure: string;
    spo2: string;
    temperature: string;
  };
  medications: { name: string; dose: string; schedule: string }[];
  readings: Reading[];
  activity: { action: string; time: string; type: "success" | "info" | "alert" }[];
  careTeam: { name: string; role: string; avatar: string }[];
  alerts: string[];
  nextAppointment: string;
  daysSinceIncident: number;
}

interface PatientSeed {
  id: string;
  checkinCode: string;
  name: string;
  age: number;
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  status: PatientStatus;
  conditions: string[];
  medications: { name: string; dose: string; schedule: string }[];
  careTeam: { name: string; role: string; avatar: string }[];
  alerts: string[];
  nextAppointment: string;
}

// Deterministic detail generation (no Math.random: values must match between
// server render and client hydration).
function buildPatient(seed: PatientSeed, index: number): Patient {
  const sev = seed.status === "critical" ? 2 : seed.status === "watch" ? 1 : 0;
  const hr = 64 + index * 2 + sev * 14;
  const sys = 112 + index * 2 + sev * 16;
  const dia = 70 + index + sev * 8;
  const spo2 = 98 - sev * 3 - (index % 2);
  const temp = +(36.5 + sev * 0.6 + (index % 3) * 0.1).toFixed(1);

  const readings: Reading[] = [0, 1, 2, 3, 4].map((h) => ({
    time: `${h === 0 ? "Now" : `${h * 2}h ago`}`,
    heartRate: hr - h + (h % 2 ? sev * 2 : 0),
    bloodPressure: `${sys - h * 2}/${dia - h}`,
    spo2: Math.min(99, spo2 + (h % 2)),
    temp: +(temp - h * 0.1).toFixed(1),
  }));

  return {
    ...seed,
    mrn: `MRN-${String(20940 + index * 137)}`,
    riskScore: 18 + sev * 28 + (index % 4) * 3,
    adherence: 96 - sev * 12 - (index % 3) * 2,
    mobility: 84 - sev * 22 - (index % 5) * 3,
    sleepQuality: 88 - sev * 15 - (index % 4) * 2,
    vitals: {
      heartRate: hr,
      bloodPressure: `${sys}/${dia}`,
      spo2,
      temperature: temp,
    },
    vitalsTrend: {
      heartRate: sev === 2 ? "+9 bpm vs baseline" : sev === 1 ? "+4 bpm vs baseline" : "at baseline",
      bloodPressure: sev >= 1 ? "elevated overnight" : "within range",
      spo2: sev === 2 ? "-3% since morning" : "steady",
      temperature: sev === 2 ? "+0.8°C in 24h" : "normal",
    },
    readings,
    activity:
      sev === 2
        ? [
            { action: "Critical alert sent to care team", time: "12 min ago", type: "alert" },
            { action: "Abnormal heart rhythm detected", time: "26 min ago", type: "alert" },
            { action: "Caregiver acknowledged alert", time: "1 hour ago", type: "info" },
          ]
        : sev === 1
          ? [
              { action: "Elevated reading flagged for review", time: "1 hour ago", type: "alert" },
              { action: "Morning medications confirmed", time: "4 hours ago", type: "success" },
              { action: "Daily check-in completed", time: "6 hours ago", type: "info" },
            ]
          : [
              { action: "Daily check-in completed", time: "2 hours ago", type: "success" },
              { action: "Morning medications confirmed", time: "5 hours ago", type: "success" },
              { action: "Activity goal reached", time: "Yesterday", type: "info" },
            ],
  };
}

const seeds: PatientSeed[] = [
  {
    id: "p01", checkinCode: "E7K2", name: "Eleanor Whitfield", age: 82, city: "New York", country: "United States", countryCode: "US",
    lat: 40.71, lon: -74.01, status: "watch",
    conditions: ["Atrial fibrillation", "Hypertension"],
    medications: [
      { name: "Apixaban", dose: "5 mg", schedule: "Twice daily" },
      { name: "Metoprolol", dose: "50 mg", schedule: "Morning" },
    ],
    careTeam: [
      { name: "Dr. Sarah Lin", role: "Cardiologist", avatar: "SL" },
      { name: "James Porter", role: "Home nurse", avatar: "JP" },
      { name: "Maya Whitfield", role: "Family caregiver", avatar: "MW" },
    ],
    alerts: ["Irregular rhythm episodes overnight", "BP trending up for 3 days"],
    nextAppointment: "Jul 15, 10:30 AM",
  },
  {
    id: "p02", checkinCode: "H3P9", name: "Harold Jenkins", age: 76, city: "Phoenix", country: "United States", countryCode: "US",
    lat: 33.45, lon: -112.07, status: "stable",
    conditions: ["Type 2 diabetes"],
    medications: [{ name: "Metformin", dose: "1000 mg", schedule: "With meals" }],
    careTeam: [
      { name: "Dr. Alan Reyes", role: "Primary care", avatar: "AR" },
      { name: "Nina Torres", role: "Care coordinator", avatar: "NT" },
    ],
    alerts: [],
    nextAppointment: "Jul 22, 9:00 AM",
  },
  {
    id: "p03", checkinCode: "M8B4", name: "Margaret Boone", age: 88, city: "Toronto", country: "Canada", countryCode: "CA",
    lat: 43.65, lon: -79.38, status: "critical",
    conditions: ["Congestive heart failure", "CKD stage 3"],
    medications: [
      { name: "Furosemide", dose: "40 mg", schedule: "Morning" },
      { name: "Lisinopril", dose: "10 mg", schedule: "Morning" },
      { name: "Carvedilol", dose: "12.5 mg", schedule: "Twice daily" },
    ],
    careTeam: [
      { name: "Dr. Priya Nair", role: "Cardiologist", avatar: "PN" },
      { name: "Tom Osei", role: "Home nurse", avatar: "TO" },
      { name: "Claire Boone", role: "Family caregiver", avatar: "CB" },
    ],
    alerts: ["Weight up 2.1 kg in 48h", "SpO2 below 93% twice today", "Care team dispatched"],
    nextAppointment: "Today, 4:00 PM (urgent)",
  },
  {
    id: "p04", checkinCode: "A2P6", name: "Arthur Pemberton", age: 79, city: "London", country: "United Kingdom", countryCode: "GB",
    lat: 51.51, lon: -0.13, status: "stable",
    conditions: ["COPD (mild)", "Osteoarthritis"],
    medications: [{ name: "Tiotropium", dose: "18 mcg", schedule: "Morning inhaler" }],
    careTeam: [
      { name: "Dr. Emma Hayes", role: "Pulmonologist", avatar: "EH" },
      { name: "Ravi Kapoor", role: "Physiotherapist", avatar: "RK" },
    ],
    alerts: [],
    nextAppointment: "Jul 18, 2:15 PM",
  },
  {
    id: "p05", checkinCode: "F5W3", name: "Ingrid Falkner", age: 84, city: "Berlin", country: "Germany", countryCode: "DE",
    lat: 52.52, lon: 13.4, status: "watch",
    conditions: ["Post-stroke recovery", "Hypertension"],
    medications: [
      { name: "Clopidogrel", dose: "75 mg", schedule: "Morning" },
      { name: "Amlodipine", dose: "5 mg", schedule: "Evening" },
    ],
    careTeam: [
      { name: "Dr. Lukas Brandt", role: "Neurologist", avatar: "LB" },
      { name: "Sofie Krause", role: "Rehab therapist", avatar: "SK" },
    ],
    alerts: ["Missed evening dose yesterday"],
    nextAppointment: "Jul 14, 11:00 AM",
  },
  {
    id: "p06", checkinCode: "K9Y7", name: "Kenji Yamamoto", age: 81, city: "Tokyo", country: "Japan", countryCode: "JP",
    lat: 35.68, lon: 139.69, status: "stable",
    conditions: ["Hypertension"],
    medications: [{ name: "Losartan", dose: "50 mg", schedule: "Morning" }],
    careTeam: [
      { name: "Dr. Aiko Tanaka", role: "Primary care", avatar: "AT" },
      { name: "Hiro Sato", role: "Community nurse", avatar: "HS" },
    ],
    alerts: [],
    nextAppointment: "Jul 25, 3:30 PM",
  },
  {
    id: "p07", checkinCode: "L4R8", name: "Lakshmi Raghavan", age: 74, city: "Mumbai", country: "India", countryCode: "IN",
    lat: 19.08, lon: 72.88, status: "watch",
    conditions: ["Type 2 diabetes", "Diabetic neuropathy"],
    medications: [
      { name: "Insulin glargine", dose: "20 units", schedule: "Bedtime" },
      { name: "Metformin", dose: "500 mg", schedule: "Twice daily" },
    ],
    careTeam: [
      { name: "Dr. Vikram Shah", role: "Endocrinologist", avatar: "VS" },
      { name: "Anita Deshmukh", role: "Home nurse", avatar: "AD" },
    ],
    alerts: ["Two low-glucose readings this week"],
    nextAppointment: "Jul 16, 8:45 AM",
  },
  {
    id: "p08", checkinCode: "C6N2", name: "Chen Wei-Ling", age: 77, city: "Singapore", country: "Singapore", countryCode: "SG",
    lat: 1.35, lon: 103.82, status: "stable",
    conditions: ["Osteoporosis"],
    medications: [{ name: "Alendronate", dose: "70 mg", schedule: "Weekly" }],
    careTeam: [
      { name: "Dr. Marcus Tan", role: "Geriatrician", avatar: "MT" },
      { name: "Grace Lim", role: "Care coordinator", avatar: "GL" },
    ],
    alerts: [],
    nextAppointment: "Aug 2, 10:00 AM",
  },
  {
    id: "p09", checkinCode: "R7F5", name: "Rosa Ferreira", age: 86, city: "São Paulo", country: "Brazil", countryCode: "BR",
    lat: -23.55, lon: -46.63, status: "critical",
    conditions: ["Pneumonia (recovering)", "Frailty"],
    medications: [
      { name: "Amoxicillin-clavulanate", dose: "875 mg", schedule: "Twice daily" },
      { name: "Paracetamol", dose: "500 mg", schedule: "As needed" },
    ],
    careTeam: [
      { name: "Dr. Beatriz Costa", role: "Pulmonologist", avatar: "BC" },
      { name: "Paulo Mendes", role: "Home nurse", avatar: "PM" },
      { name: "Luiza Ferreira", role: "Family caregiver", avatar: "LF" },
    ],
    alerts: ["Fever spike 38.4°C this morning", "Respiratory rate elevated"],
    nextAppointment: "Today, 6:00 PM (tele-visit)",
  },
  {
    id: "p10", checkinCode: "D3K9", name: "Desmond Nkosi", age: 72, city: "Cape Town", country: "South Africa", countryCode: "ZA",
    lat: -33.93, lon: 18.42, status: "stable",
    conditions: ["Hypertension", "Glaucoma"],
    medications: [
      { name: "Hydrochlorothiazide", dose: "25 mg", schedule: "Morning" },
      { name: "Latanoprost drops", dose: "1 drop", schedule: "Bedtime" },
    ],
    careTeam: [
      { name: "Dr. Naledi Dlamini", role: "Primary care", avatar: "ND" },
      { name: "Sipho Mbeki", role: "Community health worker", avatar: "SM" },
    ],
    alerts: [],
    nextAppointment: "Jul 29, 1:00 PM",
  },
  {
    id: "p11", checkinCode: "S8H4", name: "Sun-Hee Park", age: 80, city: "Seoul", country: "South Korea", countryCode: "KR",
    lat: 37.57, lon: 126.98, status: "watch",
    conditions: ["Early dementia", "Hypertension"],
    medications: [
      { name: "Donepezil", dose: "10 mg", schedule: "Bedtime" },
      { name: "Amlodipine", dose: "5 mg", schedule: "Morning" },
    ],
    careTeam: [
      { name: "Dr. Ji-Woo Kim", role: "Neurologist", avatar: "JK" },
      { name: "Min-Jun Park", role: "Family caregiver", avatar: "MP" },
    ],
    alerts: ["Wandering event detected Tuesday night"],
    nextAppointment: "Jul 17, 9:30 AM",
  },
  {
    id: "p12", checkinCode: "B5G7", name: "Beryl Hastings", age: 78, city: "Sydney", country: "Australia", countryCode: "AU",
    lat: -33.87, lon: 151.21, status: "stable",
    conditions: ["Atrial fibrillation (controlled)"],
    medications: [{ name: "Rivaroxaban", dose: "20 mg", schedule: "With dinner" }],
    careTeam: [
      { name: "Dr. Oliver Grant", role: "Cardiologist", avatar: "OG" },
      { name: "Tessa Byrne", role: "Care coordinator", avatar: "TB" },
    ],
    alerts: [],
    nextAppointment: "Jul 21, 11:15 AM",
  },
];

export const patients: Patient[] = seeds.map((seed, index) => {
  const sev = seed.status === "critical" ? 2 : seed.status === "watch" ? 1 : 0;
  return { ...buildPatient(seed, index), daysSinceIncident: sev === 2 ? 0 : sev === 1 ? 6 : 34 + index };
});

export function getPatient(id: string): Patient | undefined {
  return patients.find((p) => p.id === id);
}

export function getPatientByCode(code: string): Patient | undefined {
  return patients.find((p) => p.checkinCode === code.trim().toUpperCase());
}
