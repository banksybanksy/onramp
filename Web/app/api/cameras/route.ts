import { NextResponse } from "next/server";

import { CameraService } from "@/services/camera-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const service = new CameraService();
  return NextResponse.json(await service.getCameras());
}
