import { NextResponse } from "next/server";

import { GeocodingService } from "@/services/geocoding-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const service = new GeocodingService();
  return NextResponse.json({
    results: await service.search(query)
  });
}
