"use client";

interface TopbarProps {
  title?: string;
}

export default function Topbar({ title }: TopbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 mb-8">
      {title ? (
        <div>
          <p className="text-sm text-gray-400">Kleenkars Operations</p>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
        </div>
      ) : null}

      <div className="relative w-full sm:max-w-md">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">Search</span>
        <input
          type="text"
          placeholder="Search..."
          className="w-full bg-white/5 border border-white/10 focus:border-red-500 outline-none rounded-2xl py-4 pl-20 pr-4 text-white"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative bg-white/5 border border-white/10 hover:border-red-500 transition p-4 rounded-2xl">
          <span aria-hidden="true">!</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
          <span className="text-red-500 text-2xl" aria-hidden="true">
            A
          </span>
          <div>
            <p className="font-semibold">Admin</p>
            <p className="text-sm text-gray-400">Kleenkars</p>
          </div>
        </div>
      </div>
    </div>
  );
}
