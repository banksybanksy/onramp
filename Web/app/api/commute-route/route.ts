import { NextResponse } from "next/server";

import { CommuteRouteService } from "@/services/commute-route-service";
import type { Coordinate } from "@/types";

export const dynamic = "force-dynamic";

function isCoordinate(value: unknown): value is Coordinate {
  const candidate = value as Partial<Coordinate> | null;
  return (
    !!candidate &&
    Number.isFinite(candidate.lat) &&
    Number.isFinite(candidate.lng)
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    origin?: unknown;
    destination?: unknown;
  } | null;

  if (!isCoordinate(body?.origin) || !isCoordinate(body?.destination)) {
    return NextResponse.json(
      { error: "Body must include origin and destination as { lat, lng }" },
      { status: 400 }
    );
  }

  const service = new CommuteRouteService();
  return NextResponse.json(await service.getRoute(body.origin, body.destination));
}
