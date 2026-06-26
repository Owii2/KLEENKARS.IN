"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  ClipboardList, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Edit,
  Plus,
  Download,
  User,
  Phone,
  Clock,
  CreditCard,
  Tag,
  History,
  Camera,
  BookOpen,
  Trash2
} from "lucide-react";
import { jsPDF } from "jspdf";

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
  addons?: string[];
  pickupDrop?: boolean;
  notes?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  employeeCode?: string;
}

interface Attendance {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  attendanceStatus: string;
  checkIn: string;
}

interface Service {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  category?: string | null;
  isActive: boolean;
}

const ActiveTimer = ({ startedAt }: { startedAt: string | null | undefined }) => {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!startedAt) {
      setElapsed("");
      return;
    }
    const interval = setInterval(() => {
      const start = new Date(startedAt).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, now - start);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      let timeStr = "";
      if (hours > 0) timeStr += `${hours}h `;
      timeStr += `${minutes}m ${seconds}s`;
      setElapsed(timeStr);
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  if (!startedAt) return null;
  return (
    <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 flex items-center gap-1 animate-pulse">
      ⏱ {elapsed || "0m 0s"}
    </span>
  );
};

export default function StaffPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Detailer workspace states
  const [detailingBooking, setDetailingBooking] = useState<Booking | null>(null);
  const [detailerChecklist, setDetailerChecklist] = useState<boolean[]>([false, false, false, false, false]);
  const [detailerPhotos, setDetailerPhotos] = useState<string[]>([]);
  const [detailerNotesText, setDetailerNotesText] = useState("");
  const [isSubmittingDetailer, setIsSubmittingDetailer] = useState(false);
  const [historyPhone, setHistoryPhone] = useState<string | null>(null);

  const getServiceTypeCategory = (serviceName: string): "Ceramic" | "PPF" | "Interior" | "General" => {
    const name = (serviceName || "").toLowerCase();
    if (name.includes("ceramic")) return "Ceramic";
    if (name.includes("ppf") || name.includes("protection")) return "PPF";
    if (name.includes("interior")) return "Interior";
    return "General";
  };

  const getServiceInstructions = (category: "Ceramic" | "PPF" | "Interior" | "General") => {
    switch (category) {
      case "Ceramic":
        return [
          { title: "Decontamination & Wash", desc: "Spray iron remover, rinse, and clay bar all surfaces to ensure a perfectly smooth finish." },
          { title: "Paint Correction", desc: "Use dual-action machine polishing with compound and fine polish to remove 80-90% of swirl marks." },
          { title: "IPA Surface Prep", desc: "Wipe down panels using isopropyl alcohol (IPA) to strip polishing oils and ensure proper coating bond." },
          { title: "Coating Application", desc: "Apply coating in 2x2 sections with cross-hatch strokes. Wait for flashing (1-2 mins) and buff flush with clean microfiber." },
          { title: "Top Coat & IR Cure", desc: "Bake under infrared curing lamps or air-dry for 12 hours, then apply silica top-coat sealant." }
        ];
      case "PPF":
        return [
          { title: "Paint Prep & Gaps", desc: "Decontaminate paint and deep-clean panel edges, badges, and gaps with isopropyl alcohol." },
          { title: "Precision Alignment", desc: "Squeegee water and slip solution under custom-cut PPF panels to align perfectly." },
          { title: "Squeegee Water out", desc: "Remove all excess water bubbles from center outwards using medium firm pressure." },
          { title: "Edge wrapping & Heat gun", desc: "Dry wrap edges with a heat gun to seal, shrink, and wrap film around inner panels securely." },
          { title: "Bubble & Lifting Inspection", desc: "Conduct final check under dual lights for trapped bubbles, dust, or edge lifting." }
        ];
      case "Interior":
        return [
          { title: "Vent Blowout & Vacuum", desc: "Use compressed air in tight spots and vacuum seats, under seats, carpets, and trunk." },
          { title: "Dashboard & Trim Cleanup", desc: "Scrub dashboard, door panel cards, and center console using soft brushes and APC." },
          { title: "Leather/Fabric Deep Clean", desc: "Shampoo fabrics or clean leather seats with pH-balanced scrub. Condition leather surfaces." },
          { title: "Ceiling & Door Trim", desc: "Gently steam cleaner headliner stains and clean plastic sill plates." },
          { title: "UV Coat & Windows", desc: "Apply non-greasy UV dressing protectant and wipe glass windows streak-free." }
        ];
      default:
        return [
          { title: "Pre-Rinse Wheel Arches", desc: "Blast thick mud out of wheel wells, tires, undercarriage, and rocker panels." },
          { title: "Snow Foam Wash", desc: "Coat car in foam wash. Hand wash top-to-bottom using microfiber wash mitts (two-bucket method)." },
          { title: "De-ionized Water Rinse", desc: "Rinse body completely to ensure clean surfaces." },
          { title: "Microfiber Towel Dry", desc: "Use extra-large drying towel and blow dry door jams, side mirrors, and emblems." },
          { title: "Tire Dress & Glass Clean", desc: "Apply high-gloss dressing to tires and wipe exterior/interior windshield glass." }
        ];
    }
  };

  const getServiceChecklist = (category: "Ceramic" | "PPF" | "Interior" | "General") => {
    switch (category) {
      case "Ceramic":
        return [
          "Decontamination and clay-bar treatment completed",
          "Multi-stage machine paint correction completed",
          "IPA wipe-down finished to remove all polishing oils",
          "Ceramic base coat applied panel-by-panel and buffed off",
          "IR lamp heat-curing or air-cure top coat applied"
        ];
      case "PPF":
        return [
          "Paint completely decontaminated and edges cleaned",
          "PPF film aligned and applied using slip solution",
          "Water and bubbles squeegeed out fully",
          "Edges wrapped and shrunk using heat gun",
          "Inspection for dust specs and lifting completed"
        ];
      case "Interior":
        return [
          "Air vents blown out and interior vacuumed fully",
          "Dashboard, console, and door cards deep cleaned",
          "Seats shampooed or leather conditioned",
          "Ceiling headliner and door pillar cloths cleaned",
          "UV protectant dressed and windows streak-free"
        ];
      default:
        return [
          "Undercarriage and wheel arches pressure-rinsed",
          "Snow foam wash hand-rubbed top to bottom",
          "Exterior rinsed cleanly with pressure water",
          "Drying completed with microfibers and air blowers",
          "Tires dressed and windshields wiped clean"
        ];
    }
  };

  const fetchData = async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();
      if (authData.type === "employee") {
        setEmployee(authData.employee);
        
        // Fetch bookings (allowed for all staff roles)
        const bookingRes = await fetch("/api/bookings");
        const bookingData = await bookingRes.json();
        setBookings(bookingData.bookings || []);

        // If supervisor, fetch employees list, attendance logs, and active services
        if (authData.employee.role === "supervisor") {
          const [empRes, attRes, servRes] = await Promise.all([
            fetch("/api/employees"),
            fetch("/api/attendance"),
            fetch("/api/services")
          ]);
          if (empRes.ok) {
            const empData = await empRes.json();
            setEmployees(empData.employees || []);
          }
          if (attRes.ok) {
            const attData = await attRes.json();
            setAttendance(attData.attendance || []);
          }
          if (servRes.ok) {
            const servData = await servRes.json();
            setServices(servData.services || []);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching staff dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateStatus = async (bookingId: string, status: string) => {
    await fetch(`/api/bookings/${bookingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchData();
  };

  const handleDetailerPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setDetailerPhotos((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeDetailerPhoto = (index: number) => {
    setDetailerPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const submitDetailerTask = async () => {
    if (!detailingBooking) return;
    setIsSubmittingDetailer(true);

    const category = getServiceTypeCategory(detailingBooking.serviceType);
    
    // Read existing notes JSON to preserve supervisor or other data
    let existingNotes = {};
    if (detailingBooking.notes) {
      try {
        existingNotes = JSON.parse(detailingBooking.notes);
      } catch {}
    }

    const payloadNotes = JSON.stringify({
      ...existingNotes,
      detailerPhotos,
      detailerChecklist,
      detailerNotesText,
      detailerCompletedAt: new Date().toISOString(),
      serviceInstructionsCategory: category,
    });

    try {
      const res = await fetch(`/api/bookings/${detailingBooking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Completed",
          notes: payloadNotes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Failed to update detailing task.");
        return;
      }

      alert("Detailing task completed successfully!");
      setDetailingBooking(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Error submitting task details.");
    } finally {
      setIsSubmittingDetailer(false);
    }
  };

  const submitWasherTask = async () => {
    if (!detailingBooking) return;
    setIsSubmittingDetailer(true);

    let existingNotes = {};
    if (detailingBooking.notes) {
      try {
        existingNotes = JSON.parse(detailingBooking.notes);
      } catch {}
    }

    const payloadNotes = JSON.stringify({
      ...existingNotes,
      detailerPhotos,
      detailerChecklist,
      detailerNotesText,
      detailerCompletedAt: new Date().toISOString(),
      serviceInstructionsCategory: "General",
      washerJob: true
    });

    try {
      const res = await fetch(`/api/bookings/${detailingBooking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Completed",
          completedAt: new Date().toISOString(),
          notes: payloadNotes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Failed to update wash task.");
        return;
      }

      alert("Wash job completed successfully!");
      setDetailingBooking(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Error submitting wash details.");
    } finally {
      setIsSubmittingDetailer(false);
    }
  };

  const WasherDashboard = () => {
    const [subTab, setSubTab] = useState<"active" | "history">("active");
    const isWasher = employee?.role === "washer";

    const myActiveBookings = bookings.filter(
      (b) => b.assignedEmployeeId === employee?.id && b.status !== "Completed" && b.status !== "Cancelled"
    );

    const myCompletedBookings = bookings.filter(
      (b) => b.assignedEmployeeId === employee?.id && b.status === "Completed"
    );

    const category = detailingBooking ? getServiceTypeCategory(detailingBooking.serviceType) : "General";
    const instructions = detailingBooking ? getServiceInstructions(category) : [];
    
    // Washer uses basic wash checklist, detailer uses service-specific checklist
    const checklistItems = detailingBooking 
      ? (isWasher 
          ? [
              "Undercarriage and wheel arches pressure-rinsed cleanly",
              "Snow foam wash applied and exterior mitt-washed",
              "Exterior body rinsed completely to remove soap residue",
              "Exterior dried using premium microfibers and air blowers",
              "Tire walls polished and gloss dressing applied"
            ]
          : getServiceChecklist(category))
      : [];

    const handleCheckboxToggle = (index: number) => {
      setDetailerChecklist((prev) => {
        const next = [...prev];
        next[index] = !next[index];
        return next;
      });
    };

    const isAllChecked = detailerChecklist.every(Boolean);

    const handleStartJob = async (bookingId: string) => {
      await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Washing",
          startedAt: new Date().toISOString()
        }),
      });
      fetchData();
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/5 p-6 rounded-3xl border border-indigo-500/20">
          <div>
            <h2 className="text-3xl font-extrabold text-indigo-300">
              {isWasher ? "Wash Station Workspace" : "Detailing Workspace"}
            </h2>
            <p className="text-gray-400 mt-1">
              {isWasher 
                ? "Track assigned wash orders, execute procedure checklists, and log completion times." 
                : "Access your assigned jobs, checklist procedures, and client vehicle histories."}
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-4 py-2 rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Queue
          </button>
        </div>

        {/* Sub tabs */}
        <div className="flex border-b border-gray-800 gap-2 pb-px overflow-x-auto">
          <button
            onClick={() => setSubTab("active")}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
              subTab === "active"
                ? "border-indigo-400 text-indigo-300 bg-indigo-500/5 rounded-t-xl"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            {isWasher ? "Active Wash Queue" : "Active Detailing Queue"} ({myActiveBookings.length})
          </button>
          <button
            onClick={() => setSubTab("history")}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
              subTab === "history"
                ? "border-indigo-400 text-indigo-300 bg-indigo-500/5 rounded-t-xl"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <History className="w-4 h-4" />
            Completed Work History ({myCompletedBookings.length})
          </button>
        </div>

        {subTab === "active" ? (
          myActiveBookings.length === 0 ? (
            <div className="glass-panel p-8 text-center text-gray-400 border border-white/5">
              No active jobs assigned to you at the moment. Keep dynamic queue refreshed.
            </div>
          ) : (
            <div className="space-y-4">
              {myActiveBookings.map((b) => {
                const isWashing = b.status === "Washing" || b.status === "Active";
                let statusColor = "bg-yellow-500/10 text-yellow-300 border-yellow-500/20";
                if (isWashing) statusColor = "bg-blue-500/10 text-blue-300 border-blue-500/20";

                return (
                  <div key={b.id} className="glass-panel p-5 border border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-white/10 transition-all duration-300 group">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${statusColor}`}>
                          {b.status}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">Ref: {b.id.substring(0, 8).toUpperCase()}</span>
                        <span className="text-xs text-gray-400 font-medium bg-white/5 px-2 py-0.5 rounded flex items-center gap-1">
                          <Clock className="w-3 h-3 text-yellow-400" />
                          {b.bookingDate} at {b.bookingTime}
                        </span>
                        {isWashing && b.startedAt && (
                          <ActiveTimer startedAt={b.startedAt} />
                        )}
                      </div>

                      <div>
                        <h4 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          {isWasher ? `Client #${b.id.substring(0, 5).toUpperCase()}` : b.customerName}
                        </h4>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
                          {!isWasher && (
                            <>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-gray-500" /> {b.phoneNumber || "-"}
                              </span>
                              <span>•</span>
                            </>
                          )}
                          <span>Vehicle: <strong className="text-gray-300">{b.vehicleType}</strong></span>
                          <span>•</span>
                          <span>Service: <strong className="text-indigo-300">{b.serviceType}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      {!isWasher && (
                        <button
                          onClick={() => setHistoryPhone(b.phoneNumber || null)}
                          className="flex items-center justify-center gap-1.5 bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-500/20 px-4 py-2.5 rounded-xl text-xs font-bold transition active:scale-95"
                        >
                          <History className="w-4 h-4" />
                          Vehicle History
                        </button>
                      )}

                      {!isWashing ? (
                        <button
                          onClick={() => handleStartJob(b.id)}
                          className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 shadow-lg shadow-blue-500/15"
                        >
                          Start Job
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setDetailerChecklist([false, false, false, false, false]);
                            setDetailerPhotos([]);
                            setDetailerNotesText("");
                            setDetailingBooking(b);
                          }}
                          className="flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 shadow-lg shadow-green-500/15"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Checklist & Complete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          myCompletedBookings.length === 0 ? (
            <div className="glass-panel p-8 text-center text-gray-400 border border-white/5">
              No completed jobs on record. Start finishing your assigned tasks to populate this history.
            </div>
          ) : (
            <div className="space-y-4">
              {myCompletedBookings.map((b) => (
                <div key={b.id} className="glass-panel p-5 border border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 opacity-75">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border border-green-500/20 bg-green-500/10 text-green-300">
                        Finished
                      </span>
                      <span className="text-xs text-gray-500 font-mono">Ref: {b.id.substring(0, 8).toUpperCase()}</span>
                      <span className="text-xs text-gray-400 font-medium bg-white/5 px-2 py-0.5 rounded">
                        {b.bookingDate} at {b.bookingTime}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-lg font-bold text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        {isWasher ? `Client #${b.id.substring(0, 5).toUpperCase()}` : b.customerName}
                      </h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
                        <span>Vehicle: <strong className="text-gray-300">{b.vehicleType}</strong></span>
                        <span>•</span>
                        <span>Service: <strong className="text-indigo-300">{b.serviceType}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Detailing Checklist & Photos Modal */}
        {detailingBooking && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
            <div className="bg-gray-900 border border-white/10 p-6 rounded-3xl w-full max-w-lg shadow-2xl glass-panel relative text-left max-h-[90vh] overflow-y-auto animate-fade-in">
              <h3 className="text-xl font-bold mb-1 text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-400" />
                {isWasher ? "Wash Checklist & Verification" : "Detailing Checklist & Progress"}
              </h3>
              <p className="text-xs text-gray-400 mb-6">
                {isWasher 
                  ? "Complete basic wash steps and upload completion photos to finalize wash order." 
                  : `Complete the required steps and upload photos for: ${detailingBooking.serviceType}`}
              </p>

              <div className="space-y-6">
                {/* Service Instructions Accordion - Show instructions only for detailers */}
                {!isWasher && instructions.length > 0 && (
                  <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-indigo-300 flex items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      Service Instructions ({category})
                    </h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {instructions.map((step, idx) => (
                        <div key={idx} className="text-xs border-l-2 border-indigo-500/30 pl-2.5">
                          <span className="font-bold text-yellow-400">Step {idx + 1}: {step.title}</span>
                          <p className="text-gray-400 mt-0.5">{step.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Checklist */}
                <div className="space-y-3 bg-black/40 p-4 rounded-xl border border-white/5">
                  <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2">
                    {isWasher ? "Wash Steps Checklist" : "Quality checklist validation"}
                  </h4>
                  {checklistItems.map((item, index) => (
                    <label key={index} className="flex items-start gap-3 cursor-pointer text-xs text-gray-300 select-none hover:text-white transition">
                      <input
                        type="checkbox"
                        checked={detailerChecklist[index]}
                        onChange={() => handleCheckboxToggle(index)}
                        className="mt-0.5 accent-yellow-500"
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>

                {/* Photo Uploads */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    {isWasher ? "Completion Photos" : "Work Progress Photos"}
                  </label>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {detailerPhotos.map((photo, index) => (
                      <div key={index} className="relative rounded-xl overflow-hidden border border-white/10 h-24 bg-black group">
                        <img src={photo} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeDetailerPhoto(index)}
                          className="absolute inset-0 bg-red-650/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-250 text-white font-bold"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    {detailerPhotos.length < 6 && (
                      <label className="flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl h-24 hover:border-yellow-500 cursor-pointer bg-black/20 hover:bg-black/40 transition">
                        <Camera className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-[9px] text-gray-500 font-semibold">Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleDetailerPhotoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {isWasher ? "Upload up to 6 completion photos." : "Upload up to 6 work progress photos (base64 serialized)."}
                  </p>
                </div>

                {/* Detailing Notes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                    {isWasher ? "Wash Notes (Optional)" : "Detailer Notes (Optional)"}
                  </label>
                  <textarea
                    value={detailerNotesText}
                    onChange={(e) => setDetailerNotesText(e.target.value)}
                    placeholder={isWasher ? "Enter any notes or observations about the wash..." : "Enter any vehicle conditions, exceptions, or recommendations..."}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition h-16 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 border-t border-white/5 pt-4">
                <button
                  onClick={() => setDetailingBooking(null)}
                  disabled={isSubmittingDetailer}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={isWasher ? submitWasherTask : submitDetailerTask}
                  disabled={!isAllChecked || isSubmittingDetailer}
                  className={`flex-1 py-3 rounded-xl font-bold transition shadow-lg ${
                    isAllChecked && !isSubmittingDetailer
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white active:scale-95 cursor-pointer shadow-green-500/10"
                      : "bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5"
                  }`}
                >
                  {isSubmittingDetailer ? "Submitting..." : "Complete Task"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Customer History Modal */}
        {historyPhone && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
            <div className="bg-gray-900 border border-white/10 p-6 rounded-3xl w-full max-w-2xl shadow-2xl glass-panel relative text-left max-h-[85vh] overflow-y-auto animate-fade-in">
              <h3 className="text-xl font-bold mb-2 text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" />
                Customer Vehicle History
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Viewing detailing log records for phone: <span className="text-indigo-300 font-semibold">{historyPhone}</span>
              </p>

              {(() => {
                const historyList = bookings.filter((b) => b.phoneNumber === historyPhone);
                if (historyList.length === 0) {
                  return <p className="text-gray-400 text-center py-6">No previous detailing records found for this phone number.</p>;
                }
                return (
                  <div className="overflow-x-auto border border-white/5 rounded-2xl">
                    <table className="w-full text-left text-sm text-gray-300">
                      <thead>
                        <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-gray-400 bg-white/5">
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Vehicle</th>
                          <th className="px-4 py-3">Service Package</th>
                          <th className="px-4 py-3">Price Paid</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {historyList.map((h) => (
                          <tr key={h.id} className="hover:bg-white/[0.02] transition">
                            <td className="px-4 py-3 font-medium text-white">{h.bookingDate}</td>
                            <td className="px-4 py-3 font-semibold text-yellow-400">{h.vehicleType}</td>
                            <td className="px-4 py-3">{h.serviceType}</td>
                            <td className="px-4 py-3 text-green-400">Rs. {h.finalAmount ?? h.totalCost}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                h.status === "Completed" 
                                  ? "bg-green-500/10 text-green-300 border-green-500/20" 
                                  : h.status === "Cancelled" 
                                  ? "bg-red-500/10 text-red-300 border-red-500/20" 
                                  : "bg-yellow-500/10 text-yellow-300 border-yellow-500/20"
                              }`}>
                                {h.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setHistoryPhone(null)}
                  className="bg-white/5 hover:bg-white/10 text-gray-300 px-6 py-2.5 rounded-xl font-bold transition active:scale-95 border border-white/5"
                >
                  Close History
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const SupervisorDashboard = () => {
    const [activeTab, setActiveTab] = useState<"attendance" | "bookings" | "closing">("attendance");

    const isToday = (dateString: string) => {
      if (!dateString) return false;
      const todayStr = new Date().toLocaleDateString('en-CA'); // returns "YYYY-MM-DD"
      if (dateString.includes('T') || dateString.includes(' ')) {
        const localDateStr = new Date(dateString).toLocaleDateString('en-CA');
        return localDateStr === todayStr;
      }
      return dateString === todayStr;
    };

    const getTodayAttendance = (empId: string) => {
      return attendance.find(
        (att) => att.employeeId === empId && isToday(att.checkIn)
      );
    };

    const todayCheckedInCount = employees.filter((emp) => {
      const att = getTodayAttendance(emp.id);
      return att && (att.attendanceStatus === "Present" || att.attendanceStatus === "Half Day");
    }).length;

    const pendingBookingsCount = bookings.filter((b) => b.status === "Pending").length;
    const assignedBookingsCount = bookings.filter((b) => b.status === "Assigned" || b.status === "Washing").length;

    const AttendanceTab = () => {
      const underEmployees = employees.filter(
        (emp) => emp.role !== "admin" && emp.role !== "manager" && emp.role !== "supervisor"
      );

      const handleMark = async (emp: Employee, status: string) => {
        try {
          const res = await fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              employeeId: emp.id,
              employeeCode: emp.employeeCode || emp.id.substring(0, 6),
              employeeName: emp.name,
              attendanceStatus: status,
            }),
          });
          if (!res.ok) {
            const data = await res.json();
            alert(data.message || "Failed to mark attendance");
            return;
          }
          fetchData();
        } catch (err) {
          console.error(err);
          alert("An error occurred while marking attendance");
        }
      };

      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Under Employees</h3>
            <span className="text-xs text-gray-400">Total: {underEmployees.length} staff members</span>
          </div>

          {underEmployees.length === 0 ? (
            <div className="glass-panel p-6 text-center text-gray-400 border border-white/5">
              No active staff reporting under your supervision found.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {underEmployees.map((emp) => {
                const todayAtt = getTodayAttendance(emp.id);

                return (
                  <div key={emp.id} className="glass-panel p-5 border border-white/5 flex flex-col justify-between gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                            {emp.employeeCode || "EMP"}
                          </span>
                          <span className="text-xs text-yellow-400 capitalize px-2 py-0.5 bg-yellow-400/10 rounded-full">
                            {emp.role}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-white mt-1.5">{emp.name}</h4>
                      </div>

                      {todayAtt ? (
                        <div className="flex flex-col items-end">
                          <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                            todayAtt.attendanceStatus === "Present"
                              ? "bg-green-500/20 text-green-300 border border-green-500/30"
                              : todayAtt.attendanceStatus === "Absent"
                              ? "bg-red-500/20 text-red-300 border border-red-500/30"
                              : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                          }`}>
                            {todayAtt.attendanceStatus}
                          </span>
                          <span className="text-[10px] text-gray-500 mt-1">
                            Checked at {new Date(todayAtt.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-500/10 text-gray-400 border border-gray-500/20">
                          Not Marked Today
                        </span>
                      )}
                    </div>

                    {!todayAtt && (
                      <div className="flex gap-2 border-t border-white/5 pt-3">
                        <button
                          onClick={() => handleMark(emp, "Present")}
                          className="flex-1 bg-green-600/10 hover:bg-green-600/20 active:bg-green-600 text-green-400 hover:text-white border border-green-500/30 py-2 rounded-xl text-sm font-semibold transition"
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleMark(emp, "Half Day")}
                          className="flex-1 bg-yellow-500/10 hover:bg-yellow-500/20 active:bg-yellow-500 text-yellow-400 hover:text-white border border-yellow-500/30 py-2 rounded-xl text-sm font-semibold transition"
                        >
                          Half Day
                        </button>
                        <button
                          onClick={() => handleMark(emp, "Absent")}
                          className="flex-1 bg-red-600/10 hover:bg-red-600/20 active:bg-red-600 text-red-400 hover:text-white border border-red-500/30 py-2 rounded-xl text-sm font-semibold transition"
                        >
                          Absent
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    };

    const BookingsTab = () => {
      // Filter bookings for today only
      const activeBookings = bookings.filter((b) => isToday(b.bookingDate));

      const washerDetailerStaff = employees.filter(
        (emp) => emp.role === "washer" || emp.role === "detailer"
      );

      // State for Edit Modal
      const [showEditModal, setShowEditModal] = useState(false);
      const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
      const [editCustomerName, setEditCustomerName] = useState("");
      const [editPhoneNumber, setEditPhoneNumber] = useState("");
      const [editBookingTime, setEditBookingTime] = useState("");
      const [editStatus, setEditStatus] = useState("");
      const [editDiscount, setEditDiscount] = useState(0);
      const [editTotalCost, setEditTotalCost] = useState(0);

      // Quality Control Modal States
      const [qcBooking, setQcBooking] = useState<Booking | null>(null);
      const [beforePhoto, setBeforePhoto] = useState<string>("");
      const [afterPhoto, setAfterPhoto] = useState<string>("");
      const [qcChecklist, setQcChecklist] = useState<boolean[]>([false, false, false, false, false]);
      const [isSubmittingQc, setIsSubmittingQc] = useState(false);

      const openQcModal = (b: Booking) => {
        setQcBooking(b);
        if (b.notes) {
          try {
            const data = JSON.parse(b.notes);
            if (data.qcPassed) {
              setBeforePhoto(data.beforePhoto || "");
              setAfterPhoto(data.afterPhoto || "");
              setQcChecklist(data.checklist || [false, false, false, false, false]);
              return;
            }
          } catch {
            // Notes was a plain string notes from cashier/manager, leave default empty
          }
        }
        setBeforePhoto("");
        setAfterPhoto("");
        setQcChecklist([false, false, false, false, false]);
      };

      const handleQcToggle = (index: number) => {
        setQcChecklist((prev) => {
          const next = [...prev];
          next[index] = !next[index];
          return next;
        });
      };

      const allQcChecked = qcChecklist.every(Boolean);

      const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after") => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (type === "before") setBeforePhoto(reader.result as string);
            else setAfterPhoto(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      };

      const submitQcPassed = async () => {
        if (!qcBooking) return;
        
        setIsSubmittingQc(true);
        const finalAmount = qcBooking.totalCost - (qcBooking.discount || 0);

        try {
          const res = await fetch(`/api/bookings/${qcBooking.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "Completed",
              notes: JSON.stringify({
                beforePhoto,
                afterPhoto,
                qcPassed: true,
                qcPassedAt: new Date().toISOString(),
                checklist: qcChecklist
              }),
              finalAmount: finalAmount >= 0 ? finalAmount : 0
            }),
          });

          if (!res.ok) {
            const data = await res.json();
            alert(data.message || "Failed to submit QC review.");
            return;
          }

          alert("Quality Control review passed! Wash order completed.");
          setQcBooking(null);
          fetchData();
        } catch (err) {
          console.error(err);
          alert("Error submitting quality checklist.");
        } finally {
          setIsSubmittingQc(false);
        }
      };

      // State for New Drive-In Modal
      const [showNewDriveModal, setShowNewDriveModal] = useState(false);
      const [newCustomerName, setNewCustomerName] = useState("");
      const [newPhoneNumber, setNewPhoneNumber] = useState("");
      const [newVehicleType, setNewVehicleType] = useState("Hatchback");
      const [newVehicleNumber, setNewVehicleNumber] = useState("");
      const [newServiceId, setNewServiceId] = useState("");
      const [newBookingTime, setNewBookingTime] = useState("");
      const [newBookingDate, setNewBookingDate] = useState("");
      const [newDiscount, setNewDiscount] = useState(0);
      const [newPaymentMode, setNewPaymentMode] = useState("Cash");

      // Auto-prefill time for New Drive-In
      useEffect(() => {
        if (showNewDriveModal) {
          const now = new Date();
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          setNewBookingTime(`${hours}:${minutes}`);
          setNewBookingDate(now.toLocaleDateString('en-CA'));
        }
      }, [showNewDriveModal]);

      const handleAssign = async (bookingId: string, employeeId: string) => {
        if (!employeeId) {
          alert("Please select a staff member first.");
          return;
        }

        const emp = employees.find((e) => e.id === employeeId);
        if (!emp) return;

        try {
          const res = await fetch(`/api/bookings/${bookingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              assignedEmployeeId: emp.id,
              assignedEmployeeName: emp.name,
              status: "Assigned"
            }),
          });

          if (!res.ok) {
            const data = await res.json();
            alert(data.message || "Failed to assign employee");
            return;
          }

          fetchData();
        } catch (err) {
          console.error(err);
          alert("Failed to assign staff member");
        }
      };

      const openEditModal = (b: Booking) => {
        setEditingBooking(b);
        setEditCustomerName(b.customerName);
        setEditPhoneNumber(b.phoneNumber || "");
        setEditBookingTime(b.bookingTime || "");
        // Map database status to our selector values: Pending, Active, Finished, Cancelled
        if (b.status === "Completed") {
          setEditStatus("Finished");
        } else if (b.status === "Washing" || b.status === "Assigned" || b.status === "Active") {
          setEditStatus("Active");
        } else {
          setEditStatus(b.status || "Pending");
        }
        setEditDiscount(b.discount || 0);
        setEditTotalCost(b.totalCost || 0);
        setShowEditModal(true);
      };

      const submitEdit = async () => {
        if (!editingBooking) return;

        // Map selector status back to DB status:
        // Finished -> Completed, Active -> Active, Pending -> Pending, Cancelled -> Cancelled
        let dbStatus = editStatus;
        if (editStatus === "Finished") dbStatus = "Completed";
        else if (editStatus === "Active") dbStatus = "Active";

        // Calculate finalAmount
        const finalAmount = editTotalCost - editDiscount;

        try {
          const res = await fetch(`/api/bookings/${editingBooking.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerName: editCustomerName,
              phoneNumber: editPhoneNumber,
              bookingTime: editBookingTime,
              status: dbStatus,
              discount: editDiscount,
              totalCost: editTotalCost,
              finalAmount: finalAmount >= 0 ? finalAmount : 0,
            }),
          });

          if (!res.ok) {
            const data = await res.json();
            alert(data.message || "Failed to update booking");
            return;
          }

          setShowEditModal(false);
          fetchData();
        } catch (err) {
          console.error(err);
          alert("Error updating booking");
        }
      };

      const submitNewDrive = async () => {
        if (!newCustomerName) {
          alert("Customer name is required.");
          return;
        }
        if (!newPhoneNumber) {
          alert("Phone number is required.");
          return;
        }
        if (!newServiceId) {
          alert("Please select a service package.");
          return;
        }

        // Validate or format phone number
        const cleanPhone = newPhoneNumber.trim();
        const formattedPhone = cleanPhone.startsWith("+91") 
          ? cleanPhone 
          : cleanPhone.length === 10 
            ? `+91${cleanPhone}` 
            : cleanPhone;

        const dateStr = newBookingDate || new Date().toLocaleDateString('en-CA');

        try {
          // 1. Create the booking with standard calculated pricing
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
                  vehicleType: newVehicleType || "Hatchback",
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

          // 2. If a custom discount is applied, or supervisor adjusted the cost, update via PUT
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

          setShowNewDriveModal(false);
          // Reset fields
          setNewCustomerName("");
          setNewPhoneNumber("");
          setNewVehicleType("Hatchback");
          setNewVehicleNumber("");
          setNewServiceId("");
          setNewDiscount(0);
          setNewPaymentMode("Cash");
          fetchData();
        } catch (err) {
          console.error(err);
          alert("Error creating booking");
        }
      };

      const generateInvoice = (booking: Booking) => {
        const doc = new jsPDF();

        // Red Header Bar
        doc.setFillColor(220, 38, 38); // bg-red-600
        doc.rect(0, 0, 210, 45, "F");

        // Title
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(28);
        doc.text("KLEENKARS", 15, 25);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("PREMIUM VEHICLE WASH & DETAILING SERVICES", 15, 34);

        // Document label
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("INVOICE RECEIPT", 145, 25);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`Booking Ref: ${booking.id.toUpperCase()}`, 145, 32);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 145, 37);

        // Body Setup
        doc.setTextColor(40, 40, 40);

        // Bill To Section
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("CUSTOMER DETAILS", 15, 60);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Name:       ${booking.customerName}`, 15, 68);
        doc.text(`Phone:      ${booking.phoneNumber || "-"}`, 15, 75);
        doc.text(`Date:       ${booking.bookingDate} at ${booking.bookingTime}`, 15, 82);

        // Service Description Table Headers
        doc.setFillColor(245, 245, 245);
        doc.rect(15, 95, 180, 10, "F");
        doc.setFont("helvetica", "bold");
        doc.text("Description of Wash Services", 20, 101);
        doc.text("Vehicle Class", 115, 101);
        doc.text("Amount (INR)", 160, 101);

        // Line dividers
        doc.setDrawColor(220, 220, 220);
        doc.line(15, 105, 195, 105);

        // Service Row
        doc.setFont("helvetica", "normal");
        doc.text(booking.serviceType || "Car Wash", 20, 115);
        doc.text(booking.vehicleType || "Car", 115, 115);
        doc.text(`Rs. ${booking.totalCost}`, 160, 115);

        let y = 125;
        // Addons row if present
        if (booking.addons && booking.addons.length > 0) {
          doc.setFont("helvetica", "italic");
          doc.setTextColor(110, 110, 110);
          doc.text(`Selected Addons: ${booking.addons.join(", ")}`, 20, y);
          y += 10;
        }

        // Pickup / Drop indicator
        if (booking.pickupDrop) {
          doc.setFont("helvetica", "normal");
          doc.setTextColor(60, 60, 60);
          doc.text("Includes pickup and delivery services (+)", 20, y);
          y += 10;
        }

        doc.line(15, y, 195, y);
        y += 12;

        // Discount / Totals Row
        const discAmount = booking.discount || 0;
        const finalAmt = booking.totalCost - discAmount;

        // Total Price Box
        doc.setFillColor(254, 242, 242); // light red-50
        doc.rect(110, y - 6, 85, 22, "F");
        doc.setDrawColor(252, 165, 165); // light red border
        doc.rect(110, y - 6, 85, 22, "S");

        doc.setTextColor(60, 60, 60);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Subtotal: Rs. ${booking.totalCost}.00`, 115, y + 2);
        doc.text(`Discount: Rs. ${discAmount}.00`, 115, y + 8);

        doc.setTextColor(220, 38, 38);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Total Paid:", 115, y + 14);
        doc.text(`Rs. ${finalAmt >= 0 ? finalAmt : 0}.00`, 155, y + 14);

        y += 45;
        // Terms & Thank you notes
        doc.setTextColor(120, 120, 120);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "italic");
        doc.text("This receipt was generated electronically and is valid for booking status records.", 15, y);
        doc.text("Need support? Contact us at SUPPORT.KLEENKARS@gmail.com", 15, y + 5);
        doc.text("Thank you for choosing Kleenkars detailing centers!", 15, y + 10);

        doc.save(`Kleenkars_Invoice_${booking.customerName.replace(/\s+/g, "_")}.pdf`);
      };

      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">Today's Bookings Pipeline</h3>
              <p className="text-xs text-gray-400 mt-0.5">Showing bookings scheduled for today.</p>
            </div>
            <button
              onClick={() => setShowNewDriveModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-lg shadow-green-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              New Booking
            </button>
          </div>

          {activeBookings.length === 0 ? (
            <div className="glass-panel p-8 text-center text-gray-400 border border-white/5">
              No bookings scheduled for today. Click "New Drive-In Booking" to add one.
            </div>
          ) : (
            <div className="space-y-4">
              {activeBookings.map((b) => {
                const isPending = b.status === "Pending";
                const isCancelled = b.status === "Cancelled";
                const isFinished = b.status === "Completed" || b.status === "Finished";
                const isActive = !isPending && !isCancelled && !isFinished;

                let statusColor = "bg-yellow-500/10 text-yellow-300 border-yellow-500/20";
                if (isActive) statusColor = "bg-blue-500/10 text-blue-300 border-blue-500/20";
                if (isFinished) statusColor = "bg-green-500/10 text-green-300 border-green-500/20";
                if (isCancelled) statusColor = "bg-red-500/10 text-red-300 border-red-500/20";

                return (
                  <div key={b.id} className="glass-panel p-5 border border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-white/10 transition-all duration-300 group">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${statusColor}`}>
                          {b.status === "Completed" ? "Finished" : b.status}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">Ref: {b.id.substring(0, 8).toUpperCase()}</span>
                        <span className="text-xs text-gray-400 font-medium bg-white/5 px-2 py-0.5 rounded flex items-center gap-1">
                          <Clock className="w-3 h-3 text-yellow-400" />
                          {b.bookingTime}
                        </span>
                        {b.pickupDrop && (
                          <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                            Pickup & Drop
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          {b.customerName}
                        </h4>
                        {b.status === "Completed" && b.notes && (() => {
                          try {
                            const qc = JSON.parse(b.notes);
                            if (qc.qcPassed) {
                              return (
                                <div className="mt-1.5 mb-1.5 text-[11px] text-green-400 flex items-center gap-1.5 bg-green-500/5 px-2.5 py-1 rounded border border-green-500/10 w-fit">
                                  <span>✓ Quality Control passed</span>
                                </div>
                              );
                            }
                          } catch {}
                          return null;
                        })()}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
                          <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-gray-500" /> {b.phoneNumber || "-"}</span>
                          <span>•</span>
                          <span>Vehicle: <strong className="text-gray-300">{b.vehicleType}</strong></span>
                          <span>•</span>
                          <span>Service: <strong className="text-indigo-300">{b.serviceType}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-white/[0.02] p-3 rounded-2xl border border-white/5">
                      <div className="flex flex-col min-w-[140px]">
                        <label className="text-[10px] text-gray-500 font-semibold mb-1 uppercase tracking-wider">Assign Staff</label>
                        <select
                          defaultValue={b.assignedEmployeeId || ""}
                          onChange={(e) => handleAssign(b.id, e.target.value)}
                          className="bg-black/40 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-yellow-500 transition cursor-pointer"
                        >
                          <option value="">-- Unassigned --</option>
                          {washerDetailerStaff.map((emp) => {
                            const todayAtt = getTodayAttendance(emp.id);
                            const statusSuffix = todayAtt
                              ? ` [${todayAtt.attendanceStatus}]`
                              : " [Not Marked]";
                            return (
                              <option key={emp.id} value={emp.id}>
                                {emp.name} ({emp.role}){statusSuffix}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        {b.status !== "Cancelled" && (!b.notes || !(() => {
                          try {
                            const parsed = JSON.parse(b.notes);
                            return parsed.qcPassed;
                          } catch {
                            return false;
                          }
                        })()) && (
                          <button
                            onClick={() => openQcModal(b)}
                            className="flex items-center justify-center gap-1.5 bg-green-600/10 hover:bg-green-600 text-green-400 hover:text-white border border-green-500/20 px-3.5 py-2 rounded-xl text-xs font-bold transition active:scale-95 animate-pulse"
                            title="Quality Control Checklist"
                          >
                            QC Check
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(b)}
                          className="flex items-center justify-center gap-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 px-3.5 py-2 rounded-xl text-xs font-semibold transition active:scale-95"
                          title="Edit Booking"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => generateInvoice(b)}
                          className="flex items-center justify-center gap-1.5 bg-pink-600/10 hover:bg-pink-600 text-pink-400 hover:text-white border border-pink-500/20 px-3.5 py-2 rounded-xl text-xs font-semibold transition active:scale-95"
                          title="Download Invoice Receipt"
                        >
                          <Download className="w-4 h-4" />
                          Invoice
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Edit Booking Modal */}
          {showEditModal && editingBooking && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
              <div className="bg-gray-900 border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl glass-panel relative">
                <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                  <Edit className="w-5 h-5 text-yellow-400" />
                  Edit Booking Details
                </h3>
                <p className="text-xs text-gray-400 mb-4">Update customer details, status, or pricing for today's wash booking.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Customer Name</label>
                    <input
                      type="text"
                      value={editCustomerName}
                      onChange={(e) => setEditCustomerName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Phone Number</label>
                    <input
                      type="text"
                      value={editPhoneNumber}
                      onChange={(e) => setEditPhoneNumber(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Scheduled Time</label>
                    <input
                      type="time"
                      value={editBookingTime}
                      onChange={(e) => setEditBookingTime(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Pipeline Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Active">Active / Washing</option>
                      <option value="Finished">Finished / Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Discount (Rs.)</label>
                      <input
                        type="number"
                        value={editDiscount}
                        onChange={(e) => setEditDiscount(Number(e.target.value))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Total Cost (Rs.)</label>
                      <input
                        type="number"
                        value={editTotalCost}
                        onChange={(e) => setEditTotalCost(Number(e.target.value))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 border-t border-white/5 pt-4">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl font-bold transition active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitEdit}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-black py-3 rounded-xl font-bold transition active:scale-95 shadow-lg shadow-yellow-500/10"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quality Control Checklist & Photos Modal */}
          {qcBooking && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
              <div className="bg-gray-900 border border-white/10 p-6 rounded-3xl w-full max-w-lg shadow-2xl glass-panel relative text-left max-h-[90vh] overflow-y-auto animate-fade-in">
                <h3 className="text-xl font-bold mb-1 text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  Quality Control Review
                </h3>
                <p className="text-xs text-gray-400 mb-6">Perform checklist verification and log photos to finalize work order.</p>

                <div className="space-y-6">
                  {/* Photo Upload Section */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">Before Cleaning Photo</label>
                      {beforePhoto ? (
                        <div className="relative rounded-xl overflow-hidden border border-white/10 h-32 bg-black">
                          <img src={beforePhoto} alt="Before" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setBeforePhoto("")}
                            className="absolute top-2 right-2 bg-red-650/80 hover:bg-red-650 p-1.5 rounded-full text-white text-xs font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl h-32 hover:border-yellow-500 cursor-pointer bg-black/20 hover:bg-black/40 transition">
                          <Plus className="w-6 h-6 text-gray-400 mb-1" />
                          <span className="text-[10px] text-gray-500 font-semibold">Upload Before Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(e, "before")}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">After Cleaning Photo</label>
                      {afterPhoto ? (
                        <div className="relative rounded-xl overflow-hidden border border-white/10 h-32 bg-black">
                          <img src={afterPhoto} alt="After" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setAfterPhoto("")}
                            className="absolute top-2 right-2 bg-red-650/80 hover:bg-red-650 p-1.5 rounded-full text-white text-xs font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl h-32 hover:border-yellow-500 cursor-pointer bg-black/20 hover:bg-black/40 transition">
                          <Plus className="w-6 h-6 text-gray-400 mb-1" />
                          <span className="text-[10px] text-gray-500 font-semibold">Upload After Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(e, "after")}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Detailer Submissions Section */}
                  {qcBooking.notes && (() => {
                    try {
                      const notesObj = JSON.parse(qcBooking.notes);
                      const hasPhotos = Array.isArray(notesObj.detailerPhotos) && notesObj.detailerPhotos.length > 0;
                      const hasNotes = !!notesObj.detailerNotesText;
                      if (!hasPhotos && !hasNotes) return null;

                      return (
                        <div className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-3">
                          <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Detailer Submissions</h4>
                          {hasNotes && (
                            <div className="text-xs">
                              <span className="text-gray-400">Detailer Notes:</span>
                              <p className="text-white mt-0.5 bg-black/40 p-2.5 rounded-xl border border-white/5">{notesObj.detailerNotesText}</p>
                            </div>
                          )}
                          {hasPhotos && (
                            <div>
                              <span className="text-gray-400 text-xs block mb-1.5">Work Progress Photos:</span>
                              <div className="grid grid-cols-4 gap-2">
                                {notesObj.detailerPhotos.map((p: string, idx: number) => (
                                  <a key={idx} href={p} target="_blank" rel="noopener noreferrer" className="relative rounded-lg overflow-hidden border border-white/10 h-16 bg-black hover:border-indigo-400 transition block">
                                    <img src={p} alt={`Detailer upload ${idx+1}`} className="w-full h-full object-cover" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    } catch {
                      return null;
                    }
                  })()}

                  {/* Checklist Options */}
                  <div className="space-y-3 bg-black/40 p-4 rounded-xl border border-white/5">
                    <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2">Inspect Detailing Quality</h4>
                    {[
                      "Wheel arches, rims, and underbody mud completely cleaned",
                      "Foam wash finished and body inspected for scratches/spots",
                      "Seats, cabin mats, vents, and boot space thoroughly vacuumed",
                      "Dashboard trim, steering wheel, and console cleaned and polished",
                      "All window glasses and windshield wiped down streak-free"
                    ].map((item, index) => (
                      <label key={index} className="flex items-start gap-3 cursor-pointer text-xs text-gray-300 select-none hover:text-white transition">
                        <input
                          type="checkbox"
                          checked={qcChecklist[index]}
                          onChange={() => handleQcToggle(index)}
                          className="mt-0.5 accent-yellow-500"
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 mt-6 border-t border-white/5 pt-4">
                  <button
                    onClick={() => setQcBooking(null)}
                    disabled={isSubmittingQc}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitQcPassed}
                    disabled={!allQcChecked || isSubmittingQc}
                    className={`flex-1 py-3 rounded-xl font-bold transition shadow-lg ${
                      allQcChecked && !isSubmittingQc
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white active:scale-95 cursor-pointer shadow-green-500/10"
                        : "bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5"
                    }`}
                  >
                    {isSubmittingQc ? "Finalizing..." : "Pass QC & Complete"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* New Booking Modal */}
          {showNewDriveModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
              <div className="bg-gray-900 border border-white/10 p-6 rounded-3xl w-full max-w-md shadow-2xl glass-panel relative">
                <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-green-400" />
                  Create New Booking
                </h3>
                <p className="text-xs text-gray-400 mb-4">Register a wash or detailing job for a customer.</p>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Date *</label>
                      <input
                        type="date"
                        value={newBookingDate}
                        onChange={(e) => setNewBookingDate(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Time</label>
                      <input
                        type="time"
                        value={newBookingTime}
                        onChange={(e) => setNewBookingTime(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Customer Name *</label>
                    <input
                      type="text"
                      placeholder="Enter customer name"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Phone Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={newPhoneNumber}
                      onChange={(e) => setNewPhoneNumber(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Vehicle Class</label>
                      <select
                        value={newVehicleType}
                        onChange={(e) => setNewVehicleType(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition cursor-pointer"
                      >
                        <option value="Hatchback">Hatchback</option>
                        <option value="Sedan">Sedan</option>
                        <option value="SUV">SUV</option>
                        <option value="Luxury">Luxury</option>
                        <option value="Bike">Bike / Motorcycle</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Vehicle No.</label>
                      <input
                        type="text"
                        placeholder="e.g. DL3C1234"
                        value={newVehicleNumber}
                        onChange={(e) => setNewVehicleNumber(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Wash Service *</label>
                    <select
                      value={newServiceId}
                      onChange={(e) => setNewServiceId(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition cursor-pointer"
                    >
                      <option value="">-- Select Package --</option>
                      {services.map((svc) => (
                        <option key={svc.id} value={svc.id}>
                          {svc.name} (Rs. {svc.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Discount (Rs.)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newDiscount}
                        onChange={(e) => setNewDiscount(Number(e.target.value))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Payment Mode</label>
                      <select
                        value={newPaymentMode}
                        onChange={(e) => setNewPaymentMode(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-yellow-500 transition cursor-pointer"
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI / GPay</option>
                        <option value="Card">Card</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 border-t border-white/5 pt-4">
                  <button
                    onClick={() => setShowNewDriveModal(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl font-bold transition active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitNewDrive}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-xl font-bold transition active:scale-95 shadow-lg shadow-green-500/10"
                  >
                    Create Booking
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };

    const ClosingTab = () => {
      const [cashClosing, setCashClosing] = useState("");
      const [wageDeduction, setWageDeduction] = useState("");
      const [onlinePayment, setOnlinePayment] = useState("");
      const [loading, setLoading] = useState(false);
      const [successMsg, setSuccessMsg] = useState("");
      const [errorMsg, setErrorMsg] = useState("");

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMsg("");
        setErrorMsg("");

        try {
          const res = await fetch("/api/daily-closing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cashClosingAfterExpenses: Number(cashClosing || 0),
              dailyWageDeductions: Number(wageDeduction || 0),
              onlinePaymentCollected: Number(onlinePayment || 0),
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.message || "Failed to submit daily register closing.");
          }

          setSuccessMsg("Daily closing register updated successfully for today.");
          setCashClosing("");
          setWageDeduction("");
          setOnlinePayment("");
        } catch (err) {
          console.error(err);
          setErrorMsg(err instanceof Error ? err.message : "Failed to submit closing.");
        } finally {
          setLoading(false);
        }
      };

      return (
        <div className="max-w-xl mx-auto space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white">Daily Cash & Register Closing</h3>
            <p className="text-xs text-gray-400 mt-1">Submit closing figures to finalize accounts for today's transactions.</p>
          </div>

          <form onSubmit={handleSubmit} className="glass-panel p-6 border border-white/5 space-y-5">
            {successMsg && (
              <div className="bg-green-500/10 text-green-300 border border-green-500/20 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-500/10 text-red-300 border border-red-500/20 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">
                  Cash Closing After Expenses (Rs.)
                </label>
                <input
                  type="number"
                  value={cashClosing}
                  onChange={(e) => setCashClosing(e.target.value)}
                  placeholder="Enter total remaining cash in till"
                  required
                  min="0"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500"
                />
                <p className="text-[11px] text-gray-500 mt-1">Physical cash left in register drawer after all store-level expenses.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">
                  Daily Wage Deductions (Rs.)
                </label>
                <input
                  type="number"
                  value={wageDeduction}
                  onChange={(e) => setWageDeduction(e.target.value)}
                  placeholder="Enter wage/salary deductions or advances"
                  required
                  min="0"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500"
                />
                <p className="text-[11px] text-gray-500 mt-1">Total wage cuts, loan deductions, or salary advances processed today.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">
                  Total Online Payment Collected (Rs.)
                </label>
                <input
                  type="number"
                  value={onlinePayment}
                  onChange={(e) => setOnlinePayment(e.target.value)}
                  placeholder="Enter online UPI/Card collection total"
                  required
                  min="0"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500"
                />
                <p className="text-[11px] text-gray-500 mt-1">All non-cash payments (UPI, GPay, Paytm, credit cards) received today.</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black py-3.5 rounded-xl font-bold transition disabled:bg-gray-700 disabled:text-gray-400 mt-2"
            >
              {loading ? "Submitting Register..." : "Submit Daily Register Closing"}
            </button>
          </form>
        </div>
      );
    };

    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/5 p-6 rounded-3xl border border-yellow-500/20">
          <div>
            <h2 className="text-3xl font-extrabold text-yellow-300">Supervisor Portal</h2>
            <p className="text-gray-400 mt-1">Manage attendance, assign jobs, and close daily registers.</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-4 py-2 rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel border-white/10 rounded-3xl p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Checked In Today</p>
              <h3 className="text-3xl font-black text-green-400 mt-1">
                {todayCheckedInCount} / {employees.filter((e) => e.role !== "admin" && e.role !== "manager" && e.role !== "supervisor").length}
              </h3>
            </div>
            <div className="p-4 bg-green-500/10 rounded-2xl text-green-400">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel border-white/10 rounded-3xl p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending Bookings</p>
              <h3 className="text-3xl font-black text-yellow-400 mt-1">{pendingBookingsCount}</h3>
            </div>
            <div className="p-4 bg-yellow-500/10 rounded-2xl text-yellow-400">
              <ClipboardList className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel border-white/10 rounded-3xl p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Assigned & Washing</p>
              <h3 className="text-3xl font-black text-indigo-400 mt-1">{assignedBookingsCount}</h3>
            </div>
            <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="flex border-b border-gray-800 gap-2 pb-px overflow-x-auto">
          <button
            onClick={() => setActiveTab("attendance")}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
              activeTab === "attendance"
                ? "border-yellow-400 text-yellow-300 bg-yellow-500/5 rounded-t-xl"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            Manage Attendance
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
              activeTab === "bookings"
                ? "border-yellow-400 text-yellow-300 bg-yellow-500/5 rounded-t-xl"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Assign Bookings
          </button>
          <button
            onClick={() => setActiveTab("closing")}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
              activeTab === "closing"
                ? "border-yellow-400 text-yellow-300 bg-yellow-500/5 rounded-t-xl"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Daily Cash Closing
          </button>
        </div>

        <div className="mt-6">
          {activeTab === "attendance" && <AttendanceTab />}
          {activeTab === "bookings" && <BookingsTab />}
          {activeTab === "closing" && <ClosingTab />}
        </div>
      </div>
    );
  };

  const DriverDashboard = () => (
    <div className="glass-panel p-5">
      <h2 className="text-2xl font-semibold text-purple-300 mb-4">
        Pickup Driver Portal
      </h2>
      <p className="text-gray-300">
        Transport bookings, route optimizer, and pick‑up/delivery actions.
      </p>
    </div>
  );

  const CashierDashboard = () => (
    <div className="glass-panel p-5">
      <h2 className="text-2xl font-semibold text-teal-300 mb-4">
        Cashier Register
      </h2>
      <p className="text-gray-300">
        Pending payments, record transactions, print invoices.
      </p>
    </div>
  );

  const renderDashboard = () => {
    if (!employee) return <div className="text-gray-400">Loading...</div>;
    switch (employee.role) {
      case "washer":
      case "detailer":
        return <WasherDashboard />;
      case "supervisor":
        return <SupervisorDashboard />;
      case "pickup_driver":
        return <DriverDashboard />;
      case "cashier":
        return <CashierDashboard />;
      default:
        return <div className="text-gray-400">Role not recognized.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-black p-6 text-white">
      <h1 className="text-4xl font-bold text-red-500 mb-8">Staff Dashboard</h1>
      {renderDashboard()}
    </div>
  );
}
