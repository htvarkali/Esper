import { notFound } from "next/navigation";
import PatientDashboard from "@/components/patient-dashboard";
import AuthGuard from "@/components/auth-guard";
import { getPatient, patients } from "@/app/data/patients";

export function generateStaticParams() {
  return patients.map((patient) => ({ id: patient.id }));
}

export default async function PatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = getPatient(id);
  if (!patient) notFound();
  return (
    <AuthGuard>
      <PatientDashboard patient={patient} />
    </AuthGuard>
  );
}
