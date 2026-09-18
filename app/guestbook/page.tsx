import { StickyWall } from "@/components/StickyWall";
import { SectionHead } from "@/components/SectionHead";

export const metadata = {
  title: "Guestbook Wall · GoHackerz",
  description: "Sticky notes visitors leave on the GoHackerz wall.",
};

export default function GuestbookPage() {
  return (
    <div className="wrap py-10">
      <SectionHead title="Community Guestbook Wall" note="// leave your mark" />
      <div className="card p-8 sm:p-12 text-center my-6">
        <div className="text-[56px] mb-4">📌</div>
        <h1 className="text-3xl font-bold tracking-tight mb-3">The GoHackerz Corkboard</h1>
        <p className="text-muted text-lg max-w-xl mx-auto mb-8">
          Drag a colored chip onto the wall, type your message, and stick your note up for all visitors to see.
        </p>
        <div className="flex justify-center">
          <StickyWall variant="inline" />
        </div>
      </div>
    </div>
  );
}
