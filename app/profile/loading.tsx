export default function Loading() {
  return (
    <div className="wrap pt-8 pb-4">
      <div className="skeleton h-44 rounded-3xl mb-6" />
      <div className="flex gap-2 mb-6">
        <div className="skeleton h-9 w-28 rounded-full" />
        <div className="skeleton h-9 w-24 rounded-full" />
        <div className="skeleton h-9 w-24 rounded-full" />
      </div>
      <div className="skeleton h-80 rounded-2xl" />
    </div>
  );
}