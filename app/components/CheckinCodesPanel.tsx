import Link from "next/link";
import { patients, statusColor } from "../data/patients";

export default function CheckinCodesPanel() {
  return (
    <div className="bg-gray-alpha-100 backdrop-blur-md border border-gray-alpha-200 rounded-md p-4 md:p-6 space-y-4">
      <div className="space-y-1">
        <h2 className="my-0 font-mono font-medium text-sm tracking-tight uppercase text-gray-1000">
          Patient check-in codes
        </h2>
        <p className="text-sm text-gray-900">
          Give a patient their code, they enter it at <span className="text-gray-1000">/checkin</span> to
          answer their daily questions on the senior-friendly screen.
        </p>
      </div>
      <ul className="list-none pl-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
        {patients.map((patient) => (
          <li key={patient.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: statusColor[patient.status] }}
              />
              <Link
                href={`/patient/${patient.id}`}
                className="truncate text-gray-1000 hover:underline underline-offset-2"
              >
                {patient.name}
              </Link>
            </span>
            <span className="font-mono tabular-nums tracking-[0.2em] text-gray-1000 bg-gray-alpha-200 rounded px-2 py-0.5">
              {patient.checkinCode}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
