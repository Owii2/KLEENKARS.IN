"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState<{ phone?: string } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("customerUser");
    setCustomer(stored ? JSON.parse(stored) : null);
  }, []);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const links = [
    { name: "Home", href: "/" },
    { name: "Book", href: "/booking" },
    customer ? { name: "Dashboard", href: "/customer/dashboard" } : { name: "Login", href: "/customer/login" },
    { name: "Staff Login", href: "/login" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08080a]/90 backdrop-blur-2xl shadow-black/30">
      <div className="main-container flex h-24 items-center justify-between gap-6">
        <div className="flex flex-col justify-center gap-1 items-start">
          <Logo width={170} height={48} />
          <span className="text-sm uppercase tracking-[0.32em] text-red-400">Premium Car Care</span>
        </div>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-semibold text-gray-300 transition hover:text-white"
            >
              {link.name}
            </Link>
          ))}

          <Link
            href="/booking"
            className="rounded-full bg-gradient-to-r from-red-600 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition hover:brightness-110"
          >
            Book Now
          </Link>
        </nav>

        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-200 transition hover:bg-white/10"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-white/10 bg-[#050507]/95 backdrop-blur-xl">
          <nav className="flex flex-col gap-4 px-5 py-6">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-base font-semibold text-gray-200 transition hover:text-red-400"
              >
                {link.name}
              </Link>
            ))}

            <Link
              href="/booking"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-red-500 px-6 py-3 text-center text-sm font-bold text-white shadow-lg shadow-red-500/20 transition hover:brightness-110"
            >
              Book Now
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
