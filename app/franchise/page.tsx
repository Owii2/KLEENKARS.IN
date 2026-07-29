import Link from "next/link";
import { Metadata } from "next";
import { FranchiseForm } from "@/components/franchise/FranchiseForm";

export const metadata: Metadata = {
  title: "Car Wash & Detailing Franchise Opportunity in India",
  description:
    "Partner with Kleenkars to start your own high-ROI car wash, ceramic coating, and auto detailing studio in India. Turnkey setup, branding, and training support.",
  alternates: {
    canonical: "https://kleenkars.in/franchise",
  },
};

export default function FranchisePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://kleenkars.in",
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Franchise Opportunity",
        "item": "https://kleenkars.in/franchise",
      },
    ],
  };

  return (
    <main className="min-h-screen bg-black text-white py-8 sm:py-12 lg:py-16 px-4 sm:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-6xl space-y-8 sm:space-y-12">
        {/* BREADCRUMB & HEADER */}
        <div className="space-y-4">
          <nav aria-label="Breadcrumb" className="text-xs text-gray-400 flex items-center gap-2">
            <Link href="/" className="hover:text-red-400 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white font-semibold">Franchise</span>
          </nav>

          <div className="text-center max-w-3xl mx-auto space-y-3 pt-2">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Start a High-ROI Car Wash &amp; Detailing Franchise
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              Join India&apos;s fastest growing car care brand. Kleenkars provides end-to-end studio setup, professional equipment, trained manpower, marketing support, and technology systems.
            </p>
          </div>
        </div>

        {/* VALUE PROPOSITION GRID */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-3">
            <div className="text-2xl">🚗</div>
            <h3 className="text-lg font-bold text-white">Booming Industry</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Rapid growth in passenger vehicles across Tier 1, 2, and 3 Indian cities creates massive demand for premium detailing.
            </p>
          </div>
          <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-3">
            <div className="text-2xl">🛠️</div>
            <h3 className="text-lg font-bold text-white">Turnkey Studio Setup</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              We guide you from site selection and bay layout design to high-pressure foam washers, polishers, and chemical supplies.
            </p>
          </div>
          <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-3">
            <div className="text-2xl">📈</div>
            <h3 className="text-lg font-bold text-white">High Profit Margins</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Services like Ceramic Coating and PPF offer exceptional margins with quick return on initial capital investment.
            </p>
          </div>
        </div>

        {/* FRANCHISE FORM COMPONENT */}
        <FranchiseForm />
      </div>
    </main>
  );
}
