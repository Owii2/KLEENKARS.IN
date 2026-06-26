"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import { 
  Plus, 
  User, 
  Phone, 
  Clock, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  Briefcase, 
  TrendingUp, 
  Users, 
  Package, 
  FileText, 
  Settings, 
  LogOut, 
  CheckCircle, 
  Shield, 
  Edit, 
  Trash2, 
  Award, 
  ChevronRight, 
  Clipboard, 
  Star, 
  Activity, 
  AlertTriangle, 
  MapPin, 
  Check 
} from "lucide-react";

import TransactionsConsole from "@/components/dashboard/TransactionsConsole";

interface Booking {
  id: string;
  customerName: string;
  phoneNumber?: string;
  vehicleType: string;
  serviceType: string;
  bookingDate: string;
  bookingTime: string;
  totalCost: number;
  discount?: number;
  finalAmount?: number | null;
  status: string;
  assignedEmployeeId?: string | null;
  assignedEmployeeName?: string | null;
  pickupDrop?: boolean;
  paymentMode?: string;
  addons?: string[];
}

interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  role: string;
  status: string;
  salaryPerDay: number;
  shiftType: string | null;
  branch: string | null;
  jobsCompleted: number;
  revenueGenerated: number;
  customerRating: number;
  phoneNumber: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  category?: string | null;
  isActive: boolean;
}

interface Customer {
  id: string;
  customerName: string;
  phoneNumber: string;
  totalVisits: number;
  totalSpent: number;
  category?: string;
  lastVisit?: string;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minStock: number;
  costPerUnit: number;
  updatedAt: string;
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  paymentMode: string;
  notes: string | null;
  createdAt: string;
}

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  benefits: string | null;
}

interface Membership {
  id: string;
  customerId: string;
  membershipPlanId: string;
  startDate: string;
  endDate: string;
  status: string;
  customer: { customerName: string; phoneNumber: string };
  membershipPlan: { name: string };
}

interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  checkIn: string;
  checkOut: string | null;
  attendanceStatus: string;
}

const matchServiceToVehicle = (serviceName: string, vehicleType: string) => {
  if (!vehicleType) return false;
  const match = serviceName.match(/^(.+?)\s*-\s*([A-Za-z0-9\/\-\s]+)$/i);
  if (!match) return true; // Include services without a vehicle suffix as they are generic/All
  const svcType = match[2].trim().toLowerCase();
  const parts = svcType.split(/[\/,]/).map(p => p.trim());
  return parts.includes(vehicleType.toLowerCase()) || parts.includes("all");
};

const getBaseServiceName = (name: string) => {
  if (!name) return "";
  const parts = name.split(" - ");
  return parts[0].trim();
};

export default function ManagerPage() {
  const router = useRouter();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState("overview");

  // Core Data States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Create Booking Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [newVehicleType, setNewVehicleType] = useState("");
  const [newVehicleNumber, setNewVehicleNumber] = useState("");
  const [newServiceId, setNewServiceId] = useState("");
  const [newBookingDate, setNewBookingDate] = useState("");
  const [newBookingTime, setNewBookingTime] = useState("");
  const [newDiscount, setNewDiscount] = useState(0);
  const [newPaymentMode, setNewPaymentMode] = useState("Cash");

  // Edit Booking Modal States
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editStatus, setEditStatus] = useState("Pending");
  const [editDiscount, setEditDiscount] = useState(0);
  const [editTotalCost, setEditTotalCost] = useState(0);

  // Inventory Modal States
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [selectedInvItem, setSelectedInvItem] = useState<InventoryItem | null>(null);
  const [invName, setInvName] = useState("");
  const [invQty, setInvQty] = useState("");
  const [invUnit, setInvUnit] = useState("Liters");
  const [invMinStock, setInvMinStock] = useState("");
  const [invCost, setInvCost] = useState("");

  // Expense Modal States
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expCategory, setExpCategory] = useState("Supplies");
  const [expPayMode, setExpPayMode] = useState("Cash");
  const [expNotes, setExpNotes] = useState("");

  // Membership Assignment Form States
  const [assignCustomerId, setAssignCustomerId] = useState("");
  const [assignPlanId, setAssignPlanId] = useState("");
  const [assignStartDate, setAssignStartDate] = useState(new Date().toISOString().substring(0, 10));

  // Employee Scheduling Drawer States
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [empShift, setEmpShift] = useState("day");
  const [empBranch, setEmpBranch] = useState("");
  const [empSalary, setEmpSalary] = useState("");
  const [empStatus, setEmpStatus] = useState("active");

  // Roster Check-in Logs States (Attendance today)
  const [todayAttendance, setTodayAttendance] = useState<Record<string, string>>({}); // employeeId -> status

  // Fetch all dashboard data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        bookingRes, 
        employeeRes, 
        serviceRes, 
        customerRes, 
        invRes, 
        expRes, 
        plansRes, 
        membershipsRes,
        attendanceRes,
        transactionsRes
      ] = await Promise.all([
        fetch("/api/bookings").then(r => r.ok ? r.json() : { bookings: [] }),
        fetch("/api/employees").then(r => r.ok ? r.json() : { employees: [] }),
        fetch("/api/services").then(r => r.ok ? r.json() : { services: [] }),
        fetch("/api/customers").then(r => r.ok ? r.json() : { customers: [] }),
        fetch("/api/inventory").then(r => r.ok ? r.json() : { items: [] }),
        fetch("/api/expenses").then(r => r.ok ? r.json() : { expenses: [] }),
        fetch("/api/membership-plans").then(r => r.ok ? r.json() : { plans: [] }),
        fetch("/api/memberships").then(r => r.ok ? r.json() : { memberships: [] }),
        fetch("/api/attendance").then(r => r.ok ? r.json() : { attendance: [] }),
        fetch("/api/transactions").then(r => r.ok ? r.json() : { transactions: [] }),
      ]);

      setBookings(bookingRes.bookings || []);
      setEmployees(employeeRes.employees || []);
      setServices(serviceRes.services || []);
      setCustomers(customerRes.customers || []);
      setInventory(invRes.items || []);
      setExpenses(expRes.expenses || []);
      setMembershipPlans(plansRes.plans || []);
      setMemberships(membershipsRes.memberships || []);
      setAttendance(attendanceRes.attendance || []);
      setTransactions(transactionsRes.transactions || []);

      // Prep check-in logs for today
      const todayStr = new Date().toLocaleDateString('en-CA');
      const todayLogs = (attendanceRes.attendance || []).filter((a: Attendance) => {
        return new Date(a.checkIn).toLocaleDateString('en-CA') === todayStr;
      });
      const attendanceMap: Record<string, string> = {};
      todayLogs.forEach((l: Attendance) => {
        attendanceMap[l.employeeId] = l.attendanceStatus;
      });
      setTodayAttendance(attendanceMap);

    } catch (err) {
      console.error("Failed to load manager datasets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Prefill time/date on open
  useEffect(() => {
    if (showCreateModal) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setNewBookingTime(`${hours}:${minutes}`);
      setNewBookingDate(now.toLocaleDateString('en-CA'));
    }
  }, [showCreateModal]);

  // Handle logout
  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  // Staff Check-in submit handler
  const handleMarkAttendance = async (empId: string, empName: string, status: string) => {
    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: empId,
          employeeName: empName,
          attendanceStatus: status,
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        setTodayAttendance(prev => ({ ...prev, [empId]: status }));
        fetchData();
      } else {
        alert(resData.message || "Failed to log attendance");
      }
    } catch (error) {
      console.error(error);
      alert("Error marking attendance");
    }
  };

  // Assign staff to booking
  const assignBooking = async (bookingId: string, employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    if (!employee) return;
    try {
      await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedEmployeeId: employee.id,
          assignedEmployeeName: employee.name,
          status: "Assigned",
        }),
      });
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Error assigning staff");
    }
  };

  // Create Booking Submit
  const submitNewBooking = async () => {
    if (!newVehicleType) {
      alert("Vehicle Class is required.");
      return;
    }
    if (!newCustomerName || !newPhoneNumber || !newServiceId) {
      alert("Customer Name, Phone, and Service Package are required.");
      return;
    }

    const cleanPhone = newPhoneNumber.trim();
    const formattedPhone = cleanPhone.startsWith("+91") ? cleanPhone : cleanPhone.length === 10 ? `+91${cleanPhone}` : cleanPhone;
    const dateStr = newBookingDate || new Date().toLocaleDateString('en-CA');

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: newCustomerName,
          phoneNumber: formattedPhone,
          bookingDate: dateStr,
          bookingTime: newBookingTime,
          details: [
            {
              vehicleType: newVehicleType,
              serviceId: newServiceId,
              vehicleNumber: newVehicleNumber || undefined,
              addons: [],
            }
          ],
          pickupDrop: false,
          paymentMode: newPaymentMode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "Failed to create booking");
        return;
      }

      const newBooking = data.booking;
      const finalAmt = newBooking.totalCost - newDiscount;

      if (newDiscount > 0) {
        await fetch(`/api/bookings/${newBooking.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            discount: newDiscount,
            finalAmount: finalAmt >= 0 ? finalAmt : 0,
          }),
        });
      }

      setShowCreateModal(false);
      setNewCustomerName("");
      setNewPhoneNumber("");
      setNewVehicleNumber("");
      setNewVehicleType("");
      setNewServiceId("");
      setNewDiscount(0);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Error creating booking");
    }
  };

  // Edit booking submit
  const handleSaveEditBooking = async () => {
    if (!editingBooking) return;
    try {
      const finalAmt = editTotalCost - editDiscount;
      const res = await fetch(`/api/bookings/${editingBooking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          discount: editDiscount,
          totalCost: editTotalCost,
          finalAmount: finalAmt >= 0 ? finalAmt : 0,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("Booking details modified!");
        setEditingBooking(null);
        fetchData();
      } else {
        alert(data.message || "Failed to update booking");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete booking handler
  const handleDeleteBooking = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this booking record?")) return;
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("Booking deleted.");
        fetchData();
      } else {
        alert(data.message || "Failed to delete booking.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create / Adjust inventory item
  const handleSaveInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invName || invQty === "" || invCost === "") {
      alert("Please fill in Name, Quantity, and cost.");
      return;
    }

    const payload = {
      name: invName,
      quantity: Number(invQty),
      unit: invUnit,
      minStock: Number(invMinStock || 5),
      costPerUnit: Number(invCost),
    };

    try {
      const url = selectedInvItem ? `/api/inventory/${selectedInvItem.id}` : "/api/inventory";
      const method = selectedInvItem ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("Inventory adjusted!");
        setShowInventoryModal(false);
        fetchData();
      } else {
        alert(data.message || "Failed to save item.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create daily expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || !expAmount) {
      alert("Please provide Title and Amount.");
      return;
    }

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: expTitle,
          amount: Number(expAmount),
          category: expCategory,
          paymentMode: expPayMode,
          notes: expNotes || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("Expense voucher logged!");
        setExpTitle("");
        setExpAmount("");
        setExpNotes("");
        setShowExpenseModal(false);
        fetchData();
      } else {
        alert(data.message || "Failed to log expense.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Assign membership manually
  const handleAssignMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignCustomerId || !assignPlanId) {
      alert("Customer and Plan tier are required.");
      return;
    }

    try {
      const res = await fetch("/api/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: assignCustomerId,
          membershipPlanId: assignPlanId,
          startDate: assignStartDate,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("Membership assigned successfully!");
        setAssignCustomerId("");
        setAssignPlanId("");
        fetchData();
      } else {
        alert(data.message || "Failed to assign membership.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update employee schedule details
  const handleSaveScheduling = async () => {
    if (!selectedEmployee) return;
    try {
      const res = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftType: empShift,
          branch: empBranch,
          salaryPerDay: Number(empSalary),
          status: empStatus,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert("Employee scheduling details updated.");
        setSelectedEmployee(null);
        fetchData();
      } else {
        alert(data.message || "Failed to update scheduling.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Invoice downloader
  const handleDownloadInvoice = (booking: Booking) => {
    const doc = new jsPDF();
    doc.setFillColor(220, 38, 38); 
    doc.rect(0, 0, 210, 45, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text("KLEENKARS", 15, 25);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("PREMIUM VEHICLE DETAILING & WASH HUB", 15, 34);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("INVOICE RECEIPT", 145, 25);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Booking Ref: ${booking.id.substring(0, 8).toUpperCase()}`, 145, 32);
    doc.text(`Date: ${booking.bookingDate}`, 145, 37);

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("CUSTOMER DETAILS", 15, 60);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Name:       ${booking.customerName}`, 15, 68);
    doc.text(`Phone:      ${booking.phoneNumber || "N/A"}`, 15, 75);
    doc.text(`Schedule:   ${booking.bookingDate} at ${booking.bookingTime}`, 15, 82);

    doc.setFillColor(245, 245, 245);
    doc.rect(15, 95, 180, 10, "F");
    doc.setFont("helvetica", "bold");
    doc.text("Description of Wash Services", 20, 101);
    doc.text("Vehicle Class", 115, 101);
    doc.text("Amount (INR)", 160, 101);

    doc.setFont("helvetica", "normal");
    doc.line(15, 105, 195, 105);
    doc.text(booking.serviceType, 20, 115);
    doc.text(booking.vehicleType, 115, 115);
    doc.text(`Rs. ${booking.totalCost}`, 160, 115);

    let y = 125;
    if (booking.discount && booking.discount > 0) {
      doc.text(`Discount Applied: -Rs. ${booking.discount}`, 20, y);
      y += 10;
    }

    doc.line(15, y, 195, y);
    y += 12;

    doc.setFillColor(254, 242, 242);
    doc.rect(110, y - 6, 85, 12, "F");
    doc.setTextColor(220, 38, 38);
    doc.setFont("helvetica", "bold");
    doc.text("Total Paid:", 115, y + 2);
    doc.text(`Rs. ${booking.finalAmount ?? booking.totalCost}.00`, 150, y + 2);

    y += 30;
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "italic");
    doc.text("This receipt was generated by the Manager terminal.", 15, y);
    doc.text("Thank you for choosing Kleenkars detailing centers!", 15, y + 5);

    doc.save(`Kleenkars_Invoice_${booking.customerName.replace(/\s+/g, "_")}.pdf`);
  };

  // Filter Bookings Based on search and tabs
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch = 
        b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.phoneNumber && b.phoneNumber.includes(searchQuery));
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const currentMonthStr = useMemo(() => todayStr.slice(0, 7), [todayStr]);

  // Derived Calculations
  const statsOverview = useMemo(() => {
    const bookingRevenue = bookings.reduce((sum, b) => sum + (b.finalAmount ?? b.totalCost), 0);
    const transactionRevenue = transactions.reduce((sum, t) => sum + (t.finalAmount ?? t.amount), 0);
    const totalSales = bookingRevenue + transactionRevenue;
    const completedCount = bookings.filter((b) => b.status === "Completed").length;
    const activeStaffCount = employees.filter((e) => e.status === "active").length;
    const outgoingExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const todayRevenue = bookings
      .filter((b) => b.bookingDate === todayStr)
      .reduce((sum, b) => sum + (b.finalAmount ?? b.totalCost), 0) + 
      transactions
      .filter((t) => t.date === todayStr)
      .reduce((sum, t) => sum + (t.finalAmount ?? t.amount), 0);

    const monthlyRevTotal = bookings
      .filter((b) => b.bookingDate && b.bookingDate.startsWith(currentMonthStr))
      .reduce((sum, b) => sum + (b.finalAmount ?? b.totalCost), 0) + 
      transactions
      .filter((t) => t.date && t.date.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + (t.finalAmount ?? t.amount), 0);

    const cashRevenue = bookings
      .filter((b) => b.paymentMode === "Cash")
      .reduce((sum, b) => sum + (b.finalAmount ?? b.totalCost), 0) + 
      transactions
      .filter((t) => t.paymentMode === "Cash")
      .reduce((sum, t) => sum + (t.finalAmount ?? t.amount), 0);

    const upiRevenue = bookings
      .filter((b) => b.paymentMode === "UPI")
      .reduce((sum, b) => sum + (b.finalAmount ?? b.totalCost), 0) + 
      transactions
      .filter((t) => t.paymentMode === "UPI")
      .reduce((sum, t) => sum + (t.finalAmount ?? t.amount), 0);

    // Top values
    const serviceCounts: Record<string, number> = {};
    bookings.forEach(b => {
      if (b.serviceType && !b.serviceType.toLowerCase().includes("addon") && !b.serviceType.toLowerCase().includes("polish")) {
        const baseName = getBaseServiceName(b.serviceType);
        serviceCounts[baseName] = (serviceCounts[baseName] || 0) + 1;
      }
    });
    transactions.forEach(t => {
      if (t.serviceOpted && !t.serviceOpted.toLowerCase().includes("addon") && !t.serviceOpted.toLowerCase().includes("polish")) {
        const baseName = getBaseServiceName(t.serviceOpted);
        serviceCounts[baseName] = (serviceCounts[baseName] || 0) + 1;
      }
    });
    let topService = "None";
    let maxService = 0;
    Object.entries(serviceCounts).forEach(([k, v]) => {
      if (v > maxService) {
        maxService = v;
        topService = k;
      }
    });

    const customerCounts: Record<string, number> = {};
    bookings.forEach(b => {
      if (b.customerName) customerCounts[b.customerName] = (customerCounts[b.customerName] || 0) + 1;
    });
    transactions.forEach(t => {
      if (t.customerName) customerCounts[t.customerName] = (customerCounts[t.customerName] || 0) + 1;
    });
    let topCustomer = "None";
    let maxCustomer = 0;
    Object.entries(customerCounts).forEach(([k, v]) => {
      if (v > maxCustomer) {
        maxCustomer = v;
        topCustomer = k;
      }
    });

    const employeeCounts: Record<string, number> = {};
    bookings.forEach(b => {
      if (b.assignedEmployeeName) employeeCounts[b.assignedEmployeeName] = (employeeCounts[b.assignedEmployeeName] || 0) + 1;
    });
    transactions.forEach(t => {
      if (t.assignedEmployee) employeeCounts[t.assignedEmployee] = (employeeCounts[t.assignedEmployee] || 0) + 1;
    });
    let topEmployee = "None";
    let maxEmployee = 0;
    Object.entries(employeeCounts).forEach(([k, v]) => {
      if (v > maxEmployee) {
        maxEmployee = v;
        topEmployee = k;
      }
    });

    return {
      totalSales,
      completedCount,
      activeStaffCount,
      outgoingExpenses,
      todayRevenue,
      monthlyRevTotal,
      cashRevenue,
      upiRevenue,
      topService,
      topCustomer,
      topEmployee,
    };
  }, [bookings, employees, expenses, transactions, todayStr, currentMonthStr]);

  // Weekly analytics processing
  const weeklyGraphPoints = useMemo(() => {
    const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const salesMap: Record<string, number> = {
      Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0
    };

    bookings.forEach((b) => {
      if (b.status === "Cancelled" || !b.bookingDate) return;
      const parts = b.bookingDate.split("-");
      if (parts.length >= 2) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parts[2] ? parseInt(parts[2], 10) : 1;
        const d = new Date(year, month, day);
        const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
        if (salesMap[dayName] !== undefined) {
          salesMap[dayName] += (b.finalAmount ?? b.totalCost);
        }
      }
    });

    transactions.forEach((t) => {
      if (!t.date) return;
      const parts = t.date.split("-");
      if (parts.length >= 2) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parts[2] ? parseInt(parts[2], 10) : 1;
        const d = new Date(year, month, day);
        const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
        if (salesMap[dayName] !== undefined) {
          salesMap[dayName] += (t.finalAmount ?? t.amount);
        }
      }
    });

    return weekdayNames.map((day) => ({
      day,
      sales: salesMap[day] || 0
    }));
  }, [bookings, transactions]);

  const maxSalesVal = Math.max(...weeklyGraphPoints.map((p) => p.sales), 1000);

  // SVG Chart path calculators
  const svgLinePath = useMemo(() => {
    return weeklyGraphPoints
      .map((p, idx) => {
        const x = 50 + idx * 85;
        const y = 200 - (p.sales / maxSalesVal) * 150;
        return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [weeklyGraphPoints, maxSalesVal]);

  const svgAreaPath = useMemo(() => {
    if (weeklyGraphPoints.length === 0) return "";
    const firstX = 50;
    const lastX = 50 + (weeklyGraphPoints.length - 1) * 85;
    return `${svgLinePath} L ${lastX} 210 L ${firstX} 210 Z`;
  }, [svgLinePath, weeklyGraphPoints]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-72 bg-[#07070a] border-b lg:border-b-0 lg:border-r border-white/10 p-6 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Section */}
          <div className="mb-8 pb-6 border-b border-white/10">
            <h2 className="text-2xl font-black tracking-wider text-red-500">KLEENKARS</h2>
            <p className="text-[10px] text-gray-500 tracking-widest font-semibold uppercase mt-1">Manager console</p>
          </div>

          {/* Nav Items */}
          <nav className="space-y-2.5">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full text-left p-3.5 rounded-xl font-semibold text-sm transition ${
                activeTab === "overview" ? "bg-red-600 text-white shadow-lg shadow-red-900/30" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              Analytics Dashboard
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`w-full text-left p-3.5 rounded-xl font-semibold text-sm transition ${
                activeTab === "bookings" ? "bg-red-600 text-white shadow-lg shadow-red-900/30" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              Bookings Manager
            </button>
            <button
              onClick={() => setActiveTab("customers")}
              className={`w-full text-left p-3.5 rounded-xl font-semibold text-sm transition ${
                activeTab === "customers" ? "bg-red-600 text-white shadow-lg shadow-red-900/30" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              Customer Registry
            </button>
            <button
              onClick={() => setActiveTab("payments")}
              className={`w-full text-left p-3.5 rounded-xl font-semibold text-sm transition ${
                activeTab === "payments" ? "bg-red-600 text-white shadow-lg shadow-red-900/30" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              Payments & Sales
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`w-full text-left p-3.5 rounded-xl font-semibold text-sm transition ${
                activeTab === "transactions" ? "bg-red-600 text-white shadow-lg shadow-red-900/30" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              Transactions & CRM
            </button>
            <button
              onClick={() => setActiveTab("attendance")}
              className={`w-full text-left p-3.5 rounded-xl font-semibold text-sm transition ${
                activeTab === "attendance" ? "bg-red-600 text-white shadow-lg shadow-red-900/30" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              Attendance & Duty
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`w-full text-left p-3.5 rounded-xl font-semibold text-sm transition ${
                activeTab === "inventory" ? "bg-red-600 text-white shadow-lg shadow-red-900/30" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              Inventory Catalog
            </button>
            <button
              onClick={() => setActiveTab("expenses")}
              className={`w-full text-left p-3.5 rounded-xl font-semibold text-sm transition ${
                activeTab === "expenses" ? "bg-red-600 text-white shadow-lg shadow-red-900/30" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              Expenses Registry
            </button>
            <button
              onClick={() => setActiveTab("employees")}
              className={`w-full text-left p-3.5 rounded-xl font-semibold text-sm transition ${
                activeTab === "employees" ? "bg-red-600 text-white shadow-lg shadow-red-900/30" : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              Employee Scheduling
            </button>
          </nav>
        </div>

        {/* Footer Area */}
        <div className="mt-8 border-t border-white/10 pt-5 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center font-bold text-red-500">M</div>
            <div>
              <p className="text-xs font-bold text-white">Operations Manager</p>
              <p className="text-[10px] text-gray-500">Rohini Center</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600/10 hover:bg-red-650 transition text-red-500 hover:text-white font-bold p-3.5 rounded-xl text-sm flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-screen">
        {loading ? (
          <div className="py-20 text-center text-gray-500 flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full" />
            <p className="text-sm font-semibold tracking-wider font-mono text-gray-400">Loading Manager Console Datasets...</p>
          </div>
        ) : (
          <div>
            {/* Top Info Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <span className="text-xs text-red-500 font-bold uppercase tracking-wider font-mono">Workspace Terminal</span>
                <h1 className="text-3xl font-extrabold text-white mt-0.5">Manager Dashboard</h1>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-[#111] border border-gray-800 px-4 py-2 rounded-xl text-xs font-mono text-gray-400">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </span>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-red-600 hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] transition-all text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-red-900/30"
                >
                  <Plus className="w-4 h-4" />
                  New Booking
                </button>
              </div>
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-8 animate-slide-up">
                {/* Stats Counters Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#0b0b0b] p-5 rounded-xl border border-gray-850 flex flex-col justify-between">
                    <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Today's Revenue</span>
                    <span className="text-2xl font-extrabold mt-2 text-white font-mono">₹{statsOverview.todayRevenue.toLocaleString()}</span>
                  </div>
                  <div className="bg-[#0b0b0b] p-5 rounded-xl border border-gray-850 flex flex-col justify-between">
                    <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Monthly Revenue</span>
                    <span className="text-2xl font-extrabold mt-2 text-yellow-400 font-mono">₹{statsOverview.monthlyRevTotal.toLocaleString()}</span>
                  </div>
                  <div className="bg-[#0b0b0b] p-5 rounded-xl border border-gray-850 flex flex-col justify-between">
                    <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Cash Revenue</span>
                    <span className="text-2xl font-extrabold mt-2 text-emerald-400 font-mono">₹{statsOverview.cashRevenue.toLocaleString()}</span>
                  </div>
                  <div className="bg-[#0b0b0b] p-5 rounded-xl border border-gray-850 flex flex-col justify-between">
                    <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">UPI Revenue</span>
                    <span className="text-2xl font-extrabold mt-2 text-cyan-400 font-mono">₹{statsOverview.upiRevenue.toLocaleString()}</span>
                  </div>
                  <div className="bg-[#0b0b0b] p-5 rounded-xl border border-gray-850 flex flex-col justify-between">
                    <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider font-bold">Top Service</span>
                    <span className="text-lg font-bold mt-2 text-indigo-400 truncate">{statsOverview.topService}</span>
                  </div>
                  <div className="bg-[#0b0b0b] p-5 rounded-xl border border-gray-850 flex flex-col justify-between">
                    <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider font-bold">Top Customer</span>
                    <span className="text-lg font-bold mt-2 text-pink-400 truncate">{statsOverview.topCustomer}</span>
                  </div>
                  <div className="bg-[#0b0b0b] p-5 rounded-xl border border-gray-850 flex flex-col justify-between">
                    <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider font-bold">Top Employee</span>
                    <span className="text-lg font-bold mt-2 text-orange-400 truncate">{statsOverview.topEmployee}</span>
                  </div>
                  <div className="bg-[#0b0b0b] p-5 rounded-xl border border-gray-850 flex flex-col justify-between">
                    <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Sales (INR)</span>
                    <span className="text-2xl font-extrabold mt-2 text-green-400 font-mono">₹{statsOverview.totalSales.toLocaleString()}</span>
                  </div>
                </div>

                {/* SVG Revenue Chart */}
                <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl p-5 shadow-xl">
                  <h3 className="text-lg font-bold text-white mb-2">Weekly Sales Overview</h3>
                  <p className="text-xs text-gray-500 mb-6">Revenue tracking charts from Monday to Sunday</p>

                  <div className="relative">
                    <svg className="w-full h-64 overflow-visible" viewBox="0 0 600 240">
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                        <line
                          key={i}
                          x1="50"
                          y1={200 - p * 150}
                          x2="570"
                          y2={200 - p * 150}
                          className="stroke-gray-800/50"
                          strokeDasharray="4"
                        />
                      ))}

                      {/* Area Fill */}
                      <path d={svgAreaPath} fill="url(#salesGrad)" />

                      {/* Line Vector */}
                      <path
                        d={svgLinePath}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />

                      {/* Points */}
                      {weeklyGraphPoints.map((p, idx) => {
                        const x = 50 + idx * 85;
                        const y = 200 - (p.sales / maxSalesVal) * 150;
                        return (
                          <g key={idx} className="group cursor-pointer">
                            <circle cx={x} cy={y} r="4" className="fill-red-500 stroke-black stroke-2" />
                            <circle cx={x} cy={y} r="8" className="fill-red-500 opacity-0 hover:opacity-20 transition" />
                            <text
                              x={x}
                              y={y - 10}
                              textAnchor="middle"
                              className="fill-white text-[10px] font-bold font-mono opacity-0 group-hover:opacity-100 transition-opacity bg-black"
                            >
                              ₹{p.sales}
                            </text>
                          </g>
                        );
                      })}

                      {/* Day Labels */}
                      {weeklyGraphPoints.map((p, idx) => (
                        <text
                          key={idx}
                          x={50 + idx * 85}
                          y="225"
                          textAnchor="middle"
                          className="fill-gray-500 text-[10px] font-semibold"
                        >
                          {p.day.substring(0, 3)}
                        </text>
                      ))}
                    </svg>
                  </div>
                </div>

                {/* Staff Performance Leaderboard */}
                <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl p-5 shadow-xl">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    Staff Performance Leaderboard
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-[#141414] text-gray-400 uppercase text-xs">
                        <tr>
                          <th className="px-4 py-3">Employee Name</th>
                          <th className="px-4 py-3">Designation</th>
                          <th className="px-4 py-3">Jobs Completed</th>
                          <th className="px-4 py-3">Rating</th>
                          <th className="px-4 py-3 text-right">Revenue Generated</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-850">
                        {employees
                          .filter((e) => e.role !== "manager" && e.role !== "admin")
                          .sort((a, b) => b.jobsCompleted - a.jobsCompleted)
                          .map((emp) => (
                            <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3 font-semibold text-white">{emp.name}</td>
                              <td className="px-4 py-3 text-gray-400 capitalize">{emp.role.replace("_", " ")}</td>
                              <td className="px-4 py-3 text-gray-300 font-mono">{emp.jobsCompleted || 0}</td>
                              <td className="px-4 py-3 text-yellow-500">★ {emp.customerRating?.toFixed(1) || "5.0"}</td>
                              <td className="px-4 py-3 text-right text-green-400 font-bold font-mono">₹{(emp.revenueGenerated || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BOOKINGS */}
            {activeTab === "bookings" && (
              <div className="space-y-6 animate-slide-up">
                {/* Filters */}
                <div className="bg-[#0b0b0b] border border-gray-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <input
                    type="text"
                    placeholder="Search by customer, phone, Plate No..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 flex-1 max-w-md"
                  />
                  <div className="flex flex-wrap gap-2">
                    {["all", "Pending", "Assigned", "Washing", "Completed", "Cancelled"].map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold transition capitalize ${
                          statusFilter === st ? "bg-red-600 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bookings Queue */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredBookings.map((b) => (
                    <div key={b.id} className="bg-[#0b0b0b] border border-gray-800 rounded-xl p-5 flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-bold text-white">{b.customerName}</h4>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">{b.phoneNumber || "No Phone Registered"}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            b.status === "Pending" ? "bg-yellow-950/40 text-yellow-400 border-yellow-800/40" :
                            b.status === "Assigned" ? "bg-blue-950/40 text-blue-400 border-blue-800/40" :
                            b.status === "Completed" ? "bg-green-950/40 text-green-400 border-green-800/40" :
                            "bg-gray-900 text-gray-400 border-gray-800"
                          }`}>
                            {b.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-4 text-xs bg-[#111] p-3 rounded-lg border border-gray-850">
                          <div>
                            <span className="text-gray-500 block">Service</span>
                            <span className="text-white font-semibold">{b.serviceType}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Class</span>
                            <span className="text-white font-semibold">{b.vehicleType}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Invoiced Cost</span>
                            <span className="text-red-400 font-bold font-mono">₹{b.finalAmount ?? b.totalCost}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 mt-3 text-xs text-gray-400 font-mono">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{b.bookingDate} at {b.bookingTime}</span>
                        </div>
                      </div>

                      <div className="border-t border-gray-850 pt-4 flex flex-col gap-3">
                        {/* Assign Select */}
                        {b.status === "Pending" && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Staff Assignment:</span>
                            <select
                              onChange={(e) => assignBooking(b.id, e.target.value)}
                              className="bg-black border border-gray-800 text-xs p-2 rounded-lg text-white"
                              defaultValue=""
                            >
                              <option value="" disabled>-- Assign Active Staff --</option>
                              {employees
                                .filter((e) => e.role !== "manager" && e.role !== "admin" && e.status === "active")
                                .map((e) => (
                                  <option key={e.id} value={e.id}>
                                    {e.name} ({e.role.replace("_", " ")})
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}

                        {b.assignedEmployeeName && (
                          <div className="flex items-center gap-1 text-xs text-green-400">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Assigned: <strong className="font-bold">{b.assignedEmployeeName}</strong></span>
                          </div>
                        )}

                        {/* Actions Row */}
                        <div className="flex justify-between items-center gap-2 mt-1">
                          <button
                            onClick={() => handleDownloadInvoice(b)}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            Receipt PDF
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingBooking(b);
                                setEditStatus(b.status);
                                setEditDiscount(b.discount || 0);
                                setEditTotalCost(b.totalCost);
                              }}
                              className="bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-400 font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteBooking(b.id)}
                              className="bg-red-950/40 hover:bg-red-900 border border-red-800/40 text-red-400 font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredBookings.length === 0 && (
                    <div className="col-span-full py-16 text-center text-gray-500 text-sm">
                      No bookings found for the current matching parameters.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: CUSTOMERS */}
            {activeTab === "customers" && (
              <div className="space-y-6 animate-slide-up">
                <div className="bg-[#0b0b0b] border border-gray-800 p-4 rounded-xl">
                  <input
                    type="text"
                    placeholder="Search by customer name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-black border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600 w-full max-w-md"
                  />
                </div>

                <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-[#141414] text-gray-400 uppercase text-xs border-b border-gray-850">
                        <tr>
                          <th className="px-6 py-4">Client ID</th>
                          <th className="px-6 py-4">Customer Name</th>
                          <th className="px-6 py-4">Phone Number</th>
                          <th className="px-6 py-4">Visits logged</th>
                          <th className="px-6 py-4 text-center">Category Badge</th>
                          <th className="px-6 py-4 text-right">Lifetime Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-850">
                        {customers
                          .filter((c) =>
                            c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.phoneNumber.includes(searchQuery)
                          )
                          .map((cust) => (
                            <tr key={cust.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 font-mono font-semibold text-red-500">{cust.id}</td>
                              <td className="px-6 py-4 font-bold text-white">{cust.customerName}</td>
                              <td className="px-6 py-4 font-mono text-gray-400">{cust.phoneNumber}</td>
                              <td className="px-6 py-4 font-mono text-gray-300">{cust.totalVisits}</td>
                              <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                  cust.totalSpent > 5000 ? "bg-yellow-950/40 text-yellow-400 border-yellow-800/40" :
                                  cust.totalSpent > 1500 ? "bg-blue-950/40 text-blue-400 border-blue-800/40" :
                                  "bg-gray-900 text-gray-400 border-gray-800"
                                }`}>
                                  {cust.totalSpent > 5000 ? "⭐ VIP Elite" : cust.totalSpent > 1500 ? "Regular" : "Standard"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right text-green-400 font-bold font-mono">₹{(cust.totalSpent || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: PAYMENTS & MEMBERSHIPS */}
            {activeTab === "payments" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
                {/* Left Panel: Assign active plan */}
                <div className="lg:col-span-1">
                  <div className="bg-[#0b0b0b] border border-gray-800 p-6 rounded-2xl shadow-xl">
                    <h2 className="text-xl font-bold text-white mb-4">Manual Membership Activation</h2>
                    <form onSubmit={handleAssignMembership} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Select Customer</label>
                        <select
                          value={assignCustomerId}
                          onChange={(e) => setAssignCustomerId(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 text-sm transition"
                        >
                          <option value="">-- Select Client --</option>
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.customerName} ({c.phoneNumber})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Select Tier Plan</label>
                        <select
                          value={assignPlanId}
                          onChange={(e) => setAssignPlanId(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 text-sm transition"
                        >
                          <option value="">-- Select Tier --</option>
                          {membershipPlans.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Rs. {p.price})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Start Date</label>
                        <input
                          type="date"
                          value={assignStartDate}
                          onChange={(e) => setAssignStartDate(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 text-sm transition"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all text-white font-bold py-3 rounded-xl shadow-lg"
                      >
                        Activate Plan
                      </button>
                    </form>
                  </div>
                </div>

                {/* Right Panel: Payments list & Subscriptions logs */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Payments Log Card */}
                  <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-gray-850 bg-[#111]/50">
                      <h3 className="text-lg font-bold text-white">Recent Payments ledger</h3>
                    </div>
                    <div className="overflow-y-auto max-h-[300px]">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#141414] text-gray-400 uppercase">
                          <tr>
                            <th className="px-4 py-3">Ref ID</th>
                            <th className="px-4 py-3">Customer</th>
                            <th className="px-4 py-3 font-mono">Invoice Amount</th>
                            <th className="px-4 py-3">Mode</th>
                            <th className="px-4 py-3">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-850">
                          {bookings
                            .filter((b) => b.status === "Completed")
                            .map((b) => (
                              <tr key={b.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 font-mono text-red-500">#{b.id.substring(0, 8)}</td>
                                <td className="px-4 py-3 text-white font-semibold">{b.customerName}</td>
                                <td className="px-4 py-3 font-bold font-mono text-green-400">₹{b.finalAmount ?? b.totalCost}</td>
                                <td className="px-4 py-3 text-gray-400">{b.paymentMode || "Cash"}</td>
                                <td className="px-4 py-3 text-gray-500">{b.bookingDate}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Active Customer Subscriptions */}
                  <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-gray-850 bg-[#111]/50">
                      <h3 className="text-lg font-bold text-white">Active Subscriptions</h3>
                    </div>
                    <div className="overflow-y-auto max-h-[300px]">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#141414] text-gray-400 uppercase">
                          <tr>
                            <th className="px-4 py-3">Client</th>
                            <th className="px-4 py-3">Plan Tier</th>
                            <th className="px-4 py-3">Duration Dates</th>
                            <th className="px-4 py-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-850">
                          {memberships.map((m) => (
                            <tr key={m.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3 text-white font-semibold">
                                <div>{m.customer?.customerName || "Default Customer"}</div>
                                <div className="text-[10px] text-gray-500">{m.customer?.phoneNumber}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="bg-red-950/20 text-red-400 px-2 py-0.5 rounded-full border border-red-900/30 text-[10px] uppercase font-bold">
                                  {m.membershipPlan?.name}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-400">
                                <div>S: {new Date(m.startDate).toLocaleDateString()}</div>
                                <div>E: {new Date(m.endDate).toLocaleDateString()}</div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  m.status === "ACTIVE" ? "bg-green-950/40 text-green-400 border border-green-800/40" : "bg-gray-900 text-gray-400"
                                }`}>
                                  {m.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: ATTENDANCE */}
            {activeTab === "attendance" && (
              <div className="space-y-6 animate-slide-up">
                {/* Roster list today */}
                <div className="bg-[#0b0b0b] border border-gray-800 p-6 rounded-xl shadow-xl">
                  <h3 className="text-xl font-bold text-white mb-1">Today's Employee Attendance</h3>
                  <p className="text-xs text-gray-500 mb-6">Log check-ins for the crew members on floor duties</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {employees
                      .filter((e) => e.role !== "manager" && e.role !== "admin")
                      .map((emp) => {
                        const status = todayAttendance[emp.id] || "unmarked";
                        return (
                          <div key={emp.id} className="bg-black/40 border border-gray-850 p-4 rounded-xl flex flex-col justify-between gap-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-white">{emp.name}</h4>
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider">{emp.role.replace("_", " ")}</span>
                              </div>
                              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${
                                status === "present" ? "bg-green-950/40 text-green-400 border-green-800/40" :
                                status === "half day" ? "bg-yellow-950/40 text-yellow-400 border-yellow-800/40" :
                                status === "absent" ? "bg-red-950/40 text-red-400 border-red-800/40" :
                                "bg-gray-900 text-gray-500 border-gray-800"
                              }`}>
                                {status}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <button
                                onClick={() => handleMarkAttendance(emp.id, emp.name, "present")}
                                className="bg-green-950/30 hover:bg-green-900 border border-green-800/30 text-green-400 hover:text-white transition py-1 rounded text-[10px] font-bold"
                              >
                                Present
                              </button>
                              <button
                                onClick={() => handleMarkAttendance(emp.id, emp.name, "half day")}
                                className="bg-yellow-950/30 hover:bg-yellow-900 border border-yellow-800/30 text-yellow-400 hover:text-white transition py-1 rounded text-[10px] font-bold"
                              >
                                Half Day
                              </button>
                              <button
                                onClick={() => handleMarkAttendance(emp.id, emp.name, "absent")}
                                className="bg-red-950/30 hover:bg-red-900 border border-red-800/30 text-red-400 hover:text-white transition py-1 rounded text-[10px] font-bold"
                              >
                                Absent
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Historical Log */}
                <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
                  <div className="p-4 border-b border-gray-850 bg-[#111]/50">
                    <h3 className="text-lg font-bold text-white">Historical Check-in Logs</h3>
                  </div>
                  <div className="overflow-y-auto max-h-[300px]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#141414] text-gray-400 uppercase">
                        <tr>
                          <th className="px-6 py-3">Employee Name</th>
                          <th className="px-6 py-3">Punch Date</th>
                          <th className="px-6 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-850">
                        {attendance.map((log) => (
                          <tr key={log.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-3 font-semibold text-white">{log.employeeName}</td>
                            <td className="px-6 py-3 text-gray-400">{new Date(log.checkIn).toLocaleString()}</td>
                            <td className="px-6 py-3 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                log.attendanceStatus === "present" ? "bg-green-950/40 text-green-400 border border-green-800/40" :
                                log.attendanceStatus === "half day" ? "bg-yellow-950/40 text-yellow-400 border-yellow-800/40" :
                                "bg-red-950/40 text-red-400 border border-red-800/40"
                              }`}>
                                {log.attendanceStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: INVENTORY */}
            {activeTab === "inventory" && (
              <div className="space-y-6 animate-slide-up">
                <div className="flex justify-between items-center bg-[#0b0b0b] border border-gray-800 p-4 rounded-xl">
                  <h3 className="text-lg font-bold text-white">Supplies Catalog & Threshold Stock</h3>
                  <button
                    onClick={() => {
                      setSelectedInvItem(null);
                      setInvName("");
                      setInvQty("");
                      setInvUnit("Liters");
                      setInvMinStock("5");
                      setInvCost("");
                      setShowInventoryModal(true);
                    }}
                    className="bg-red-650 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Item
                  </button>
                </div>

                <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-[#141414] text-gray-400 uppercase text-xs border-b border-gray-850">
                        <tr>
                          <th className="px-6 py-4">Item Name</th>
                          <th className="px-6 py-4">Quantity Level</th>
                          <th className="px-6 py-4">Threshold Alert</th>
                          <th className="px-6 py-4">Unit Asset Cost</th>
                          <th className="px-6 py-4">Total Assets</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-850">
                        {inventory.map((item) => {
                          const isLow = item.quantity < item.minStock;
                          return (
                            <tr key={item.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 font-bold text-white">{item.name}</td>
                              <td className="px-6 py-4 font-mono font-bold">
                                <span className={isLow ? "text-red-400" : "text-white"}>
                                  {item.quantity} {item.unit}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {isLow ? (
                                  <span className="bg-red-955/20 text-red-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-red-900/30">
                                    ⚠️ REORDER NEEDED (Min: {item.minStock})
                                  </span>
                                ) : (
                                  <span className="bg-green-955/20 text-green-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-green-800/30">
                                    Sufficient
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 font-mono text-gray-300">₹{item.costPerUnit}</td>
                              <td className="px-6 py-4 text-green-400 font-bold font-mono">₹{(item.quantity * item.costPerUnit).toLocaleString()}</td>
                              <td className="px-6 py-4 text-right space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedInvItem(item);
                                    setInvName(item.name);
                                    setInvQty(String(item.quantity));
                                    setInvUnit(item.unit);
                                    setInvMinStock(String(item.minStock));
                                    setInvCost(String(item.costPerUnit));
                                    setShowInventoryModal(true);
                                  }}
                                  className="text-cyan-400 hover:text-cyan-300 font-bold text-xs bg-cyan-500/10 px-3 py-1.5 rounded-lg transition"
                                >
                                  Adjust
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: DAILY EXPENSES */}
            {activeTab === "expenses" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
                {/* Left Panel: Entry Form */}
                <div className="lg:col-span-1">
                  <div className="bg-[#0b0b0b] border border-gray-800 p-6 rounded-2xl shadow-xl">
                    <h2 className="text-xl font-bold text-white mb-4">Daily Expense Entry</h2>
                    <form onSubmit={handleAddExpense} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Voucher Title *</label>
                        <input
                          type="text"
                          placeholder="e.g. Chemicals purchase, Fuel"
                          value={expTitle}
                          onChange={(e) => setExpTitle(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 text-sm transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Amount (₹) *</label>
                        <input
                          type="number"
                          placeholder="e.g. 1500"
                          value={expAmount}
                          onChange={(e) => setExpAmount(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 font-mono text-sm transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Category</label>
                        <select
                          value={expCategory}
                          onChange={(e) => setExpCategory(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 text-sm transition animate-none"
                        >
                          <option value="Supplies">Supplies & Chemicals</option>
                          <option value="Fuel">Fuel & Transport</option>
                          <option value="Utilities">Utilities & Water</option>
                          <option value="Equipment">Tools & Spares</option>
                          <option value="Rent">Store Rent</option>
                          <option value="Payroll">Daily Wages/Incentives</option>
                          <option value="Miscellaneous">Miscellaneous Outgoing</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Payment Mode</label>
                        <select
                          value={expPayMode}
                          onChange={(e) => setExpPayMode(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 text-sm transition"
                        >
                          <option value="Cash">Cash Ledger</option>
                          <option value="UPI">UPI / GPay</option>
                          <option value="Card">Bank Cards</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Memo Notes</label>
                        <textarea
                          placeholder="Disciplinary/wages adjustments info..."
                          value={expNotes}
                          onChange={(e) => setExpNotes(e.target.value)}
                          rows={2}
                          className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-red-600 text-sm transition"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all text-white font-bold py-3 rounded-xl shadow-lg text-sm"
                      >
                        File Voucher
                      </button>
                    </form>
                  </div>
                </div>

                {/* Right Panel: Log list */}
                <div className="lg:col-span-2">
                  <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-gray-850 bg-[#111]/50">
                      <h3 className="text-lg font-bold text-white">Daily Expenses Log</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#141414] text-gray-400 uppercase">
                          <tr>
                            <th className="px-6 py-3">Expense Details</th>
                            <th className="px-6 py-3">Category</th>
                            <th className="px-6 py-3">Mode</th>
                            <th className="px-6 py-3 font-mono text-right">Cost (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-850">
                          {expenses.map((exp) => (
                            <tr key={exp.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-3">
                                <div className="font-semibold text-white">{exp.title}</div>
                                {exp.notes && <div className="text-[10px] text-gray-500 italic mt-0.5">{exp.notes}</div>}
                              </td>
                              <td className="px-6 py-3">
                                <span className="bg-red-950/20 text-red-400 text-[9px] font-bold px-2 py-0.5 rounded border border-red-900/30 uppercase">
                                  {exp.category}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-gray-400">{exp.paymentMode}</td>
                              <td className="px-6 py-3 text-right font-bold font-mono text-red-400">-₹{exp.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: EMPLOYEE SCHEDULING */}
            {activeTab === "employees" && (
              <div className="space-y-6 animate-slide-up">
                <div className="bg-[#0b0b0b] border border-gray-800 p-4 rounded-xl">
                  <h3 className="text-lg font-bold text-white">Staff Roster & Scheduling Guidelines</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Control employee shift assignments, locations, and salary metrics</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {employees
                    .filter((e) => e.role !== "manager" && e.role !== "admin")
                    .map((emp) => (
                      <div key={emp.id} className="bg-[#0b0b0b] border border-gray-800 rounded-xl p-5 flex flex-col justify-between gap-4">
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-lg font-bold text-white">{emp.name}</h4>
                              <p className="text-xs text-gray-500 font-mono mt-0.5">{emp.employeeCode}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                              emp.status === "active" ? "bg-green-950/40 text-green-400 border-green-800/40" : "bg-red-950/40 text-red-400 border-red-800/40"
                            }`}>
                              {emp.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-4 text-xs bg-[#111] p-3 rounded-lg border border-gray-850">
                            <div>
                              <span className="text-gray-500 block">Branch Location</span>
                              <span className="text-white font-semibold flex items-center gap-0.5">
                                <MapPin className="w-3 h-3 text-red-500" />
                                {emp.branch || "Unassigned"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">Shift Type</span>
                              <span className="text-white font-semibold capitalize flex items-center gap-0.5">
                                <Clock className="w-3 h-3 text-cyan-400" />
                                {emp.shiftType || "Day"}
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-xs mt-3 pt-3 border-t border-gray-850/80">
                            <span className="text-gray-400">Daily Salary Rate:</span>
                            <span className="font-bold text-green-400 font-mono">₹{emp.salaryPerDay} / day</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setEmpShift(emp.shiftType || "day");
                            setEmpBranch(emp.branch || "");
                            setEmpSalary(String(emp.salaryPerDay));
                            setEmpStatus(emp.status);
                          }}
                          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-2 rounded-xl text-xs transition"
                        >
                          Modify Schedule
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* TAB 9: TRANSACTIONS & CRM */}
            {activeTab === "transactions" && (
              <div className="space-y-6 animate-slide-up">
                <TransactionsConsole />
              </div>
            )}

          </div>
        )}
      </main>

      {/* CREATE BOOKING MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
          <div className="bg-gray-900 border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl glass-panel relative text-left">
            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-red-500" />
              Schedule New Booking
            </h3>
            <p className="text-xs text-gray-400 mb-4">Create a customer wash or detailing job instantly.</p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Booking Date *</label>
                  <input
                    type="date"
                    value={newBookingDate}
                    onChange={(e) => setNewBookingDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Time</label>
                  <input
                    type="time"
                    value={newBookingTime}
                    onChange={(e) => setNewBookingTime(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Customer Name *</label>
                <input
                  type="text"
                  placeholder="Enter name"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Phone Number *</label>
                <input
                  type="text"
                  placeholder="10-digit number"
                  value={newPhoneNumber}
                  onChange={(e) => setNewPhoneNumber(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-600 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Vehicle Class *</label>
                  <select
                    value={newVehicleType}
                    onChange={(e) => {
                      setNewVehicleType(e.target.value);
                      setNewServiceId(""); // Reset service package when vehicle class changes
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-650 transition cursor-pointer"
                  >
                    <option value="">Select Class...</option>
                    <option value="Bike">Bike</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Sedan">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="MUV">MUV</option>
                    <option value="Truck">Truck</option>
                    <option value="Van">Van</option>
                    <option value="Traveller">Traveller</option>
                    <option value="Bus">Bus</option>
                    <option value="E-Rickshaw">E-Rickshaw</option>
                    <option value="Tractor">Tractor</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Vehicle Plate No.</label>
                  <input
                    type="text"
                    placeholder="e.g. DL3C1234"
                    value={newVehicleNumber}
                    onChange={(e) => setNewVehicleNumber(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-650 transition uppercase"
                  />
                </div>
              </div>

              {newVehicleType && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Wash Package Service *</label>
                  <select
                    value={newServiceId}
                    onChange={(e) => setNewServiceId(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-650 transition cursor-pointer"
                  >
                    <option value="">-- Select Package --</option>
                    {services.filter(svc => svc.isActive && matchServiceToVehicle(svc.name, newVehicleType)).map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.name} (Rs. {svc.price})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Incentive Discount (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newDiscount}
                    onChange={(e) => setNewDiscount(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-650 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Payment Mode</label>
                  <select
                    value={newPaymentMode}
                    onChange={(e) => setNewPaymentMode(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-650 transition cursor-pointer font-sans"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Bank Cards</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 border-t border-white/5 pt-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl font-bold transition active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={submitNewBooking}
                className="flex-1 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white py-3 rounded-xl font-bold transition active:scale-95 shadow-lg shadow-red-900/30"
              >
                Create Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BOOKING MODAL */}
      {editingBooking && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4 animate-fade-in">
          <div className="bg-gray-900 border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl glass-panel relative text-left">
            <h3 className="text-xl font-bold mb-2 text-white">Adjust Booking Details</h3>
            <p className="text-xs text-gray-400 mb-4">Edit invoice, discount values, and statuses</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Original Base Cost (₹)</label>
                <input
                  type="number"
                  value={editTotalCost}
                  onChange={(e) => setEditTotalCost(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-650 transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Discount Deduction (₹)</label>
                <input
                  type="number"
                  value={editDiscount}
                  onChange={(e) => setEditDiscount(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-650 transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Booking Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-650 transition cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Washing">Washing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex justify-between items-center text-xs bg-[#111] p-3 rounded-lg border border-gray-850">
                <span className="text-gray-500 font-semibold uppercase">Projected Net Paid:</span>
                <span className="font-extrabold text-green-400 font-mono text-sm">₹{Math.max(editTotalCost - editDiscount, 0)}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6 border-t border-white/5 pt-4">
              <button
                onClick={() => setEditingBooking(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditBooking}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition shadow-lg"
              >
                Apply Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADJUST / ADD INVENTORY MODAL */}
      {showInventoryModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
          <div className="bg-gray-900 border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl relative text-left">
            <h3 className="text-xl font-bold mb-4 text-white">
              {selectedInvItem ? "Adjust Stock Level" : "Register New Product"}
            </h3>
            <form onSubmit={handleSaveInventory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Car Shampoo, Wax Paste"
                  value={invName}
                  onChange={(e) => setInvName(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-650 transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Quantity *</label>
                  <input
                    type="number"
                    value={invQty}
                    onChange={(e) => setInvQty(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-650 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Unit *</label>
                  <select
                    value={invUnit}
                    onChange={(e) => setInvUnit(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-650 transition"
                  >
                    <option value="Liters">Liters</option>
                    <option value="Pieces">Pieces</option>
                    <option value="Boxes">Boxes</option>
                    <option value="Kilograms">Kilograms</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Min Warning Stock</label>
                  <input
                    type="number"
                    value={invMinStock}
                    onChange={(e) => setInvMinStock(e.target.value)}
                    placeholder="Alert below this..."
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-650 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Cost / Unit *</label>
                  <input
                    type="number"
                    value={invCost}
                    onChange={(e) => setInvCost(e.target.value)}
                    placeholder="Asset value"
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-650 transition"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInventoryModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-650 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition shadow-lg"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODIFY SCHEDULING MODAL */}
      {selectedEmployee && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4 animate-fade-in">
          <div className="bg-gray-900 border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl relative text-left">
            <h3 className="text-xl font-bold mb-2 text-white">Adjust Employee Schedule</h3>
            <p className="text-xs text-gray-400 mb-4">Set work shift, branch location, status, and wages for {selectedEmployee.name}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Shift Schedule</label>
                <select
                  value={empShift}
                  onChange={(e) => setEmpShift(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-650 transition"
                >
                  <option value="day">Day Shift</option>
                  <option value="night">Night Shift</option>
                  <option value="rotational">Rotational Shift</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Branch Assignment</label>
                <input
                  type="text"
                  placeholder="e.g. Rohini Sector-3"
                  value={empBranch}
                  onChange={(e) => setEmpBranch(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-650 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Base Salary / Day (₹)</label>
                <input
                  type="number"
                  value={empSalary}
                  onChange={(e) => setEmpSalary(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-650 transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Employment Status</label>
                <select
                  value={empStatus}
                  onChange={(e) => setEmpStatus(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-red-650 transition cursor-pointer"
                >
                  <option value="active">Active Duty</option>
                  <option value="revoked">Revoked</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6 border-t border-white/5 pt-4">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScheduling}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition shadow-lg"
              >
                Apply Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
