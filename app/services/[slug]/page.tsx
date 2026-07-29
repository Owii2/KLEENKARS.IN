import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { SERVICES_DATA } from "@/lib/services-data";

export function generateStaticParams() {
  return Object.keys(SERVICES_DATA).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = SERVICES_DATA[slug];

  if (!service) {
    return {
      title: "Service Not Found",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kleenkars.in";
  const canonicalUrl = `${siteUrl}/services/${service.slug}`;

  return {
    title: service.metaTitle,
    description: service.metaDescription,
    keywords: [
      service.focusKeyword,
      `${service.shortName} Aligarh`,
      "Car Detailing Aligarh",
      "Kleenkars Aligarh",
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: service.metaTitle,
      description: service.metaDescription,
      url: canonicalUrl,
      type: "website",
      images: [
        {
          url: service.heroImage,
          alt: service.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: service.metaTitle,
      description: service.metaDescription,
      images: [service.heroImage],
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = SERVICES_DATA[slug];

  if (!service) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kleenkars.in";
  const canonicalUrl = `${siteUrl}/services/${service.slug}`;

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
            "item": siteUrl,
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Services",
            "item": `${siteUrl}/services`,
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": service.shortName,
            "item": canonicalUrl,
          },
        ],
      },
      {
        "@type": "Service",
        "@id": `${canonicalUrl}#service`,
        "name": service.name,
        "description": service.overview,
        "provider": {
          "@type": "AutomotiveBusiness",
          "name": "Kleenkars",
          "url": siteUrl,
          "telephone": "+91-8650007661",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Mustafa Market, Anoop Shahar Rd",
            "addressLocality": "Aligarh",
            "addressRegion": "Uttar Pradesh",
            "postalCode": "202001",
            "addressCountry": "IN",
          },
        },
        "areaServed": {
          "@type": "City",
          "name": "Aligarh",
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${canonicalUrl}#faq`,
        "mainEntity": service.faqs.map((faq) => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer,
          },
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

      <div className="max-w-5xl mx-auto space-y-12">
        {/* BREADCRUMBS */}
        <nav aria-label="Breadcrumb" className="text-xs text-gray-400 flex items-center gap-2">
          <Link href="/" className="hover:text-red-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/services" className="hover:text-red-400 transition-colors">
            Services
          </Link>
          <span>/</span>
          <span className="text-white font-semibold">{service.shortName}</span>
        </nav>

        {/* HERO SECTION */}
        <div className="grid md:grid-cols-2 gap-8 items-center border-b border-zinc-900 pb-12">
          <div className="space-y-6">
            <div className="inline-flex gap-2 items-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-red-400 bg-red-950/40 border border-red-500/20 px-3 py-1 rounded-full">
                Aligarh Detailing Service
              </span>
              <span className="text-xs text-gray-400">{service.priceRange}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              {service.name}
            </h1>

            <p className="text-gray-300 text-sm leading-relaxed">
              {service.tagline}
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/booking"
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition shadow-lg shadow-red-600/20"
              >
                Book {service.shortName} Online
              </Link>
              <a
                href="tel:8650007661"
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition"
              >
                Call +91 8650007661
              </a>
            </div>
          </div>

          <div className="relative aspect-[16/10] rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900">
            <Image
              src={service.heroImage}
              alt={`${service.name} in Aligarh`}
              fill
              priority
              className="object-cover"
            />
          </div>
        </div>

        {/* OVERVIEW & BENEFITS */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Overview</h2>
              <p className="text-gray-300 text-sm leading-relaxed">{service.overview}</p>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Key Benefits</h2>
              <ul className="grid gap-3">
                {service.benefits.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs text-gray-300">
                    <span className="text-red-500 font-bold">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 space-y-6 h-fit">
            <h3 className="text-lg font-bold text-white border-b border-zinc-800 pb-3">Ideal Choice For</h3>
            <ul className="space-y-3">
              {service.idealFor.map((item, idx) => (
                <li key={idx} className="text-xs text-gray-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block"></span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="pt-4 border-t border-zinc-900">
              <Link
                href="/booking"
                className="w-full block text-center bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition"
              >
                Reserve Slot Now
              </Link>
            </div>
          </div>
        </div>

        {/* STEP-BY-STEP PROCESS */}
        <div className="space-y-6 pt-6 border-t border-zinc-900">
          <h2 className="text-2xl font-bold text-white">Our {service.shortName} Detailing Process</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.processSteps.map((s) => (
              <div key={s.step} className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-3">
                <span className="text-xs font-black text-red-500 uppercase tracking-widest">{s.step}</span>
                <h3 className="text-base font-bold text-white">{s.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RELATED BLOG LINK BANNER */}
        {service.relatedBlogSlug && (
          <div className="p-6 rounded-2xl bg-zinc-950 border border-red-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-red-400 tracking-widest">In-Depth Detailing Guide</p>
              <h3 className="text-lg font-bold text-white">Want to learn more about {service.shortName}?</h3>
            </div>
            <Link
              href={`/blog/${service.relatedBlogSlug}`}
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl border border-zinc-700 transition"
            >
              Read Expert Guide →
            </Link>
          </div>
        )}

        {/* FAQS SECTION */}
        <div className="space-y-6 pt-6 border-t border-zinc-900">
          <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
          <div className="grid gap-4">
            {service.faqs.map((faq, idx) => (
              <div key={idx} className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-2">
                <h3 className="text-base font-bold text-white">{faq.question}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FINAL CTA BANNER */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-red-950/40 via-zinc-900 to-black border border-red-500/40 text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Experience Premium {service.shortName} in Aligarh
          </h2>
          <p className="text-gray-400 text-xs max-w-lg mx-auto">
            Doorstep pickup &amp; drop available across Aligarh. Book your slot online or call our detailing specialists today.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Link
              href="/booking"
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-xl transition"
            >
              Book Service Now
            </Link>
            <Link
              href="/packages"
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-xl transition"
            >
              Compare All Packages
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
