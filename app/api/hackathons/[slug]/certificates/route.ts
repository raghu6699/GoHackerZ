import { NextResponse } from "next/server";
import { getCertificatesForHackathon } from "@/lib/participant-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const certs = await getCertificatesForHackathon(slug);
    return NextResponse.json({
      success: true,
      certificates: certs,
      total: certs.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch certificates" },
      { status: 500 }
    );
  }
}
