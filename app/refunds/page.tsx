import Link from "next/link";
import React from "react";

export const metadata = {
  title: "Refund & Cancellation Policy | KLEENKARS.IN",
  description: "Refund and Cancellation terms for KLEENKARS Doorstep Car Wash & Detailing Services.",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
      {/* HEADER NAVBAR */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="text-red-500">KLEENKARS</span>.IN
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-300">
            <Link href="/" className="hover:text-red-500 transition-colors">
              Home
            </Link>
            <Link href="/services" className="hover:text-red-500 transition-colors">
              Services
            </Link>
            <Link href="/booking" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
              Book Wash
            </Link>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-4xl mx-auto px-4 py-12 flex-grow">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 sm:p-12 shadow-2xl space-y-8">
          <div>
            <span className="text-red-500 text-sm font-bold tracking-wider uppercase">Customer Protection</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">Refund &amp; Cancellation Policy</h1>
            <p className="text-slate-400 text-sm mt-2">Last Updated: August 16, 2026</p>
          </div>

          <p className="text-slate-300 leading-relaxed">
            At <strong className="text-white">KLEENKARS.IN</strong>, customer satisfaction is our top priority. We strive to provide transparent, high-quality doorstep car wash and detailing services.
          </p>

          {/* SECTION 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-red-500 font-mono">1.</span> Booking Cancellations &amp; Slot Rescheduling
            </h2>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-2 pl-2">
              <li><strong className="text-white">More than 2 hours before slot:</strong> Full refund or zero-fee slot rescheduling.</li>
              <li><strong className="text-white">Less than 2 hours before slot:</strong> If technicians have already dispatched to your location, a minimal convenience cancellation charge may apply.</li>
              <li><strong className="text-white">Cancellation by KLEENKARS:</strong> In case of severe weather or equipment failure, 100% full refund or priority reschedule is guaranteed.</li>
            </ul>
          </section>

          {/* SECTION 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-red-500 font-mono">2.</span> Service Satisfaction Guarantee &amp; Re-Clean
            </h2>
            <p className="text-slate-300 leading-relaxed text-sm">
              If you notice any quality deficiency or missed area immediately upon job completion, please notify our supervisor on-site. We will inspect and re-clean the vehicle section at zero additional charge.
            </p>
          </section>

          {/* SECTION 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-red-500 font-mono">3.</span> Refund Processing Timeline
            </h2>
            <p className="text-slate-300 leading-relaxed text-sm">
              Approved online payment refunds are processed back to the original payment source (UPI / Credit Card / Net Banking) within <strong className="text-white">5 to 7 business days</strong>.
            </p>
          </section>

          {/* SECTION 4 */}
          <section className="space-y-3 border-t border-slate-800 pt-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-red-500 font-mono">4.</span> How to Request a Refund
            </h2>
            <p className="text-slate-300 leading-relaxed text-sm">
              To request a refund or raise a billing discrepancy, contact our customer support team:
            </p>
            <div className="bg-slate-950 p-4 rounded-xl text-slate-300 text-sm font-mono border border-slate-800">
              <p>Email: <span className="text-white">support@kleenkars.in</span></p>
              <p>Helpline: <span className="text-white">+91 (Aligarh Customer Support)</span></p>
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-900/40 py-6 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} KLEENKARS.IN. All rights reserved. |{" "}
        <Link href="/privacy" className="hover:text-red-500 transition-colors">
          Privacy Policy
        </Link>{" "}
        |{" "}
        <Link href="/terms" className="hover:text-red-500 transition-colors">
          Terms of Service
        </Link>
      </footer>
    </div>
  );
}
