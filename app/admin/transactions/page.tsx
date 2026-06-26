"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import TransactionsConsole from "@/components/dashboard/TransactionsConsole";

export default function AdminTransactionsPage() {
  return (
    <DashboardLayout title="Transactions Console">
      <div className="py-6 px-4 md:px-8">
        <TransactionsConsole />
      </div>
    </DashboardLayout>
  );
}
