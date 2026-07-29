import Link from "next/link";
import { Metadata } from "next";
import { PackagesList } from "@/components/packages/PackagesList";

export const metadata: Metadata = {
  title: "Car Wash & Detailing Packages & Pricing in Aligarh",
  description:
    "Explore Kleenkars' transparent car wash and detailing package prices in Aligarh. Premium Foam Wash, Deep Interior Spa, 9H Ceramic Coating, PPF, and Paint Correction packages.",
  alternates: {
    canonical: "https://kleenkars.in/packages",
  },
};

export default function PackagesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
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
            "name": "Packages & Pricing",
            "item": "https://kleenkars.in/packages",
          },
        ],
      },
      {
        "@type": "Service",
        "name": "Car Wash & Detailing Packages",
        "provider": {
          "@type": "AutomotiveBusiness",
          "name": "Kleenkars",
          "url": "https://kleenkars.in",
        },
        "areaServed": "Aligarh, Uttar Pradesh",
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Kleenkars Packages",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Premium Wash & Express Detail",
              },
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Interior Deep Cleaning Spa",
              },
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Ceramic Coating & Paint Shield",
              },
            },
          ],
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-black text-white py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
        {/* BREADCRUMB & HEADER */}
        <div className="space-y-4">
          <nav aria-label="Breadcrumb" className="text-xs text-gray-400 flex items-center gap-2">
            <Link href="/" className="hover:text-red-400 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white font-semibold">Packages</span>
          </nav>

          <div className="text-center max-w-3xl mx-auto space-y-3 pt-2">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Car Detailing Packages &amp; Pricing
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
              Transparent rates for Hatchbacks, Sedans, MUVs, and Luxury SUVs in Aligarh. All packages include options for free doorstep pickup and drop.
            </p>
          </div>
        </div>

        {/* PACKAGES RENDERER */}
        <PackagesList />

        {/* BENEFIT OVERVIEW SECTION */}
        <div className="pt-12 border-t border-zinc-900 grid md:grid-cols-3 gap-8">
          <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-2">
            <h3 className="text-lg font-bold text-white">Transparent Pricing</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              No hidden charges. Clear vehicle-tier based pricing tailored to your car size.
            </p>
          </div>
          <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-2">
            <h3 className="text-lg font-bold text-white">Free Doorstep Pickup</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Our insured drivers safely pick up your vehicle from any location in Aligarh.
            </p>
          </div>
          <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-2">
            <h3 className="text-lg font-bold text-white">100% Satisfaction Guarantee</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Inspected thoroughly before delivery to ensure a glossy, spotless finish.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
