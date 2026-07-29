"use client";

import { useMemo, useState } from "react";

const investmentBudgetOptions = [
  "₹3–5 Lakh",
  "₹5–10 Lakh",
  "₹10–15 Lakh",
  "₹15–20 Lakh",
  "₹20 Lakh+",
];

const investmentSourceOptions = [
  "Personal Savings",
  "Business Income",
  "Family Funds",
  "Loan",
  "Other",
];

const ownershipOptions = ["Owned", "Rented", "Under Negotiation"];

const staffOptions = ["1–2", "3–5", "5–10", "10+"];

const revenueOptions = ["Below ₹1 Lakh", "₹1–5 Lakh", "₹5–10 Lakh", "₹10 Lakh+"];

const initialFormState = {
  fullName: "",
  mobileNumber: "",
  whatsappNumber: "",
  emailAddress: "",
  city: "",
  state: "",
  age: "",
  occupation: "",
  investmentBudget: "",
  investmentSource: "",
  desiredCity: "",
  hasLocation: "",
  address: "",
  propertySize: "",
  ownershipStatus: "",
  propertyPhotos: [] as string[],
  businessExperience: "",
  businessName: "",
  industry: "",
  yearsOfExperience: "",
  currentMonthlyRevenue: "",
  manageOutlet: "",
  staffCanHire: "",
  marketReason: "",
  competitors: "",
  dailyCapacity: "",
  followProcedures: "",
  useBranding: "",
  attendTraining: "",
  immediateInvestment: "",
};

export function FranchiseForm() {
  const [form, setForm] = useState(initialFormState);
  const [submitted, setSubmitted] = useState(false);

  const applicationData = useMemo(
    () => ({
      ...form,
      submittedAt: new Date().toISOString(),
    }),
    [form]
  );

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    const photoPromises = Array.from(files).map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        })
    );

    const photos = await Promise.all(photoPromises);
    setForm((current) => ({ ...current, propertyPhotos: photos }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const stored = typeof window !== "undefined" ? localStorage.getItem("franchiseApplications") : null;
    const applications = stored ? JSON.parse(stored) : [];
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "franchiseApplications",
        JSON.stringify([...applications, { id: Date.now().toString(), ...applicationData }])
      );
    }
    setSubmitted(true);
    setForm(initialFormState);
  };

  return (
    <div className="glass-panel p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-zinc-950 border border-zinc-800">
      <div className="mb-6">
        <p className="text-red-400 uppercase tracking-[0.35em] font-semibold text-xs">Franchise Inquiry Application</p>
        <h2 className="text-2xl sm:text-3xl font-black mt-2 text-white">Apply for a Kleenkars Franchise</h2>
        <p className="text-gray-400 mt-2 text-xs sm:text-sm leading-relaxed">
          Share your details to apply for a Kleenkars franchise outlet. Our expansion team reviews every application thoroughly.
        </p>
      </div>

      {submitted ? (
        <div className="p-8 rounded-2xl bg-red-950/30 border border-red-500/40 text-center space-y-4">
          <span className="text-4xl">🎉</span>
          <h3 className="text-2xl font-bold text-white">Application Received!</h3>
          <p className="text-gray-300 text-sm max-w-md mx-auto">
            Thank you for applying. Our franchise team will review your application details and contact you shortly.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition mt-4"
          >
            Submit Another Application
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Section 1 */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white border-b border-zinc-800 pb-2">Section 1: Personal Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-xs font-semibold text-gray-300">
                <span>Full Name</span>
                <input
                  value={form.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none text-white text-sm"
                  placeholder="Enter full name"
                  required
                />
              </label>
              <label className="space-y-2 text-xs font-semibold text-gray-300">
                <span>Mobile Number</span>
                <input
                  type="tel"
                  value={form.mobileNumber}
                  onChange={(e) => handleChange("mobileNumber", e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none text-white text-sm"
                  placeholder="10 digit mobile number"
                  required
                />
              </label>
              <label className="space-y-2 text-xs font-semibold text-gray-300">
                <span>WhatsApp Number</span>
                <input
                  type="tel"
                  value={form.whatsappNumber}
                  onChange={(e) => handleChange("whatsappNumber", e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none text-white text-sm"
                  placeholder="WhatsApp number"
                />
              </label>
              <label className="space-y-2 text-xs font-semibold text-gray-300">
                <span>Email Address</span>
                <input
                  type="email"
                  value={form.emailAddress}
                  onChange={(e) => handleChange("emailAddress", e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none text-white text-sm"
                  placeholder="name@domain.com"
                  required
                />
              </label>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white border-b border-zinc-800 pb-2">Section 2: Investment &amp; Location</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-xs font-semibold text-gray-300">
                <span>Investment Budget</span>
                <select
                  value={form.investmentBudget}
                  onChange={(e) => handleChange("investmentBudget", e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none text-white text-sm"
                  required
                >
                  <option value="">Select budget range</option>
                  {investmentBudgetOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-xs font-semibold text-gray-300">
                <span>Desired City / Region</span>
                <input
                  value={form.desiredCity}
                  onChange={(e) => handleChange("desiredCity", e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none text-white text-sm"
                  placeholder="City for franchise outlet"
                  required
                />
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <button
              type="submit"
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold text-sm uppercase tracking-wider px-10 py-4 rounded-xl transition shadow-lg shadow-red-600/20"
            >
              Submit Franchise Inquiry
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
