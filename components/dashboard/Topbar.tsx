"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface TopbarProps {
  title?: string;
}

interface NotificationItem {
  id: string;
  type: "booking" | "approval";
  title: string;
  description: string;
  timestamp: string;
  link: string;
}

export default function Topbar({ title }: TopbarProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [bookingsRes, approvalsRes] = await Promise.all([
          fetch("/api/bookings").then(res => res.ok ? res.json() : null),
          fetch("/api/admin/approvals").then(res => res.ok ? res.json() : null)
        ]);

        const newNotifications: NotificationItem[] = [];

        if (bookingsRes && bookingsRes.success && Array.isArray(bookingsRes.bookings)) {
          const pendingBookings = bookingsRes.bookings.filter((b: any) => b.status === "Pending");
          pendingBookings.forEach((b: any) => {
            newNotifications.push({
              id: `booking-${b.id}`,
              type: "booking",
              title: "New Booking Pending",
              description: `${b.customerName} - ${b.serviceType} (Rs. ${b.totalCost})`,
              timestamp: new Date(b.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              link: "/admin/bookings"
            });
          });
        }

        if (approvalsRes && approvalsRes.success && Array.isArray(approvalsRes.approvals)) {
          const pendingApprovals = approvalsRes.approvals.filter((a: any) => a.status === "PENDING");
          pendingApprovals.forEach((a: any) => {
            newNotifications.push({
              id: `approval-${a.id}`,
              type: "approval",
              title: "Override Approval Req",
              description: `${a.managerName || "Manager"} requested ${a.action} on ${a.entityType}`,
              timestamp: new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              link: "/admin/approvals"
            });
          });
        }

        setNotifications(newNotifications);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

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

      <div className="flex items-center gap-4 relative">
        <div className="relative">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="relative bg-white/5 border border-white/10 hover:border-red-500 transition p-4 rounded-2xl cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                {notifications.length}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[#0c0c12] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="font-bold text-white">Notifications</h3>
                <span className="text-xs bg-red-600/20 text-red-500 px-2 py-0.5 rounded-full font-semibold">
                  {notifications.length} Pending
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((item) => (
                    <Link
                      key={item.id}
                      href={item.link}
                      onClick={() => setIsOpen(false)}
                      className="block p-4 border-b border-white/5 hover:bg-white/5 transition text-left"
                    >
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          item.type === "booking" ? "bg-blue-500/20 text-blue-400" : "bg-yellow-500/20 text-yellow-400"
                        }`}>
                          {item.type === "booking" ? "Booking" : "Override"}
                        </span>
                        <span className="text-[10px] text-gray-500">{item.timestamp}</span>
                      </div>
                      <p className="font-semibold text-sm text-white">{item.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
