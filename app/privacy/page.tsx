import Link from "next/link";
import React from "react";

export const metadata = {
  title: "Privacy Policy | KLEENKARS.IN",
  description: "Privacy Policy and Personal Data Protection notice for KLEENKARS Doorstep Car Wash & Detailing Services.",
};

export default function PrivacyPolicyPage() {
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
            <span className="text-red-500 text-sm font-bold tracking-wider uppercase">Legal &amp; Data Protection</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">Privacy Policy</h1>
            <p className="text-slate-400 text-sm mt-2">Last Updated: August 16, 2026</p>
          </div>

          <p className="text-slate-300 leading-relaxed">
            Welcome to <strong className="text-white">KLEENKARS.IN</strong> (&quot;KLEENKARS&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We operate Aligarh&apos;s premium doorstep car wash and detailing service.
            We are committed to safeguarding your personal data and respecting your privacy in accordance with applicable data protection laws, including the Digital Personal Data Protection (DPDP) Act.
          </p>

          {/* SECTION 1 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-red-500 font-mono">1.</span> Information We Collect
            </h2>
            <p className="text-slate-300 leading-relaxed text-sm">
              When you book a service, register an account, or contact us, we collect information necessary to deliver doorstep services efficiently:
            </p>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-2 pl-2">
              <li><strong className="text-white">Personal Identifiers:</strong> Name, mobile phone number, email address.</li>
              <li><strong className="text-white">Vehicle Information:</strong> Vehicle make, model, registration number, color, and selected wash/detailing service package.</li>
              <li><strong className="text-white">Location Data:</strong> Doorstep pickup/wash address, landmark, and GPS coordinates provided for service fulfillment.</li>
              <li><strong className="text-white">Transaction Records:</strong> Payment mode, invoice history, referral credits, and membership plan details.</li>
              <li><strong className="text-white">Technical Logs:</strong> IP address, device browser type, and authentication session tokens stored locally.</li>
            </ul>
          </section>

          {/* SECTION 2 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-red-500 font-mono">2.</span> How We Use Your Data
            </h2>
            <p className="text-slate-300 leading-relaxed text-sm">
              We process your personal information strictly for legitimate operational purposes:
            </p>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-2 pl-2">
              <li>Scheduling, dispatching, and executing doorstep car detailing and wash requests.</li>
              <li>Sending automated OTP login codes, booking confirmations, and status updates via SMS / WhatsApp.</li>
              <li>Processing service billing, invoicing, loyalty reward points, and referral programs.</li>
              <li>Improving customer service quality, chatbot assistance, and overall app reliability.</li>
            </ul>
          </section>

          {/* SECTION 3 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-red-500 font-mono">3.</span> Cookies &amp; Local Storage Policy
            </h2>
            <p className="text-slate-300 leading-relaxed text-sm">
              We utilize essential HTTP cookies and browser LocalStorage solely to manage authenticated sessions, maintain user login preferences, and ensure seamless auto-logout security after inactivity. We do not sell or trade your data to third-party marketing brokers.
            </p>
          </section>

          {/* SECTION 4 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-red-500 font-mono">4.</span> Third-Party Service Providers
            </h2>
            <p className="text-slate-300 leading-relaxed text-sm">
              To operate our services effectively, we share minimal required data with trusted third-party providers under strict data security agreements:
            </p>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-2 pl-2">
              <li><strong className="text-white">Messaging Gateways:</strong> Twilio &amp; WhatsApp Business API for dispatch alerts &amp; OTP verification.</li>
              <li><strong className="text-white">Database &amp; Hosting Infrastructure:</strong> Cloud hosting and Neon Database for secure encrypted storage.</li>
            </ul>
          </section>

          {/* SECTION 5 */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-red-500 font-mono">5.</span> Your Data Protection Rights
            </h2>
            <p className="text-slate-300 leading-relaxed text-sm">
              You maintain full control over your personal data. You have the right to request:
            </p>
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-2 pl-2">
              <li>Access to or a copy of your registered personal and booking records.</li>
              <li>Correction or updating of inaccurate profile and vehicle details.</li>
              <li>Deletion of your account and associated personal data (subject to legal billing retention requirements).</li>
            </ul>
          </section>

          {/* SECTION 6 */}
          <section className="space-y-3 border-t border-slate-800 pt-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-red-500 font-mono">6.</span> Contact Privacy Officer
            </h2>
            <p className="text-slate-300 leading-relaxed text-sm">
              If you have any questions or wish to exercise your data rights, please contact our Data Protection Officer at:
            </p>
            <div className="bg-slate-950 p-4 rounded-xl text-slate-300 text-sm font-mono border border-slate-800">
              <p>Email: <span className="text-white">support@kleenkars.in</span></p>
              <p>Location: Aligarh, Uttar Pradesh, India</p>
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-900/40 py-6 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} KLEENKARS.IN. All rights reserved. |{" "}
        <Link href="/terms" className="hover:text-red-500 transition-colors">
          Terms of Service
        </Link>{" "}
        |{" "}
        <Link href="/refunds" className="hover:text-red-500 transition-colors">
          Refund Policy
        </Link>
      </footer>
    </div>
  );
}
