"use client";

import { useEffect, useMemo, useState } from "react";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Card from "@/components/ui/Card";

interface FranchiseApplication {
  id: string;
  fullName: string;
  mobileNumber: string;
  whatsappNumber: string;
  emailAddress: string;
  city: string;
  state: string;
  age: string;
  occupation: string;
  investmentBudget: string;
  investmentSource: string;
  desiredCity: string;
  hasLocation: string;
  address: string;
  propertySize: string;
  ownershipStatus: string;
  propertyPhotos: string[];
  businessExperience: string;
  businessName: string;
  industry: string;
  yearsOfExperience: string;
  currentMonthlyRevenue: string;
  manageOutlet: string;
  staffCanHire: string;
  marketReason: string;
  competitors: string;
  dailyCapacity: string;
  followProcedures: string;
  useBranding: string;
  attendTraining: string;
  immediateInvestment: string;
  submittedAt: string;
}

function calculateScore(application: FranchiseApplication) {
  let score = 0;

  if (application.investmentBudget.includes("₹10 Lakh+")) {
    score += 25;
  } else if (application.investmentBudget.includes("₹5–10 Lakh")) {
    score += 15;
  }

  if (application.hasLocation === "Yes") {
    score += 25;
  }

  if (application.businessExperience === "Yes") {
    score += 20;
  }

  if (application.manageOutlet === "Full Time") {
    score += 15;
  }

  const capacity = Number(application.dailyCapacity || 0);
  if (capacity >= 20) {
    score += 15;
  } else if (capacity >= 10) {
    score += 10;
  }

  return score;
}

export default function AdminFranchisePage() {
  const [applications, setApplications] = useState<FranchiseApplication[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("franchiseApplications");
    if (stored) {
      setApplications(JSON.parse(stored));
    }
  }, []);

  const scoredApplications = useMemo(
    () =>
      applications.map((application) => {
        const score = calculateScore(application);
        return {
          ...application,
          score,
          recommended: score >= 70,
        };
      }),
    [applications]
  );

  const totalApplications = scoredApplications.length;
  const approvedApplications = scoredApplications.filter((app) => app.recommended).length;
  const averageScore = totalApplications
    ? Math.round(scoredApplications.reduce((sum, app) => sum + app.score, 0) / totalApplications)
    : 0;

  return (
    <DashboardLayout title="Franchise Applications">
      <div className="grid gap-6 xl:grid-cols-3 mb-8">
        <Card className="p-6">
          <h2 className="text-sm uppercase tracking-[0.35em] text-red-400">Applications</h2>
          <p className="text-4xl font-black mt-4">{totalApplications}</p>
        </Card>
        <Card className="p-6">
          <h2 className="text-sm uppercase tracking-[0.35em] text-red-400">Approved Score 70+</h2>
          <p className="text-4xl font-black mt-4">{approvedApplications}</p>
        </Card>
        <Card className="p-6">
          <h2 className="text-sm uppercase tracking-[0.35em] text-red-400">Average Internal Score</h2>
          <p className="text-4xl font-black mt-4">{averageScore}</p>
        </Card>
      </div>

      <Card className="mb-8 p-6">
        <h2 className="text-xl font-bold mb-4">Internal Scoring</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-sm text-gray-300">
          <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
            <p className="font-semibold">Budget ₹10L+</p>
            <p className="text-3xl font-black text-green-400">25</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
            <p className="font-semibold">Has Location</p>
            <p className="text-3xl font-black text-green-400">25</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
            <p className="font-semibold">Business Experience</p>
            <p className="text-3xl font-black text-green-400">20</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
            <p className="font-semibold">Full-Time Operator</p>
            <p className="text-3xl font-black text-green-400">15</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
            <p className="font-semibold">Good Market</p>
            <p className="text-3xl font-black text-green-400">15</p>
          </div>
        </div>
      </Card>

      {scoredApplications.length === 0 ? (
        <Card className="p-6 text-gray-400">No franchise applications found. Applications submitted through the franchise form will appear here.</Card>
      ) : (
        <div className="space-y-6">
          {scoredApplications.map((application) => (
            <Card key={application.id} className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm text-gray-400">{new Date(application.submittedAt).toLocaleString()}</p>
                  <h3 className="text-2xl font-bold">{application.fullName}</h3>
                  <p className="text-gray-300">{application.desiredCity} — {application.investmentBudget}</p>
                </div>
                <div className="space-y-2 text-right">
                  <div className="text-sm text-gray-400">Internal score</div>
                  <div className={`text-3xl font-black ${application.recommended ? "text-green-400" : "text-yellow-400"}`}>
                    {application.score}
                  </div>
                  <div className={`rounded-full px-4 py-2 text-xs uppercase ${application.recommended ? "bg-green-500/10 text-green-300" : "bg-yellow-500/10 text-yellow-300"}`}>
                    {application.recommended ? "Approve" : "Review"}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="space-y-2 rounded-2xl border border-white/10 bg-[#090909] p-4">
                  <p className="text-sm uppercase tracking-[0.25em] text-gray-400">Personal</p>
                  <p><span className="font-semibold">Phone:</span> {application.mobileNumber}</p>
                  <p><span className="font-semibold">WhatsApp:</span> {application.whatsappNumber}</p>
                  <p><span className="font-semibold">Email:</span> {application.emailAddress}</p>
                  <p><span className="font-semibold">City / State:</span> {application.city}, {application.state}</p>
                  <p><span className="font-semibold">Age:</span> {application.age}</p>
                  <p><span className="font-semibold">Occupation:</span> {application.occupation}</p>
                </div>
                <div className="space-y-2 rounded-2xl border border-white/10 bg-[#090909] p-4">
                  <p className="text-sm uppercase tracking-[0.25em] text-gray-400">Investment</p>
                  <p><span className="font-semibold">Budget:</span> {application.investmentBudget}</p>
                  <p><span className="font-semibold">Source:</span> {application.investmentSource}</p>
                  <p><span className="font-semibold">Immediate:</span> {application.immediateInvestment}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
                  <p className="text-sm uppercase tracking-[0.25em] text-gray-400">Location & Property</p>
                  <p><span className="font-semibold">Desired City:</span> {application.desiredCity}</p>
                  <p><span className="font-semibold">Has Location:</span> {application.hasLocation}</p>
                  {application.hasLocation === "Yes" && (
                    <>
                      <p><span className="font-semibold">Address:</span> {application.address}</p>
                      <p><span className="font-semibold">Size:</span> {application.propertySize} sq ft</p>
                      <p><span className="font-semibold">Ownership:</span> {application.ownershipStatus}</p>
                      {application.propertyPhotos.length > 0 ? (
                        <div className="space-y-3">
                          <p className="font-semibold">Photos:</p>
                          <div className="grid gap-3 sm:grid-cols-3">
                            {application.propertyPhotos.map((photo, photoIndex) => (
                              <img
                                key={photoIndex}
                                src={photo}
                                alt={`Property photo ${photoIndex + 1}`}
                                className="h-24 w-full rounded-2xl object-cover border border-white/10"
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p><span className="font-semibold">Photos:</span> none</p>
                      )}
                    </>
                  )}
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#090909] p-4">
                  <p className="text-sm uppercase tracking-[0.25em] text-gray-400">Experience & Operations</p>
                  <p><span className="font-semibold">Experience:</span> {application.businessExperience}</p>
                  {application.businessExperience === "Yes" && (
                    <>
                      <p><span className="font-semibold">Business:</span> {application.businessName || "—"}</p>
                      <p><span className="font-semibold">Industry:</span> {application.industry || "—"}</p>
                      <p><span className="font-semibold">Years:</span> {application.yearsOfExperience || "—"}</p>
                      <p><span className="font-semibold">Revenue:</span> {application.currentMonthlyRevenue || "—"}</p>
                    </>
                  )}
                  <p><span className="font-semibold">Management:</span> {application.manageOutlet}</p>
                  <p><span className="font-semibold">Staff Hiring:</span> {application.staffCanHire}</p>
                </div>
              </div>

              <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-[#090909] p-4">
                <p className="text-sm uppercase tracking-[0.25em] text-gray-400">Market Assessment</p>
                <p><span className="font-semibold">Why Kleenkars:</span> {application.marketReason}</p>
                <p><span className="font-semibold">Competitors:</span> {application.competitors}</p>
                <p><span className="font-semibold">Daily Capacity:</span> {application.dailyCapacity}</p>
                <p><span className="font-semibold">Follow Procedures:</span> {application.followProcedures}</p>
                <p><span className="font-semibold">Use Branding:</span> {application.useBranding}</p>
                <p><span className="font-semibold">Training:</span> {application.attendTraining}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
