export default function Loading() {
  return (
    <div className="wrap pt-8 pb-4">
      <div className="skeleton h-48 rounded-3xl mb-10" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 anim-stagger">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton h-52 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}