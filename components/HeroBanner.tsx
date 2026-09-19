import Link from "next/link";

export function HeroBanner() {
  return (
    <header className="wrap relative my-4 sm:my-6 px-0">
      <div className="relative overflow-hidden bg-[#EEF2FC] dark:bg-[#14102B] border-2 border-ink rounded-3xl p-6 sm:p-8 lg:p-14 shadow-pop-lg flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-10">
        {/* Background Decorative Mesh Orbs */}
        <span className="absolute -top-20 -left-20 w-[300px] h-[300px] bg-purple/10 rounded-full blur-3xl pointer-events-none" />
        <span className="absolute -bottom-20 -right-20 w-[300px] h-[300px] bg-lime/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[620px] relative z-10">
          <span className="inline-flex items-center gap-2 bg-white dark:bg-card border-2 border-ink rounded-full px-4 py-2 text-[13.5px] font-bold shadow-pop mb-6">
            <span className="badge-pulse text-[15px]">👋</span>
            <span className="text-[#1A1440] dark:text-ink font-semibold">New here? </span>
            <Link href="/signup" className="text-[#5850EC] dark:text-[#997BFF] font-bold hover:underline">
              Join 190k builders →
            </Link>
          </span>
          <h1 className="text-[clamp(40px,6.2vw,84px)] leading-[0.96] tracking-tight font-extrabold mb-6 text-ink">
            Where builders <span className="text-[#5850EC] dark:text-[#997BFF]">actually</span> write.
          </h1>
          <p className="text-[19px] sm:text-[22px] leading-relaxed max-w-[540px] font-medium text-muted mb-8">
            Honest engineering essays, teardowns and post-mortems.{" "}
            <span className="bg-[#C6FF3D] text-[#1A1440] font-bold px-1.5 py-0.5 rounded border border-ink/20">
              No sludge, no listicles
            </span>{" "}
            — just the real stuff you&apos;ll want to save.
          </p>
          <div className="flex gap-4 items-center flex-wrap">
            <Link
              href="/signup"
              className="bg-[#5850EC] hover:bg-[#4B44D4] text-white border-2 border-ink rounded-2xl font-bold px-7 py-3.5 shadow-pop hover:-translate-y-[2px] transition-all text-[16px] inline-flex items-center justify-center gap-2"
            >
              Start reading — free
            </Link>
            <Link
              href="/write"
              className="bg-[#C6FF3D] hover:bg-[#B5F524] text-[#1A1440] border-2 border-ink rounded-2xl font-bold px-7 py-3.5 shadow-pop hover:-translate-y-[2px] transition-all text-[16px] inline-flex items-center justify-center gap-2"
            >
              Write a post ✦
            </Link>
          </div>
        </div>

        {/* ── Hero Floating Sticker Pills (Laptop & Desktop View) ── */}
        <div className="hidden md:block relative w-[360px] lg:w-[420px] h-[360px] shrink-0 select-none z-10">
          {/* Sticker 1: Pink */}
          <div
            className="hero-sticker float-anim-1 absolute top-1 right-2 lg:right-6 bg-[#FF85C0] text-[#1A1440] rotate-[6deg]"
            style={{ "--rot": "6deg" } as React.CSSProperties}
          >
            p99 ↓ 40x 🚀
          </div>
          {/* Sticker 2: Orange */}
          <div
            className="hero-sticker float-anim-2 absolute top-16 left-1 lg:left-4 bg-[#FFAB76] text-[#1A1440] rotate-[-4deg]"
            style={{ "--rot": "-4deg" } as React.CSSProperties}
          >
            no clickbait 🚫
          </div>
          {/* Sticker 3: Sky Blue */}
          <div
            className="hero-sticker float-anim-3 absolute top-32 right-0 lg:right-2 bg-[#70C5FF] text-[#1A1440] rotate-[3deg]"
            style={{ "--rot": "3deg" } as React.CSSProperties}
          >
            real engineers
          </div>
          {/* Sticker 4: Lime Green */}
          <div
            className="hero-sticker float-anim-1 absolute top-48 left-0 lg:left-2 bg-[#C6FF3D] text-[#1A1440] rotate-[-3deg]"
            style={{ "--rot": "-3deg" } as React.CSSProperties}
          >
            evals &gt; vibes 📊
          </div>
          {/* Sticker 5: Cyan/Teal */}
          <div
            className="hero-sticker float-anim-2 absolute top-60 right-4 lg:right-8 bg-[#6FE8FF] text-[#1A1440] rotate-[5deg]"
            style={{ "--rot": "5deg" } as React.CSSProperties}
          >
            ✦ Rust
          </div>
          {/* Sticker 6: Peach/Yellow */}
          <div
            className="hero-sticker float-anim-3 absolute bottom-2 left-2 lg:left-6 bg-[#FFD670] text-[#1A1440] rotate-[-3deg]"
            style={{ "--rot": "-3deg" } as React.CSSProperties}
          >
            no paywall 🎉
          </div>
        </div>
      </div>
    </header>
  );
}
