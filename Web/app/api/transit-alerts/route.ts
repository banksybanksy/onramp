import { NextResponse } from "next/server";

import { TransitAlertsService } from "@/services/transit-alerts-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const service = new TransitAlertsService();
  return NextResponse.json(await service.getTransitAlerts());
}
