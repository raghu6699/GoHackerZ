import { NextResponse } from "next/server";
import {
  getPersistedTeamByCode,
  addMemberToTeam,
  createNewTeam,
  leaveCurrentTeam,
  getPersistedParticipantByTicket,
} from "@/lib/participant-store";
import { getHackathonBySlug } from "@/lib/hackathons";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ error: "Team code parameter required" }, { status: 400 });
    }

    const team = getPersistedTeamByCode(code);
    if (!team) {
      return NextResponse.json({ error: `Team "${code}" not found` }, { status: 404 });
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

    if (action === "join") {
      if (!teamCode) {
        return NextResponse.json({ error: "Team code is required to join a squad" }, { status: 400 });
      }
      const result = addMemberToTeam({
        teamCode,
        participantTicket: ticketNumber,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      const updatedParticipant = getPersistedParticipantByTicket(ticketNumber);
      return NextResponse.json({
        success: true,
        team: result.team,
        participant: updatedParticipant,
        message: `Successfully joined ${result.team?.name}!`,
      });
    }

    if (action === "create") {
      if (!teamName?.trim()) {
        return NextResponse.json({ error: "Team name is required" }, { status: 400 });
      }
      const result = createNewTeam({
        teamName,
        creatorTicket: ticketNumber,
        hackathonId: hackathon?.id,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      const updatedParticipant = getPersistedParticipantByTicket(ticketNumber);
      return NextResponse.json({
        success: true,
        team: result.team,
        participant: updatedParticipant,
        message: `Successfully created team "${result.team?.name}" with invite code ${result.team?.inviteCode}!`,
      });
    }

    if (action === "leave") {
      const result = leaveCurrentTeam(ticketNumber);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      const updatedParticipant = getPersistedParticipantByTicket(ticketNumber);
      return NextResponse.json({
        success: true,
        participant: updatedParticipant,
        message: "You have left the squad and are now hacking Solo.",
      });
    }

    return NextResponse.json({ error: `Unknown action "${action}"` }, { status: 400 });
  } catch (err) {
    console.error("POST team error:", err);
    return NextResponse.json({ error: "Failed to process team action" }, { status: 500 });
  }
}
