"use client";

import { useEffect, useState } from "react";

export type HostedEvent = { slug: string; title: string };

/** Events the signed-in user organizes (matched on the host-proposal email). */
export function useHostedEvents(email?: string | null): HostedEvent[] {
  const [events, setEvents] = useState<HostedEvent[]>([]);

  useEffect(() => {
    if (!email) {
      setEvents([]);
      return;
    }
    let cancelled = false;
    fetch("/api/hackathons/my-hosted", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && Array.isArray(d?.events)) setEvents(d.events);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [email]);

  return events;
}
