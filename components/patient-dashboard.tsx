"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { type Patient, statusLabel } from "@/app/data/patients"
import {
  ArrowLeft,
  HeartPulse,
  Gauge,
  Wind,
  Thermometer,
  Phone,
  Mail,
  Calendar,
  Plus,
  Bell,
  AlertTriangle,
  ShieldCheck,
  MapPin,
  Pill,
  Activity,
  Stethoscope,
  ClipboardList,
  LineChart,
} from "lucide-react"

const statusBadgeClass: Record<Patient["status"], string> = {
  stable: "bg-green-500/20 text-green-400 border-green-400/30",
  watch: "bg-amber-500/20 text-amber-400 border-amber-400/30",
  critical: "bg-red-500/20 text-red-400 border-red-400/30",
}

const activityDotClass = {
  success: "bg-green-400",
  info: "bg-blue-400",
  alert: "bg-red-400",
}

export function PatientDashboard({ patient }: { patient: Patient }) {
  const initials = patient.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")

  const vitalsCards = [
    {
      title: "Heart Rate",
      value: `${patient.vitals.heartRate} bpm`,
      note: patient.vitalsTrend.heartRate,
      icon: HeartPulse,
      color: "text-red-400",
    },
    {
      title: "Blood Pressure",
      value: patient.vitals.bloodPressure,
      note: patient.vitalsTrend.bloodPressure,
      icon: Gauge,
      color: "text-blue-400",
    },
    {
      title: "SpO2",
      value: `${patient.vitals.spo2}%`,
      note: patient.vitalsTrend.spo2,
      icon: Wind,
      color: "text-cyan-400",
    },
    {
      title: "Temperature",
      value: `${patient.vitals.temperature}°C`,
      note: patient.vitalsTrend.temperature,
      icon: Thermometer,
      color: "text-yellow-400",
    },
  ]

  const recoveryBars = [
    { name: "Medication adherence", progress: patient.adherence, color: "from-green-400 to-teal-500" },
    { name: "Mobility goal", progress: patient.mobility, color: "from-blue-400 to-purple-500" },
    { name: "Sleep quality", progress: patient.sleepQuality, color: "from-orange-400 to-yellow-500" },
  ]

  return (
    <div className="h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950" />
      <video
        src="/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
      />
      <div className="bg-black/40 absolute inset-0" />

      <div className="relative z-10 p-6 grid grid-cols-12 gap-6 h-screen">
        {/* Left Sidebar: patient identity */}
        <Card className="col-span-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 pb-6 h-fit flex flex-col gap-0">
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <Avatar className="h-16 w-16 mx-auto">
                <AvatarFallback className="bg-white/20 text-white text-xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold text-white leading-tight">{patient.name}</h1>
                <p className="text-white/60 text-sm">
                  {patient.age} yrs • {patient.mrn}
                </p>
              </div>
              <Badge className={`text-xs ${statusBadgeClass[patient.status]}`}>
                {statusLabel[patient.status]}
              </Badge>
              <p className="text-white/60 text-sm flex items-center justify-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {patient.city}, {patient.country}
              </p>
            </div>

            <div>
              <h4 className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-3">Patient Record</h4>
              <nav className="space-y-2">
                {[
                  { icon: Activity, label: "Overview", active: true },
                  { icon: LineChart, label: "Vitals History" },
                  { icon: Pill, label: "Medications" },
                  { icon: ClipboardList, label: "Care Notes" },
                  { icon: Calendar, label: "Appointments" },
                  { icon: Stethoscope, label: "Care Team" },
                ].map((item, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className={`w-full justify-start text-base text-white/80 hover:bg-white/10 hover:text-white transition-all duration-700 ease-out hover:scale-[1.02] h-11 ${
                      item.active ? "bg-white/20 text-white border border-white/30" : ""
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </Button>
                ))}
              </nav>
            </div>

            <div>
              <h4 className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-3">Conditions</h4>
              <div className="flex flex-wrap gap-2">
                {patient.conditions.map((condition) => (
                  <Badge key={condition} className="bg-white/10 text-white/90 border-white/20 text-xs">
                    {condition}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-3">Check-in Code</h4>
              <div className="bg-white/5 border border-white/20 rounded-xl p-4 text-center">
                <p className="text-3xl font-mono font-bold tracking-[0.3em] text-white">
                  {patient.checkinCode}
                </p>
                <p className="text-white/60 text-xs mt-2">
                  {patient.name.split(" ")[0]} enters this at /checkin to answer daily questions
                </p>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 pt-4 mt-6 border-t border-white/10">
            <Link href="/globe">
              <Button
                variant="ghost"
                className="w-full justify-start text-base text-white/80 hover:bg-white/10 hover:text-white transition-all duration-700 ease-out hover:scale-[1.02] h-11"
              >
                <ArrowLeft className="mr-3 h-5 w-5" />
                Back to Globe
              </Button>
            </Link>
          </div>
        </Card>

        {/* Main Content */}
        <div className="col-span-8 space-y-6 h-screen overflow-y-auto pb-12">
          {/* Header */}
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white">{patient.name}</h2>
                <p className="text-white/60">Live patient overview • updated moments ago</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button size="icon" variant="ghost" className="text-white/80 hover:bg-white/10 hover:text-white">
                  <Bell className="h-5 w-5" />
                </Button>
                <Button className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white transition-all duration-700 ease-out hover:scale-[1.02]">
                  <Phone className="mr-2 h-4 w-4" />
                  Contact Care Team
                </Button>
              </div>
            </div>
          </Card>

          {/* Vitals Cards */}
          <div className="grid grid-cols-4 gap-6">
            {vitalsCards.map((stat, index) => (
              <Card
                key={index}
                className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 transition-all duration-700 ease-out hover:scale-[1.02] hover:bg-white/15"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-white/60 text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className={`text-sm ${stat.color}`}>{stat.note}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 shrink-0 ${stat.color}`} />
                </div>
              </Card>
            ))}
          </div>

          {/* Readings + Risk & Recovery */}
          <div className="grid grid-cols-2 gap-6">
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Recent Readings 📈</h3>
                <Badge className="bg-white/10 text-white/80 border-white/20 text-xs">every 2h</Badge>
              </div>

              <div className="space-y-4">
                {patient.readings.map((reading, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="w-16">
                      <p className="font-semibold text-white text-sm">{reading.time}</p>
                    </div>
                    <div className="flex items-center gap-5 text-right">
                      <div>
                        <p className="text-xs text-white/50">HR</p>
                        <p className="text-sm font-bold text-white tabular-nums">{reading.heartRate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/50">BP</p>
                        <p className="text-sm font-bold text-white tabular-nums">{reading.bloodPressure}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/50">SpO2</p>
                        <p className="text-sm font-bold text-white tabular-nums">{reading.spo2}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/50">Temp</p>
                        <p className="text-sm font-bold text-white tabular-nums">{reading.temp}°</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Risk & Recovery 🎯</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 text-sm">Risk Score</span>
                    <span className="text-white font-semibold">{patient.riskScore}/100</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full bg-gradient-to-r ${
                        patient.riskScore >= 60
                          ? "from-orange-400 to-red-500"
                          : patient.riskScore >= 35
                            ? "from-yellow-400 to-orange-500"
                            : "from-green-400 to-blue-500"
                      }`}
                      style={{ width: `${patient.riskScore}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span
                      className={
                        patient.riskScore >= 60 ? "text-red-400" : patient.riskScore >= 35 ? "text-amber-400" : "text-green-400"
                      }
                    >
                      {statusLabel[patient.status]} tier
                    </span>
                    <span className="text-white/60">vs personal baseline</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-white font-medium">Daily Goals</h4>
                  <div className="space-y-2">
                    {recoveryBars.map((bar, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/80">{bar.name}</span>
                          <span className="text-white">{bar.progress}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div
                            className={`bg-gradient-to-r ${bar.color} h-2 rounded-full`}
                            style={{ width: `${bar.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-white">{patient.daysSinceIncident}</p>
                  <p className="text-white/60 text-sm">Days since last incident</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Care plan banner */}
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8">
            <div className="flex items-center justify-between gap-8">
              <div className="flex items-center space-x-6 min-w-0">
                <div className="flex items-center justify-center w-16 h-16 bg-white/20 border border-white/30 rounded-2xl shrink-0">
                  <Pill className="h-8 w-8 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-2xl font-bold text-white mb-2">Current Care Plan</h3>
                  <p className="text-white/80 text-lg mb-3">
                    {patient.medications.length} active medication{patient.medications.length === 1 ? "" : "s"},
                    reviewed by {patient.careTeam[0].name}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
                    {patient.medications.map((med) => (
                      <div key={med.name} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                        <span>
                          {med.name} {med.dose} • {med.schedule}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right space-y-4 shrink-0">
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <p className="text-white/60 text-sm">Next appointment</p>
                  <p className="text-xl font-bold text-white">{patient.nextAppointment}</p>
                  <p className="text-sm font-medium text-amber-300">{patient.careTeam[0].name}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Sidebar */}
        <Card className="col-span-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 pb-6 h-fit">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions ⚡</h3>
              <div className="space-y-2">
                {[
                  { icon: Phone, label: "Call Patient" },
                  { icon: Mail, label: "Message Caregiver" },
                  { icon: Calendar, label: "Schedule Visit" },
                  { icon: Plus, label: "Add Care Note" },
                ].map((action, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-white/80 hover:bg-white/10 hover:text-white transition-all duration-700 ease-out hover:scale-[1.02]"
                  >
                    <action.icon className="mr-3 h-4 w-4" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Active Alerts 🚨</h3>
              <div className="space-y-3">
                {patient.alerts.length === 0 ? (
                  <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                    <ShieldCheck className="h-4 w-4 text-green-400 shrink-0" />
                    <p className="text-sm text-white/80">No active alerts</p>
                  </div>
                ) : (
                  patient.alerts.map((alert, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-3 bg-red-500/10 border border-red-400/20 rounded-xl"
                    >
                      <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-white/90">{alert}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity 📋</h3>
              <div className="space-y-3">
                {patient.activity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${activityDotClass[activity.type]}`} />
                    <div className="flex-1">
                      <p className="text-sm text-white">{activity.action}</p>
                      <p className="text-xs text-white/60">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Care Team 🩺</h3>
              <div className="space-y-3">
                {patient.careTeam.map((member, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-white/20 text-white text-xs">{member.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-white">{member.name}</p>
                        <p className="text-xs text-white/60">{member.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default PatientDashboard
