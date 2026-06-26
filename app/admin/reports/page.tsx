"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface Booking {
  id: string;
  totalCost: number;
  status: string;
  createdAt: string;
  bookingDate: string;
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  createdAt: string;
}

interface WeeklyData {
  day: string;
  bookings: number;
  revenue: number;
}

export default function ReportsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Time filter state
  const [timeFilter, setTimeFilter] = useState<"all" | "month" | "week">("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, expensesRes, weeklyRes, transactionsRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/expenses"),
        fetch("/api/analytics/weekly"),
        fetch("/api/transactions"),
      ]);

      const bookingsData = await bookingsRes.json();
      const expensesData = await expensesRes.json();
      const weeklyData = await weeklyRes.json();
      const transactionsData = await transactionsRes.json();

      setBookings(bookingsData.bookings || []);
      setExpenses(expensesData.expenses || []);
      setWeeklyData(weeklyData.data || []);
      setTransactions(transactionsData.transactions || []);
    } catch (err) {
      console.error("Failed to load analytical reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter calculations based on selection
  const now = new Date();
  const startOfWeek = new Date(now);
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const filteredBookings = bookings.filter((b) => {
    if (b.status === "Cancelled") return false;
    const bDate = new Date(b.createdAt || b.bookingDate);
    if (timeFilter === "week") return bDate >= startOfWeek;
    if (timeFilter === "month") return bDate >= startOfMonth;
    return true;
  });

  const filteredTransactions = transactions.filter((t) => {
    const tDate = new Date(t.createdAt || t.date);
    if (timeFilter === "week") return tDate >= startOfWeek;
    if (timeFilter === "month") return tDate >= startOfMonth;
    return true;
  });

  const filteredExpenses = expenses.filter((e) => {
    const eDate = new Date(e.createdAt);
    if (timeFilter === "week") return eDate >= startOfWeek;
    if (timeFilter === "month") return eDate >= startOfMonth;
    return true;
  });

  // Filter weekly data according to the same time filter
  const filteredWeeklyData = weeklyData.filter((d) => {
    const dDate = new Date(d.day);
    if (timeFilter === "week") return dDate >= startOfWeek;
    if (timeFilter === "month") return dDate >= startOfMonth;
    return true;
  });

  // Totals calculations
  const totalRevenue = filteredBookings.reduce((sum, b) => sum + (b.totalCost || 0), 0) +
                       filteredTransactions.reduce((sum, t) => sum + (t.finalAmount ?? t.amount ?? 0), 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  
  const totalTicketCount = filteredBookings.length + filteredTransactions.length;
  const averageTicket = totalTicketCount > 0 ? totalRevenue / totalTicketCount : 0;

  // Expense grouping
  const expenseByCategory = filteredExpenses.reduce((acc: Record<string, number>, curr) => {
    const cat = curr.category || "Miscellaneous";
    acc[cat] = (acc[cat] || 0) + curr.amount;
    return acc;
  }, {});

  const sortedCategories = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);

  // Chart preparation
  const maxWeeklyRevenue = Math.max(...filteredWeeklyData.map((d) => d.revenue), 1000);
  const maxWeeklyBookings = Math.max(...filteredWeeklyData.map((d) => d.bookings), 5);

  // SVG Line Chart path generators
  const generateLinePath = () => {
    if (filteredWeeklyData.length === 0) return "";
    return filteredWeeklyData
      .map((d, index) => {
        const x = 50 + index * 90;
        const y = 250 - (d.revenue / maxWeeklyRevenue) * 180;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  const generateAreaPath = () => {
    if (filteredWeeklyData.length === 0) return "";
    const linePath = generateLinePath();
    const firstX = 50;
    const lastX = 50 + (filteredWeeklyData.length - 1) * 90;
    return `${linePath} L ${lastX} 250 L ${firstX} 250 Z`;
  };

  return (
    <DashboardLayout title="Analytical Reports & Profits">
      {/* Header with filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-red-500">
            Reports & Analytics
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Evaluate store gross profits, operating expenses, work order metrics, and visual performance scales.
          </p>
        </div>

        {/* Filter triggers */}
        <div className="flex items-center bg-[#0b0b0b] border border-gray-800 p-1.5 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setTimeFilter("all")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              timeFilter === "all" ? "bg-red-650 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            All-Time
          </button>
          <button
            onClick={() => setTimeFilter("month")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              timeFilter === "month" ? "bg-red-650 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setTimeFilter("week")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              timeFilter === "week" ? "bg-red-650 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            This Week
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-500">
          Compiling business datasets...
        </div>
      ) : (
        <div className="space-y-8">
          {/* Statistics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
            <div className="bg-[#0b0b0b] p-5 rounded-xl border border-gray-850 flex flex-col justify-between">
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Gross Revenues</span>
              <span className="text-3xl font-extrabold mt-2 text-white font-mono">₹{totalRevenue.toLocaleString()}</span>
              <span className="text-[10px] text-green-400 mt-1.5">★ Active Invoiced bookings</span>
            </div>

            <div className="bg-[#0b0b0b] p-5 rounded-xl border border-gray-850 flex flex-col justify-between">
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Operating Expenses</span>
              <span className="text-3xl font-extrabold mt-2 text-red-400 font-mono">₹{totalExpenses.toLocaleString()}</span>
              <span className="text-[10px] text-gray-500 mt-1.5">Includes supplies & wages</span>
            </div>

            <div className="bg-[#0b0b0b] p-5 rounded-xl border border-gray-850 flex flex-col justify-between">
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Net Profit</span>
              <span className={`text-3xl font-extrabold mt-2 font-mono ${netProfit >= 0 ? "text-green-400" : "text-red-500"}`}>
                ₹{netProfit.toLocaleString()}
              </span>
              <span className="text-[10px] text-gray-500 mt-1.5">Revenue minus costs</span>
            </div>

            <div className="bg-[#0b0b0b] p-5 rounded-xl border border-gray-850 flex flex-col justify-between">
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Margin Percentage</span>
              <span className="text-3xl font-extrabold mt-2 text-yellow-500 font-mono">
                {profitMargin.toFixed(1)}%
              </span>
              <span className="text-[10px] text-gray-500 mt-1.5">Profit margin ratio</span>
            </div>
          </div>

          {/* SVG Charts Block */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart 1: Revenue Line Chart */}
            <div className="bg-[#0b0b0b] border border-gray-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-2">Weekly Revenue Trends</h3>
              <p className="text-xs text-gray-500 mb-6">Booking billing distribution across current week days (₹)</p>

              {filteredWeeklyData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-600 text-sm">
                  Insufficient data points
                </div>
              ) : (
                <div className="relative">
                  <svg className="w-full h-64 overflow-visible" viewBox="0 0 600 280">
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => (
                      <line
                        key={idx}
                        x1="50"
                        y1={250 - p * 180}
                        x2="590"
                        y2={250 - p * 180}
                        className="stroke-gray-800/60"
                        strokeDasharray="4"
                      />
                    ))}

                    {/* Fill Area */}
                    <path d={generateAreaPath()} fill="url(#revenueGrad)" />

                    {/* Smooth Path */}
                    <path
                      d={generateLinePath()}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Interaction Points */}
                    {filteredWeeklyData.map((d, index) => {
                      const x = 50 + index * 90;
                      const y = 250 - (d.revenue / maxWeeklyRevenue) * 180;
                      return (
                        <g key={index} className="group cursor-pointer">
                          <circle cx={x} cy={y} r="5" className="fill-red-500 stroke-black stroke-2" />
                          <circle cx={x} cy={y} r="10" className="fill-red-500 opacity-0 hover:opacity-20 transition" />
                          <text
                            x={x}
                            y={y - 12}
                            textAnchor="middle"
                            className="fill-white text-[10px] font-bold font-mono opacity-0 hover:opacity-100 transition-opacity bg-black"
                          >
                            ₹{d.revenue.toLocaleString()}
                          </text>
                        </g>
                      );
                    })}

                    {/* X axis labels */}
                    {filteredWeeklyData.map((d, index) => (
                      <text
                        key={index}
                        x={50 + index * 90}
                        y="270"
                        textAnchor="middle"
                        className="fill-gray-500 text-[10px] font-semibold"
                      >
                        {d.day.substring(0, 3)}
                      </text>
                    ))}
                  </svg>
                </div>
              )}
            </div>

            {/* Chart 2: Bookings Bar Chart */}
            <div className="bg-[#0b0b0b] border border-gray-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-2">Weekly Volume Scale</h3>
              <p className="text-xs text-gray-500 mb-6">Total number of detailing deliverables per day</p>

              {filteredWeeklyData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-600 text-sm">
                  Insufficient data points
                </div>
              ) : (
                <div className="relative">
                  <svg className="w-full h-64 overflow-visible" viewBox="0 0 600 280">
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => (
                      <line
                        key={idx}
                        x1="50"
                        y1={250 - p * 180}
                        x2="590"
                        y2={250 - p * 180}
                        className="stroke-gray-800/60"
                        strokeDasharray="4"
                      />
                    ))}

                    {/* Bar Elements */}
                    {filteredWeeklyData.map((d, index) => {
                      const width = 28;
                      const height = (d.bookings / maxWeeklyBookings) * 180;
                      const x = 50 + index * 90 - width / 2;
                      const y = 250 - height;
                      return (
                        <g key={index} className="group cursor-pointer">
                          <rect
                            x={x}
                            y={y}
                            width={width}
                            height={height || 2}
                            fill="url(#barGrad)"
                            rx="4"
                            className="transition-all duration-300 hover:brightness-110"
                          />
                          <text
                            x={x + width / 2}
                            y={y - 8}
                            textAnchor="middle"
                            className="fill-white text-[10px] font-bold font-mono opacity-0 hover:opacity-100 transition-opacity"
                          >
                            {d.bookings}
                          </text>
                        </g>
                      );
                    })}

                    {/* X axis labels */}
                    {filteredWeeklyData.map((d, index) => (
                      <text
                        key={index}
                        x={50 + index * 90}
                        y="270"
                        textAnchor="middle"
                        className="fill-gray-500 text-[10px] font-semibold"
                      >
                        {d.day.substring(0, 3)}
                      </text>
                    ))}
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Expense Category Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-[#0b0b0b] border border-gray-800 rounded-2xl p-6 shadow-xl lg:col-span-2">
              <h3 className="text-lg font-bold text-white mb-2">Operating Expense Breakdowns</h3>
              <p className="text-xs text-gray-500 mb-6">Distribution ratios of store outgoing costs</p>

              {sortedCategories.length === 0 ? (
                <div className="py-12 text-center text-gray-600 text-sm">
                  No expense records logged in this timeframe.
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedCategories.map(([cat, val]) => {
                    const percentage = totalExpenses > 0 ? (val / totalExpenses) * 100 : 0;
                    return (
                      <div key={cat} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-300 font-semibold uppercase">{cat}</span>
                          <div className="space-x-2 font-mono">
                            <span className="text-gray-400">₹{val.toLocaleString()}</span>
                            <span className="text-red-400 font-bold">{percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-black border border-gray-850 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-red-650 to-orange-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-[#0b0b0b] border border-gray-800 rounded-2xl p-6 shadow-xl lg:col-span-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Workload Metrics</h3>
                <p className="text-xs text-gray-500 mb-6">Average service order size and volumes</p>
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center py-2 border-b border-gray-850">
                    <span className="text-xs text-gray-400">Average Ticket Size</span>
                    <span className="text-base font-bold text-white font-mono">₹{Math.round(averageTicket).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-850">
                    <span className="text-xs text-gray-400">Bookings Scheduled</span>
                    <span className="text-base font-bold text-white font-mono">{filteredBookings.length} orders</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-850">
                    <span className="text-xs text-gray-400">Transactions Processed</span>
                    <span className="text-base font-bold text-white font-mono">{filteredTransactions.length} sales</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs text-gray-400">Expenses Filed</span>
                    <span className="text-base font-bold text-white font-mono">{filteredExpenses.length} files</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-red-950/10 border border-red-900/20 p-4 rounded-xl text-center text-xs text-gray-400">
                Data recalculates automatically whenever you adjust database check-ins, process payroll, file expense vouchers, or complete booking checkout slips.
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
