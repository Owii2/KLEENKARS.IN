"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Card from "@/components/ui/Card";

interface LocalCustomer {
  name: string;
  phone: string;
  lastVisit: string;
}

export default function InactiveCustomers(){
  const [customers, setCustomers] = useState<LocalCustomer[]>([]);

  useEffect(()=>{
    if(typeof window === 'undefined') return;
    const stored = localStorage.getItem('customers') || '[]';
    const parsed = JSON.parse(stored) as LocalCustomer[];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 45);
    const inactive = parsed.filter((c)=> new Date(c.lastVisit) < cutoff);
    setCustomers(inactive);
  },[]);

  const sendWhatsApp = (phone:string)=>{
    const text = encodeURIComponent("Hello from Kleenkars — we miss you! Book a wash today with a special offer.");
    window.open(`https://wa.me/91${phone}?text=${text}`, '_blank');
  }

  return (
    <DashboardLayout title="Inactive Customers">
      <div className="space-y-4">
        <Card className="p-6">
          <h2 className="text-xl font-bold">Customers to follow up (45+ days)</h2>
        </Card>
        {customers.length===0 ? <Card className="p-6 text-gray-400">No inactive customers.</Card> : (
          customers.map(c=> (
            <Card key={c.phone} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-sm text-gray-400">{c.phone} • Last visit: {new Date(c.lastVisit).toLocaleDateString()}</div>
              </div>
              <div>
                <button onClick={()=>sendWhatsApp(c.phone)} className="bg-green-500 px-3 py-2 rounded">Send WhatsApp</button>
              </div>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
