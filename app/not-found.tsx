import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap max-w-[560px] py-24 text-center">
      <div className="text-[96px] font-bold text-purple leading-none mb-2">
        404
      </div>
      <div className="text-[56px] mb-4">🛸</div>
      <h1 className="text-[32px] font-bold mb-3">
        This page shipped to /dev/null.
      </h1>
      <p className="text-[17px] text-muted mb-8">
        The thing you&apos;re looking for moved, or never existed. Happens to
        the best of us.
      </p>
      <div className="flex gap-3 justify-center">
        <Link href="/" className="btn btn-purple">
          Back to the feed
        </Link>
        <Link href="/write" className="btn">
          Write something ✎
        </Link>
      </div>
    </div>
  );
}
