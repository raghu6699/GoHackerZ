import type { HackathonData } from "@/lib/hackathons";

/** Minutes after the official deadline during which late submissions are still accepted. */
export const SUBMISSION_GRACE_MIN = 15;

export type SubmissionWindow = {
  open: boolean;
  reason: "open" | "not-started" | "closed";
  opensAt: string;
  closesAt: string;
};

/**
 * Whether project submissions are accepted right now.
 * - JUDGING / COMPLETED: closed.
 * - ACTIVE (organizer opened the build): open.
 * - UPCOMING: open only between the start time and the deadline (+ grace), so
 *   nobody can submit before the build day begins.
 */
export function getSubmissionWindow(
  h: Pick<HackathonData, "status" | "startDate" | "submissionDeadline" | "endDate">,
  now: number = Date.now()
): SubmissionWindow {
  const opensAt = h.startDate;
  const closesAt = h.submissionDeadline || h.endDate;
  if (h.status === "COMPLETED" || h.status === "JUDGING") return { open: false, reason: "closed", opensAt, closesAt };
  if (h.status === "ACTIVE") return { open: true, reason: "open", opensAt, closesAt };
  const start = new Date(opensAt).getTime();
  const end = new Date(closesAt).getTime() + SUBMISSION_GRACE_MIN * 60_000;
  if (Number.isFinite(start) && now < start) return { open: false, reason: "not-started", opensAt, closesAt };
  if (Number.isFinite(end) && now > end) return { open: false, reason: "closed", opensAt, closesAt };
  return { open: true, reason: "open", opensAt, closesAt };
}
