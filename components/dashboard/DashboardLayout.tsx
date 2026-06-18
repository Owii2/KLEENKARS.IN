"use client";

import Sidebar from "./Sidebar";

import Topbar from "./Topbar";

interface Props {

  title: string;

  children: React.ReactNode;

}

export default function DashboardLayout({

  title,

  children,

}: Props) {

  return (
    <div className="relative min-h-screen bg-black text-white">
      <Sidebar />
      <div className="lg:pl-72">
        <div className="mx-auto w-full max-w-full px-4 py-6 sm:px-6 lg:px-8">
          <Topbar title={title} />

          <main className="pb-10">
            <div className="glass-panel p-6 sm:p-8">{children}</div>
          </main>
        </div>
      </div>
    </div>

  );

}