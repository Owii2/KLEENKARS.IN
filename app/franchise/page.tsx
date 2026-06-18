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

export default function FranchisePage() {
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
    <main className="min-h-screen bg-black text-white py-10 px-4 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="glass-panel p-8">
          <div className="mb-6">
            <p className="text-red-400 uppercase tracking-[0.35em] font-semibold">Franchise Inquiry</p>
            <h1 className="text-4xl font-black mt-3">Become a Kleenkars Franchise Partner</h1>
            <p className="text-gray-400 mt-4 max-w-2xl">
              Share your details to apply for a Kleenkars franchise. Our team reviews every application with an internal scoring process and contacts strong candidates directly.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Section 1: Personal Details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span>Full Name</span>
                  <input
                    value={form.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                    placeholder="Enter full name"
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span>Mobile Number</span>
                  <input
                    type="tel"
                    value={form.mobileNumber}
                    onChange={(e) => handleChange("mobileNumber", e.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                    placeholder="10 digit mobile number"
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span>WhatsApp Number</span>
                  <input
                    type="tel"
                    value={form.whatsappNumber}
                    onChange={(e) => handleChange("whatsappNumber", e.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                    placeholder="WhatsApp number"
                  />
                </label>
                <label className="space-y-2">
                  <span>Email Address</span>
                  <input
                    type="email"
                    value={form.emailAddress}
                    onChange={(e) => handleChange("emailAddress", e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                    placeholder="Email address"
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span>City</span>
                  <input
                    value={form.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                    placeholder="City"
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span>State</span>
                  <input
                    value={form.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                    placeholder="State"
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span>Age</span>
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => handleChange("age", e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                    placeholder="Age"
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span>Occupation</span>
                  <input
                    value={form.occupation}
                    onChange={(e) => handleChange("occupation", e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                    placeholder="Occupation"
                    required
                  />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Section 2: Investment Capacity</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span>Available Investment Budget</span>
                  <select
                    value={form.investmentBudget}
                    onChange={(e) => handleChange("investmentBudget", e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                    required
                  >
                    <option value="">Select budget</option>
                    {investmentBudgetOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span>Source of Investment</span>
                  <select
                    value={form.investmentSource}
                    onChange={(e) => handleChange("investmentSource", e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                    required
                  >
                    <option value="">Select source</option>
                    {investmentSourceOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Section 3: Location Details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span>City where you want to open Kleenkars</span>
                  <input
                    value={form.desiredCity}
                    onChange={(e) => handleChange("desiredCity", e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                    placeholder="Desired franchise city"
                    required
                  />
                </label>

                <label className="space-y-2">
                  <span>Do you already have a location?</span>
                  <select
                    value={form.hasLocation}
                    onChange={(e) => handleChange("hasLocation", e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                    required
                  >
                    <option value="">Select option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </label>
              </div>

              {form.hasLocation === "Yes" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span>Address</span>
                    <input
                      value={form.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                      placeholder="Property address"
                    />
                  </label>
                  <label className="space-y-2">
                    <span>Size of Property (sq ft)</span>
                    <input
                      type="number"
                      value={form.propertySize}
                      onChange={(e) => handleChange("propertySize", e.target.value)}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                      placeholder="Square feet"
                    />
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <span>Ownership Status</span>
                    <select
                      value={form.ownershipStatus}
                      onChange={(e) => handleChange("ownershipStatus", e.target.value)}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                    >
                      <option value="">Select ownership status</option>
                      {ownershipOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <span>Upload Property Photos</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-gray-200"
                    />
                    {form.propertyPhotos.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-gray-400 text-sm">
                          Uploaded {form.propertyPhotos.length} photo(s)
                        </p>
                        <div className="grid gap-3 sm:grid-cols-3">
                          {form.propertyPhotos.map((photo, index) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={index}
                              src={photo}
                              alt={`Uploaded photo ${index + 1}`}
                              className="h-24 w-full rounded-2xl object-cover border border-zinc-700"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </label>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Section 4: Business Experience</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span>Have you run a business before?</span>
                  <select
                    value={form.businessExperience}
                    onChange={(e) => handleChange("businessExperience", e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                    required
                  >
                    <option value="">Select option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </label>

                {form.businessExperience === "Yes" && (
                  <>
                    <label className="space-y-2">
                      <span>Business Name</span>
                      <input
                        value={form.businessName}
                        onChange={(e) => handleChange("businessName", e.target.value)}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                        placeholder="Business name"
                      />
                    </label>
                    <label className="space-y-2">
                      <span>Industry</span>
                      <input
                        value={form.industry}
                        onChange={(e) => handleChange("industry", e.target.value)}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                        placeholder="Industry"
                      />
                    </label>
                    <label className="space-y-2">
                      <span>Years of Experience</span>
                      <input
                        type="number"
                        value={form.yearsOfExperience}
                        onChange={(e) => handleChange("yearsOfExperience", e.target.value)}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                        placeholder="Years of experience"
                      />
                    </label>
                    <label className="space-y-2">
                      <span>Current Monthly Revenue</span>
                      <select
                        value={form.currentMonthlyRevenue}
                        onChange={(e) => handleChange("currentMonthlyRevenue", e.target.value)}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                      >
                        <option value="">Select revenue</option>
                        {revenueOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Section 5: Operations</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span>Will you personally manage the outlet?</span>
                  <select
                    value={form.manageOutlet}
                    onChange={(e) => handleChange("manageOutlet", e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                    required
                  >
                    <option value="">Select option</option>
                    <option value="Full Time">Full Time</option>
                    <option value="Part Time">Part Time</option>
                    <option value="Hire Manager">Hire Manager</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span>Number of staff you can hire initially</span>
                  <select
                    value={form.staffCanHire}
                    onChange={(e) => handleChange("staffCanHire", e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                    required
                  >
                    <option value="">Select option</option>
                    {staffOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Section 6: Market Assessment</h2>
              <div className="grid gap-4">
                <label className="space-y-2">
                  <span>Why do you want a Kleenkars franchise?</span>
                  <textarea
                    value={form.marketReason}
                    onChange={(e) => handleChange("marketReason", e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                    placeholder="Write your market assessment"
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span>Who are the main competitors in your city?</span>
                  <textarea
                    value={form.competitors}
                    onChange={(e) => handleChange("competitors", e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                    placeholder="Name major competitors"
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span>How many cars do you believe can be serviced per day at your location?</span>
                  <input
                    type="number"
                    value={form.dailyCapacity}
                    onChange={(e) => handleChange("dailyCapacity", e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                    placeholder="Expected daily car volume"
                    required
                  />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Section 7: Final Qualification Questions</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span>Are you willing to follow Kleenkars operating procedures?</span>
                  <select
                    value={form.followProcedures}
                    onChange={(e) => handleChange("followProcedures", e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                    required
                  >
                    <option value="">Select option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span>Are you willing to use Kleenkars branding and pricing standards?</span>
                  <select
                    value={form.useBranding}
                    onChange={(e) => handleChange("useBranding", e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                    required
                  >
                    <option value="">Select option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span>Are you willing to attend mandatory training?</span>
                  <select
                    value={form.attendTraining}
                    onChange={(e) => handleChange("attendTraining", e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                    required
                  >
                    <option value="">Select option</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span>How much money can you invest immediately within the next 30 days?</span>
                  <input
                    value={form.immediateInvestment}
                    onChange={(e) => handleChange("immediateInvestment", e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4 outline-none"
                    placeholder="Enter amount"
                    required
                  />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Section 8: Documents</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span>Aadhaar Card</span>
                  <input type="file" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-gray-200" required />
                </label>
                <label className="space-y-2">
                  <span>PAN Card</span>
                  <input type="file" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-gray-200" required />
                </label>
                <label className="space-y-2">
                  <span>Photograph</span>
                  <input type="file" className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-gray-200" required />
                </label>
                <label className="space-y-2">
                  <span>Property Photos (if available)</span>
                  <input type="file" multiple className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-gray-200" />
                </label>
              </div>
            </div>

            <button type="submit" className="w-full rounded-2xl bg-red-500 py-4 text-xl font-bold text-black transition hover:bg-red-600">
              Submit Franchise Application
            </button>

            {submitted && (
              <div className="rounded-2xl border border-green-500 bg-green-500/10 p-4 text-green-200">
                Your application has been submitted successfully. We have saved it locally for review. The Kleenkars team will contact you soon.
              </div>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}
