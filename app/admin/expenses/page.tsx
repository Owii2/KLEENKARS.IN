"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Card from "@/components/ui/Card";
import KpiCard from "@/components/ui/KpiCard";
import {
  TrendingUp,
  Tag,
  CreditCard,
  User,
  Calendar,
  DollarSign,
  Search,
  Upload,
  Download,
  Filter,
  FileText,
  Trash2,
  Edit2,
  X,
  CheckCircle,
  AlertTriangle,
  Plus,
  Eye,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";

interface Attachment {
  id: string;
  url: string;
  mimeType: string;
}

interface Employee {
  name: string;
  employeeCode: string;
}

interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string | null;
  description: string | null;
  paidTo: string | null;
  paymentMode: string | null;
  invoiceNumber: string | null;
  vendorGSTNumber: string | null;
  notes: string | null;
  employeeId: string | null;
  employee?: Employee | null;
  attachments?: Attachment[];
}

interface Category {
  id: string;
  name: string;
  disabled: boolean;
}

interface PaymentMode {
  id: string;
  name: string;
  disabled: boolean;
}

const COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e"];

export default function ExpensePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Dashboard Aggregates
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"dashboard" | "list" | "reports" | "setup">("dashboard");

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPaymentMode, setFilterPaymentMode] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");

  // Report States
  const [reportType, setReportType] = useState<string>("monthly");
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(false);

  // Form States (Add/Edit)
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPaidTo, setFormPaidTo] = useState("");
  const [formPaymentMode, setFormPaymentMode] = useState("");
  const [formInvoiceNumber, setFormInvoiceNumber] = useState("");
  const [formVendorGSTNumber, setFormVendorGSTNumber] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formAttachments, setFormAttachments] = useState<{ url: string; mimeType: string }[]>([]);
  const [showFullForm, setShowFullForm] = useState(false);

  // Modal / Import wizard
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any>(null);
  const [mapping, setMapping] = useState<any>({
    date: "",
    amount: "",
    category: "",
    description: "",
    paidTo: "",
    paymentMode: "",
  });
  const [dupDetection, setDupDetection] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Setup panel management states
  const [newCatName, setNewCatName] = useState("");
  const [newModeName, setNewModeName] = useState("");

  // Fetch Current User Role & metadata
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/settings"); // Retrieve system settings as a quick proxy or parse jwt tokens if cookies allow
      // We can also infer the user role from API error handlers or general endpoints. Let's make an explicit check.
      const testRes = await fetch("/api/expenses/dashboard");
      if (testRes.status === 401) {
        setCurrentUser({ role: "staff" }); // Default lower permission fallback if restricted dashboard
      } else {
        // Assume Admin/Manager privileges since dashboard loaded
        setCurrentUser({ role: "admin" });
      }
    } catch {
      setCurrentUser({ role: "staff" });
    }
  };

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch Categories
      const catRes = await fetch("/api/expenses/categories");
      const catData = await catRes.json();
      if (catData.success) {
        setCategories(catData.categories || []);
      }

      // 2. Fetch Payment Modes
      const modeRes = await fetch("/api/expenses/payment-modes");
      const modeData = await modeRes.json();
      if (modeData.success) {
        setPaymentModes(modeData.paymentModes || []);
      }

      // 3. Fetch dashboard numbers
      const dashRes = await fetch("/api/expenses/dashboard");
      const dashData = await dashRes.json();
      if (dashData.success) {
        setDashboardData(dashData.data);
      }

      // 4. Fetch list
      await fetchFilteredExpenses();
    } catch (err) {
      setError("Failed to sync system configuration data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredExpenses = async () => {
    try {
      let url = `/api/expenses?search=${encodeURIComponent(searchTerm)}`;
      if (filterCategory) url += `&category=${encodeURIComponent(filterCategory)}`;
      if (filterPaymentMode) url += `&paymentMode=${encodeURIComponent(filterPaymentMode)}`;
      if (filterStartDate) url += `&startDate=${filterStartDate}`;
      if (filterEndDate) url += `&endDate=${filterEndDate}`;
      if (filterMinAmount) url += `&minAmount=${filterMinAmount}`;
      if (filterMaxAmount) url += `&maxAmount=${filterMaxAmount}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setExpenses(data.expenses || []);
      }
    } catch {
      setError("Could not load filtered expense list.");
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    loadAll();
  }, []);

  useEffect(() => {
    fetchFilteredExpenses();
  }, [searchTerm, filterCategory, filterPaymentMode, filterStartDate, filterEndDate, filterMinAmount, filterMaxAmount]);

  // Load report data
  const loadReport = async () => {
    setReportLoading(true);
    try {
      const res = await fetch(`/api/expenses/reports?type=${reportType}&year=${reportYear}`);
      const data = await res.json();
      if (data.success) {
        setReportData(data.report || []);
      }
    } catch {
      setError("Failed to compile report.");
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "reports") {
      loadReport();
    }
  }, [reportType, reportYear, activeTab]);

  // Reset form states
  const resetForm = () => {
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormAmount("");
    setFormCategory("");
    setFormDescription("");
    setFormPaidTo("");
    setFormPaymentMode("");
    setFormInvoiceNumber("");
    setFormVendorGSTNumber("");
    setFormNotes("");
    setFormAttachments([]);
    setIsEditing(false);
    setEditId("");
    setShowFullForm(false);
  };

  // Create or Update Expense handler
  const saveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!formDate || !formAmount) {
      setError("Date and Amount are mandatory.");
      return;
    }

    const payload = {
      date: formDate,
      amount: formAmount,
      category: formCategory || null,
      description: formDescription || null,
      paidTo: formPaidTo || null,
      paymentMode: formPaymentMode || null,
      invoiceNumber: formInvoiceNumber || null,
      vendorGSTNumber: formVendorGSTNumber || null,
      notes: formNotes || null,
      attachments: formAttachments,
    };

    try {
      let res;
      if (isEditing) {
        res = await fetch(`/api/expenses/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to commit record.");
      }

      setSuccessMsg(isEditing ? "Expense updated successfully!" : "Expense logged successfully!");
      resetForm();
      loadAll();
    } catch (err: any) {
      setError(err.message || "An error occurred while saving the expense.");
    }
  };

  // Edit action
  const startEdit = (exp: Expense) => {
    setIsEditing(true);
    setEditId(exp.id);
    setFormDate(new Date(exp.date).toISOString().split("T")[0]);
    setFormAmount(String(exp.amount));
    setFormCategory(exp.category || "");
    setFormDescription(exp.description || "");
    setFormPaidTo(exp.paidTo || "");
    setFormPaymentMode(exp.paymentMode || "");
    setFormInvoiceNumber(exp.invoiceNumber || "");
    setFormVendorGSTNumber(exp.vendorGSTNumber || "");
    setFormNotes(exp.notes || "");
    setFormAttachments(exp.attachments || []);
    setShowFullForm(true);
    setActiveTab("list");
    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete Action
  const deleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Deletion failed.");
      }
      setSuccessMsg("Expense deleted successfully.");
      loadAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // File Upload Helper
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Upload failed");
      }

      setFormAttachments((prev) => [...prev, { url: data.url, mimeType: file.type }]);
    } catch (err: any) {
      setError("File upload failed: " + err.message);
    }
  };

  // Add Category Helper
  const addCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const res = await fetch("/api/expenses/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCatName }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) => [...prev, data.category]);
        setNewCatName("");
        setSuccessMsg("Category added successfully.");
      } else {
        setError(data.message);
      }
    } catch {
      setError("Failed to add category.");
    }
  };

  // Add Payment Mode Helper
  const addPaymentMode = async () => {
    if (!newModeName.trim()) return;
    try {
      const res = await fetch("/api/expenses/payment-modes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newModeName }),
      });
      const data = await res.json();
      if (data.success) {
        setPaymentModes((prev) => [...prev, data.paymentMode]);
        setNewModeName("");
        setSuccessMsg("Payment mode added successfully.");
      } else {
        setError(data.message);
      }
    } catch {
      setError("Failed to add payment mode.");
    }
  };

  // Toggle Category Disable/Enable
  const toggleCategoryStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/expenses/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, disabled: !currentStatus } : c))
        );
      }
    } catch {
      setError("Failed to toggle status.");
    }
  };

  // CSV Import flow handlers
  const handleCsvSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    // Read headers
    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target?.result as string;
      try {
        const res = await fetch("/api/expenses/import/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvString: csvText }),
        });
        const data = await res.json();
        if (data.success) {
          setCsvPreview(data);
          // Try to auto-map based on common strings
          const headers = data.headers;
          const autoMapping = {
            date: headers.find((h: string) => /date/i.test(h)) || headers[0] || "",
            amount: headers.find((h: string) => /amount/i.test(h)) || headers[1] || "",
            category: headers.find((h: string) => /cat/i.test(h)) || "",
            description: headers.find((h: string) => /desc/i.test(h)) || "",
            paidTo: headers.find((h: string) => /paid|vendor|to/i.test(h)) || "",
            paymentMode: headers.find((h: string) => /mode|pay/i.test(h)) || "",
          };
          setMapping(autoMapping);
        } else {
          setError(data.message || "Failed to load CSV headers.");
        }
      } catch {
        setError("Error parsing CSV metadata.");
      }
    };
    reader.readAsText(file);
  };

  const runCsvImport = async () => {
    if (!csvFile || !csvPreview) return;
    setError("");
    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvText = event.target?.result as string;
      try {
        const res = await fetch("/api/expenses/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            csvString: csvText,
            mapping,
            duplicateDetection: dupDetection,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setImportResult(data);
          loadAll();
        } else {
          setError(data.message || "Import encountered error.");
        }
      } catch {
        setError("Could not complete CSV import.");
      }
    };
    reader.readAsText(csvFile);
  };

  const triggerExport = () => {
    let url = `/api/expenses/export?`;
    if (filterCategory) url += `&category=${encodeURIComponent(filterCategory)}`;
    if (filterPaymentMode) url += `&paymentMode=${encodeURIComponent(filterPaymentMode)}`;
    if (filterStartDate) url += `&startDate=${filterStartDate}`;
    if (filterEndDate) url += `&endDate=${filterEndDate}`;
    if (filterMinAmount) url += `&minAmount=${filterMinAmount}`;
    if (filterMaxAmount) url += `&maxAmount=${filterMaxAmount}`;

    window.open(url, "_blank");
  };

  const chartData = useMemo(() => {
    if (!dashboardData || !dashboardData.trend) return [];
    return dashboardData.trend;
  }, [dashboardData]);

  const pieData = useMemo(() => {
    if (!dashboardData || !dashboardData.byCategory) return [];
    return dashboardData.byCategory.filter((c: any) => c.amount > 0);
  }, [dashboardData]);

  const paymentBreakdownData = useMemo(() => {
    if (!dashboardData || !dashboardData.byPaymentMode) return [];
    return dashboardData.byPaymentMode.filter((c: any) => c.amount > 0);
  }, [dashboardData]);

  return (
    <DashboardLayout title="Expense Management">
      {/* Tab Navigation header */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 mb-6 gap-4">
        <div className="flex space-x-1 bg-white/5 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === "dashboard" ? "bg-red-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === "list" ? "bg-red-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
            }`}
          >
            Expenses Log
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === "reports" ? "bg-red-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
            }`}
          >
            Reporting
          </button>
          {currentUser?.role === "admin" && (
            <button
              onClick={() => setActiveTab("setup")}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                activeTab === "setup" ? "bg-red-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
              }`}
            >
              Configurations
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={triggerExport}
            className="flex items-center gap-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-2xl">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {/* DASHBOARD TAB */}
      {activeTab === "dashboard" && dashboardData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total Today" value={`Rs. ${dashboardData.totalToday}`} color="text-red-400" />
            <KpiCard label="Total This Month" value={`Rs. ${dashboardData.totalThisMonth}`} color="text-white" />
            <KpiCard label="UPI Expenses (Month)" value={`Rs. ${dashboardData.upiExpensesThisMonth}`} color="text-blue-400" />
            <KpiCard label="Cash Expenses (Month)" value={`Rs. ${dashboardData.cashExpensesThisMonth}`} color="text-green-400" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Trend Area Chart */}
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Expense Trend</h3>
                  <p className="text-sm text-gray-400">Trend graph over last 6 months</p>
                </div>
                <TrendingUp className="text-red-400 w-5 h-5" />
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="month" stroke="#71717a" fontSize={12} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={12} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#09090b", border: "1px solid #27272a", borderRadius: "12px" }}
                      labelStyle={{ color: "#a1a1aa" }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Category Pie Chart */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Category wise</h3>
                  <p className="text-sm text-gray-400">Expense category mix this month</p>
                </div>
                <Tag className="text-yellow-400 w-5 h-5" />
              </div>
              <div className="h-60 flex items-center justify-center">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={70} fill="#8884d8" label={(entry: any) => entry.category}>
                        {pieData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#09090b", border: "1px solid #27272a", borderRadius: "12px" }}
                        labelStyle={{ color: "#a1a1aa" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-500">No category statistics found.</p>
                )}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Mode Breakdown */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Payment Mode Breakdown</h3>
                  <p className="text-sm text-gray-400">Payment mode usage this month</p>
                </div>
                <CreditCard className="text-blue-400 w-5 h-5" />
              </div>
              <div className="h-60">
                {paymentBreakdownData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentBreakdownData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="paymentMode" stroke="#71717a" fontSize={11} tickLine={false} />
                      <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#09090b", border: "1px solid #27272a", borderRadius: "12px" }}
                      />
                      <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                        {paymentBreakdownData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-500">No payment mode statistics found.</p>
                )}
              </div>
            </Card>

            {/* Top Vendors */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Top Vendors</h3>
                  <p className="text-sm text-gray-400">Highest payouts in current history</p>
                </div>
                <User className="text-green-400 w-5 h-5" />
              </div>
              <div className="space-y-4">
                {dashboardData.topVendors.length > 0 ? (
                  dashboardData.topVendors.map((vendor: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3.5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-red-600/10 text-red-500 flex items-center justify-center font-bold text-sm">
                          {i + 1}
                        </div>
                        <span className="font-semibold text-white">{vendor.vendor}</span>
                      </div>
                      <span className="font-bold text-red-400">Rs. {vendor.amount}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No vendor statistics found.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* LIST TAB (WITH FILTER PANEL & QUICK FORM ENTRY) */}
      {activeTab === "list" && (
        <div className="space-y-6">
          {/* Quick Expense Logging / Edit Panel */}
          <Card>
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-red-500" />
                {isEditing ? "Edit Expense Entry" : "Log New Expense"}
              </h3>
              <button
                type="button"
                onClick={() => setShowFullForm(!showFullForm)}
                className="text-sm text-red-400 font-semibold hover:underline"
              >
                {showFullForm ? "Show Quick Entry Fields" : "Expand All Fields"}
              </button>
            </div>

            <form onSubmit={saveExpense} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-400 mb-1">Date *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="bg-black/40 border border-white/10 p-3 rounded-xl text-white focus:outline-none focus:border-red-600"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-400 mb-1">Amount (Rs.) *</label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="bg-black/40 border border-white/10 p-3 rounded-xl text-white focus:outline-none focus:border-red-600"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-400 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="bg-black/40 border border-white/10 p-3 rounded-xl text-white focus:outline-none focus:border-red-600"
                  >
                    <option value="">Select Category</option>
                    {categories
                      .filter((c) => !c.disabled)
                      .map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-400 mb-1">Payment Mode</label>
                  <select
                    value={formPaymentMode}
                    onChange={(e) => setFormPaymentMode(e.target.value)}
                    className="bg-black/40 border border-white/10 p-3 rounded-xl text-white focus:outline-none focus:border-red-600"
                  >
                    <option value="">Select Payment Mode</option>
                    {paymentModes
                      .filter((p) => !p.disabled)
                      .map((mode) => (
                        <option key={mode.id} value={mode.name}>
                          {mode.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Advanced Fields */}
              {showFullForm && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/5">
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-400 mb-1">Paid To / Vendor</label>
                    <input
                      type="text"
                      placeholder="Vendor / entity paid"
                      value={formPaidTo}
                      onChange={(e) => setFormPaidTo(e.target.value)}
                      className="bg-black/40 border border-white/10 p-3 rounded-xl text-white focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-400 mb-1">Invoice / Receipt Number</label>
                    <input
                      type="text"
                      placeholder="Invoice ID"
                      value={formInvoiceNumber}
                      onChange={(e) => setFormInvoiceNumber(e.target.value)}
                      className="bg-black/40 border border-white/10 p-3 rounded-xl text-white focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-400 mb-1">Vendor GSTIN</label>
                    <input
                      type="text"
                      placeholder="Vendor GST ID"
                      value={formVendorGSTNumber}
                      onChange={(e) => setFormVendorGSTNumber(e.target.value)}
                      className="bg-black/40 border border-white/10 p-3 rounded-xl text-white focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-400 mb-1">Short Description</label>
                    <input
                      type="text"
                      placeholder="Description details"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="bg-black/40 border border-white/10 p-3 rounded-xl text-white focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <div className="flex flex-col md:col-span-2">
                    <label className="text-xs text-gray-400 mb-1">Notes</label>
                    <textarea
                      placeholder="Additional notes"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="bg-black/40 border border-white/10 p-3 rounded-xl text-white focus:outline-none focus:border-red-600 h-12 resize-none"
                    />
                  </div>
                  <div className="flex flex-col md:col-span-2">
                    <label className="text-xs text-gray-400 mb-1">Attachments (Receipt, Bill, Invoice)</label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer">
                        <Upload className="w-4 h-4" />
                        Choose file
                        <input type="file" onChange={handleAttachmentUpload} className="hidden" accept="image/*,application/pdf" />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {formAttachments.map((att, i) => (
                          <div key={i} className="flex items-center bg-red-600/10 text-red-400 px-3 py-1.5 rounded-lg text-xs gap-2 border border-red-500/20">
                            <span className="truncate max-w-[120px]">{att.url.split("/").pop()}</span>
                            <button
                              type="button"
                              onClick={() => setFormAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                              className="hover:text-red-300"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/5">
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition shadow-lg shadow-red-600/10"
                >
                  {isEditing ? "Update Entry" : "Log Expense"}
                </button>
              </div>
            </form>
          </Card>

          {/* Filtering and search panel */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-1 h-fit">
              <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4 text-red-500" />
                Refine List
              </h4>

              <div className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-400 mb-1">Search Keywords</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Description, vendor, category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 pl-9 pr-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-red-600"
                    />
                    <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs text-gray-400 mb-1">Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-red-600"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs text-gray-400 mb-1">Payment Mode</label>
                  <select
                    value={filterPaymentMode}
                    onChange={(e) => setFilterPaymentMode(e.target.value)}
                    className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-red-600"
                  >
                    <option value="">All Payment Modes</option>
                    {paymentModes.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-400 mb-1">Min Rs.</label>
                    <input
                      type="number"
                      value={filterMinAmount}
                      onChange={(e) => setFilterMinAmount(e.target.value)}
                      className="bg-black/40 border border-white/10 p-2 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-400 mb-1">Max Rs.</label>
                    <input
                      type="number"
                      value={filterMaxAmount}
                      onChange={(e) => setFilterMaxAmount(e.target.value)}
                      className="bg-black/40 border border-white/10 p-2 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-400 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="bg-black/40 border border-white/10 p-2 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs text-gray-400 mb-1">End Date</label>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="bg-black/40 border border-white/10 p-2 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterCategory("");
                    setFilterPaymentMode("");
                    setFilterStartDate("");
                    setFilterEndDate("");
                    setFilterMinAmount("");
                    setFilterMaxAmount("");
                  }}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-semibold py-2.5 rounded-xl transition"
                >
                  Clear Filters
                </button>
              </div>
            </Card>

            {/* List panel */}
            <div className="lg:col-span-3 space-y-4">
              {expenses.length === 0 ? (
                <Card className="text-center py-10">
                  <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No expense records found matching criteria.</p>
                </Card>
              ) : (
                expenses.map((expense) => (
                  <Card key={expense.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/5 hover:border-white/10 transition">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 bg-white/5 text-white/80 rounded-lg text-xs font-semibold">
                          {expense.category || "Uncategorized"}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(expense.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-white">
                        {expense.paidTo ? `Paid to ${expense.paidTo}` : "Expense log entry"}
                      </h4>
                      {expense.description && <p className="text-sm text-gray-400">{expense.description}</p>}
                      {expense.notes && <p className="text-xs text-gray-500 italic">Notes: {expense.notes}</p>}
                      <div className="flex items-center space-x-3 pt-2 text-xs text-gray-500">
                        <span>Mode: {expense.paymentMode || "Unspecified"}</span>
                        {expense.invoiceNumber && <span>Invoice: {expense.invoiceNumber}</span>}
                        {expense.attachments && expense.attachments.length > 0 && (
                          <span className="text-red-400 flex items-center gap-1 font-semibold">
                            <Eye className="w-3.5 h-3.5" />
                            {expense.attachments.length} attachment(s)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex md:flex-col items-end justify-between md:justify-center gap-2">
                      <div className="text-right">
                        <span className="text-2xl font-black text-red-500">Rs. {expense.amount}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => startEdit(expense)}
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition text-gray-400 hover:text-white"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {currentUser?.role === "admin" && (
                          <button
                            onClick={() => deleteExpense(expense.id)}
                            className="p-2 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* REPORTING TAB */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white/5 p-4 rounded-3xl border border-white/5">
            <div className="flex items-center space-x-4">
              <div className="flex flex-col">
                <label className="text-xs text-gray-400 mb-1">Report Target</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-red-600"
                >
                  <option value="monthly">Monthly Expense Report</option>
                  <option value="category">Category Wise Report</option>
                  <option value="vendor">Vendor Wise Payouts</option>
                  <option value="cash-flow">Cash Flow Breakdown</option>
                  <option value="profit-vs-expense">Profit vs Expense Analysis</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-400 mb-1">Calendar Year</label>
                <select
                  value={reportYear}
                  onChange={(e) => setReportYear(Number(e.target.value))}
                  className="bg-black/40 border border-white/10 p-2.5 rounded-xl text-sm text-white focus:outline-none"
                >
                  {[2025, 2026, 2027, 2028].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={loadReport}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition"
            >
              Recalculate
            </button>
          </div>

          {reportLoading ? (
            <Card className="text-center py-20">Loading report statistics...</Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Report Chart */}
              <Card className="lg:col-span-2">
                <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-red-500" />
                  Visual Analysis
                </h4>
                <div className="h-80">
                  {reportData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis
                          dataKey={
                            reportType === "monthly" || reportType === "profit-vs-expense"
                              ? "month"
                              : reportType === "category"
                              ? "category"
                              : reportType === "vendor"
                              ? "vendor"
                              : "paymentMode"
                          }
                          stroke="#71717a"
                          fontSize={11}
                          tickLine={false}
                        />
                        <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: "#09090b", border: "1px solid #27272a", borderRadius: "12px" }} />
                        {reportType === "profit-vs-expense" ? (
                          <>
                            <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]} />
                          </>
                        ) : (
                          <Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">No records compiled.</div>
                  )}
                </div>
              </Card>

              {/* Data Table */}
              <Card>
                <h4 className="text-lg font-bold text-white mb-6">Data Sheet</h4>
                <div className="overflow-y-auto max-h-[320px] space-y-3">
                  {reportData.map((row, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-2xl">
                      <span className="font-semibold text-gray-300">
                        {row.month || row.category || row.vendor || row.paymentMode}
                      </span>
                      {reportType === "profit-vs-expense" ? (
                        <div className="text-right text-xs">
                          <div className="text-green-400 font-bold">Rev: Rs. {row.revenue}</div>
                          <div className="text-red-400 font-bold">Exp: Rs. {row.expense}</div>
                        </div>
                      ) : (
                        <span className="font-bold text-white">Rs. {row.amount}</span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* SETUP CONFIG TAB */}
      {activeTab === "setup" && currentUser?.role === "admin" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Categories setup */}
          <Card>
            <h4 className="text-lg font-bold text-white mb-4">Manage Categories</h4>
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="New Category Name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 p-3 rounded-xl text-sm focus:outline-none"
              />
              <button
                onClick={addCategory}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 rounded-xl text-sm transition"
              >
                Add
              </button>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/5">
                  <span className={`font-semibold ${c.disabled ? "text-gray-600 line-through" : "text-white"}`}>{c.name}</span>
                  <button
                    onClick={() => toggleCategoryStatus(c.id, c.disabled)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      c.disabled ? "bg-green-600/20 text-green-500 hover:bg-green-600/30" : "bg-red-600/20 text-red-500 hover:bg-red-600/30"
                    }`}
                  >
                    {c.disabled ? "Enable" : "Disable"}
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Payment modes setup */}
          <Card>
            <h4 className="text-lg font-bold text-white mb-4">Manage Payment Modes</h4>
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="New Mode Name"
                value={newModeName}
                onChange={(e) => setNewModeName(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 p-3 rounded-xl text-sm focus:outline-none"
              />
              <button
                onClick={addPaymentMode}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 rounded-xl text-sm transition"
              >
                Add
              </button>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {paymentModes.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/5">
                  <span className={`font-semibold ${p.disabled ? "text-gray-600 line-through" : "text-white"}`}>{p.name}</span>
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/expenses/payment-modes/${p.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ disabled: !p.disabled }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          setPaymentModes((prev) =>
                            prev.map((m) => (m.id === p.id ? { ...m, disabled: !p.disabled } : m))
                          );
                        }
                      } catch {
                        setError("Failed to modify payment mode status.");
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      p.disabled ? "bg-green-600/20 text-green-500 hover:bg-green-600/30" : "bg-red-600/20 text-red-500 hover:bg-red-600/30"
                    }`}
                  >
                    {p.disabled ? "Enable" : "Disable"}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* CSV IMPORT WIZARD MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Upload className="w-5 h-5 text-red-500" />
                CSV Expense Upload Wizard
              </h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setCsvFile(null);
                  setCsvPreview(null);
                  setImportResult(null);
                }}
                className="p-1 hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {!csvFile && !importResult && (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-3xl p-12 hover:border-red-600/50 transition bg-black/20">
                <FileText className="w-16 h-16 text-gray-500 mb-4" />
                <p className="text-lg font-semibold mb-2">Drag and drop your expense CSV file here</p>
                <p className="text-sm text-gray-400 mb-6">File headers must align with date & amount fields.</p>
                <label className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition cursor-pointer">
                  Browse Files
                  <input type="file" onChange={handleCsvSelect} accept=".csv" className="hidden" />
                </label>
              </div>
            )}

            {csvFile && csvPreview && !importResult && (
              <div className="space-y-6">
                {/* Column Mapping Section */}
                <div>
                  <h4 className="font-bold text-white mb-3">1. Map CSV Headers to DB Columns</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {Object.keys(mapping).map((field) => (
                      <div key={field} className="flex flex-col">
                        <label className="text-xs text-gray-400 capitalize mb-1">{field === "paidTo" ? "Paid To / Vendor" : field}</label>
                        <select
                          value={mapping[field]}
                          onChange={(e) => setMapping((prev: any) => ({ ...prev, [field]: e.target.value }))}
                          className="bg-black/40 border border-white/10 p-2 rounded-lg text-xs"
                        >
                          <option value="">-- Ignored --</option>
                          {csvPreview.headers.map((h: string) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Duplicate detection & Action controls */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dupDetection}
                      onChange={(e) => setDupDetection(e.target.checked)}
                      className="w-4 h-4 accent-red-600 rounded bg-black/40 border-white/10"
                    />
                    <span className="text-sm font-semibold text-gray-300">Enable duplicate detection checks</span>
                  </label>
                  <button
                    onClick={runCsvImport}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition"
                  >
                    Confirm Import
                  </button>
                </div>

                {/* Grid Preview Section */}
                <div>
                  <h4 className="font-bold text-white mb-3">2. Preview CSV Content (First 20 records)</h4>
                  <div className="overflow-x-auto rounded-2xl border border-white/10">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/10">
                          {csvPreview.headers.map((h: string) => (
                            <th key={h} className="p-3 font-bold text-gray-300">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.previewRows.map((row: any, i: number) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                            {csvPreview.headers.map((h: string) => (
                              <td key={h} className="p-3 text-gray-400">
                                {row[h]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {importResult && (
              <div className="space-y-6 text-center py-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                <h4 className="text-2xl font-black text-white">Import Complete!</h4>
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl">
                    <p className="text-xs text-gray-400">Imported Rows</p>
                    <p className="text-3xl font-black text-green-500">{importResult.importedCount}</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
                    <p className="text-xs text-gray-400">Invalid / Skipped Rows</p>
                    <p className="text-3xl font-black text-red-500">{importResult.invalidCount}</p>
                  </div>
                </div>

                {importResult.invalidRows && importResult.invalidRows.length > 0 && (
                  <div className="text-left max-w-2xl mx-auto space-y-2 mt-6">
                    <h5 className="font-bold text-sm text-white">Validation Errors / Skipped Items Summary</h5>
                    <div className="max-h-[200px] overflow-y-auto bg-black/40 p-4 rounded-2xl border border-white/5 space-y-2">
                      {importResult.invalidRows.map((err: any, idx: number) => (
                        <p key={idx} className="text-xs text-red-400 font-medium">
                          Line {err.rowNumber}: {err.reason}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setCsvFile(null);
                    setCsvPreview(null);
                    setImportResult(null);
                  }}
                  className="bg-white/5 hover:bg-white/10 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition mt-6"
                >
                  Close Wizard
                </button>
              </div>
            )}
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
