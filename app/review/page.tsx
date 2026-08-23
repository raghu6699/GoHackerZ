import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/profile";
import { getReviewQueue } from "@/lib/queries";
import { ReviewActions } from "@/components/ReviewActions";

export const metadata: Metadata = { title: "Review queue — GoHackerz" };

export default async function ReviewPage() {
  const user = await getCurrentDbUser();
  if (!user) redirect("/signin");
  if (user.role !== "EDITOR" && user.role !== "ADMIN") {
    return (
      <div className="wrap max-w-[560px] py-24 text-center">
        <div className="text-[56px] mb-4">🔒</div>
        <h1 className="text-[28px] font-bold mb-3">Editors only</h1>
        <p className="text-muted mb-6">
          The review queue is reserved for the editorial team.
        </p>
        <Link href="/" className="btn btn-purple">
          Back to feed
        </Link>
      </div>
    );
  }

  const queue = await getReviewQueue();

  return (
    <div className="wrap max-w-[760px] py-12">
      <span className="chip bg-sky mb-3 inline-block">🔍 editorial</span>
      <h1 className="text-[34px] font-bold mb-6">Review queue</h1>

      {queue.length === 0 ? (
        <div className="card p-10 text-center font-semibold">
          All clear — nothing awaiting review. ✦
        </div>
      ) : (
        <div className="space-y-5">
          {queue.map((a) => (
            <div key={a.slug} className="card p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <b className="text-[18px]">{a.title}</b>
                  <p className="text-[14px] text-muted mt-1">{a.dek}</p>
                  <div className="font-mono text-[11px] text-subtle mt-1">
                    by @{a.authorUsername} · {a.readingTime} min read
                  </div>
                </div>
                <ReviewActions slug={a.slug} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}