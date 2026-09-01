"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CookieConsent() {
  const pathname = usePathname();
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const consentGiven = localStorage.getItem("kleenkars_cookie_consent");
      if (!consentGiven) {
        setShowConsent(true);
      }
    }
  }, []);

  // Do not show cookie popup on QR landing hub or admin pages
  if (
    !showConsent ||
    pathname === "/connect" ||
    pathname?.startsWith("/connect/") ||
    pathname === "/hub" ||
    pathname === "/links" ||
    pathname === "/qr" ||
    pathname?.startsWith("/admin")
  ) {
    return null;
  }

  const handleAccept = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kleenkars_cookie_consent", "accepted");
    }
    setShowConsent(false);
  };

  return (
    <div
      id="cookie-consent-banner"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md bg-slate-900/95 border border-slate-800 backdrop-blur-lg p-5 rounded-2xl shadow-2xl z-50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="text-base">🍪</span> Cookie &amp; Data Notice
          </h3>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            We use essential cookies &amp; session storage to manage doorstep bookings, authenticate logins, and improve service delivery. Read our{" "}
            <Link href="/privacy" className="text-red-400 underline hover:text-red-300">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="text-red-400 underline hover:text-red-300">
              Terms of Service
            </Link>.
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleAccept}
          className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition-colors shadow-lg shadow-red-900/30"
        >
          Accept &amp; Continue
        </button>
      </div>
    </div>
  );
}
