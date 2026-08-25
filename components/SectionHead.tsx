export function SectionHead({
  title,
  note,
  id,
}: {
  title: string;
  note?: string;
  id?: string;
}) {
  return (
    <div id={id} className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 mt-14 mb-6">
      <h2 className="text-[26px] sm:text-[34px] font-bold tracking-tight">{title}</h2>
      {note && (
        <span className="font-mono text-[12px] sm:text-[13px] text-purple font-bold whitespace-nowrap">
          {note}
        </span>
      )}
    </div>
  );
}
