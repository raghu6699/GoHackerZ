import { NextResponse } from "next/server";
import { updateHackathonStatus, isDbAvailable } from "@/lib/participant-store";
import { getHackathonBySlug } from "@/lib/hackathons";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const hackathon = await getHackathonBySlug(slug);
    if (!hackathon) {
      return NextResponse.json(
        { success: false, error: "Hackathon not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      status: hackathon.status,
      hackathon: {
        id: hackathon.id,
        slug: hackathon.slug,
        title: hackathon.title,
        status: hackathon.status,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch status" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const body = await request.json();
    const { status, adminSecret } = body;

    const validStatuses = ["UPCOMING", "ACTIVE", "JUDGING", "COMPLETED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    const result = await updateHackathonStatus(slug, status);

    return NextResponse.json({
      success: true,
      status: result.status,
      autoIssuedCount: result.autoIssuedCount,
      message:
        status === "COMPLETED"
          ? `Hackathon finalized! ${result.autoIssuedCount || 0} participation certificates automatically generated.`
          : `Hackathon status updated to ${status}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update status" },
      { status: 500 }
    );
  }
}
