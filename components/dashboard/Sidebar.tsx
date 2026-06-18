"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function Sidebar() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <aside className="relative lg:fixed left-0 top-0 z-30 w-full lg:w-72 bg-[#07070a]/90 border-b border-white/10 lg:border-b-0 lg:border-r lg:border-white/10 text-white p-6 backdrop-blur-xl h-full flex flex-col">
      {/* LOGO */}
      <div className="mb-8 border-b border-white/10 pb-6">
        <Logo width={140} height={42} className="max-w-full" />
      </div>

      <nav className="space-y-3 flex-1 overflow-y-auto">
        <Link href="/admin" className="block bg-white/5 hover:bg-red-600 transition p-4 rounded-2xl">
          Dashboard
        </Link>
        <Link href="/admin/bookings" className="block bg-white/5 hover:bg-red-600 transition p-4 rounded-2xl">
          Bookings
        </Link>
        <Link href="/admin/employees" className="block bg-white/5 hover:bg-red-600 transition p-4 rounded-2xl">
          Employees
        </Link>
        <Link href="/admin/attendance" className="block bg-white/5 hover:bg-red-600 transition p-4 rounded-2xl">
          Attendance
        </Link>
        <Link href="/admin/customers" className="block bg-white/5 hover:bg-red-600 transition p-4 rounded-2xl">
          Customers
        </Link>
        <Link href="/admin/expenses" className="block bg-white/5 hover:bg-red-600 transition p-4 rounded-2xl">
          Expenses
        </Link>
        <Link href="/admin/services" className="block bg-white/5 hover:bg-red-600 transition p-4 rounded-2xl">
          Services
        </Link>
        <Link href="/admin/offers" className="block bg-white/5 hover:bg-red-600 transition p-4 rounded-2xl">
          Offers
        </Link>
        <Link href="/admin/daily-closing" className="block bg-white/5 hover:bg-red-600 transition p-4 rounded-2xl">
          Daily Closing
        </Link>
        <Link href="/admin/franchise" className="block bg-white/5 hover:bg-red-600 transition p-4 rounded-2xl">
          Franchise Applications
        </Link>
        <Link href="/admin/memberships" className="block bg-white/5 hover:bg-red-600 transition p-4 rounded-2xl">
          Memberships
        </Link>
      </nav>

      <div className="mt-8 border-t border-white/10 pt-6">
        <button
          onClick={handleLogout}
          className="w-full text-left block bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white transition p-4 rounded-2xl font-semibold"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
