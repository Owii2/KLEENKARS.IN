import Link from "next/link";
import React from "react";

export const metadata = {
  title: "Terms of Service | KLEENKARS.IN",
  description: "Terms and conditions of service for KLEENKARS Doorstep Car Wash & Detailing Services.",
};

export default function TermsOfServicePage() {
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
            <span className="text-red-500 text-sm font-bold tracking-wider uppercase">Agreement</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">Terms of Service</h1>
            <p className="text-slate-400 text-sm mt-2">Last Updated: August 16, 2026</p>
          </div>

          <p className="text-slate-300 leading-relaxed">
            These Terms of Service (&quot;Terms&quot;) govern your use of the website <strong className="text-white">KLEENKARS.IN</strong> and your booking of our doorstep car wash, detailing, ceramic coating, and paint protection services. By accessing or using our services, you agree to be bound by these Terms.
          </p>

          {/* SECTION 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-red-500 font-mono">1.</span> Scope of Service
            </h2>
            <p className="text-slate-300 leading-relaxed text-sm">
              KLEENKARS provides professional doorstep car cleaning, interior vacuuming, foam washing, paint correction, ceramic coating, and detailing services at the location specified during booking in Aligarh and surrounding service coverage zones.
            </p>
          </section>

          {/* SECTION 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-red-500 font-mono">2.</span> Customer Responsibilities &amp; Premises Access
            </h2>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-2 pl-2">
              <li><strong className="text-white">Vehicle Access:</strong> The customer must ensure the vehicle is parked in a safe, accessible area permitting technician access.</li>
              <li><strong className="text-white">Utilities Access:</strong> For doorstep wash packages, basic access to a clean water outlet and electrical point may be required unless mobile tank units are booked.</li>
              <li><strong className="text-white">Personal Belongings:</strong> Customers are advised to remove all valuable personal items from the vehicle prior to service commencement. KLEENKARS is not responsible for lost unverified personal property left inside the cabin.</li>
              <li><strong className="text-white">Pre-existing Damage Disclosure:</strong> Customers must disclose any pre-existing paint chips, cracked glass, structural rust, or loose fittings before service begins.</li>
            </ul>
          </section>

          {/* SECTION 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-red-500 font-mono">3.</span> Bookings, Pricing &amp; Payments
            </h2>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-2 pl-2">
              <li>Bookings are confirmed upon scheduling via the app/website or customer service desk.</li>
              <li>Prices shown are inclusive of applicable service taxes. Payment may be completed online or upon job completion via cash/UPI/cards.</li>
              <li>Promotional offer codes and membership package discounts cannot be combined unless explicitly stated.</li>
            </ul>
          </section>

          {/* SECTION 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-red-500 font-mono">4.</span> Cancellation &amp; Rescheduling
            </h2>
            <p className="text-slate-300 leading-relaxed text-sm">
              Bookings may be rescheduled or cancelled free of charge up to 2 hours prior to the scheduled slot time. For full refund conditions, please review our dedicated{" "}
              <Link href="/refunds" className="text-red-400 underline hover:text-red-300">
                Refund &amp; Cancellation Policy
              </Link>.
            </p>
          </section>

          {/* SECTION 5 */}
          <section className="space-y-3 border-t border-slate-800 pt-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-red-500 font-mono">5.</span> Limitation of Liability
            </h2>
            <p className="text-slate-300 leading-relaxed text-sm">
              KLEENKARS employs trained detailing professionals using high-grade, paint-safe products. However, KLEENKARS shall not be liable for damage resulting from undisclosed pre-existing vehicle defects, faded paintwork, or pre-damaged electrical fittings.
            </p>
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
        <Link href="/refunds" className="hover:text-red-500 transition-colors">
          Refund Policy
        </Link>
      </footer>
    </div>
  );
}
