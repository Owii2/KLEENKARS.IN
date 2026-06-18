"use client";

import { useEffect, useMemo, useState } from "react";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Card from "@/components/ui/Card";
import KpiCard from "@/components/ui/KpiCard";

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  paymentMode: string;
  notes: string | null;
}

export default function ExpensePage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [notes, setNotes] = useState("");

  const fetchExpenses = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/expenses");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load expenses");
      }

      setExpenses(data.expenses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const addExpense = async () => {
    setError("");

    const response = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        amount: Number(amount),
        category,
        paymentMode,
        notes,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Could not add expense");
      return;
    }

    setTitle("");
    setAmount("");
    setCategory("");
    setNotes("");
    fetchExpenses();
  };

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses]
  );

  return (
    <DashboardLayout title="Expenses">
      <Card className="mb-8">
        <div className="grid md:grid-cols-2 gap-4">
          <input
            placeholder="Expense Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-black border border-gray-700 p-3 rounded-lg"
          />
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-black border border-gray-700 p-3 rounded-lg"
          />
          <input
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-black border border-gray-700 p-3 rounded-lg"
          />
          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            className="bg-black border border-gray-700 p-3 rounded-lg"
          >
            <option>Cash</option>
            <option>UPI</option>
            <option>Bank Transfer</option>
          </select>
          <textarea
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-black border border-gray-700 p-3 rounded-lg md:col-span-2"
          />
        </div>
        <button
          onClick={addExpense}
          className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg mt-5"
        >
          Add Expense
        </button>
        {error ? <p className="text-red-400 mt-4">{error}</p> : null}
      </Card>

      <div className="mb-8">
        <KpiCard label="Total Expenses" value={`Rs. ${totalExpenses}`} color="text-red-400" />
      </div>

      <div className="space-y-4">
        {loading ? (
          <Card>Loading expenses...</Card>
        ) : expenses.length === 0 ? (
          <Card>No expenses recorded.</Card>
        ) : (
          expenses.map((expense) => (
            <Card key={expense.id} className="flex flex-col sm:flex-row sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">{expense.title}</h2>
                <p className="text-gray-400">{expense.category}</p>
                <p className="text-gray-500 text-sm">{expense.notes || "-"}</p>
              </div>
              <div className="sm:text-right">
                <div className="text-red-400 text-2xl font-bold">
                  Rs. {expense.amount}
                </div>
                <div className="text-gray-400">{expense.paymentMode}</div>
              </div>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
