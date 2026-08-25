import { NewPatientForm } from "@/components/new-patient-form";

export default function NuevaPacientePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nueva paciente</h1>
      <NewPatientForm />
    </div>
  );
}
