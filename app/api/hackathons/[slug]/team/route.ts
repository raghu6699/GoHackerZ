import { NextResponse } from "next/server";
import {
  getTeamByCode,
  getPersistedTeamByCode,
  addMemberToTeam,
  createNewTeam,
  leaveCurrentTeam,
  getPersistedParticipantByTicket,
  syncTeamParticipants,
} from "@/lib/participant-store";
import { getHackathonBySlug, getParticipantByTicket } from "@/lib/hackathons";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.trim().replace(/^#/, "").toUpperCase();

    if (!code) {
      return NextResponse.json({ error: "Team code parameter required" }, { status: 400 });
    }

    // DB-backed lookup — returns real-time membership from Postgres + memory/disk fallback
    const team = await getTeamByCode(code);
    if (!team) {
      return NextResponse.json({ error: `Team with invite code "${code}" was not found. Please check the code and try again.` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        name: team.name,
        inviteCode: team.inviteCode,
        captainId: team.captainId,
        membersCount: team.members.length,
        isFull: team.members.length >= 4,
        members: team.members.map((m) => ({
          name: m.name,
          roleTitle: m.roleTitle,
          avatarUrl: m.avatarUrl,
          isCaptain: m.isCaptain,
          ticketNumber: m.ticketNumber,
        })),
      },
    });
  } catch (err) {
    console.error("GET team error:", err);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const hackathon = await getHackathonBySlug(slug);
    const body = await req.json();
    const { action, ticketNumber, teamCode, teamName } = body;

    if (!ticketNumber) {
      return NextResponse.json({ error: "Ticket number is required" }, { status: 400 });
    }

    // Ensure participant exists — query DB so we always get fresh team membership
    const existing = await getParticipantByTicket(ticketNumber);
    if (!existing) {
      return NextResponse.json(
        { error: `Participant with ticket #${ticketNumber} not found.` },
        { status: 404 }
      );
    }

    if (action === "join") {
      const code = (teamCode || "").trim().replace(/^#/, "").toUpperCase();
      if (!code) {
        return NextResponse.json({ error: "Team code is required to join a squad" }, { status: 400 });
      }

      const result = await addMemberToTeam({
        teamCode: code,
        participantTicket: ticketNumber,
        hackathonId: hackathon?.id,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      // After join, fetch fresh participant state from DB
      const updatedParticipant = await getParticipantByTicket(ticketNumber);
      return NextResponse.json({
        success: true,
        team: result.team,
        participant: updatedParticipant || result.participant || existing,
        message: `Successfully joined ${result.team?.name}!`,
      });
    }

    if (action === "create") {
      if (!teamName?.trim()) {
        return NextResponse.json({ error: "Team name is required" }, { status: 400 });
      }
      const result = await createNewTeam({
        teamName,
        creatorTicket: ticketNumber,
        hackathonId: hackathon?.id,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      // After create, fetch fresh participant state from DB
      const updatedParticipant = await getParticipantByTicket(ticketNumber);
      return NextResponse.json({
        success: true,
        team: result.team,
        participant: updatedParticipant || existing,
        message: `Successfully created team "${result.team?.name}" with invite code ${result.team?.inviteCode}!`,
      });
    }

    if (action === "leave") {
      const result = await leaveCurrentTeam(ticketNumber);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      const updatedParticipant = await getParticipantByTicket(ticketNumber);
      return NextResponse.json({
        success: true,
        participant: updatedParticipant || { ...existing, teamId: undefined, teamName: undefined, teamCode: undefined, isCaptain: false },
        message: "You have left the squad and are now hacking Solo.",
      });
    }

    return NextResponse.json({ error: `Unknown action "${action}"` }, { status: 400 });
  } catch (err) {
    console.error("POST team error:", err);
    return NextResponse.json({ error: "Failed to process team action" }, { status: 500 });
  }
}
