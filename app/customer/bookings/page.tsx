"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface CustomerUser {
  name?: string;
  phone: string;
  email?: string;
}

interface LocalBooking {
  id: string;
  name?: string;
  phone: string;
  service: string;
  amount: number;
  date: string;
  time?: string;
  status: string;
  vehicle?: string;
  addons?: string[];
}

export default function BookingsPage() {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [bookings, setBookings] = useState<LocalBooking[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("customerUser");
    const u = stored ? JSON.parse(stored) as CustomerUser : null;
    setUser(u);
    const all = JSON.parse(window.localStorage.getItem("bookings") || "[]") as LocalBooking[];
    setBookings(all.filter((b) => b.phone === u?.phone).sort((a, b) => (a.date > b.date ? 1 : -1)));
  }, []);

  const refresh = () => {
    const all = JSON.parse(window.localStorage.getItem("bookings") || "[]") as LocalBooking[];
    const stored = window.localStorage.getItem("customerUser");
    const u = stored ? JSON.parse(stored) as CustomerUser : null;
    setBookings(all.filter((b) => b.phone === u?.phone));
  };

  const cancel = (id: string) => {
    const all = JSON.parse(window.localStorage.getItem("bookings") || "[]") as LocalBooking[];
    const idx = all.findIndex((x) => x.id === id);
    if (idx === -1) return;
    all[idx].status = "Cancelled";
    window.localStorage.setItem("bookings", JSON.stringify(all));
    refresh();
  };

  const rebook = (b: LocalBooking) => {
    window.localStorage.setItem("rebookItem", JSON.stringify(b));
    router.push("/booking");
  };

  const generatePdf = (b: LocalBooking) => {
    // render an HTML invoice, capture with html2canvas and save via jsPDF
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '0';
    container.style.width = '800px';
    container.innerHTML = `
      <div style="font-family: Arial, sans-serif; color: #111; padding:20px; width:760px;">
        <h1 style="color:#e11d48">OWII Invoice</h1>
        <div>Invoice ID: ${b.id}</div>
        <div>Date: ${b.date} ${b.time || ''}</div>
        <div>Customer: ${b.name || ''}</div>
        <div>Phone: ${b.phone}</div>
        <div>Service: ${b.service}</div>
        <div>Amount: ₹${b.amount}</div>
        ${b.addons && b.addons.length ? `<div>Addons: ${b.addons.join(', ')}</div>` : ''}
        <div>Status: ${b.status}</div>
      </div>
    `;
    document.body.appendChild(container);
    html2canvas(container, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`invoice_${b.id}.pdf`);
      document.body.removeChild(container);
    }).catch(err => { console.log(err); alert('Failed to generate PDF'); document.body.removeChild(container); });
  };

  if (!user) return <div className="p-6">Please <Link href="/customer/login">login</Link></div>;

  const upcoming = bookings.filter(b => b.status !== "Completed" && b.status !== "Cancelled");
  const history = bookings.filter(b => b.status === "Completed" || b.status === "Cancelled");

  return (
    <main className="min-h-screen p-6 bg-black text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Upcoming Bookings</h1>
        <div className="space-y-4">
          {upcoming.length === 0 && <div className="p-4 bg-zinc-900 rounded">No upcoming bookings. <Link href="/booking">Book now</Link></div>}
          {upcoming.map((b) => (
            <div key={b.id} className="p-4 bg-zinc-900 rounded">
              <div className="flex justify-between">
                <div>
                  <div className="font-bold">{b.service}</div>
                  <div className="text-sm text-gray-400">{b.date} {b.time}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">₹{b.amount}</div>
                  <div className="text-sm text-gray-400">{b.status}</div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => alert('Reschedule flow placeholder')} className="px-3 py-1 bg-white/5 rounded">Reschedule</button>
                <button onClick={() => cancel(b.id)} className="px-3 py-1 bg-red-600 rounded">Cancel</button>
                <button onClick={() => alert('Track status placeholder')} className="px-3 py-1 bg-white/5 rounded">Track Status</button>
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold">Booking History</h2>
        <div className="space-y-4">
          {history.length === 0 && <div className="p-4 bg-zinc-900 rounded">No past bookings.</div>}
          {history.map((b) => (
            <div key={b.id} className="p-4 bg-zinc-900 rounded">
              <div className="flex justify-between">
                <div>
                  <div className="font-bold">{b.service}</div>
                  <div className="text-sm text-gray-400">{b.date} {b.time} • {b.vehicle || ''}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">₹{b.amount}</div>
                  <div className="text-sm text-gray-400">{b.status}</div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => rebook(b)} className="px-3 py-1 bg-green-600 rounded">Book Again</button>
                <button onClick={() => generatePdf(b)} className="px-3 py-1 bg-white/5 rounded">Download Invoice</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
