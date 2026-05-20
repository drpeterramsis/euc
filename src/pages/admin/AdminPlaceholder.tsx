export default function AdminPlaceholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <span className="text-5xl mb-4">{"\u2699\uFE0F"}</span>
      <h1 className="text-xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-sm text-gray-400">
        This admin section is under construction.
      </p>
    </div>
  );
}
