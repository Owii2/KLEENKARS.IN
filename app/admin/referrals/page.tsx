"use client";

import { useEffect, useState } from "react";

export default function AdminReferrals() {
  const [list, setList] = useState<any[]>([]);

  const fetchReport = () => {
    fetch('/api/admin/referrals/report').then(r=>r.json()).then(j=>{ if(j.success) setList(j.report || []); });
  };

  useEffect(()=>{ fetchReport(); },[]);

  const credit = async (phone:string) => {
    const pts = Number(prompt('Points to credit') || '0');
    if(!pts) return;
    const res = await fetch('/api/admin/referrals/credit', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ phone, points: pts }) });
    const j = await res.json();
    if (j.success) { alert('Credited'); fetchReport(); } else alert(j.message || 'Failed');
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Referral Programs</h1>
      <div className="space-y-3">
        {list.map((item: any) => (
          <div key={item.customer.id} className="p-4 bg-zinc-900 rounded flex justify-between">
            <div>
              <div className="font-bold">{item.customer.customerName} • {item.customer.phoneNumber}</div>
              <div className="text-sm text-gray-400">Code: {item.customer.referralCode} • Points: {item.customer.referralPoints} • Redemptions: {item.redemptions}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>{navigator.clipboard.writeText(item.customer.referralCode || '')}} className="px-3 py-1 bg-white/5 rounded">Copy Code</button>
              <button onClick={()=>credit(item.customer.phoneNumber)} className="px-3 py-1 bg-green-600 rounded">Credit Points</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
