import Link from "next/link";

export function Logo({
  className = "",
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-[9px] font-bold text-[23px] ${
        light ? "text-white" : "text-ink"
      } ${className}`}
    >
      <span
        className={`grid place-items-center w-[30px] h-[30px] rounded-[9px] border-2 border-ink shadow-pop-sm -rotate-6 text-[16px] ${
          light ? "bg-lime text-ink" : "bg-purple text-white"
        }`}
      >
        L
      </span>
      Lore
    </Link>
  );
}
