import { NextResponse } from "next/server";

import { IncidentRepository } from "@/services/incident-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const repository = new IncidentRepository();
  const snapshot = await repository.getSnapshot();
  return NextResponse.json(snapshot);
}
