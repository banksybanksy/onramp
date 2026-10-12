import { NextResponse } from "next/server";

import { GeocodingService } from "@/services/geocoding-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Place names are short; anything longer is not a real query.
  const query = (searchParams.get("q") ?? "").slice(0, 120);
  const service = new GeocodingService();
  return NextResponse.json({
    results: await service.search(query)
  });
}
