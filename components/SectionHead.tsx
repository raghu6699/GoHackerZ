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
    <div id={id} className="flex items-end justify-between mt-14 mb-6">
      <h2 className="text-[34px] font-bold tracking-tight">{title}</h2>
      {note && (
        <span className="font-mono text-[13px] text-purple font-bold">
          {note}
        </span>
      )}
    </div>
  );
}
