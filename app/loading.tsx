export default function Loading() {
  return (
    <div className="wrap max-w-[1200px] py-14">
      <div className="skeleton h-10 w-[320px] mb-4" />
      <div className="skeleton h-5 w-[420px] mb-8" />
      <div className="skeleton h-44 rounded-3xl mb-10" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-56 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
