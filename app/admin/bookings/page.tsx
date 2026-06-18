"use client";

import {

  useEffect,

  useMemo,

  useState,

  useRef,

} from "react";

import DashboardLayout from "@/components/dashboard/DashboardLayout";

import Card from "@/components/ui/Card";

import Button from "@/components/ui/Button";

interface Booking {

  id: string;

  customerName: string;

  phoneNumber: string;

  vehicleType: string;

  serviceType: string;

  addons: string[];

  pickupDrop: boolean;

  bookingDate: string;

  bookingTime: string;

  totalCost: number;

  status?: string;
  assignedEmployeeId?: string | null;
  assignedEmployeeName?: string | null;

}

export default function BookingsPage() {

  const [bookings, setBookings] =
    useState<Booking[]>([]);

  const [employees, setEmployees] = useState<{ id: string; name: string; employeeCode?: string }[]>([]);
  const [empQuery, setEmpQuery] = useState("");
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const empRef = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [editAmount, setEditAmount] =
    useState(0);
  const [editStatus, setEditStatus] = useState<string>("");
  const [editAssignedId, setEditAssignedId] = useState<string>("");
  const [editAssignedName, setEditAssignedName] = useState<string>("");

  const [search, setSearch] =
    useState("");

  const fetchBookings = async () => {

    try {

      const response =
        await fetch("/api/bookings");

      const data =
        await response.json();

      setBookings(data.bookings);

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);

    }

  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {

    fetchBookings();
    fetchEmployees();

  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (empRef.current && !empRef.current.contains(e.target as Node)) {
        setShowEmpDropdown(false);
      }
    }

    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const filteredEmployees = useMemo(() => {
    const q = empQuery.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((emp) => (emp.name + (emp.employeeCode || "")).toLowerCase().includes(q));
  }, [employees, empQuery]);

  const filteredBookings =
    useMemo(() => {

      return bookings.filter(
        (booking) =>

          booking.customerName
            .toLowerCase()
            .includes(
              search.toLowerCase()
            ) ||

          booking.phoneNumber.includes(
            search
          )
      );

    }, [bookings, search]);

  const handleEdit = async (
    id: string
  ) => {

    try {

      await fetch(
        `/api/bookings/${id}`,
        {

          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            totalCost: editAmount,
            status: editStatus,
            assignedEmployeeId: editAssignedId || null,
            assignedEmployeeName: editAssignedName,
          }),

        }
      );

      fetchBookings();

      setEditingId(null);
      setEditStatus("");
      setEditAssignedId("");
      setEditAssignedName("");

    } catch (error) {

      console.log(error);

    }

  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this booking? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      fetchBookings();
    } catch (err) {
      console.log(err);
      alert("Failed to delete booking");
    }
  };

  return (

    <DashboardLayout title="Bookings Management">

      {/* SEARCH */}

      <Card className="mb-8">

        <input
          type="text"
          placeholder="Search customer or phone number..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          className="

            w-full

            bg-black

            border
            border-gray-700

            focus:border-red-500

            outline-none

            p-4

            rounded-xl

          "
        />

      </Card>

      {/* BOOKINGS TABLE */}

      <Card>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1200px]">

            <thead>

              <tr className="bg-red-600 text-white">

                <th className="p-4 text-left">
                  Name
                </th>

                <th className="p-4 text-left">
                  Phone
                </th>

                <th className="p-4 text-left">
                  Vehicle
                </th>

                <th className="p-4 text-left">
                  Service
                </th>

                <th className="p-4 text-left">
                  Add-ons
                </th>

                <th className="p-4 text-left">
                  Date
                </th>

                <th className="p-4 text-left">
                  Time
                </th>

                <th className="p-4 text-left">
                  Status
                </th>

                <th className="p-4 text-left">
                  Amount
                </th>

                <th className="p-4 text-left">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td className="p-5">
                    Loading...
                  </td>

                </tr>

              ) : filteredBookings.length ===
                0 ? (

                <tr>

                  <td className="p-5">
                    No bookings found
                  </td>

                </tr>

              ) : (

                filteredBookings.map(
                  (booking) => (

                    <tr
                      key={booking.id}
                      className="border-b border-gray-800 hover:bg-[#181818]"
                    >

                      <td className="p-4">
                        {
                          booking.customerName
                        }
                      </td>

                      <td className="p-4">
                        {
                          booking.phoneNumber
                        }
                      </td>

                      <td className="p-4">
                        {
                          booking.vehicleType
                        }
                      </td>

                      <td className="p-4">
                        {
                          booking.serviceType
                        }
                      </td>

                      <td className="p-4">

                        {booking.addons?.join(
                          ", "
                        ) || "None"}

                        <br />

                        <span className="text-gray-400 text-sm">

                          {booking.pickupDrop
                            ? "Pickup & Drop"
                            : "No Pickup"}

                        </span>

                      </td>

                      <td className="p-4">
                        {
                          booking.bookingDate
                        }
                      </td>

                      <td className="p-4">
                        {
                          booking.bookingTime
                        }
                      </td>

                      <td className="p-4">

                        <span
                          className={`

                            px-3
                            py-1

                            rounded-full

                            text-sm

                            ${
                              booking.status ===
                              "Completed"
                                ? "bg-green-600"
                                : booking.status ===
                                  "Washing"
                                ? "bg-blue-600"
                                : booking.status ===
                                  "Assigned"
                                ? "bg-yellow-600"
                                : "bg-gray-700"
                            }

                          `}
                        >

                          {booking.status ||
                            "Pending"}

                        </span>

                      </td>

                      <td className="p-4">

                        {editingId ===
                        booking.id ? (

                          <div className="space-y-2">
                            <input
                              type="number"
                              value={editAmount}
                              onChange={(e) => setEditAmount(Number(e.target.value))}
                              className="bg-black border border-gray-700 rounded-lg px-3 py-2 w-28"
                            />

                            <div className="relative" ref={empRef}>
                              <input
                                type="text"
                                placeholder="Assign employee..."
                                value={empQuery}
                                onChange={(e) => { setEmpQuery(e.target.value); setShowEmpDropdown(true); }}
                                onFocus={() => setShowEmpDropdown(true)}
                                className="bg-black border border-gray-700 rounded-lg px-3 py-2 w-44"
                              />

                              {showEmpDropdown && (
                                <div className="absolute z-20 mt-1 w-44 max-h-52 overflow-auto bg-[#111] border border-gray-700 rounded-lg">
                                  {filteredEmployees.length === 0 ? (
                                    <div className="p-2 text-gray-400">No employees</div>
                                  ) : (
                                    filteredEmployees.map((emp) => (
                                      <button
                                        key={emp.id}
                                        type="button"
                                        onMouseDown={(e) => { e.preventDefault(); setEditAssignedId(emp.id); setEditAssignedName(emp.name); setEmpQuery(emp.name); setShowEmpDropdown(false); }}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-800"
                                      >
                                        {emp.name} {emp.employeeCode ? `(${emp.employeeCode})` : ""}
                                      </button>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>

                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value)}
                              className="bg-black border border-gray-700 rounded-lg px-3 py-2 w-44"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Assigned">Assigned</option>
                              <option value="Washing">Washing</option>
                              <option value="Completed">Completed</option>
                              <option value="Delivered">Delivered</option>
                            </select>
                          </div>

                        ) : (

                          <span className="text-green-400 font-bold">

                            ₹
                            {
                              booking.totalCost
                            }

                          </span>

                        )}

                      </td>

                      <td className="p-4">

                        <div className="flex gap-2">
                          {editingId === booking.id ? (
                            <>
                              <Button
                                onClick={() => handleEdit(booking.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Save
                              </Button>

                              <Button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditStatus("");
                                  setEditAssignedId("");
                                  setEditAssignedName("");
                                }}
                                className="bg-gray-600 hover:bg-gray-700"
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                onClick={() => {
                                  setEditingId(booking.id);
                                  setEditAmount(booking.totalCost);
                                  setEditAssignedId(booking.assignedEmployeeId || "");
                                  setEditAssignedName(booking.assignedEmployeeName || "");
                                  setEditStatus(booking.status || "Pending");
                                }}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Edit
                              </Button>

                              <Button
                                onClick={() => handleDelete(booking.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </Card>

    </DashboardLayout>

  );

}
