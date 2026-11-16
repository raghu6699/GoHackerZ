import { getCurrentDbUser } from "@/lib/profile";
import { isUserAdmin } from "@/lib/admin-auth";
import { getParticipantByTicket, type HackathonParticipant } from "@/lib/hackathons";

export type TicketAuth =
  | { ok: true; participant: HackathonParticipant; isOwner: boolean }
  | { ok: false; status: 401 | 403 | 404; error: string };

/**
 * A ticket number alone is NOT a credential (it is shown on public pages).
 * Mutations must come from the signed-in user whose email owns the ticket
 * (or a platform admin).
 */
export async function requireTicketOwner(ticketNumber: string): Promise<TicketAuth> {
  const user = await getCurrentDbUser();
  if (!user?.email) {
    return { ok: false, status: 401, error: "Please sign in to continue." };
  }
  const participant = await getParticipantByTicket(ticketNumber);
  if (!participant) {
    return { ok: false, status: 404, error: `Ticket #${ticketNumber} not found.` };
  }
  const isOwner =
    (participant.email ?? "").trim().toLowerCase() === user.email.trim().toLowerCase();
  if (!isOwner && !isUserAdmin(user)) {
    return { ok: false, status: 403, error: "This ticket belongs to another account." };
  }
  return { ok: true, participant, isOwner };
}

/** Remove contact details before a participant record is shown publicly. */
export function publicParticipant<T extends { email?: string }>(p: T): Omit<T, "email"> {
  const { email: _email, ...rest } = p;
  return rest;
}
