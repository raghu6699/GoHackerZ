import Link from "next/link";
import { Logo } from "./Logo";

const cols = [
  {
    heading: "READ",
    links: [
      { label: "Latest", href: "/read" },
      { label: "Deep Dives", href: "/deep-dives" },
      { label: "Topics", href: "/topics" },
    ],
  },
  {
    heading: "WRITE",
    links: [
      { label: "Editor", href: "/write" },
      { label: "Guidelines", href: "/guidelines" },
      { label: "Sign up", href: "/signup" },
    ],
  },
  {
    heading: "ABOUT",
    links: [
      { label: "Manifesto", href: "/manifesto" },
      { label: "RSS", href: "/rss.xml" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-8 sm:mt-16 pb-6 sm:pb-8">
      <div className="wrap">
        <div className="bg-brand-dark text-white border-2 border-ink shadow-pop-lg rounded-2xl sm:rounded-3xl p-5 sm:p-10">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-6 sm:gap-8 mb-6 sm:mb-9">
            <div className="col-span-2 sm:col-span-1">
              <Logo light className="mb-2" />
              <p className="text-[#D4CEF5] text-[13px] sm:text-[15px] leading-relaxed max-w-[260px]">
                Engineering essays and teardowns from the builders who ship.
              </p>
            </div>
            {cols.map((c) => (
              <div key={c.heading}>
                <h6 className="font-mono text-[11px] sm:text-[12px] text-lime font-bold mb-2 sm:mb-3.5">
                  {c.heading}
                </h6>
                {c.links.map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="block text-[#E5E0FF] text-[13px] sm:text-[15px] py-1 hover:text-white hover:underline transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row justify-between gap-2 pt-4 sm:pt-6 border-t border-[#392E6B] font-mono text-[11px] sm:text-[12px] text-[#A69ECB]">
            <span>© 2026 gohackerz.com</span>
            <span>Privacy · Terms · RSS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
