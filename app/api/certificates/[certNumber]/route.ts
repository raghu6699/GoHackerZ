import { NextResponse } from "next/server";
import { getCertificateByNumber, getCertificateByTicket } from "@/lib/participant-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ certNumber: string }> }
) {
  const { certNumber } = await params;
  try {
    let cert = await getCertificateByNumber(certNumber);
    if (!cert) {
      cert = await getCertificateByTicket(certNumber);
    }

    if (!cert) {
      return NextResponse.json(
        { success: false, error: "Certificate not found or not yet issued" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      certificate: cert,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve certificate" },
      { status: 500 }
    );
  }
}
