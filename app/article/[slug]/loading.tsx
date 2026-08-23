export default function Loading() {
  return (
    <div className="wrap max-w-[820px] pt-8 pb-4">
      <div className="skeleton h-4 w-40 mb-6" />
      <div className="skeleton h-16 w-full mb-4" />
      <div className="skeleton h-5 w-[70%] mb-8" />
      <div className="skeleton h-12 w-64 mb-10" />
      <div className="space-y-3">
        {[90, 100, 96, 100, 60].map((w, i) => (
          <div key={i} className="skeleton h-4" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}
