import Link from "next/link";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { NavAuth } from "./NavAuth";
import { MobileMenu } from "./MobileMenu";

const links = [
  { href: "/read", label: "Feed" },
  { href: "/deep-dives", label: "Deep Dives" },
  { href: "/topics", label: "Topics" },
  { href: "/guestbook", label: "Guestbook" },
  { href: "/about", label: "About" },
  { href: "/search", label: "Search" },
];

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 py-3 md:py-4 bg-bg/95 backdrop-blur-md border-b border-ink/10">
      <div className="wrap flex items-center justify-between gap-3 md:gap-6">
        <Logo />
        <div className="hidden md:flex gap-1 ml-3">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-[15px] font-medium px-3.5 py-2 rounded-[10px] hover:bg-card hover:border-2 hover:border-ink hover:px-3 hover:py-[6px] hover:shadow-pop-sm transition-all"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2 md:gap-2.5">
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2.5">
            <NavAuth />
            <Link href="/write" className="btn btn-purple">
              <span>Start writing</span> <span aria-hidden>✎</span>
            </Link>
          </div>
          <MobileMenu />
        </div>
      </div>
    </nav>
  );
}
