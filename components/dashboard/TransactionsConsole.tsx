"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Search,
  Download,
  Upload,
  Trash2,
  Edit,
  Filter,
  Calendar,
  DollarSign,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  X,
  User,
  Clock,
  Tag,
  Car,
  FileText
} from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  amount: number;
  paymentMode: string;
  time?: string | null;
  customerName?: string | null;
  customerMobile?: string | null;
  customerId?: string | null;
  vehicleNumber?: string | null;
  vehicleType?: string | null;
  serviceOpted?: string | null;
  addonServices?: string | null;
  assignedEmployee?: string | null;
  discountAmount?: number | null;
  finalAmount?: number | null;
  notes?: string | null;
  invoiceId: string;
  createdAt: string;
  createdBy?: string | null;
}

const VEHICLE_OPTIONS = [
  { value: "Bike", label: "Bike" },
  { value: "Hatchback", label: "Hatchback" },
  { value: "Sedan", label: "Sedan" },
  { value: "SUV", label: "SUV" },
  { value: "MUV", label: "MUV" },
  { value: "Truck", label: "Truck" },
  { value: "Van", label: "Van" },
  { value: "Traveller", label: "Traveller" },
  { value: "Bus", label: "Bus" },
  { value: "E-Rickshaw", label: "E-Rickshaw" },
  { value: "Tractor", label: "Tractor" },
  { value: "Others", label: "Others" }
];

const matchServiceToVehicle = (serviceName: string, vehicleType: string) => {
  if (!vehicleType) return false;
  const match = serviceName.match(/^(.+?)\s*-\s*([A-Za-z0-9\/\-\s]+)$/i);
  if (!match) return true; // Include services without a vehicle suffix as they are generic/All
  const svcType = match[2].trim().toLowerCase();
  const parts = svcType.split(/[\/,]/).map(p => p.trim());
  return parts.includes(vehicleType.toLowerCase()) || parts.includes("all");
};

const DEFAULT_DETECTION_RULES = [
  { serviceOpted: "Bike Wash", vehicleType: "Bike", minAmount: 30, maxAmount: 50 },
  { serviceOpted: "Water Wash", vehicleType: "All", minAmount: 70, maxAmount: 100 },
  { serviceOpted: "Express Wash", vehicleType: "All", minAmount: 120, maxAmount: 150 },
  { serviceOpted: "Classic Wash", vehicleType: "Hatchback/Sedan", minAmount: 160, maxAmount: 200 },
  { serviceOpted: "Classic Wash", vehicleType: "SUV", minAmount: 220, maxAmount: 250 },
  { serviceOpted: "Premium Wash", vehicleType: "Hatchback", minAmount: 260, maxAmount: 300 },
  { serviceOpted: "Premium Wash", vehicleType: "Sedan", minAmount: 320, maxAmount: 350 },
  { serviceOpted: "Premium Wash", vehicleType: "SUV", minAmount: 360, maxAmount: 400 },
  { serviceOpted: "Premium + Wax", vehicleType: "Sedan", minAmount: 449, maxAmount: 450 },
  { serviceOpted: "Premium + Wax", vehicleType: "SUV", minAmount: 499, maxAmount: 500 },
  { serviceOpted: "Interior Dry Clean", vehicleType: "Hatchback/Sedan", minAmount: 799, maxAmount: 1000 },
  { serviceOpted: "Interior Dry Clean", vehicleType: "SUV", minAmount: 1001, maxAmount: 1200 },
  { serviceOpted: "Paint Correction", vehicleType: "Hatchback/Sedan", minAmount: 1499, maxAmount: 1499 },
  { serviceOpted: "Paint Correction", vehicleType: "SUV", minAmount: 1799, maxAmount: 1799 },
  { serviceOpted: "Dealer Monthly", vehicleType: "Bulk", minAmount: 2000, maxAmount: 999999 }
];

export default function TransactionsConsole() {
  const [activeSubTab, setActiveSubTab] = useState<"list" | "quick-entry" | "import">("list");
  
  // Data lists
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [customers, setCustomers] = useState<{ id: string; customerName: string; phoneNumber?: string }[]>([]);
  const [services, setServices] = useState<{ id: string; name: string; category?: string | null; isActive: boolean }[]>([]);
  const [detectionRules, setDetectionRules] = useState<any[]>([]);

  // Filter form states
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterVehicle, setFilterVehicle] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterPaymentMode, setFilterPaymentMode] = useState("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Quick Entry states
  const [quickDate, setQuickDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [quickAmount, setQuickAmount] = useState("");
  const [quickPaymentMode, setQuickPaymentMode] = useState("UPI");
  const [quickTime, setQuickTime] = useState("");
  const [quickCustomerName, setQuickCustomerName] = useState("");
  const [quickCustomerMobile, setQuickCustomerMobile] = useState("");
  const [quickVehicleNumber, setQuickVehicleNumber] = useState("");
  const [quickVehicleType, setQuickVehicleType] = useState("");
  const [quickServiceOpted, setQuickServiceOpted] = useState("");
  const [quickAddonServices, setQuickAddonServices] = useState("");
  const [quickAssignedEmployee, setQuickAssignedEmployee] = useState("");
  const [quickDiscountAmount, setQuickDiscountAmount] = useState("");
  const [quickNotes, setQuickNotes] = useState("");
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Edit Drawer states
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editPaymentMode, setEditPaymentMode] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editCustomerMobile, setEditCustomerMobile] = useState("");
  const [editVehicleNumber, setEditVehicleNumber] = useState("");
  const [editVehicleType, setEditVehicleType] = useState("");
  const [editServiceOpted, setEditServiceOpted] = useState("");
  const [editAddonServices, setEditAddonServices] = useState("");
  const [editAssignedEmployee, setEditAssignedEmployee] = useState("");
  const [editDiscountAmount, setEditDiscountAmount] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // CSV Import States
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<string, number>>({});
  const [importPreview, setImportPreview] = useState<Record<string, any>[]>([]);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState(false);
  const [importResult, setImportResult] = useState<{ successCount: number; failCount: number; errors: string[] } | null>(null);

  // Fetch functions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filterStartDate) queryParams.set("startDate", filterStartDate);
      if (filterEndDate) queryParams.set("endDate", filterEndDate);
      if (filterCustomer) queryParams.set("customerName", filterCustomer);
      if (filterVehicle) queryParams.set("vehicleNumber", filterVehicle);
      if (filterEmployee) queryParams.set("assignedEmployee", filterEmployee);
      if (filterPaymentMode && filterPaymentMode !== "all") queryParams.set("paymentMode", filterPaymentMode);

      const res = await fetch(`/api/transactions?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error("Error loading transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [empRes, custRes, svcRes, settingsRes] = await Promise.all([
        fetch("/api/employees"),
        fetch("/api/crm/customers"),
        fetch("/api/services"),
        fetch("/api/settings"),
      ]);
      const empData = await empRes.json();
      const custData = await custRes.json();
      const svcData = await svcRes.json();
      const settingsData = await settingsRes.json();

      if (empData.employees) setEmployees(empData.employees);
      if (custData.customers) setCustomers(custData.customers);
      if (svcData.services) setServices(svcData.services);
      if (settingsData.success && settingsData.settings) {
        const rulesSetting = settingsData.settings.find((s: any) => s.key === "auto_detection_rules");
        if (rulesSetting && rulesSetting.value) {
          try {
            setDetectionRules(JSON.parse(rulesSetting.value));
          } catch (e) {
            console.error("Error parsing auto detection rules:", e);
          }
        }
      }
    } catch (err) {
      console.error("Error loading metadata:", err);
    }
  };

  const autoDetectServiceAndVehicle = (amountStr: string, vehicleTypeVal: string, isEdit: boolean) => {
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount)) return;

    const rules = detectionRules.length > 0 ? detectionRules : DEFAULT_DETECTION_RULES;
    const match = rules.find((rule: any) => amount >= rule.minAmount && amount <= rule.maxAmount);

    if (match) {
      let targetVehicle = vehicleTypeVal;
      const ruleVehicle = match.vehicleType;
      
      if (ruleVehicle && ruleVehicle.toLowerCase() !== "all") {
        const parts = ruleVehicle.split(/[\/,]/).map((p: string) => p.trim().toLowerCase());
        const currentLower = vehicleTypeVal ? vehicleTypeVal.toLowerCase() : "";
        
        if (!parts.includes(currentLower)) {
          const firstOpt = ruleVehicle.split(/[\/,]/)[0].trim();
          targetVehicle = firstOpt.charAt(0).toUpperCase() + firstOpt.slice(1).toLowerCase();
        }
      }

      if (isEdit) {
        if (targetVehicle && targetVehicle !== editVehicleType) {
          setEditVehicleType(targetVehicle);
        }
      } else {
        if (targetVehicle && targetVehicle !== quickVehicleType) {
          setQuickVehicleType(targetVehicle);
        }
      }

      if (targetVehicle) {
        const matchingService = services.find(s => 
          s.isActive && 
          matchServiceToVehicle(s.name, targetVehicle) &&
          s.name.toLowerCase().includes(match.serviceOpted.toLowerCase())
        );

        if (matchingService) {
          if (isEdit) {
            setEditServiceOpted(matchingService.name);
          } else {
            setQuickServiceOpted(matchingService.name);
          }
        }
      }
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchMetadata();
  }, [filterStartDate, filterEndDate, filterCustomer, filterVehicle, filterEmployee, filterPaymentMode]);

  // Handle Quick Entry Submit
  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);
    if (!quickDate || !quickAmount || !quickPaymentMode) {
      setFormFeedback({ type: "error", message: "Date, Amount, and Payment Mode are required." });
      return;
    }

    setQuickSubmitting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: quickDate,
          amount: parseFloat(quickAmount),
          paymentMode: quickPaymentMode,
          time: quickTime,
          customerName: quickCustomerName,
          customerMobile: quickCustomerMobile,
          vehicleNumber: quickVehicleNumber,
          vehicleType: quickVehicleType,
          serviceOpted: quickServiceOpted,
          addonServices: quickAddonServices,
          assignedEmployee: quickAssignedEmployee,
          discountAmount: quickDiscountAmount ? parseFloat(quickDiscountAmount) : 0,
          notes: quickNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFormFeedback({ type: "success", message: `Transaction created successfully! Invoice ID: ${data.transaction.invoiceId}` });
        // Reset form
        setQuickAmount("");
        setQuickTime("");
        setQuickCustomerName("");
        setQuickCustomerMobile("");
        setQuickVehicleNumber("");
        setQuickVehicleType("");
        setQuickServiceOpted("");
        setQuickAddonServices("");
        setQuickAssignedEmployee("");
        setQuickDiscountAmount("");
        setQuickNotes("");
        fetchTransactions();
      } else {
        setFormFeedback({ type: "error", message: data.message || "Failed to save transaction." });
      }
    } catch (err: any) {
      setFormFeedback({ type: "error", message: err.message || "An unexpected error occurred." });
    } finally {
      setQuickSubmitting(false);
    }
  };

  // Handle Edit Click
  const openEditDrawer = (tx: Transaction) => {
    setEditingTransaction(tx);
    // Convert DD/MM/YYYY to YYYY-MM-DD for the HTML5 date input if needed
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(tx.date)) {
      const [day, month, year] = tx.date.split("/");
      setEditDate(`${year}-${month}-${day}`);
    } else {
      setEditDate(tx.date);
    }
    setEditAmount(String(tx.amount));
    setEditPaymentMode(tx.paymentMode);
    setEditTime(tx.time || "");
    setEditCustomerName(tx.customerName || "");
    setEditCustomerMobile(tx.customerMobile || "");
    setEditVehicleNumber(tx.vehicleNumber || "");
    setEditVehicleType(tx.vehicleType || "");
    setEditServiceOpted(tx.serviceOpted || "");
    setEditAddonServices(tx.addonServices || "");
    setEditAssignedEmployee(tx.assignedEmployee || "");
    setEditDiscountAmount(tx.discountAmount ? String(tx.discountAmount) : "");
    setEditNotes(tx.notes || "");
  };

  // Handle Edit Save
  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    // Convert date back to DD/MM/YYYY if the original transaction date used that format
    const isDdMmYyyy = /^\d{2}\/\d{2}\/\d{4}$/.test(editingTransaction.date);
    let finalDate = editDate;
    if (isDdMmYyyy && /^\d{4}-\d{2}-\d{2}$/.test(editDate)) {
      const [year, month, day] = editDate.split("-");
      finalDate = `${day}/${month}/${year}`;
    }

    setEditSaving(true);
    try {
      const res = await fetch(`/api/transactions/${editingTransaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: finalDate,
          amount: parseFloat(editAmount),
          paymentMode: editPaymentMode,
          time: editTime,
          customerName: editCustomerName,
          customerMobile: editCustomerMobile,
          vehicleNumber: editVehicleNumber,
          vehicleType: editVehicleType,
          serviceOpted: editServiceOpted,
          addonServices: editAddonServices,
          assignedEmployee: editAssignedEmployee,
          discountAmount: editDiscountAmount ? parseFloat(editDiscountAmount) : 0,
          notes: editNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Transaction updated successfully!");
        setEditingTransaction(null);
        fetchTransactions();
      } else {
        alert(data.message || "Failed to update transaction.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setEditSaving(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this transaction record?")) return;

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        alert("Transaction deleted.");
        fetchTransactions();
      } else {
        alert(data.message || "Failed to delete transaction.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // Native CSV Parser
  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let cell = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            cell += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cell += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          row.push(cell);
          cell = "";
        } else if (char === '\r' || char === '\n') {
          row.push(cell);
          cell = "";
          if (row.length > 0 && (row.length > 1 || row[0] !== "")) {
            lines.push(row);
          }
          row = [];
          if (char === '\r' && nextChar === '\n') {
            i++;
          }
        } else {
          cell += char;
        }
      }
    }
    if (cell !== "" || row.length > 0) {
      row.push(cell);
      lines.push(row);
    }
    return lines;
  };

  // File selection for Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setCsvFile(file);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length > 0) {
        const headers = parsed[0].map(h => h.trim());
        setCsvHeaders(headers);
        setCsvRows(parsed.slice(1));
        
        // Auto map obvious columns
        const initialMapping: Record<string, number> = {};
        const fields = [
          "date", "amount", "paymentMode", "customerName", "customerMobile",
          "customerId", "vehicleNumber", "vehicleType", "serviceOpted",
          "addonServices", "assignedEmployee", "discountAmount", "notes"
        ];

        fields.forEach(field => {
          const matchedIndex = headers.findIndex(h =>
            h.toLowerCase() === field.toLowerCase() ||
            h.toLowerCase().replace(/\s/g, "") === field.toLowerCase() ||
            (field === "paymentMode" && h.toLowerCase().includes("payment")) ||
            (field === "vehicleNumber" && h.toLowerCase().includes("vehicle")) ||
            (field === "customerName" && h.toLowerCase().includes("customer"))
          );
          if (matchedIndex !== -1) {
            initialMapping[field] = matchedIndex;
          }
        });

        setColumnMappings(initialMapping);
      }
    };
    reader.readAsText(file);
  };

  const handleMappingChange = (field: string, indexStr: string) => {
    const val = indexStr === "" ? -1 : parseInt(indexStr, 10);
    setColumnMappings(prev => {
      const next = { ...prev };
      if (val === -1) {
        delete next[field];
      } else {
        next[field] = val;
      }
      return next;
    });
  };

  // Preview & Validate CSV Data
  useEffect(() => {
    if (csvRows.length === 0) {
      setImportPreview([]);
      setImportWarnings([]);
      return;
    }

    const previewList: Record<string, any>[] = [];
    const warnings: string[] = [];
    const maxPreview = Math.min(csvRows.length, 20);

    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      const parsedRow: Record<string, any> = {};

      const fields = [
        "date", "amount", "paymentMode", "time", "customerName", "customerMobile",
        "customerId", "vehicleNumber", "vehicleType", "serviceOpted",
        "addonServices", "assignedEmployee", "discountAmount", "notes"
      ];

      fields.forEach(field => {
        const colIdx = columnMappings[field];
        parsedRow[field] = (colIdx !== undefined && colIdx < row.length) ? row[colIdx]?.trim() : "";
      });

      // Validations
      const rowNum = i + 1;
      if (!parsedRow.date) {
        warnings.push(`Row ${rowNum}: Missing Date`);
      }
      if (!parsedRow.amount) {
        warnings.push(`Row ${rowNum}: Missing Amount`);
      } else if (isNaN(parseInt(parsedRow.amount, 10))) {
        warnings.push(`Row ${rowNum}: Amount '${parsedRow.amount}' is not a valid number`);
      }
      if (!parsedRow.paymentMode) {
        warnings.push(`Row ${rowNum}: Missing Payment Mode`);
      }

      if (i < maxPreview) {
        previewList.push(parsedRow);
      }
    }

    setImportPreview(previewList);
    setImportWarnings(warnings);
  }, [csvRows, columnMappings]);

  // Execute Bulk Import
  const executeImport = async () => {
    if (csvRows.length === 0) return;
    setImportProgress(true);
    setImportResult(null);

    // Build items using current column mapping
    const transactionsToImport = csvRows.map(row => {
      const item: Record<string, any> = {};
      const fields = [
        "date", "amount", "paymentMode", "time", "customerName", "customerMobile",
        "customerId", "vehicleNumber", "vehicleType", "serviceOpted",
        "addonServices", "assignedEmployee", "discountAmount", "notes"
      ];

      fields.forEach(field => {
        const colIdx = columnMappings[field];
        item[field] = (colIdx !== undefined && colIdx < row.length) ? row[colIdx]?.trim() : undefined;
      });
      return item;
    });

    try {
      const res = await fetch("/api/transactions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: transactionsToImport }),
      });
      const data = await res.json();
      if (data.success) {
        setImportResult({
          successCount: data.successCount,
          failCount: data.failCount,
          errors: data.errors,
        });
        // Clear file details on complete success or complete show
        setCsvFile(null);
        setCsvHeaders([]);
        setCsvRows([]);
        fetchTransactions();
      } else {
        alert(data.message || "Failed to run import wizard.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setImportProgress(false);
    }
  };

  // CSV Export Trigger
  const handleExport = () => {
    if (transactions.length === 0) {
      alert("No transaction records available to export.");
      return;
    }

    const headers = [
      "Invoice ID", "Date", "Time", "Amount", "Discount Amount", "Final Amount",
      "Payment Mode", "Customer Name", "Customer Mobile", "Customer ID",
      "Vehicle Number", "Vehicle Type", "Service Opted", "Add-On Services",
      "Assigned Employee", "Created By", "Created At", "Notes"
    ];

    const csvContent = [
      headers.join(","),
      ...transactions.map(tx => {
        const row = [
          tx.invoiceId,
          tx.date,
          tx.time || "",
          tx.amount,
          tx.discountAmount || 0,
          tx.finalAmount || tx.amount,
          tx.paymentMode,
          tx.customerName || "",
          tx.customerMobile || "",
          tx.customerId || "",
          tx.vehicleNumber || "",
          tx.vehicleType || "",
          tx.serviceOpted || "",
          tx.addonServices || "",
          tx.assignedEmployee || "",
          tx.createdBy || "",
          tx.createdAt,
          (tx.notes || "").replace(/"/g, '""')
        ];
        return row.map(val => {
          const str = String(val);
          return str.includes(",") || str.includes("\n") || str.includes('"')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        }).join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Kleenkars_Transactions_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Local pagination logic
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return transactions.slice(start, start + itemsPerPage);
  }, [transactions, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0a0a0f]/60 p-6 rounded-3xl border border-white/5 backdrop-blur-xl">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
            Transactions & CRM Console
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Log financial entries, import historical CSV reports, and update transactional files.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveSubTab("list")}
            className={`px-5 py-2.5 rounded-2xl font-semibold transition text-sm flex items-center gap-2 ${
              activeSubTab === "list"
                ? "bg-red-600 text-white shadow-lg shadow-red-900/30"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <FileText size={16} /> Transaction List
          </button>
          <button
            onClick={() => setActiveSubTab("quick-entry")}
            className={`px-5 py-2.5 rounded-2xl font-semibold transition text-sm flex items-center gap-2 ${
              activeSubTab === "quick-entry"
                ? "bg-red-600 text-white shadow-lg shadow-red-900/30"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Plus size={16} /> Quick Entry
          </button>
          <button
            onClick={() => setActiveSubTab("import")}
            className={`px-5 py-2.5 rounded-2xl font-semibold transition text-sm flex items-center gap-2 ${
              activeSubTab === "import"
                ? "bg-red-600 text-white shadow-lg shadow-red-900/30"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Upload size={16} /> Import Wizard
          </button>
        </div>
      </div>

      {/* SUB TAB: TRANSACTION LIST */}
      {activeSubTab === "list" && (
        <div className="space-y-6">
          {/* SEARCH FILTERS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 bg-[#0a0a0f]/40 p-6 rounded-3xl border border-white/5 backdrop-blur-xl">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Start Date</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full bg-[#12121a]/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">End Date</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full bg-[#12121a]/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Customer Name</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter name..."
                  value={filterCustomer}
                  onChange={(e) => setFilterCustomer(e.target.value)}
                  className="w-full bg-[#12121a]/80 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition"
                />
                <Search size={14} className="absolute left-2.5 top-3 text-gray-500" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Vehicle Number</label>
              <input
                type="text"
                placeholder="Filter vehicle..."
                value={filterVehicle}
                onChange={(e) => setFilterVehicle(e.target.value)}
                className="w-full bg-[#12121a]/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Employee</label>
              <select
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                className="w-full bg-[#12121a]/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition"
              >
                <option value="">All Staff</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.name}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-400">Payment Mode</label>
              <select
                value={filterPaymentMode}
                onChange={(e) => setFilterPaymentMode(e.target.value)}
                className="w-full bg-[#12121a]/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition"
              >
                <option value="all">All Modes</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </div>
          </div>

          {/* DYNAMIC DATA TABLE CARD */}
          <div className="bg-[#0a0a0f]/60 p-6 rounded-3xl border border-white/5 backdrop-blur-xl relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold tracking-wide">Transaction Entries</h2>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 transition rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Download size={14} /> Export CSV
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-16 text-gray-400 gap-2">
                <RefreshCw className="animate-spin text-red-500" /> Fetching transactions...
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-16 text-gray-500 text-sm">
                No matching transactions found. Create a new entry or import custom records.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400">
                      <th className="py-3 px-4">Invoice ID</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Customer Details</th>
                      <th className="py-3 px-4">Vehicle</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Assignee</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {currentItems.map((tx) => (
                      <tr key={tx.id} className="hover:bg-white/5 transition">
                        <td className="py-3.5 px-4 font-mono text-red-400 text-xs">{tx.invoiceId}</td>
                        <td className="py-3.5 px-4">
                          <div>{tx.date}</div>
                          {tx.time && <div className="text-xs text-gray-500">{tx.time}</div>}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-200">{tx.customerName || "-"}</div>
                          {tx.customerMobile && <div className="text-xs text-gray-500">{tx.customerMobile}</div>}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-gray-200">{tx.vehicleNumber || "-"}</div>
                          {tx.vehicleType && <div className="text-xs text-gray-500">{tx.vehicleType}</div>}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-emerald-400">₹{tx.amount}</div>
                          {tx.discountAmount ? (
                            <div className="text-xs text-red-400">Disc: ₹{tx.discountAmount}</div>
                          ) : null}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-gray-300">
                            {tx.paymentMode}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-300">{tx.assignedEmployee || "-"}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => openEditDrawer(tx)}
                              className="p-1.5 hover:bg-white/15 text-blue-400 hover:text-white rounded-lg transition"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(tx.id)}
                              className="p-1.5 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-6 border-t border-white/10 pt-4">
                    <span className="text-xs text-gray-400">
                      Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, transactions.length)} of {transactions.length} rows
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white disabled:opacity-50 transition flex items-center"
                      >
                        <ChevronLeft size={14} /> Prev
                      </button>
                      <span className="px-3 py-1.5 text-xs text-gray-300 font-bold bg-[#12121a] rounded-lg">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-white disabled:opacity-50 transition flex items-center"
                      >
                        Next <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB TAB: QUICK ENTRY FORM */}
      {activeSubTab === "quick-entry" && (
        <div className="max-w-4xl mx-auto bg-[#0a0a0f]/60 p-8 rounded-3xl border border-white/5 backdrop-blur-xl">
          <h2 className="text-2xl font-bold tracking-wide mb-2 flex items-center gap-2">
            <Plus className="text-red-500" /> Quick Transaction Entry
          </h2>
          <p className="text-gray-400 text-xs mb-6">
            Fields marked with <span className="text-red-500 font-extrabold">*</span> are required. Others can be left empty for historical compatibility.
          </p>

          {formFeedback && (
            <div className={`p-4 mb-6 rounded-2xl border text-sm flex items-center gap-3 ${
              formFeedback.type === "success" 
                ? "bg-emerald-600/10 border-emerald-500/20 text-emerald-400" 
                : "bg-red-600/10 border-red-500/20 text-red-400"
            }`}>
              {formFeedback.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
              <div>{formFeedback.message}</div>
            </div>
          )}

          <form onSubmit={handleQuickSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* DATE */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  required
                  value={quickDate}
                  onChange={(e) => setQuickDate(e.target.value)}
                  className="w-full bg-[#12121a]/80 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition"
                />
              </div>

              {/* AMOUNT */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">Amount (INR) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-500">₹</span>
                  <input
                    type="number"
                    required
                    placeholder="Enter amount"
                    value={quickAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuickAmount(val);
                      autoDetectServiceAndVehicle(val, quickVehicleType, false);
                    }}
                    className="w-full bg-[#12121a]/80 border border-white/10 rounded-2xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-red-500 transition"
                  />
                </div>
              </div>

              {/* PAYMENT MODE */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">Payment Mode <span className="text-red-500">*</span></label>
                <select
                  required
                  value={quickPaymentMode}
                  onChange={(e) => setQuickPaymentMode(e.target.value)}
                  className="w-full bg-[#12121a]/80 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition"
                >
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>
            </div>

            <hr className="border-white/5 my-4" />
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Optional CRM Expansion Fields</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* TIME */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5"><Clock size={12} /> Time</label>
                <input
                  type="text"
                  placeholder="e.g. 14:30"
                  value={quickTime}
                  onChange={(e) => setQuickTime(e.target.value)}
                  className="w-full bg-[#12121a]/80 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition"
                />
              </div>

              {/* CUSTOMER NAME */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5"><User size={12} /> Customer Name</label>
                <input
                  type="text"
                  placeholder="Name"
                  value={quickCustomerName}
                  onChange={(e) => setQuickCustomerName(e.target.value)}
                  className="w-full bg-[#12121a]/80 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition"
                />
              </div>

              {/* CUSTOMER MOBILE */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5"><User size={12} /> Customer Mobile</label>
                <input
                  type="text"
                  placeholder="Mobile number"
                  value={quickCustomerMobile}
                  onChange={(e) => setQuickCustomerMobile(e.target.value)}
                  className="w-full bg-[#12121a]/80 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition"
                />
              </div>

              {/* VEHICLE NUMBER */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5"><Car size={12} /> Vehicle Number</label>
                <input
                  type="text"
                  placeholder="Vehicle number"
                  value={quickVehicleNumber}
                  onChange={(e) => setQuickVehicleNumber(e.target.value)}
                  className="w-full bg-[#12121a]/80 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition"
                />
              </div>

              {/* VEHICLE TYPE */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5"><Car size={12} /> Vehicle Type <span className="text-red-500">*</span></label>
                <select
                  required
                  value={quickVehicleType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuickVehicleType(val);
                    setQuickServiceOpted(""); // Reset service when vehicle type changes
                    if (val) {
                      autoDetectServiceAndVehicle(quickAmount, val, false);
                    }
                  }}
                  className="w-full bg-[#12121a]/80 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition"
                >
                  <option value="">Select Vehicle Type...</option>
                  {VEHICLE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* SERVICE OPTED */}
              {quickVehicleType && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5"><Tag size={12} /> Service Opted</label>
                  <select
                    value={quickServiceOpted}
                    onChange={(e) => setQuickServiceOpted(e.target.value)}
                    className="w-full bg-[#12121a]/80 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition"
                  >
                    <option value="">Select Service...</option>
                    <optgroup label="Washes">
                      {services.filter(s => s.category === "Wash" && s.isActive && matchServiceToVehicle(s.name, quickVehicleType)).map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Detailing">
                      {services.filter(s => s.category === "Detailing" && s.isActive && matchServiceToVehicle(s.name, quickVehicleType)).map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Other Services">
                      {services.filter(s => s.category !== "Wash" && s.category !== "Detailing" && s.category !== "Addon" && s.isActive && matchServiceToVehicle(s.name, quickVehicleType)).map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              )}

              {/* ADD-ON SERVICES */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5"><Tag size={12} /> Add-On Services</label>
                <input
                  type="text"
                  placeholder="Any add-on products"
                  value={quickAddonServices}
                  onChange={(e) => setQuickAddonServices(e.target.value)}
                  className="w-full bg-[#12121a]/80 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition"
                />
              </div>

              {/* ASSIGNED EMPLOYEE */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5"><User size={12} /> Assigned Employee</label>
                <select
                  value={quickAssignedEmployee}
                  onChange={(e) => setQuickAssignedEmployee(e.target.value)}
                  className="w-full bg-[#12121a]/80 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition"
                >
                  <option value="">No Staff Assigned</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              </div>

              {/* DISCOUNT AMOUNT */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">Discount Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-500">₹</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={quickDiscountAmount}
                    onChange={(e) => setQuickDiscountAmount(e.target.value)}
                    className="w-full bg-[#12121a]/80 border border-white/10 rounded-2xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-red-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* NOTES */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5"><FileText size={12} /> Notes / Remarks</label>
              <textarea
                rows={3}
                placeholder="Enter special notes..."
                value={quickNotes}
                onChange={(e) => setQuickNotes(e.target.value)}
                className="w-full bg-[#12121a]/80 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 transition resize-none"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={quickSubmitting}
                className="px-8 py-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 transition rounded-2xl font-bold text-sm tracking-wider flex items-center gap-2"
              >
                {quickSubmitting ? <RefreshCw className="animate-spin" size={16} /> : null}
                Save Transaction
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB TAB: CSV IMPORT WIZARD */}
      {activeSubTab === "import" && (
        <div className="space-y-6">
          <div className="bg-[#0a0a0f]/60 p-8 rounded-3xl border border-white/5 backdrop-blur-xl">
            <h2 className="text-2xl font-bold tracking-wide mb-2 flex items-center gap-2">
              <Upload className="text-red-500" /> CSV Import Wizard
            </h2>
            <p className="text-gray-400 text-xs mb-6">
              Upload a legacy spreadsheet, map file headers to database columns, preview row errors, and import successful rows.
            </p>

            <div className="border border-dashed border-white/10 hover:border-red-500/50 transition rounded-2xl p-8 flex flex-col items-center justify-center bg-[#12121a]/40 cursor-pointer relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload size={32} className="text-gray-500 mb-2" />
              <div className="text-sm font-bold text-gray-300">
                {csvFile ? csvFile.name : "Select CSV Report file"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {csvFile ? `${(csvFile.size / 1024).toFixed(1)} KB` : "Click or drag & drop .csv files"}
              </div>
            </div>

            {importResult && (
              <div className="mt-6 p-5 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-sm space-y-2">
                <h3 className="font-bold flex items-center gap-2">
                  <CheckCircle size={18} /> Bulk Import Completed
                </h3>
                <p>Imported Successfully: <strong>{importResult.successCount} rows</strong></p>
                <p>Skipped / Failed: <strong>{importResult.failCount} rows</strong></p>
                {importResult.errors.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-emerald-500/10 max-h-48 overflow-y-auto font-mono text-xs text-red-400 space-y-1">
                    <p className="font-bold mb-1">Import Warnings / Errors:</p>
                    {importResult.errors.slice(0, 10).map((err, idx) => (
                      <div key={idx}>- {err}</div>
                    ))}
                    {importResult.errors.length > 10 && <div>...and {importResult.errors.length - 10} more errors</div>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* COLUMN MAPPER CARD */}
          {csvHeaders.length > 0 && (
            <div className="bg-[#0a0a0f]/60 p-8 rounded-3xl border border-white/5 backdrop-blur-xl space-y-6">
              <h3 className="text-lg font-bold tracking-wide">Step 2: Map CSV Columns manually</h3>
              <p className="text-gray-400 text-xs">
                Select corresponding columns from your CSV headers. Only Date, Amount, and Payment Mode are mandatory.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { field: "date", label: "Date", required: true },
                  { field: "amount", label: "Amount", required: true },
                  { field: "paymentMode", label: "Payment Mode", required: true },
                  { field: "time", label: "Time", required: false },
                  { field: "customerName", label: "Customer Name", required: false },
                  { field: "customerMobile", label: "Customer Mobile", required: false },
                  { field: "customerId", label: "Customer ID", required: false },
                  { field: "vehicleNumber", label: "Vehicle Number", required: false },
                  { field: "vehicleType", label: "Vehicle Type", required: false },
                  { field: "serviceOpted", label: "Service Opted", required: false },
                  { field: "addonServices", label: "Add-On Services", required: false },
                  { field: "assignedEmployee", label: "Assigned Employee", required: false },
                  { field: "discountAmount", label: "Discount Amount", required: false },
                  { field: "notes", label: "Notes / Remarks", required: false }
                ].map(({ field, label, required }) => (
                  <div key={field} className="space-y-1">
                    <label className="text-xs font-semibold text-gray-300 flex justify-between">
                      <span>{label} {required && <span className="text-red-500">*</span>}</span>
                      <span className="text-gray-500 font-mono text-[10px]">{field}</span>
                    </label>
                    <select
                      value={columnMappings[field] !== undefined ? columnMappings[field] : ""}
                      onChange={(e) => handleMappingChange(field, e.target.value)}
                      className="w-full bg-[#12121a]/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition"
                    >
                      <option value="">[ Ignore / Empty ]</option>
                      {csvHeaders.map((header, idx) => (
                        <option key={idx} value={idx}>
                          Column {idx + 1}: {header}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* WARNING BOX */}
              {importWarnings.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-start gap-2.5 max-h-36 overflow-y-auto">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold">Validation Warnings ({importWarnings.length} issues found):</div>
                    <div className="text-[11px] font-mono">
                      {importWarnings.slice(0, 5).map((w, idx) => (
                        <div key={idx}>- {w}</div>
                      ))}
                      {importWarnings.length > 5 && <div>...and {importWarnings.length - 5} more rows have warnings (these invalid rows will be automatically skipped during import)</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* ROW PREVIEW */}
              {importPreview.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-300">File Preview (First {importPreview.length} rows)</h4>
                  <div className="overflow-x-auto rounded-xl border border-white/5">
                    <table className="w-full text-left border-collapse text-xs bg-[#12121a]/40">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/10 text-gray-400">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Amount</th>
                          <th className="py-2.5 px-3">Payment</th>
                          <th className="py-2.5 px-3">Customer</th>
                          <th className="py-2.5 px-3">Vehicle</th>
                          <th className="py-2.5 px-3">Service</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {importPreview.map((row, idx) => (
                          <tr key={idx} className="hover:bg-white/5 transition">
                            <td className="py-2 px-3">{row.date || <span className="text-red-500 italic">empty</span>}</td>
                            <td className="py-2 px-3">{row.amount || <span className="text-red-500 italic">empty</span>}</td>
                            <td className="py-2 px-3">{row.paymentMode || <span className="text-red-500 italic">empty</span>}</td>
                            <td className="py-2 px-3 text-gray-300">{row.customerName || "-"}</td>
                            <td className="py-2 px-3 text-gray-300">{row.vehicleNumber || "-"}</td>
                            <td className="py-2 px-3 text-gray-300">{row.serviceOpted || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  onClick={executeImport}
                  disabled={importProgress || csvRows.length === 0}
                  className="px-8 py-3 bg-red-600 hover:bg-red-500 disabled:bg-gray-700 transition rounded-2xl font-bold text-sm tracking-wider flex items-center gap-2"
                >
                  {importProgress ? <RefreshCw className="animate-spin" size={16} /> : <Upload size={16} />}
                  Import Valid Rows ({csvRows.length - importWarnings.filter(w => w.includes("Missing")).length} rows)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EDITING DRAWER / OVERLAY */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0d0d15] text-white p-6 shadow-2xl border-l border-white/10 h-full overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-6 border-b border-white/5">
                <h3 className="text-xl font-bold">Edit Transaction Details</h3>
                <button
                  onClick={() => setEditingTransaction(null)}
                  className="p-1 hover:bg-white/10 rounded-lg transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form id="edit-tx-form" onSubmit={handleEditSave} className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-semibold">Date</label>
                    <input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-semibold">Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 14:30"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-semibold">Amount (INR)</label>
                    <input
                      type="number"
                      required
                      value={editAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditAmount(val);
                        autoDetectServiceAndVehicle(val, editVehicleType, true);
                      }}
                      className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-semibold">Payment Mode</label>
                    <select
                      value={editPaymentMode}
                      onChange={(e) => setEditPaymentMode(e.target.value)}
                      className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-sm"
                    >
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Net Banking">Net Banking</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">Customer Name</label>
                  <input
                    type="text"
                    value={editCustomerName}
                    onChange={(e) => setEditCustomerName(e.target.value)}
                    className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">Customer Mobile</label>
                  <input
                    type="text"
                    value={editCustomerMobile}
                    onChange={(e) => setEditCustomerMobile(e.target.value)}
                    className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-semibold">Vehicle Number</label>
                    <input
                      type="text"
                      value={editVehicleNumber}
                      onChange={(e) => setEditVehicleNumber(e.target.value)}
                      className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-semibold">Vehicle Type</label>
                    <select
                      value={editVehicleType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditVehicleType(val);
                        setEditServiceOpted(""); // Reset service when vehicle type changes
                        if (val) {
                          autoDetectServiceAndVehicle(editAmount, val, true);
                        }
                      }}
                      className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="">Select Vehicle Type...</option>
                      {editVehicleType && !VEHICLE_OPTIONS.some(o => o.value.toLowerCase() === editVehicleType.toLowerCase()) && (
                        <option value={editVehicleType}>{editVehicleType} (Legacy)</option>
                      )}
                      {VEHICLE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* SERVICE OPTED */}
                {editVehicleType && (
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-semibold">Service Opted</label>
                    <select
                      value={editServiceOpted}
                      onChange={(e) => setEditServiceOpted(e.target.value)}
                      className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="">Select Service...</option>
                      {editServiceOpted && !services.some(s => s.name === editServiceOpted) && (
                        <option value={editServiceOpted}>{editServiceOpted} (Legacy/Unlisted)</option>
                      )}
                      <optgroup label="Washes">
                        {services.filter(s => s.category === "Wash" && matchServiceToVehicle(s.name, editVehicleType)).map(s => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Detailing">
                        {services.filter(s => s.category === "Detailing" && matchServiceToVehicle(s.name, editVehicleType)).map(s => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Other Services">
                        {services.filter(s => s.category !== "Wash" && s.category !== "Detailing" && s.category !== "Addon" && matchServiceToVehicle(s.name, editVehicleType)).map(s => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">Add-On Services</label>
                  <input
                    type="text"
                    value={editAddonServices}
                    onChange={(e) => setEditAddonServices(e.target.value)}
                    className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-semibold">Discount Amount</label>
                    <input
                      type="number"
                      value={editDiscountAmount}
                      onChange={(e) => setEditDiscountAmount(e.target.value)}
                      className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-semibold">Assigned Employee</label>
                    <select
                      value={editAssignedEmployee}
                      onChange={(e) => setEditAssignedEmployee(e.target.value)}
                      className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-sm"
                    >
                      <option value="">No Staff Assigned</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.name}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">Notes</label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full bg-[#181824] border border-white/10 rounded-xl px-3 py-2 text-sm resize-none"
                  />
                </div>
              </form>
            </div>

            <div className="flex gap-4 pt-6 border-t border-white/5 mt-6">
              <button
                type="button"
                onClick={() => setEditingTransaction(null)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 transition rounded-xl font-bold text-sm text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-tx-form"
                disabled={editSaving}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 transition rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
              >
                {editSaving ? <RefreshCw className="animate-spin" size={16} /> : null}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
