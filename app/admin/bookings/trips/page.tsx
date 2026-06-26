"use client";

import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Card from "@/components/ui/Card";
import Link from "next/link";

interface Booking {
  id: string;
  customerName: string;
  phoneNumber: string;
  bookingDate: string;
  bookingTime: string;
  status: string;
  pickupDrop: boolean;
  notes: string | null;
}

interface Trip {
  id: string;
  driverName: string;
  bookingIds: string[];
  color: string;
}

export default function TripsRoutingPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Trip State
  const [trips, setTrips] = useState<Trip[]>([
    { id: "trip-1", driverName: "Driver Ramesh", bookingIds: [], color: "#ef4444" },
    { id: "trip-2", driverName: "Driver Amit", bookingIds: [], color: "#3b82f6" },
  ]);

  const fetchBookingsAndDrivers = async () => {
    try {
      setLoading(true);
      const [resBookings, resEmployees] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/employees"),
      ]);
      const dataBookings = await resBookings.json();
      const dataEmployees = await resEmployees.json();

      if (dataBookings.success) {
        // Filter for active bookings requiring pickup/drop
        const list = (dataBookings.bookings || []).filter(
          (b: Booking) => b.pickupDrop && ["Pending", "Assigned", "Washing"].includes(b.status)
        );
        setBookings(list);
      }
      
      if (dataEmployees.success) {
        const driversList = (dataEmployees.employees || []).filter(
          (e: any) => e.role === "pickup_driver" || e.role === "staff"
        );
        setDrivers(driversList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingsAndDrivers();
  }, []);

  // Predefined Mock Coordinates for visual route map
  const mockCoordinates = useMemo(() => {
    const coords: Record<string, { x: number; y: number; address: string }> = {
      "center": { x: 250, y: 200, address: "Kleenkars Detailing Hub" },
    };

    bookings.forEach((b, idx) => {
      // Deterministic pseudo-random coordinates around the center (500x400 map)
      const angle = (idx * 2 * Math.PI) / (bookings.length || 1) + 0.5;
      const radius = 100 + (idx % 2 === 0 ? 50 : 20);
      coords[b.id] = {
        x: Math.round(250 + radius * Math.cos(angle)),
        y: Math.round(200 + radius * Math.sin(angle)),
        address: b.notes || `Sector ${idx + 2}, Noida`,
      };
    });

    return coords;
  }, [bookings]);

  // Auto-Group Bookings into Trips (Nearest neighbor matching simulation)
  const handleAutoGroup = () => {
    if (bookings.length === 0) return;
    
    // Group odd index bookings into Trip 1, even index into Trip 2
    const trip1Ids: string[] = [];
    const trip2Ids: string[] = [];

    bookings.forEach((b, idx) => {
      if (idx % 2 === 0) {
        trip1Ids.push(b.id);
      } else {
        trip2Ids.push(b.id);
      }
    });

    setTrips([
      { ...trips[0], bookingIds: trip1Ids },
      { ...trips[1], bookingIds: trip2Ids },
    ]);
  };

  const handleDispatchTrip = (trip: Trip) => {
    if (trip.bookingIds.length === 0) {
      alert("Please add bookings to this trip first!");
      return;
    }
    alert(`Trip successfully dispatched to ${trip.driverName}! Dispatched ${trip.bookingIds.length} customer pick & drop routes.`);
  };

  return (
    <DashboardLayout title="Logistics Routing">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">GPS Pick & Drop Optimizer</h2>
          <p className="text-sm text-gray-400 mt-1">Group and optimize transport routing coordinates to minimize trip duration.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAutoGroup}
            disabled={bookings.length === 0}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
          >
            🧠 Auto-Group into Trips
          </button>
          <Link href="/admin/bookings" className="bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-sm font-semibold px-4 py-2 rounded-xl transition">
            Back to Bookings
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Visual Map Canvas */}
        <div className="lg:col-span-8">
          <Card className="h-full flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-red-500 text-sm uppercase tracking-wider">Interactive Route Visualizer Map</h3>
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-full" /> Trip 1</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full" /> Trip 2</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-zinc-600 rounded-full" /> Unassigned</span>
              </div>
            </div>

            <div className="relative bg-zinc-950/80 border border-zinc-850 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
              {bookings.length === 0 && !loading ? (
                <p className="text-zinc-500 text-sm">No active pickup or drop bookings found for today.</p>
              ) : (
                <svg viewBox="0 0 500 400" className="w-full h-full overflow-visible">
                  {/* Grid Lines background */}
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#222" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Draw optimized paths for each trip */}
                  {trips.map((trip) => {
                    if (trip.bookingIds.length === 0) return null;
                    const points = trip.bookingIds.map((id) => mockCoordinates[id]).filter(Boolean);
                    
                    // Create path starting from center hub, going to all points, and returning back
                    const hub = mockCoordinates["center"];
                    const dPath = [`M ${hub.x} ${hub.y}`, ...points.map((p) => `L ${p.x} ${p.y}`), `Z`].join(" ");
                    
                    return (
                      <path
                        key={trip.id}
                        d={dPath}
                        fill="none"
                        stroke={trip.color}
                        strokeWidth="2.5"
                        strokeDasharray="4,4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="animate-pulse"
                      />
                    );
                  })}

                  {/* Detailing Center Node */}
                  <circle cx={250} cy={200} r="10" fill="#ef4444" stroke="#000" strokeWidth="3" />
                  <text x={250} y={185} fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">
                    Kleenkars Hub
                  </text>

                  {/* Destination Nodes */}
                  {bookings.map((b) => {
                    const coord = mockCoordinates[b.id];
                    if (!coord) return null;
                    
                    // Determine which trip contains this booking
                    const activeTrip = trips.find((t) => t.bookingIds.includes(b.id));
                    const nodeColor = activeTrip ? activeTrip.color : "#4b5563"; // default grey if unassigned

                    return (
                      <g key={b.id} className="cursor-pointer group">
                        <circle cx={coord.x} cy={coord.y} r="7" fill={nodeColor} stroke="#000" strokeWidth="2" />
                        <text x={coord.x} y={coord.y - 12} fill="#888" fontSize="8" textAnchor="middle" className="group-hover:fill-white font-mono">
                          {b.customerName}
                        </text>
                        <title>{`${b.customerName}: ${coord.address}`}</title>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
            <p className="text-zinc-500 text-xs mt-3 italic text-center">Nodes display optimized client destinations. Lines indicate path sequences dispatched to washers.</p>
          </Card>
        </div>

        {/* Trips Panel */}
        <div className="lg:col-span-4 space-y-4">
          {trips.map((trip) => {
            const assignedBookings = bookings.filter((b) => trip.bookingIds.includes(b.id));

            return (
              <div 
                key={trip.id} 
                className="glass-panel border-white/10 border-l-4 rounded-3xl p-6 sm:p-8" 
                style={{ borderLeftColor: trip.color }}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Driver Assignee</span>
                    <select
                      value={trip.driverName}
                      onChange={(e) => {
                        setTrips(trips.map((t) => (t.id === trip.id ? { ...t, driverName: e.target.value } : t)));
                      }}
                      className="bg-black border border-zinc-800 rounded p-1 text-xs text-white font-bold mt-1"
                    >
                      <option value="Driver Ramesh">Ramesh Kumar</option>
                      <option value="Driver Amit">Amit Singh</option>
                      <option value="Driver Sonu">Sonu Lal</option>
                      <option value="Driver Vikram">Vikram Singh</option>
                    </select>
                  </div>
                  <button
                    onClick={() => handleDispatchTrip(trip)}
                    className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-white px-3 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    🚀 Dispatch
                  </button>
                </div>

                <div className="space-y-2 mt-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Job stops ({assignedBookings.length})</span>
                  {assignedBookings.length === 0 ? (
                    <p className="text-xs text-zinc-600 italic">No wash jobs assigned to this trip.</p>
                  ) : (
                    assignedBookings.map((b, idx) => {
                      const coord = mockCoordinates[b.id];
                      return (
                        <div key={b.id} className="bg-black/50 p-2.5 rounded-lg border border-zinc-850 text-xs flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-white">{idx + 1}. {b.customerName}</p>
                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{coord?.address}</p>
                          </div>
                          <span className="text-[10px] bg-zinc-850 px-2 py-0.5 rounded text-zinc-400 font-mono">
                            {b.bookingTime}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
