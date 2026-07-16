import { NextResponse } from "next/server";

import { CommuteRouteService } from "@/services/commute-route-service";
import type { Coordinate } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    origin: Coordinate;
    destination: Coordinate;
  };

  const service = new CommuteRouteService();
  return NextResponse.json(await service.getRoute(body.origin, body.destination));
}
