"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  joiningDate: string;
  salaryPerDay: number;
  phoneNumber: string;
  email: string | null;
  role: string;
  status: string;
  jobsCompleted: number;
  revenueGenerated: number;
  totalUpsells: number;
  attendancePercent: number;
  customerRating: number;
  penalties: number;
  incentives: number;
  aadhaarNumber: string | null;
  address: string | null;
  emergencyContact: string | null;
  branch: string | null;
  shiftType: string | null;
  notes: string | null;
}

interface EmployeesResponse {
  employees?: Employee[];
}

export default function EmployeePage() {
  const currentUserRole = "admin";

  // Data States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Create Employee States
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [employeeCode, setEmployeeCode] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [salaryPerDay, setSalaryPerDay] = useState("");
  const [role, setRole] = useState("washer");
  const [email, setEmail] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [branch, setBranch] = useState("");
  const [shiftType, setShiftType] = useState("day");
  const [notes, setNotes] = useState("");

  // Drawer / Detail Edit States
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [drawerData, setDrawerData] = useState<Partial<Employee>>({});
  const [resetPasswordInput, setResetPasswordInput] = useState("");
  const [savingDrawer, setSavingDrawer] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState(false);
  const [showRoleGuidelines, setShowRoleGuidelines] = useState(false);

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;
    if (!confirm(`Are you absolutely sure you want to delete ${selectedEmployee.name}? This will permanently remove their records, attendance history, and login access.`)) {
      return;
    }
    try {
      setDeletingEmployee(true);
      const response = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert("Employee profile deleted successfully.");
        setSelectedEmployee(null);
        fetchEmployees();
      } else {
        alert(data.message || "Failed to delete employee.");
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      alert("An unexpected error occurred during deletion.");
    } finally {
      setDeletingEmployee(false);
    }
  };

  function generateEmployeeCode() {
    return `KKS00${Math.floor(100 + Math.random() * 900)}`;
  }

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/employees");
      const data = await response.json() as EmployeesResponse;
      setEmployees(data.employees || []);
    } catch (error) {
      console.error("Failed to load employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await fetch("/api/attendance");
      const data = await response.json();
      setAttendanceRecords(data.attendance || []);
    } catch (error) {
      console.error("Failed to load attendance logs:", error);
    }
  };

  useEffect(() => {
    fetchEmployees();
    setEmployeeCode(generateEmployeeCode());
    fetchAttendance();
  }, []);

  const handleCreateEmployee = async () => {
    if (!name || !phoneNumber || !password || !salaryPerDay) {
      alert("Please fill in all basic required fields (Name, Phone, Password, Salary).");
      return;
    }

    const code = employeeCode.trim() || generateEmployeeCode();

    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeCode: code,
          name,
          phoneNumber,
          password,
          salaryPerDay: Number(salaryPerDay),
          role,
          email: email.trim() || null,
          aadhaarNumber: aadhaarNumber.trim() || null,
          address: address.trim() || null,
          emergencyContact: emergencyContact.trim() || null,
          branch: branch.trim() || null,
          shiftType: shiftType || null,
          notes: notes.trim() || null,
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        alert("Employee created successfully!");
        // Reset states
        setName("");
        setPhoneNumber("");
        setPassword("");
        setSalaryPerDay("");
        setRole("washer");
        setEmail("");
        setAadhaarNumber("");
        setAddress("");
        setEmergencyContact("");
        setBranch("");
        setShiftType("day");
        setNotes("");
        setEmployeeCode(generateEmployeeCode());
        setShowCreateForm(false);
        setShowAdvanced(false);
        fetchEmployees();
      } else {
        alert(resData.message || "Failed to create employee.");
      }
    } catch (error) {
      console.error("Error creating employee:", error);
      alert("An unexpected error occurred.");
    }
  };

  const handleSaveDrawer = async () => {
    if (!selectedEmployee) return;

    try {
      setSavingDrawer(true);
      const updatePayload = {
        ...drawerData,
        password: resetPasswordInput.trim() !== "" ? resetPasswordInput.trim() : undefined,
      };

      const response = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        alert("Employee details updated successfully!");
        setResetPasswordInput("");
        setSelectedEmployee(null);
        fetchEmployees();
      } else {
        alert(resData.message || "Failed to update employee details.");
      }
    } catch (error) {
      console.error("Error updating employee details:", error);
      alert("An unexpected error occurred while saving.");
    } finally {
      setSavingDrawer(false);
    }
  };

  // Derived Filtering logic
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.phoneNumber.includes(searchQuery) ||
      (emp.email && emp.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = filterRole === "all" || emp.role === filterRole;
    const matchesStatus = filterStatus === "all" || emp.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Analytics logic
  const totalCount = employees.length;
  const activeCount = employees.filter((e) => e.status === "active").length;
  const totalJobs = employees.reduce((sum, e) => sum + (e.jobsCompleted || 0), 0);
  const totalRevenue = employees.reduce((sum, e) => sum + (e.revenueGenerated || 0), 0);

  const selectedEmployeeAttendanceStats = useMemo(() => {
    if (!selectedEmployee) return { present: 0, halfDay: 0, totalDaysWorked: 0 };
    
    const empId = selectedEmployee.id;
    const now = new Date();
    const currentMonthNum = now.getMonth();
    const currentYearNum = now.getFullYear();
    
    const records = attendanceRecords.filter((rec) => {
      if (rec.employeeId !== empId) return false;
      const recDate = new Date(rec.checkIn);
      return recDate.getMonth() === currentMonthNum && recDate.getFullYear() === currentYearNum;
    });
    
    let present = 0;
    let halfDay = 0;
    
    records.forEach((rec) => {
      const status = rec.attendanceStatus?.trim().toLowerCase();
      if (status === "present") {
        present += 1;
      } else if (status === "half day" || status === "halfday" || status === "half-day") {
        halfDay += 1;
      }
    });
    
    const totalDaysWorked = present + (0.5 * halfDay);
    return { present, halfDay, totalDaysWorked };
  }, [selectedEmployee, attendanceRecords]);

  // Helper to render role label beautifully
  const getRoleLabel = (roleKey: string) => {
    const roleLabels: { [key: string]: string } = {
      staff: "Staff",
      supervisor: "Supervisor",
      washer: "Washer",
      detailer: "Detailer",
      pickup_driver: "Pickup Driver",
      cashier: "Cashier",
      manager: "Manager",
      admin: "Admin",
    };
    return roleLabels[roleKey] || roleKey;
  };

  // Helper to calculate Payout estimation
  const calculatePayout = (emp: Partial<Employee>) => {
    const daily = emp.salaryPerDay || 0;
    const inc = emp.incentives || 0;
    const pen = emp.penalties || 0;
    return (daily * 30) + inc - pen;
  };

  return (
    <DashboardLayout title="Employee Registry & Workspace">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-red-500">
            Employee Workspace
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Monitor check-ins, manage compensations, review feedback, and configure credentials.
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(true);
            setEmployeeCode(generateEmployeeCode());
          }}
          className="bg-red-600 hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-white font-semibold px-5 py-3 rounded-lg flex items-center gap-2 self-start md:self-auto shadow-lg shadow-red-900/30"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Employee
        </button>
      </div>

      {/* Analytics Counter Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slide-up">
        <div className="bg-[#111] p-5 rounded-xl border border-gray-800 flex flex-col justify-between hover:border-gray-700 transition-all duration-300">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Strength</span>
          <span className="text-3xl font-bold mt-2 text-white">{totalCount} Members</span>
        </div>
        <div className="bg-[#111] p-5 rounded-xl border border-gray-800 flex flex-col justify-between hover:border-gray-700 transition-all duration-300">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Active Staff</span>
          <span className="text-3xl font-bold text-green-400 mt-2">{activeCount} Duty</span>
        </div>
        <div className="bg-[#111] p-5 rounded-xl border border-gray-800 flex flex-col justify-between hover:border-gray-700 transition-all duration-300">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Jobs Delivered</span>
          <span className="text-3xl font-bold text-cyan-400 mt-2">{totalJobs} Completed</span>
        </div>
        <div className="bg-[#111] p-5 rounded-xl border border-gray-800 flex flex-col justify-between hover:border-gray-700 transition-all duration-300">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Team Revenue</span>
          <span className="text-3xl font-bold text-yellow-500 mt-2">₹{totalRevenue.toLocaleString()}</span>
        </div>
      </div>

      {/* Filter and Search Bar Section */}
      <div className="bg-[#0b0b0b] p-5 rounded-xl border border-gray-800 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by name, ID, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black border border-gray-850 focus:border-red-600 outline-none text-white pl-10 pr-4 py-3 rounded-lg transition-colors text-sm"
          />
        </div>

        {/* Dropdown filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs font-semibold uppercase">Role:</span>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-black border border-gray-800 focus:border-red-600 outline-none text-white text-sm px-3 py-2 rounded-lg"
            >
              <option value="all">All Roles</option>
              <option value="staff">Staff</option>
              <option value="supervisor">Supervisor</option>
              <option value="washer">Washer</option>
              <option value="detailer">Detailer</option>
              <option value="pickup_driver">Pickup Driver</option>
              <option value="cashier">Cashier</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs font-semibold uppercase">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-black border border-gray-800 focus:border-red-600 outline-none text-white text-sm px-3 py-2 rounded-lg"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="revoked">Revoked Only</option>
            </select>
          </div>

          {(searchQuery || filterRole !== "all" || filterStatus !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterRole("all");
                setFilterStatus("all");
              }}
              className="text-xs text-red-500 hover:text-red-400 hover:underline px-2 py-1 font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Grid/Table of Employees */}
      <div className="bg-[#0b0b0b] rounded-xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-500">
            <svg className="animate-spin h-8 w-8 mx-auto text-red-600 mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Fetching staff registry...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-sm">
            No employees match the specified criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#141414] text-gray-400 font-semibold uppercase tracking-wider text-xs border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4">Staff Code</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Salary/Day</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Jobs</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-850">
                {filteredEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="hover:bg-[#121212]/40 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-semibold text-red-400">
                      {employee.employeeCode}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{employee.name}</div>
                      {employee.email && (
                        <div className="text-gray-500 text-xs mt-0.5">{employee.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-[#1e1e1e] text-gray-300 text-xs px-2.5 py-1 rounded-full font-medium border border-gray-800">
                        {getRoleLabel(employee.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white font-medium">
                      ₹{employee.salaryPerDay}
                    </td>
                    <td className="px-6 py-4 text-gray-300 font-mono">
                      {employee.phoneNumber || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-yellow-500">★</span>
                        <span className="font-semibold text-white">
                          {(employee.customerRating || 5.0).toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {employee.jobsCompleted || 0}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border ${
                          employee.status === "active"
                            ? "bg-green-950/40 text-green-400 border-green-800/40"
                            : "bg-red-950/40 text-red-400 border-red-800/40"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            employee.status === "active" ? "bg-green-400" : "bg-red-400"
                          }`}
                        />
                        {employee.status === "active" ? "Active" : "Revoked"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setDrawerData(employee);
                          setResetPasswordInput("");
                        }}
                        className="bg-[#222] hover:bg-red-600 hover:text-white transition-all text-gray-300 font-semibold px-4 py-2 rounded-lg text-xs"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Permissions & Wage Guidelines Accordion */}
      <div className="mt-8 bg-[#0b0b0b] rounded-xl border border-gray-800 overflow-hidden">
        <button
          onClick={() => setShowRoleGuidelines(!showRoleGuidelines)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-[#111]/40 transition-colors"
        >
          <div>
            <h3 className="text-lg font-bold text-red-500 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Role Authority & Wage Guidelines
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Review operational scopes, permission matrices, and recommended daily wage scales.
            </p>
          </div>
          <span className="text-red-500 font-bold font-mono">
            {showRoleGuidelines ? "▲ Collapse" : "▼ Expand Guidelines"}
          </span>
        </button>

        {showRoleGuidelines && (
          <div className="p-6 border-t border-gray-850 bg-black/40 space-y-6 text-sm text-gray-300">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-[#111]/60 p-4 rounded-xl border border-gray-850/80">
                <h4 className="font-bold text-white flex items-center gap-1.5 text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span> Admin
                </h4>
                <p className="text-xs text-gray-400 mt-2">
                  Full system control. Access to settings, financial stats, payroll generation, coupons, system backups, and database resets.
                </p>
                <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between text-xs text-gray-500">
                  <span>Wage Scale:</span>
                  <span className="font-mono text-white font-semibold">Custom/Profit Share</span>
                </div>
              </div>

              <div className="bg-[#111]/60 p-4 rounded-xl border border-gray-850/80">
                <h4 className="font-bold text-white flex items-center gap-1.5 text-orange-400">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span> Manager
                </h4>
                <p className="text-xs text-gray-400 mt-2">
                  Operational override. Create and edit staff profiles, adjust inventory restocks, override services pricing, manage campaigns, review closing statements.
                </p>
                <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between text-xs text-gray-500">
                  <span>Wage Scale:</span>
                  <span className="font-mono text-white font-semibold">₹1,000 - ₹1,800 / day</span>
                </div>
              </div>

              <div className="bg-[#111]/60 p-4 rounded-xl border border-gray-850/80">
                <h4 className="font-bold text-white flex items-center gap-1.5 text-yellow-400">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Supervisor
                </h4>
                <p className="text-xs text-gray-400 mt-2">
                  Shift supervisor. Log check-ins/attendance, view live pipelines, manage assignments, create drive-in bookings, apply specific discounts, create customer invoices.
                </p>
                <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between text-xs text-gray-500">
                  <span>Wage Scale:</span>
                  <span className="font-mono text-white font-semibold">₹600 - ₹1,000 / day</span>
                </div>
              </div>

              <div className="bg-[#111]/60 p-4 rounded-xl border border-gray-850/80">
                <h4 className="font-bold text-white flex items-center gap-1.5 text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-500"></span> Cashier
                </h4>
                <p className="text-xs text-gray-400 mt-2">
                  POS operations. Create bookings, apply valid discount coupons, update payment states, and file daily cash closings before closing shift.
                </p>
                <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between text-xs text-gray-500">
                  <span>Wage Scale:</span>
                  <span className="font-mono text-white font-semibold">₹500 - ₹800 / day</span>
                </div>
              </div>

              <div className="bg-[#111]/60 p-4 rounded-xl border border-gray-850/80">
                <h4 className="font-bold text-white flex items-center gap-1.5 text-green-400">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span> Washer & Detailer
                </h4>
                <p className="text-xs text-gray-400 mt-2">
                  Floor tasks. Execute bookings, inspect detailing targets, report completed milestones to claim job incentives (per car payout scale).
                </p>
                <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between text-xs text-gray-500">
                  <span>Wage Scale:</span>
                  <span className="font-mono text-white font-semibold">₹350 - ₹600 / day</span>
                </div>
              </div>

              <div className="bg-[#111]/60 p-4 rounded-xl border border-gray-850/80">
                <h4 className="font-bold text-white flex items-center gap-1.5 text-purple-400">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span> Pickup Driver
                </h4>
                <p className="text-xs text-gray-400 mt-2">
                  Concierge delivery. Assigned to booking pickup requests. Tracks pickup/delivery timestamps, responsible for vehicle logistics reports.
                </p>
                <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between text-xs text-gray-500">
                  <span>Wage Scale:</span>
                  <span className="font-mono text-white font-semibold">₹400 - ₹700 / day</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-800 bg-[#070707] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <p className="font-semibold text-white">Need to update base wages?</p>
                <p className="text-gray-500">You can adjust daily wage rates by viewing any staff member profile above and modifying the financial config fields.</p>
              </div>
              <div className="text-gray-400 font-semibold font-mono">
                System Standard Payout = (Days Worked * Daily Wage) + Incentives - Penalties
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Profile Drawer */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setSelectedEmployee(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Body */}
          <div className="relative w-full max-w-2xl bg-[#0d0d0d] border-l border-gray-800 shadow-2xl h-full flex flex-col z-10">
            {/* Header */}
            <div className="p-6 border-b border-gray-850 flex items-center justify-between bg-[#111]">
              <div>
                <span className="font-mono text-xs font-semibold text-red-500 uppercase tracking-wider">
                  Employee Dossier
                </span>
                <h2 className="text-2xl font-bold text-white mt-1">
                  {drawerData.name} ({drawerData.employeeCode})
                </h2>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800/50 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Profile stats highlights */}
              <div className="grid grid-cols-3 gap-3 bg-black p-4 rounded-xl border border-gray-850">
                <div className="text-center">
                  <div className="text-gray-500 text-xs font-semibold">Jobs done</div>
                  <div className="text-xl font-bold text-white mt-1">{drawerData.jobsCompleted || 0}</div>
                </div>
                <div className="text-center border-x border-gray-850">
                  <div className="text-gray-500 text-xs font-semibold">Revenue</div>
                  <div className="text-xl font-bold text-green-400 mt-1">₹{drawerData.revenueGenerated || 0}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500 text-xs font-semibold">Rating</div>
                  <div className="text-xl font-bold text-yellow-500 mt-1">★ {(drawerData.customerRating || 5.0).toFixed(1)}</div>
                </div>
              </div>

              {/* Grid sections */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Basic Personal Info */}
                <div className="space-y-4">
                  <h3 className="text-red-500 text-xs font-bold uppercase tracking-wider border-b border-gray-850 pb-2">
                    Primary Profile
                  </h3>

                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500 text-xs font-semibold">Full Name</label>
                    <input
                      value={drawerData.name || ""}
                      onChange={(e) => setDrawerData({ ...drawerData, name: e.target.value })}
                      className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500 text-xs font-semibold">Phone Number</label>
                    <input
                      value={drawerData.phoneNumber || ""}
                      onChange={(e) => setDrawerData({ ...drawerData, phoneNumber: e.target.value })}
                      className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500 text-xs font-semibold">Email ID</label>
                    <input
                      value={drawerData.email || ""}
                      onChange={(e) => setDrawerData({ ...drawerData, email: e.target.value })}
                      placeholder="No email registered (defaults to owii.rajput@gmail.com)"
                      className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none"
                    />
                  </div>
                </div>

                {/* Operations & Identity */}
                <div className="space-y-4">
                  <h3 className="text-red-500 text-xs font-bold uppercase tracking-wider border-b border-gray-850 pb-2">
                    Employment Details
                  </h3>

                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500 text-xs font-semibold">Branch Location</label>
                    <input
                      value={drawerData.branch || ""}
                      onChange={(e) => setDrawerData({ ...drawerData, branch: e.target.value })}
                      placeholder="e.g. Rohini Sector-3"
                      className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500 text-xs font-semibold">Shift Schedule</label>
                    <select
                      value={drawerData.shiftType || "day"}
                      onChange={(e) => setDrawerData({ ...drawerData, shiftType: e.target.value })}
                      className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none"
                    >
                      <option value="day">Day Shift</option>
                      <option value="night">Night Shift</option>
                      <option value="rotational">Rotational</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500 text-xs font-semibold">Employment Status</label>
                    <select
                      value={drawerData.status || "active"}
                      onChange={(e) => setDrawerData({ ...drawerData, status: e.target.value })}
                      className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="revoked">Revoked</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Financial Compensation */}
                <div className="space-y-4 bg-[#111]/40 p-4 rounded-xl border border-gray-850">
                  <h3 className="text-red-500 text-xs font-bold uppercase tracking-wider border-b border-gray-855 pb-2">
                    Financial Config
                  </h3>

                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500 text-xs font-semibold">Base Salary / Day</label>
                    <input
                      type="number"
                      value={drawerData.salaryPerDay || 0}
                      onChange={(e) => setDrawerData({ ...drawerData, salaryPerDay: Number(e.target.value) })}
                      className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500 text-xs font-semibold">Incentives</label>
                      <input
                        type="number"
                        value={drawerData.incentives || 0}
                        onChange={(e) => setDrawerData({ ...drawerData, incentives: Number(e.target.value) })}
                        className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-green-400 focus:border-red-600 outline-none font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500 text-xs font-semibold">Penalties</label>
                      <input
                        type="number"
                        value={drawerData.penalties || 0}
                        onChange={(e) => setDrawerData({ ...drawerData, penalties: Number(e.target.value) })}
                        className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-red-400 focus:border-red-600 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Days worked this month:</span>
                      <span className="text-white font-semibold font-mono">
                        {selectedEmployeeAttendanceStats.totalDaysWorked} days ({selectedEmployeeAttendanceStats.present} Present, {selectedEmployeeAttendanceStats.halfDay} Half Day)
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-semibold text-red-500">Calculated Payout:</span>
                      <span className="font-bold text-lg text-green-400 font-mono">
                        ₹{Math.max(
                          (selectedEmployeeAttendanceStats.totalDaysWorked * (drawerData.salaryPerDay || 0)) + 
                          (drawerData.incentives || 0) - 
                          (drawerData.penalties || 0), 
                          0
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verification Documents & Role */}
                <div className="space-y-4 bg-[#111]/40 p-4 rounded-xl border border-gray-850">
                  <h3 className="text-red-500 text-xs font-bold uppercase tracking-wider border-b border-gray-855 pb-2">
                    Security & Verification
                  </h3>

                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500 text-xs font-semibold">Aadhaar UID Number</label>
                    <input
                      value={drawerData.aadhaarNumber || ""}
                      onChange={(e) => setDrawerData({ ...drawerData, aadhaarNumber: e.target.value })}
                      placeholder="12-digit Aadhaar UID"
                      className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500 text-xs font-semibold">Emergency Contact</label>
                    <input
                      value={drawerData.emergencyContact || ""}
                      onChange={(e) => setDrawerData({ ...drawerData, emergencyContact: e.target.value })}
                      placeholder="Relation & Phone"
                      className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500 text-xs font-semibold">Employment Role</label>
                    <select
                      value={drawerData.role || "staff"}
                      onChange={(e) => setDrawerData({ ...drawerData, role: e.target.value })}
                      className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none"
                    >
                      <option value="staff">Staff</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="washer">Washer</option>
                      <option value="detailer">Detailer</option>
                      <option value="pickup_driver">Pickup Driver</option>
                      <option value="cashier">Cashier</option>
                      {currentUserRole === "admin" && <option value="manager">Manager</option>}
                    </select>
                  </div>
                </div>
              </div>

              {/* Home Address & Performance Inputs */}
              <div className="space-y-4">
                <h3 className="text-red-500 text-xs font-bold uppercase tracking-wider border-b border-gray-855 pb-2">
                  Address & Performance Indices
                </h3>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-500 text-xs font-semibold">Residential Address</label>
                  <input
                    value={drawerData.address || ""}
                    onChange={(e) => setDrawerData({ ...drawerData, address: e.target.value })}
                    placeholder="Full street address details"
                    className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500 text-xs font-semibold">Total Upsells (Value)</label>
                    <input
                      type="number"
                      value={drawerData.totalUpsells || 0}
                      onChange={(e) => setDrawerData({ ...drawerData, totalUpsells: Number(e.target.value) })}
                      className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500 text-xs font-semibold">Attendance Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={drawerData.attendancePercent || 0}
                      onChange={(e) => setDrawerData({ ...drawerData, attendancePercent: Number(e.target.value) })}
                      className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Credentials & Security Area */}
              <div className="p-4 rounded-xl border border-yellow-900/30 bg-yellow-950/10 space-y-3">
                <h4 className="text-yellow-500 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Security Operations
                </h4>
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 text-xs font-semibold">Set New Password</label>
                  <input
                    type="password"
                    placeholder="Leave blank to preserve current password"
                    value={resetPasswordInput}
                    onChange={(e) => setResetPasswordInput(e.target.value)}
                    className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none"
                  />
                  <p className="text-gray-500 text-[10px] mt-0.5">
                    Password updates take effect immediately on next login attempt. Min. 6 characters.
                  </p>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="flex flex-col gap-1">
                <label className="text-red-500 text-xs font-bold uppercase tracking-wider border-b border-gray-855 pb-1">
                  Managerial / Operational Notes
                </label>
                <textarea
                  value={drawerData.notes || ""}
                  onChange={(e) => setDrawerData({ ...drawerData, notes: e.target.value })}
                  rows={3}
                  placeholder="Record disciplinary updates, check-in records, or operational performance commentary..."
                  className="bg-black border border-gray-800 p-3 rounded-lg text-sm text-white focus:border-red-600 outline-none w-full"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-gray-850 flex items-center justify-between gap-3 bg-[#111]">
              <button
                onClick={handleDeleteEmployee}
                disabled={savingDrawer || deletingEmployee}
                className="bg-red-950/40 hover:bg-red-900 border border-red-800/40 hover:border-red-600 text-red-400 font-semibold px-5 py-2.5 rounded-lg text-sm transition-all duration-200"
              >
                {deletingEmployee ? "Deleting..." : "Delete Employee"}
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedEmployee(null)}
                  disabled={savingDrawer || deletingEmployee}
                  className="bg-transparent hover:bg-gray-800 border border-gray-800 text-gray-300 font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveDrawer}
                  disabled={savingDrawer || deletingEmployee}
                  className="bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all text-white font-semibold px-6 py-2.5 rounded-lg text-sm shadow-md"
                >
                  {savingDrawer ? "Saving updates..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Employee Drawer/Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            onClick={() => setShowCreateForm(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal content */}
          <div className="relative w-full max-w-xl bg-[#0d0d0d] border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-850 flex justify-between items-center bg-[#111]">
              <div>
                <h3 className="text-xl font-bold text-white">Enroll New Employee</h3>
                <p className="text-xs text-gray-400">Configure credentials and assign starting attributes</p>
              </div>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-white p-2 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* Form Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 text-xs font-semibold">Employee ID Code</label>
                  <input
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    placeholder="e.g. KKS0012"
                    className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 text-xs font-semibold">Job Designation Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none"
                  >
                    <option value="staff">Staff</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="washer">Washer</option>
                    <option value="detailer">Detailer</option>
                    <option value="pickup_driver">Pickup Driver</option>
                    <option value="cashier">Cashier</option>
                    {currentUserRole === "admin" && <option value="manager">Manager</option>}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-xs font-semibold">Employee Name *</label>
                <input
                  placeholder="Full Legal Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 text-xs font-semibold">Phone Number *</label>
                  <input
                    placeholder="10-digit Phone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-gray-400 text-xs font-semibold">Starting Password *</label>
                  <input
                    type="password"
                    placeholder="Secure Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-xs font-semibold">Starting Daily Base Salary (₹) *</label>
                <input
                  type="number"
                  placeholder="Base Daily Salary, e.g. 500"
                  value={salaryPerDay}
                  onChange={(e) => setSalaryPerDay(e.target.value)}
                  className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none font-mono"
                />
              </div>

              {/* Advanced toggler */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs font-bold text-red-500 hover:text-red-400 flex items-center gap-1 focus:outline-none"
                >
                  {showAdvanced ? "Hide Advanced Fields ▲" : "Show Advanced Fields (Aadhaar, Email, Address) ▼"}
                </button>
              </div>

              {showAdvanced && (
                <div className="space-y-4 pt-2 border-t border-gray-850 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-400 text-xs font-semibold">Email ID (Optional)</label>
                      <input
                        placeholder="e.g. employee@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-gray-400 text-xs font-semibold">Aadhaar Number (Optional)</label>
                      <input
                        placeholder="12-digit Aadhaar"
                        value={aadhaarNumber}
                        onChange={(e) => setAadhaarNumber(e.target.value)}
                        className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-400 text-xs font-semibold">Emergency Contact</label>
                      <input
                        placeholder="Name & Contact"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-gray-400 text-xs font-semibold">Branch Assignment</label>
                      <input
                        placeholder="e.g. Rohini"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-gray-400 text-xs font-semibold">Shift Schedule</label>
                    <select
                      value={shiftType}
                      onChange={(e) => setShiftType(e.target.value)}
                      className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none"
                    >
                      <option value="day">Day Shift</option>
                      <option value="night">Night Shift</option>
                      <option value="rotational">Rotational</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-gray-400 text-xs font-semibold">Residential Address</label>
                    <input
                      placeholder="Full Address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="bg-black border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:border-red-600 outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-gray-400 text-xs font-semibold">Managerial Notes</label>
                    <textarea
                      placeholder="Disciplinary/Work background notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="bg-black border border-gray-800 p-3 rounded-lg text-sm text-white focus:border-red-600 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-850 flex justify-end gap-3 bg-[#111]">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-transparent hover:bg-gray-800 border border-gray-800 text-gray-300 font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateEmployee}
                className="bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all text-white font-semibold px-6 py-2.5 rounded-lg text-sm shadow-md"
              >
                Enroll Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
