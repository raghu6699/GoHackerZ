import Link from "next/link";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { NavAuth } from "./NavAuth";
import { MobileMenu } from "./MobileMenu";

const links = [
  { href: "/", label: "Feed" },
  { href: "/topic/systems", label: "Deep Dives" },
  { href: "/search", label: "Search" },
  { href: "/#topics", label: "Topics" },
  { href: "/writer/maya", label: "Writers" },
];

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 py-3 md:py-4 bg-bg/85 backdrop-blur-md">
      <div className="wrap flex items-center gap-2.5 md:gap-6">
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
        <div className="ml-auto flex items-center gap-2 md:gap-2.5">
          <ThemeToggle />
          <NavAuth />
          <Link href="/write" className="btn btn-purple">
            {/* Shorter label keeps the bar inside 320px viewports */}
            <span className="hidden sm:inline">Start writing</span>
            <span className="sm:hidden">Write</span>{" "}
            <span aria-hidden>✎</span>
          </Link>
          <MobileMenu />
        </div>
      </div>
    </nav>
  );
}
