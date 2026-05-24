import { useNavigate } from "react-router-dom";

export default function AdminPlaceholder({ title }: { title: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 min-h-[44px] min-w-[44px] pr-2"
        >
          ← Admin Panel
        </button>
        <span className="text-gray-300">|</span>
        <h1 className="text-sm font-semibold text-gray-700 truncate">
          {title}
        </h1>
      </div>
      <div className="flex flex-col items-center justify-center flex-1 min-h-[60vh] px-6 text-center">
        <span className="text-5xl mb-4">{"\u2699\uFE0F"}</span>
        <h1 className="text-xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-sm text-gray-400">
          This admin section is under construction.
        </p>
      </div>
    </div>
  );
}
