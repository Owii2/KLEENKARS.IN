import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { SERVICES_DATA } from "@/lib/services-data";

export const metadata: Metadata = {
  title: "Car Detailing Services in Aligarh | Ceramic Coating, PPF, Wash & Spa",
  description:
    "Explore Kleenkars' complete auto detailing services in Aligarh, UP. 9H Ceramic Coating, TPU Paint Protection Film (PPF), Paint Correction, Interior Steam Spa, and Doorstep Car Wash.",
  alternates: {
    canonical: "https://kleenkars.in/services",
  },
};

export default function ServicesIndexPage() {
  const servicesList = Object.values(SERVICES_DATA);

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
            "name": "Services",
            "item": "https://kleenkars.in/services",
          },
        ],
      },
      {
        "@type": "ItemList",
        "name": "Kleenkars Car Detailing Services Aligarh",
        "itemListElement": servicesList.map((svc, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "name": svc.name,
          "url": `https://kleenkars.in/services/${svc.slug}`,
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-black text-white py-16 px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-6xl mx-auto space-y-12">
        {/* BREADCRUMB & HEADER */}
        <div className="space-y-4">
          <nav aria-label="Breadcrumb" className="text-xs text-gray-400 flex items-center gap-2">
            <Link href="/" className="hover:text-red-400 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white font-semibold">Services</span>
          </nav>

          <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
            <p className="text-xs uppercase tracking-[0.35em] text-red-500 font-bold">Expert Care Studio</p>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              Car Detailing &amp; Wash Services in Aligarh
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              Specialized detailing treatments tailored for daily drivers, luxury sedans, and SUVs. Doorstep pickup and drop available across Aligarh.
            </p>
          </div>
        </div>

        {/* SERVICES GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {servicesList.map((svc) => (
            <div
              key={svc.slug}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col justify-between hover:border-red-500/50 transition-all duration-300 shadow-xl hover:shadow-red-500/5 group"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-zinc-900">
                <Image
                  src={svc.heroImage}
                  alt={`${svc.shortName} in Aligarh`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-red-400 bg-red-950/40 border border-red-500/20 px-2.5 py-0.5 rounded-full inline-block">
                    {svc.priceRange}
                  </span>
                  <h2 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">
                    {svc.shortName}
                  </h2>
                  <p className="text-gray-400 text-xs line-clamp-3 leading-relaxed">
                    {svc.overview}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-900 flex items-center justify-between">
                  <Link
                    href={`/services/${svc.slug}`}
                    className="text-xs font-bold text-red-500 group-hover:text-red-400 transition flex items-center gap-1"
                  >
                    View Detailing Details →
                  </Link>

                  <Link
                    href="/booking"
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl transition"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
