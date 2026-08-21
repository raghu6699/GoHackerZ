import Link from "next/link";
import { Logo } from "./Logo";

const cols = [
  {
    heading: "READ",
    links: [
      { label: "Latest", href: "/" },
      { label: "Deep Dives", href: "/topic/systems" },
      { label: "Topics", href: "/#topics" },
    ],
  },
  {
    heading: "WRITE",
    links: [
      { label: "Editor", href: "/write" },
      { label: "Guidelines", href: "/write" },
      { label: "Sign up", href: "/signup" },
    ],
  },
  {
    heading: "ABOUT",
    links: [
      { label: "Manifesto", href: "/" },
      { label: "RSS", href: "/" },
      { label: "Contact", href: "/" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 pb-8">
      <div className="wrap">
        <div className="bg-brand-dark text-white border-2 border-ink shadow-pop-lg rounded-3xl p-8 sm:p-11">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-8 mb-9">
            <div>
              <Logo light className="mb-3" />
              <p className="text-[#D4CEF5] text-[15px] leading-relaxed max-w-[260px]">
                Writing worth your attention — from the engineers who actually
                ship.
              </p>
            </div>
            {cols.map((c) => (
              <div key={c.heading}>
                <h6 className="font-mono text-[12px] text-lime font-bold mb-3.5">
                  {c.heading}
                </h6>
                {c.links.map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="block text-[#E5E0FF] text-[15px] py-[5px] hover:text-white hover:underline transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row justify-between gap-2 pt-6 border-t-2 border-[#392E6B] font-mono text-[12px] text-[#A69ECB]">
            <span>© 2026 gohackerz.com — made with ♥ by ud.ai</span>
            <span>Privacy · Terms · RSS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
