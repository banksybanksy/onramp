import { NextResponse } from "next/server";

import { TrafficIncidentsService } from "@/services/traffic-incidents-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const service = new TrafficIncidentsService();
  return NextResponse.json(await service.getTrafficIncidents());
}
