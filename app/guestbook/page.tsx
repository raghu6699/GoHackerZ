import { StickyWall } from "@/components/StickyWall";
import { SectionHead } from "@/components/SectionHead";

export const metadata = {
  title: "Guestbook Wall · GoHackerz",
  description: "Sticky notes visitors leave on the GoHackerz wall.",
};

export default function GuestbookPage() {
  return (
    <div className="wrap py-8 sm:py-12">
      <SectionHead title="Community Guestbook Wall" note="// leave your mark" />
      <div className="mb-6">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-2">
          The GoHackerz Corkboard 📌
        </h1>
        <p className="text-muted text-base sm:text-lg max-w-2xl">
          Pick a colored sticky note, type your message, and pin it to the board for all builders to see.
        </p>
      </div>

      <StickyWall mode="embedded" />
    </div>
  );
}
