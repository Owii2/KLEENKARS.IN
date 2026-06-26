"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Card from "@/components/ui/Card";
import KpiCard from "@/components/ui/KpiCard";

interface Booking {
  id: string;
  customerName: string;
  serviceType: string;
  totalCost: number;
  pickupDrop: boolean;
  status: string;
  createdAt: string;
  bookingDate: string;
  paymentMode: string | null;
  assignedEmployeeName?: string | null;
}

interface Employee {
  id: string;
  role: string;
  status: string;
}

// Quick links for admin navigation – displayed in a vertical sidebar
const quickLinks = [
  { href: "/admin/bookings", label: "Bookings", description: "Manage all bookings" },
  { href: "/admin/employees", label: "Employees", description: "Manage staff accounts" },
  { href: "/admin/attendance", label: "Attendance", description: "Track daily staff attendance" },
  { href: "/admin/customers", label: "Customers", description: "CRM and repeat customers" },
  { href: "/admin/expenses", label: "Expenses", description: "Track operational costs" },
  { href: "/admin/services", label: "Services & Pricing", description: "Manage wash packages and add‑ons" },
  { href: "/admin/offers", label: "Offers & Coupons", description: "Configure active promo codes" },
  { href: "/admin/referrals", label: "Referrals", description: "Reward customer referrals" },
  { href: "/admin/approvals", label: "Approvals", description: "Review manager overrides" },
  { href: "/admin/franchise", label: "Franchise", description: "Review franchise applications" },
  { href: "/admin/daily-closing", label: "Daily Closing", description: "Close revenue and expenses" },
  { href: "/admin/chatbot", label: "Chatbot Agent", description: "Manage FAQ knowledge base and view chats" },
  { href: "/admin/blog", label: "Blog Posts", description: "Create and publish company blogs" },
  { href: "/admin/settings", label: "Console Settings", description: "System settings and rules" },
];

const getBaseServiceName = (name: string) => {
  if (!name) return "";
  const parts = name.split(" - ");
  return parts[0].trim();
};

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [error, setError] = useState("");

  // ---------------------------------------------------------------------
  // Data fetching – runs once on mount
  // ---------------------------------------------------------------------
  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError("");
      try {
        const [bookingsRes, employeesRes, transactionsRes] = await Promise.all([
          fetch("/api/bookings"),
          fetch("/api/employees"),
          fetch("/api/transactions"),
        ]);
        const bookingsData = await bookingsRes.json();
        const employeesData = await employeesRes.json();
        const transactionsData = await transactionsRes.json();
        if (!bookingsRes.ok) throw new Error(bookingsData.message || "Failed to load bookings");
        if (!employeesRes.ok) throw new Error(employeesData.message || "Failed to load employees");
        setBookings(bookingsData.bookings || []);
        setEmployees(employeesData.employees || []);
        setTransactions(transactionsData.transactions || []);
        // Fetch detailed performance analytics
        try {
          const perfRes = await fetch("/api/analytics/detailed");
          if (perfRes.ok) {
            const perfJson = await perfRes.json();
            setPerformanceData(perfJson.data || []);
          }
        } catch (e) {
          console.error("Failed to fetch performance analytics", e);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // ---------------------------------------------------------------------
  // KPI calculations – memoised for performance
  // ---------------------------------------------------------------------
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const currentMonthStr = useMemo(() => todayStr.slice(0, 7), [todayStr]);

  const totalRevenue = useMemo(() => {
    const bookingRevenue = bookings.reduce((sum, b) => sum + b.totalCost, 0);
    const transactionRevenue = transactions.reduce((sum, t) => sum + (t.finalAmount ?? t.amount), 0);
    return bookingRevenue + transactionRevenue;
  }, [bookings, transactions]);

  const todayRevenue = useMemo(() => {
    const bookingRev = bookings
      .filter((b) => b.bookingDate === todayStr)
      .reduce((sum, b) => sum + b.totalCost, 0);
    const transRev = transactions
      .filter((t) => t.date === todayStr)
      .reduce((sum, t) => sum + (t.finalAmount ?? t.amount), 0);
    return bookingRev + transRev;
  }, [bookings, transactions, todayStr]);

  const monthlyRevTotal = useMemo(() => {
    const bookingRev = bookings
      .filter((b) => b.bookingDate && b.bookingDate.startsWith(currentMonthStr))
      .reduce((sum, b) => sum + b.totalCost, 0);
    const transRev = transactions
      .filter((t) => t.date && t.date.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + (t.finalAmount ?? t.amount), 0);
    return bookingRev + transRev;
  }, [bookings, transactions, currentMonthStr]);

  const cashRevenue = useMemo(() => {
    const bookingRev = bookings
      .filter((b) => b.paymentMode === "Cash")
      .reduce((sum, b) => sum + b.totalCost, 0);
    const transRev = transactions
      .filter((t) => t.paymentMode === "Cash")
      .reduce((sum, t) => sum + (t.finalAmount ?? t.amount), 0);
    return bookingRev + transRev;
  }, [bookings, transactions]);

  const upiRevenue = useMemo(() => {
    const bookingRev = bookings
      .filter((b) => b.paymentMode === "UPI")
      .reduce((sum, b) => sum + b.totalCost, 0);
    const transRev = transactions
      .filter((t) => t.paymentMode === "UPI")
      .reduce((sum, t) => sum + (t.finalAmount ?? t.amount), 0);
    return bookingRev + transRev;
  }, [bookings, transactions]);

  const topService = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach(b => {
      if (b.serviceType && !b.serviceType.toLowerCase().includes("addon") && !b.serviceType.toLowerCase().includes("polish")) {
        const baseName = getBaseServiceName(b.serviceType);
        counts[baseName] = (counts[baseName] || 0) + 1;
      }
    });
    transactions.forEach(t => {
      if (t.serviceOpted && !t.serviceOpted.toLowerCase().includes("addon") && !t.serviceOpted.toLowerCase().includes("polish")) {
        const baseName = getBaseServiceName(t.serviceOpted);
        counts[baseName] = (counts[baseName] || 0) + 1;
      }
    });
    let top = "None";
    let max = 0;
    Object.entries(counts).forEach(([k, v]) => {
      if (v > max) {
        max = v;
        top = k;
      }
    });
    return top;
  }, [bookings, transactions]);

  const topCustomer = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach(b => {
      if (b.customerName) counts[b.customerName] = (counts[b.customerName] || 0) + 1;
    });
    transactions.forEach(t => {
      if (t.customerName) counts[t.customerName] = (counts[t.customerName] || 0) + 1;
    });
    let top = "None";
    let max = 0;
    Object.entries(counts).forEach(([k, v]) => {
      if (v > max) {
        max = v;
        top = k;
      }
    });
    return top;
  }, [bookings, transactions]);

  const topEmployee = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach(b => {
      if (b.assignedEmployeeName) counts[b.assignedEmployeeName] = (counts[b.assignedEmployeeName] || 0) + 1;
    });
    transactions.forEach(t => {
      if (t.assignedEmployee) counts[t.assignedEmployee] = (counts[t.assignedEmployee] || 0) + 1;
    });
    let top = "None";
    let max = 0;
    Object.entries(counts).forEach(([k, v]) => {
      if (v > max) {
        max = v;
        top = k;
      }
    });
    return top;
  }, [bookings, transactions]);

  const totalCount = bookings.length + transactions.length;
const averageTicket = totalCount ? Math.round(totalRevenue / totalCount) : 0;
  const pendingBookings = bookings.filter((b) => b.status === "Pending").length;
  const inProgress = bookings.filter((b) => ["Assigned", "Washing"].includes(b.status)).length;
  const completedJobs = bookings.filter((b) => ["Completed", "Delivered"].includes(b.status)).length;
  const pickupCount = bookings.filter((b) => b.pickupDrop).length;
  const presentStaff = employees.filter((e) => e.status === "active").length;
  const absentStaff = Math.max(employees.length - presentStaff, 0);
  const activeSupervisors = employees.filter((e) => e.role === "supervisor" && e.status === "active").length;

  // Service‑wise revenue map
  const serviceRevenue = useMemo(() => {
    const stats: Record<string, number> = {};
    bookings.forEach(b => {
      if (b.serviceType) {
        const baseName = getBaseServiceName(b.serviceType);
        stats[baseName] = (stats[baseName] || 0) + b.totalCost;
      }
    });
    transactions.forEach(t => {
      if (t.serviceOpted) {
        const baseName = getBaseServiceName(t.serviceOpted);
        stats[baseName] = (stats[baseName] || 0) + (t.finalAmount ?? t.amount);
      }
    });
    return stats;
  }, [bookings, transactions]);

  // Monthly revenue – grouped by month name
  const monthlyRevenue = useMemo(() => {
    const stats: Record<string, number> = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const addRevenue = (dateStr: string | null | undefined, amount: number, createdAtStr?: string) => {
      let targetDate = dateStr;
      if (!targetDate && createdAtStr) {
        targetDate = createdAtStr.split("T")[0];
      }
      if (!targetDate) return;
      const parts = targetDate.split("-");
      if (parts.length >= 2) {
        const monthIndex = parseInt(parts[1], 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          const monthName = months[monthIndex];
          stats[monthName] = (stats[monthName] || 0) + amount;
        }
      }
    };

    bookings.forEach(b => {
      addRevenue(b.bookingDate, b.totalCost, b.createdAt);
    });

    transactions.forEach(t => {
      addRevenue(t.date, t.finalAmount ?? t.amount, t.createdAt);
    });

    return stats;
  }, [bookings, transactions]);

  // ---------------------------------------------------------------------
  // SVG chart helpers – remain unchanged but wrapped for clarity
  // ---------------------------------------------------------------------
  const renderMonthlyChart = () => {
    const rawEntries = Object.entries(monthlyRevenue);
    if (rawEntries.length === 0) return <p className="text-gray-400">No revenue data yet.</p>;
    const monthsOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const entries = rawEntries.sort((a, b) => {
      return monthsOrder.indexOf(a[0]) - monthsOrder.indexOf(b[0]);
    });
    const width = 500;
    const height = 200;
    const padL = 50,
      padR = 20,
      padT = 20,
      padB = 30;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;
    const maxVal = Math.max(...entries.map(([, v]) => v), 1000);
    const points = entries.map(([month, val], i) => {
      const x = padL + (entries.length > 1 ? (i / (entries.length - 1)) * chartW : 0);
      const y = height - padB - (val / maxVal) * chartH;
      return { x, y, month, val };
    });
    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const areaPath = points.length
      ? `${linePath} L ${points[points.length - 1].x} ${height - padB} L ${points[0].x} ${height - padB} Z`
      : "";
    const ticks = [0, 0.33, 0.66, 1].map((p) => Math.round(maxVal * p));
    return (
      <div className="w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {ticks.map((tick, i) => {
            const y = height - padB - (tick / maxVal) * chartH;
            return (
              <g key={i} className="opacity-20">
                <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#fff" strokeWidth="1" strokeDasharray="3,3" />
                <text x={padL - 8} y={y + 3} fill="#fff" fontSize="10" textAnchor="end">
                  ₹{tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
                </text>
              </g>
            );
          })}
          {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}
          {linePath && <path d={linePath} fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
          {points.map((p, i) => (
            <g key={i} className="group cursor-pointer">
              <circle cx={p.x} cy={p.y} r={5} fill="#ef4444" stroke="#000" strokeWidth={2} />
              <title>{p.month}: ₹{p.val}</title>
            </g>
          ))}
          {points.map((p, i) => (
            <text key={i} x={p.x} y={height - 10} fill="#888" fontSize="10" textAnchor="middle">
              {p.month}
            </text>
          ))}
        </svg>
      </div>
    );
  };

  const renderServiceChart = () => {
    let entries = Object.entries(serviceRevenue);
    if (entries.length === 0) return <p className="text-gray-400">No service data yet.</p>;

    // Sort by revenue descending
    entries.sort((a, b) => b[1] - a[1]);

    // Group if there are too many services (more than 6)
    if (entries.length > 6) {
      const top5 = entries.slice(0, 5);
      const othersVal = entries.slice(5).reduce((sum, [, v]) => sum + v, 0);
      entries = [...top5, ["Others", othersVal]];
    }

    const getShortServiceName = (name: string) => {
      if (name === "Others") return "Others";
      return name
        .replace("Express Wash", "Exp Wash")
        .replace("Classic Wash", "Clsc Wash")
        .replace("Premium Wash", "Prem Wash")
        .replace("Hatchback", "Hatch")
        .replace(" - ", " ")
        .replace(" (Addon)", "");
    };

    const width = 500;
    const height = 200;
    const padL = 50,
      padR = 20,
      padT = 25,
      padB = 30;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;
    const maxVal = Math.max(...entries.map(([, v]) => v), 1000);
    const barSpacing = chartW / entries.length;
    const barWidth = Math.max(barSpacing * 0.6, 12);
    const bars = entries.map(([service, val], i) => {
      const barHeight = (val / maxVal) * chartH;
      const x = padL + i * barSpacing + (barSpacing - barWidth) / 2;
      const y = height - padB - barHeight;
      return { x, y, width: barWidth, height: barHeight, service, val };
    });
    const ticks = [0, 0.5, 1].map((p) => Math.round(maxVal * p));
    return (
      <div className="w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {ticks.map((tick, i) => {
            const y = height - padB - (tick / maxVal) * chartH;
            return (
              <g key={i} className="opacity-20">
                <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#fff" strokeWidth="1" strokeDasharray="3,3" />
                <text x={padL - 8} y={y + 3} fill="#fff" fontSize="10" textAnchor="end">
                  ₹{tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
                </text>
              </g>
            );
          })}
          {bars.map((bar, i) => (
            <g key={i} className="group cursor-pointer">
              <rect x={bar.x} y={bar.y} width={bar.width} height={bar.height} fill="url(#barGrad)" rx={3} className="hover:fill-green-400 transition-colors" />
              <text x={bar.x + bar.width / 2} y={bar.y - 5} fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle">
                ₹{bar.val}
              </text>
              <title>{bar.service}: ₹{bar.val}</title>
            </g>
          ))}
          {bars.map((bar, i) => {
            const shortName = getShortServiceName(bar.service);
            const displayLabel = shortName.length > 12 ? `${shortName.substring(0, 11)}.` : shortName;
            return (
              <text key={i} x={bar.x + bar.width / 2} y={height - 10} fill="#888" fontSize="9" textAnchor="middle">
                {displayLabel}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------
  return (
    <DashboardLayout title="Admin Dashboard">
      {/* Error banner */}
      {error && <Card className="mb-8 text-red-400">{error}</Card>}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar navigation */}
        <nav className="w-full lg:w-64 bg-black bg-opacity-30 backdrop-filter backdrop-blur-lg rounded-xl p-4 glass-panel hidden lg:block">
          <h2 className="text-xl font-semibold text-white mb-4">Admin Menu</h2>
          <ul className="space-y-2">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="block p-3 rounded hover:bg-white/10 transition-colors">
                  <span className="block font-medium text-gray-100">{link.label}</span>
                  <span className="block text-xs text-gray-400">{link.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main content */}
        <div className="flex-1 space-y-6">
          {/* Quick Actions Shortcuts */}
          <div className="glass-panel p-6">
            <h2 className="text-xl font-bold text-red-400 mb-4">Quick Shortcuts</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <Link href="/admin/blog" className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-red-600/20 border border-white/10 rounded-2xl text-center transition-all duration-200 group">
                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">✍️</span>
                <span className="font-semibold text-sm text-gray-200 group-hover:text-white">Blog Manager</span>
              </Link>
              <Link href="/admin/chatbot" className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-red-600/20 border border-white/10 rounded-2xl text-center transition-all duration-200 group">
                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">🤖</span>
                <span className="font-semibold text-sm text-gray-200 group-hover:text-white">Chatbot Agent</span>
              </Link>
              <Link href="/admin/bookings" className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-red-600/20 border border-white/10 rounded-2xl text-center transition-all duration-200 group">
                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">📅</span>
                <span className="font-semibold text-sm text-gray-200 group-hover:text-white">Bookings</span>
              </Link>
              <Link href="/admin/services" className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-red-600/20 border border-white/10 rounded-2xl text-center transition-all duration-200 group">
                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">🛠️</span>
                <span className="font-semibold text-sm text-gray-200 group-hover:text-white">Services & Pricing</span>
              </Link>
              <Link href="/admin/settings" className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-red-600/20 border border-white/10 rounded-2xl text-center transition-all duration-200 group">
                <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">⚙️</span>
                <span className="font-semibold text-sm text-gray-200 group-hover:text-white">Console Settings</span>
              </Link>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <KpiCard label="Today's Revenue" value={`Rs. ${todayRevenue}`} color="text-red-400" />
            <KpiCard label="Monthly Revenue" value={`Rs. ${monthlyRevTotal}`} color="text-yellow-400" />
            <KpiCard label="Cash Revenue" value={`Rs. ${cashRevenue}`} color="text-emerald-400" />
            <KpiCard label="UPI Revenue" value={`Rs. ${upiRevenue}`} color="text-cyan-400" />
            <KpiCard label="Total Revenue" value={`Rs. ${totalRevenue}`} color="text-green-400" />
            <KpiCard label="Total Bookings" value={bookings.length} color="text-blue-400" />
            <KpiCard label="Total Transactions" value={transactions.length} color="text-purple-400" />
            <KpiCard label="Top Service" value={topService} color="text-indigo-400" />
            <KpiCard label="Top Customer" value={topCustomer} color="text-pink-400" />
            <KpiCard label="Top Employee" value={topEmployee} color="text-orange-400" />
            <KpiCard label="Avg Ticket Size" value={`Rs. ${averageTicket}`} color="text-yellow-400" />
            <KpiCard label="Present Staff" value={presentStaff} color="text-green-400" />
            <KpiCard label="Absent Staff" value={absentStaff} color="text-red-400" />
            <KpiCard label="Dashboard State" value={loading ? "Loading" : "Live"} color="text-white" />
          </div>

          {/* Charts section – two cards side‑by‑side on large screens */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="glass-panel p-6">
              <h2 className="text-xl font-bold mb-4 text-red-400">Monthly Revenue Trend</h2>
              {renderMonthlyChart()}
            </Card>
            <Card className="glass-panel p-6">
              <h2 className="text-xl font-bold mb-4 text-red-400">Service‑wise Revenue</h2>
              {renderServiceChart()}
            </Card>
          </div>

          {/* Recent bookings table – responsive overflow */}
          <Card className="glass-panel p-6">
            <h2 className="text-xl font-bold mb-4 text-red-400">Recent Bookings</h2>
            {bookings.length === 0 ? (
              <p className="text-gray-400">No bookings found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="bg-red-600">
                      <th className="p-3 text-left text-white">Customer</th>
                      <th className="p-3 text-left text-white">Service</th>
                      <th className="p-3 text-left text-white">Status</th>
                      <th className="p-3 text-left text-white">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.slice(0, 8).map((b) => (
                      <tr key={b.id} className="border-b border-gray-800 hover:bg-white/5 transition-colors">
                        <td className="p-3 text-gray-200">{b.customerName}</td>
                        <td className="p-3 text-gray-200">{b.serviceType}</td>
                        <td className="p-3 text-gray-200">{b.status}</td>
                        <td className="p-3 text-green-400">Rs. {b.totalCost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          {/* Performance Insights */}
          <Card className="glass-panel p-6 mt-6">
            <h2 className="text-xl font-bold mb-4 text-red-400">Performance Insights</h2>
            {performanceData.length === 0 ? (
              <p className="text-gray-400">No performance data available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="bg-red-600">
                      <th className="p-3 text-left text-white">Day</th>
                      <th className="p-3 text-left text-white">Time of Day</th>
                      <th className="p-3 text-left text-white">Bookings</th>
                      <th className="p-3 text-left text-white">Revenue</th>
                      <th className="p-3 text-left text-white">Avg Rev</th>
                      <th className="p-3 text-left text-white">Event</th>
                      <th className="p-3 text-left text-white">Weather</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-800 hover:bg-white/5 transition-colors">
                        <td className="p-3 text-gray-200">{row.day}</td>
                        <td className="p-3 text-gray-200">{row.timeOfDay}</td>
                        <td className="p-3 text-gray-200">{row.bookings}</td>
                        <td className="p-3 text-green-400">₹{row.revenue}</td>
                        <td className="p-3 text-yellow-400">₹{row.avgRevenue}</td>
                        <td className="p-3 text-gray-200">{row.event ? `${row.event.type}` : "-"}</td>
                        <td className="p-3 text-gray-200">{row.weather ? `${row.weather.temperature}°C ${row.weather.condition}` : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
