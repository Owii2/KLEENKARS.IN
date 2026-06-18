"use client";

import { useEffect, useState } from "react";

export default function EmployeePage() {

  const currentUserRole = "admin";

  const [employees, setEmployees] = useState<any[]>([]);

  const [editingId, setEditingId] = useState("");

  const [editData, setEditData] = useState<any>({});

  const [employeeCode, setEmployeeCode] = useState(generateEmployeeCode());
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");

  const [salaryPerDay, setSalaryPerDay] = useState("");

  const [role, setRole] = useState("staff");

  function generateEmployeeCode() {
    return `KKS00${Math.floor(100 + Math.random() * 900)}`;
  }

  const fetchEmployees = async () => {

    const response = await fetch("/api/employees");

    const data = await response.json();

    setEmployees(data.employees);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const createEmployee = async () => {
    const code = employeeCode.trim() || generateEmployeeCode();

    await fetch("/api/employees", {

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

      }),

    });

    setEmployeeCode(generateEmployeeCode());
    setName("");
    setPhoneNumber("");
    setPassword("");
    setSalaryPerDay("");

    fetchEmployees();
  };

  return (

    <div className="min-h-screen bg-black text-white p-6">

      <h1 className="text-4xl font-bold text-red-500 mb-8">
        Employee Management
      </h1>

      <div className="bg-[#111] p-6 rounded-xl border border-gray-800 mb-10">

        <div className="grid md:grid-cols-2 gap-4">

          <input
            placeholder="Employee ID"
            value={employeeCode}
            onChange={(e) => setEmployeeCode(e.target.value)}
            className="bg-black border border-gray-700 p-3 rounded-lg"
          />

          <input
            placeholder="Employee Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-black border border-gray-700 p-3 rounded-lg"
          />

          <input
            placeholder="Phone Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="bg-black border border-gray-700 p-3 rounded-lg"
          />

          <input
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-black border border-gray-700 p-3 rounded-lg"
          />

          <input
            placeholder="Salary Per Day"
            type="number"
            value={salaryPerDay}
            onChange={(e) =>
              setSalaryPerDay(e.target.value)
            }
            className="bg-black border border-gray-700 p-3 rounded-lg"
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-black border border-gray-700 p-3 rounded-lg"
          >

            <option value="staff">
              Staff
            </option>

            <option value="supervisor">
              Supervisor
            </option>

            <option value="washer">
              Washer
            </option>

            <option value="detailer">
              Detailer
            </option>

            <option value="pickup_driver">
              Pickup Driver
            </option>

            <option value="cashier">
              Cashier
            </option>

            <option value="manager">
              Manager
            </option>

          </select>

        </div>

        <button
          onClick={createEmployee}
          className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg mt-5"
        >
          Create Employee
        </button>

      </div>

      min-w-[900px]

        <table className="w-full">

          <thead>

            <tr className="bg-red-600 text-white">

              <th className="p-3 text-left">
                Employee ID
              </th>

              <th className="p-3 text-left">
                Name
              </th>

              <th className="p-3 text-left">
                Joining Date
              </th>

              <th className="p-3 text-left">
                Salary/Day
              </th>

              <th className="p-3 text-left">
                Phone
              </th>

              <th className="p-3 text-left">
                Role
              </th>

              <th className="p-3 text-left">
                Revenue
              </th>

              <th className="p-3 text-left">
                Jobs
              </th>

              <th className="p-3 text-left">
                Status
              </th>

              <th className="p-3 text-left">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {employees.map((employee: any) => (

              <tr
                key={employee.id}
                className="border-b border-gray-800"
              >

                <td className="p-3">
                  {editingId === employee.id ? (
                    <input
                      value={editData.employeeCode}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          employeeCode: e.target.value,
                        })
                      }
                      className="bg-black border border-gray-700 p-2 rounded"
                    />
                  ) : (
                    employee.employeeCode
                  )}
                </td>

                <td className="p-3">

                  {editingId === employee.id ? (

                    <input
                      value={editData.name}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          name: e.target.value,
                        })
                      }
                      className="bg-black border border-gray-700 p-2 rounded"
                    />

                  ) : (
                    employee.name
                  )}

                </td>

                <td className="p-3">

                  {new Date(
                    employee.joiningDate
                  ).toLocaleDateString()}

                </td>

                <td className="p-3">

                  {editingId === employee.id ? (

                    <input
                      type="number"
                      value={editData.salaryPerDay}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          salaryPerDay:
                            Number(e.target.value),
                        })
                      }
                      className="bg-black border border-gray-700 p-2 rounded w-24"
                    />

                  ) : (
                    `₹${employee.salaryPerDay}`
                  )}

                </td>

                <td className="p-3">

                  {editingId === employee.id ? (

                    <input
                      value={editData.phoneNumber}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          phoneNumber:
                            e.target.value,
                        })
                      }
                      className="bg-black border border-gray-700 p-2 rounded"
                    />

                  ) : (
                    employee.phoneNumber
                  )}

                </td>

                <td className="p-3 uppercase">

                  {editingId === employee.id ? (

                    <select
                      value={editData.role}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          role: e.target.value,
                        })
                      }
                      className="bg-black border border-gray-700 p-2 rounded"
                    >

                      <option value="staff">
                        Staff
                      </option>

                      <option value="supervisor">
                        Supervisor
                      </option>

                      <option value="washer">
                        Washer
                      </option>

                      <option value="detailer">
                        Detailer
                      </option>

                      <option value="pickup_driver">
                        Pickup Driver
                      </option>

                      <option value="cashier">
                        Cashier
                      </option>

                      {currentUserRole === "admin" && (

                        <option value="manager">
                          Manager
                        </option>

                      )}

                    </select>

                  ) : (
                    employee.role
                  )}

                </td>

                <td className="p-3 text-green-400">
                  ₹{employee.revenueGenerated}
                </td>

                <td className="p-3">
                  {employee.jobsCompleted}
                </td>

                <td className="p-3">

                  {editingId === employee.id ? (

                    <select
                      value={editData.status}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          status: e.target.value,
                        })
                      }
                      className="bg-black border border-gray-700 p-2 rounded"
                    >

                      <option value="active">
                        Active
                      </option>

                      <option value="revoked">
                        Revoked
                      </option>

                    </select>

                  ) : (

                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        employee.status === "active"
                          ? "bg-green-600"
                          : "bg-red-600"
                      }`}
                    >
                      {employee.status}
                    </span>

                  )}

                </td>

                <td className="p-3">

                  {editingId === employee.id ? (

                    <button
                      onClick={async () => {

                        await fetch(
                          `/api/employees/${employee.id}`,
                          {

                            method: "PUT",

                            headers: {
                              "Content-Type":
                                "application/json",
                            },

                            body: JSON.stringify(editData),

                          }
                        );

                        setEditingId("");

                        fetchEmployees();

                      }}
                      className="bg-green-600 px-4 py-2 rounded"
                    >
                      Save
                    </button>

                  ) : (

                    <>
                      {(currentUserRole === "admin" ||

                        (currentUserRole === "manager" &&
                          employee.role !== "manager")) && (

                        <button
                          onClick={() => {

                            setEditingId(employee.id);

                            setEditData(employee);

                          }}
                          className="bg-blue-600 px-4 py-2 rounded"
                        >
                          Edit
                        </button>

                      )}
                    </>

                  )}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

  );
}