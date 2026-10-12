import { OnrampApp } from "@/components/onramp-app";
import { IncidentRepository } from "@/services/incident-repository";

export const dynamic = "force-dynamic";

export default async function Page() {
  const repository = new IncidentRepository();
  const initialData = await repository.getSnapshot();

  return <OnrampApp initialData={initialData} />;
}
