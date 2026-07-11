"use client";

import { useState } from "react";
import Link from "next/link";
import { getPatientByCode, type Patient } from "../data/patients";

interface Question {
  key: string;
  text: string;
  options: { label: string; emoji: string }[];
}

const QUESTIONS: Question[] = [
  {
    key: "mood",
    text: "How are you feeling today?",
    options: [
      { label: "Great", emoji: "😄" },
      { label: "Okay", emoji: "🙂" },
      { label: "Not great", emoji: "😞" },
    ],
  },
  {
    key: "medications",
    text: "Did you take your medications today?",
    options: [
      { label: "Yes", emoji: "✅" },
      { label: "Not yet", emoji: "🕐" },
    ],
  },
  {
    key: "sleep",
    text: "How did you sleep last night?",
    options: [
      { label: "Well", emoji: "😴" },
      { label: "Okay", emoji: "🙂" },
      { label: "Poorly", emoji: "😫" },
    ],
  },
  {
    key: "meals",
    text: "Have you eaten today?",
    options: [
      { label: "Yes", emoji: "🍽️" },
      { label: "Not yet", emoji: "🕐" },
    ],
  },
  {
    key: "pain",
    text: "Are you in any pain right now?",
    options: [
      { label: "No pain", emoji: "😌" },
      { label: "A little", emoji: "😕" },
      { label: "A lot", emoji: "😖" },
    ],
  },
];

type Step = "code" | number | "note" | "done";

export default function CheckinPage() {
  const [step, setStep] = useState<Step>("code");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");

  const firstName = patient?.name.split(" ")[0] ?? "";

  const submitCode = (event: React.FormEvent) => {
    event.preventDefault();
    const match = getPatientByCode(code);
    if (!match) {
      setCodeError("That code was not found. Please check it and try again.");
      return;
    }
    setCodeError(null);
    setPatient(match);
    setStep(0);
  };

  const answer = (question: Question, label: string) => {
    setAnswers((prev) => ({ ...prev, [question.key]: label }));
    const index = step as number;
    setStep(index + 1 < QUESTIONS.length ? index + 1 : "note");
  };

  const finish = (finalNote: string) => {
    if (patient) {
      try {
        const key = "esper-checkins";
        const existing = JSON.parse(localStorage.getItem(key) ?? "[]");
        existing.push({
          patientId: patient.id,
          name: patient.name,
          code: patient.checkinCode,
          at: new Date().toISOString(),
          answers: { ...answers, note: finalNote },
        });
        localStorage.setItem(key, JSON.stringify(existing));
      } catch {
        // storage unavailable, the on-screen confirmation still stands
      }
    }
    setStep("done");
  };

  return (
    <main className="min-h-screen bg-[#faf6ef] text-[#241f1a] font-sans flex flex-col">
      <header className="px-6 pt-8 pb-4 max-w-2xl w-full mx-auto flex items-center justify-between">
        <span className="font-mono uppercase tracking-widest text-lg text-[#8a7f72]">Esper</span>
        {typeof step === "number" && (
          <span className="text-xl text-[#8a7f72]">
            Question {step + 1} of {QUESTIONS.length}
          </span>
        )}
      </header>

      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-2xl">
          {step === "code" && (
            <form onSubmit={submitCode} className="space-y-8 text-center">
              <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl font-bold leading-tight">Hello! 👋</h1>
                <p className="text-2xl text-[#5c5347] leading-relaxed">
                  Please type your 4-character code.
                  <br />
                  Your care team gave it to you.
                </p>
              </div>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 4))}
                autoFocus
                inputMode="text"
                autoComplete="off"
                aria-label="Your 4-character check-in code"
                className="w-64 text-center text-6xl font-mono tracking-[0.35em] uppercase bg-white border-4 border-[#d8cbb8] focus:border-[#2f6f4f] rounded-2xl py-5 outline-none"
                placeholder="····"
              />
              {codeError && <p className="text-2xl text-[#b3372c]">{codeError}</p>}
              <div>
                <button
                  type="submit"
                  disabled={code.length !== 4}
                  className="text-3xl font-bold bg-[#2f6f4f] text-white rounded-2xl px-16 py-6 cursor-pointer hover:bg-[#25573e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Start
                </button>
              </div>
              <Link href="/" className="inline-block text-xl text-[#8a7f72] underline underline-offset-4">
                Go back
              </Link>
            </form>
          )}

          {typeof step === "number" && patient && (
            <div className="space-y-10 text-center">
              {step === 0 && (
                <p className="text-3xl text-[#5c5347]">
                  Good to see you, <span className="font-bold text-[#241f1a]">{firstName}</span>!
                </p>
              )}
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                {QUESTIONS[step].text}
              </h1>
              <div className="flex flex-col gap-4 max-w-md mx-auto">
                {QUESTIONS[step].options.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => answer(QUESTIONS[step as number], option.label)}
                    className="flex items-center justify-center gap-4 text-3xl font-semibold bg-white border-4 border-[#d8cbb8] hover:border-[#2f6f4f] hover:bg-[#f0faf4] rounded-2xl py-6 px-8 cursor-pointer transition-colors"
                  >
                    <span className="text-4xl">{option.emoji}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "note" && (
            <div className="space-y-8 text-center">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Anything you&apos;d like your care team to know?
              </h1>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder="Type here (optional)"
                className="w-full text-2xl bg-white border-4 border-[#d8cbb8] focus:border-[#2f6f4f] rounded-2xl p-6 outline-none resize-none"
              />
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => finish(note)}
                  className="text-3xl font-bold bg-[#2f6f4f] text-white rounded-2xl px-14 py-6 cursor-pointer hover:bg-[#25573e] transition-colors"
                >
                  Send ✓
                </button>
                <button
                  onClick={() => finish("")}
                  className="text-2xl font-semibold bg-white border-4 border-[#d8cbb8] rounded-2xl px-10 py-6 cursor-pointer hover:border-[#8a7f72] transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="space-y-8 text-center">
              <p className="text-8xl">✅</p>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Thank you, {firstName}!
              </h1>
              <p className="text-2xl text-[#5c5347] leading-relaxed">
                Your answers were sent to your care team.
                <br />
                Have a lovely day. 🌼
              </p>
              <Link
                href="/"
                className="inline-block text-2xl font-semibold bg-white border-4 border-[#d8cbb8] rounded-2xl px-10 py-5 hover:border-[#8a7f72] transition-colors"
              >
                Done
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
