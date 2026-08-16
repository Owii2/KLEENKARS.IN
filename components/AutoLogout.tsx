"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

// Default inactivity timeout: 15 minutes (900,000 ms)
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
// Show warning prompt 1 minute before auto-logout (14 minutes of inactivity)
const WARNING_BEFORE_MS = 1 * 60 * 1000;

export default function AutoLogout() {
  const router = useRouter();
  const pathname = usePathname();

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  const lastActivityRef = useRef<number>(0);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if any user (staff/admin or customer) is currently logged in
  const isUserLoggedIn = useCallback(() => {
    if (typeof window === "undefined") return false;

    // Customer login check via localStorage
    const hasCustomer = !!window.localStorage.getItem("customerUser");

    // Staff/admin dashboard routes check
    const isProtectedDashboardRoute =
      pathname?.startsWith("/admin") ||
      pathname?.startsWith("/staff") ||
      pathname?.startsWith("/manager") ||
      pathname?.startsWith("/customer/dashboard");

    return hasCustomer || isProtectedDashboardRoute;
  }, [pathname]);

  const performLogout = useCallback(async () => {
    try {
      // Clear customer user storage
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("customerUser");
      }

      // Call API logout endpoint to clear server auth cookies
      await fetch("/api/logout", { method: "POST" }).catch(() => {});

      setShowWarning(false);

      // Redirect based on current area
      if (pathname?.startsWith("/customer")) {
        router.push("/customer/login?reason=inactivity");
      } else {
        router.push("/login?reason=inactivity");
      }
    } catch (error) {
      console.error("Error performing auto-logout:", error);
    }
  }, [pathname, router]);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (showWarning) {
      setShowWarning(false);
    }

    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    if (!isUserLoggedIn()) return;

    // Set warning timer (fires after 14 minutes of inactivity)
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsRemaining(60);

      // Countdown interval for visual timer display
      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS);

    // Set hard logout timer (fires after 15 minutes of inactivity)
    logoutTimerRef.current = setTimeout(() => {
      performLogout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [isUserLoggedIn, performLogout, showWarning]);

  useEffect(() => {
    if (!isUserLoggedIn()) return;

    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];

    const handleUserActivity = () => {
      // Throttle reset calls to at most once per 2 seconds for performance
      if (Date.now() - lastActivityRef.current > 2000) {
        resetTimer();
      }
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    resetTimer();

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isUserLoggedIn, resetTimer]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-zinc-900 border border-red-500/40 rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="w-12 h-12 bg-red-950/60 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-400 text-xl font-bold">
          ⚠️
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black text-white">Inactivity Warning</h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            You have been inactive for 14 minutes. For security, your session will automatically log out in:
          </p>
          <div className="text-3xl font-black text-red-500 py-2">
            {secondsRemaining}s
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <button
            onClick={resetTimer}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-lg shadow-red-600/20 text-sm"
          >
            Stay Logged In
          </button>
          <button
            onClick={performLogout}
            className="bg-zinc-800 hover:bg-zinc-700 text-gray-300 font-semibold py-3 px-4 rounded-xl transition text-sm"
          >
            Log Out Now
          </button>
        </div>
      </div>
    </div>
  );
}
