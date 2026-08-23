import type { AvatarColor } from "@/lib/data";

const colorMap: Record<AvatarColor, string> = {
  purple: "bg-purple text-white",
  pink: "bg-pink text-[#1A1440]",
  sky: "bg-sky text-[#1A1440]",
  peach: "bg-peach text-[#1A1440]",
  lime: "bg-lime text-[#1A1440]",
  ink: "bg-brand-dark text-white",
};

const sizeMap = {
  sm: "w-8 h-8 text-[12px] rounded-lg shadow-pop-sm",
  md: "w-11 h-11 text-[15px] rounded-xl shadow-pop-sm",
  lg: "w-16 h-16 text-[22px] rounded-2xl shadow-pop",
  xl: "w-24 h-24 text-[34px] rounded-2xl shadow-pop-lg",
};

export function Avatar({
  initials,
  color = "purple",
  size = "md",
  rotate,
  src,
}: {
  initials: string;
  color?: AvatarColor;
  size?: keyof typeof sizeMap;
  rotate?: boolean;
  /** Uploaded profile image — shown instead of initials when present. */
  src?: string | null;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={initials}
        className={`avatar ${sizeMap[size]} object-cover bg-card ${
          rotate ? "-rotate-6" : ""
        }`}
      />
    );
  }
  return (
    <span
      className={`avatar ${colorMap[color]} ${sizeMap[size]} ${
        rotate ? "-rotate-6" : ""
      }`}
      aria-hidden
    >
      {initials}
    </span>
  );
}
