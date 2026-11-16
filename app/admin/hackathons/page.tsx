import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma, isDbAvailable } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/profile";
import { isUserAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata = { title: "All Hackathons — Admin | RepoRally" };

/** Platform-admin overview: every hackathon, and every registrant across all of them. */
export default async function AllHackathonsAdminPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/signin?next=/admin/hackathons");
  if (!isUserAdmin(user)) {
    return (
      <div className="wrap py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Admins only</h1>
        <p className="text-muted">This page is restricted to platform administrators.</p>
      </div>
    );
  }

  const hackathons = isDbAvailable()
    ? await prisma.hackathon.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          _count: { select: { participants: true, teams: true, submissions: true } },
        },
      })
    : [];

  const participants = isDbAvailable()
    ? await prisma.hackathonParticipant.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          ticketNumber: true,
          name: true,
          email: true,
          createdAt: true,
          hackathon: { select: { slug: true, title: true } },
          team: { select: { name: true } },
          submissions: { select: { title: true }, take: 1, orderBy: { createdAt: "desc" } },
        },
      })
    : [];

  return (
    <div className="wrap py-10 space-y-10">
      <header>
        <h1 className="text-3xl font-black tracking-tight">All hackathons</h1>
        <p className="text-muted text-sm">
          {hackathons.length} hackathons · {participants.length} registrations across all of them
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {hackathons.map((h) => (
          <Link key={h.id} href={`/hackathons/${h.slug}/admin`} className="card card-hover p-5 block">
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold text-lg">{h.title}</span>
              <span className="chip">{h.status}</span>
            </div>
            <div className="font-mono text-xs text-subtle mt-2">
              {h._count.participants} registered · {h._count.teams} squads · {h._count.submissions} projects
            </div>
            <div className="font-mono text-xs text-purple mt-3">Open studio →</div>
          </Link>
        ))}
        {hackathons.length === 0 && <p className="text-muted">No hackathons in the database.</p>}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">Every registration</h2>
        <div className="overflow-x-auto card">
          <table className="w-full text-left text-sm">
            <thead className="font-mono text-[11px] text-subtle uppercase">
              <tr>
                <th className="p-3">Builder</th>
                <th className="p-3">Hackathon</th>
                <th className="p-3">Ticket</th>
                <th className="p-3">Squad</th>
                <th className="p-3">Project</th>
                <th className="p-3">Registered</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.ticketNumber} className="border-t border-[#e2dff2]">
                  <td className="p-3">
                    <div className="font-semibold">{p.name}</div>
                    <div className="font-mono text-xs text-subtle">{p.email}</div>
                  </td>
                  <td className="p-3">
                    <Link className="text-purple hover:underline" href={`/hackathons/${p.hackathon.slug}/admin`}>
                      {p.hackathon.title}
                    </Link>
                  </td>
                  <td className="p-3 font-mono text-xs">{p.ticketNumber}</td>
                  <td className="p-3">{p.team?.name ?? "Solo"}</td>
                  <td className="p-3">{p.submissions[0]?.title ?? "—"}</td>
                  <td className="p-3 font-mono text-xs">{p.createdAt.toISOString().slice(0, 10)}</td>
                </tr>
              ))}
              {participants.length === 0 && (
                <tr>
                  <td className="p-3 text-muted" colSpan={6}>
                    No registrations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
