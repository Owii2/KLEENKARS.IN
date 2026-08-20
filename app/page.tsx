import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import { Metadata } from "next";
import { ChatBotWidget } from "@/components/ui/ChatBotWidget";
import { OfferModal } from "@/components/homepage/OfferModal";
import { ServicesGrid } from "@/components/homepage/ServicesGrid";
import { PriceEstimator } from "@/components/homepage/PriceEstimator";
import { prisma } from "@/lib/prisma";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Kleenkars — Premium Car Wash & Car Detailing Studio in Aligarh",
  description:
    "Top-rated car detailing & wash studio in Aligarh. Doorstep car wash, 9H Ceramic Coating, Paint Protection Film (PPF), Paint Correction, and Interior Spa with free pickup & drop.",
  alternates: {
    canonical: "https://kleenkars.in/",
  },
};

export default async function HomePage() {
  let featuredPrice = 399;
  try {
    const rainyDaySvc = await prisma.service.findFirst({
      where: {
        isActive: true,
        name: { contains: "Rainy Day", mode: "insensitive" },
      },
      orderBy: { price: "asc" },
    });
    if (rainyDaySvc) {
      featuredPrice = rainyDaySvc.price;
    }
  } catch (err) {
    console.error("Error fetching featured service price:", err);
  }
  const stats = [
    { label: "Google Rating", value: "5.0★" },
    { label: "Google Reviews", value: "16+" },
    { label: "Working Hours", value: "10AM–10PM" },
    { label: "Pickup & Drop", value: "Available" },
  ];

  const features = [
    {
      title: "Doorstep Pickup & Drop",
      description: "Convenient pickup from your home or office in Aligarh and a sparkling return.",
    },
    {
      title: "Pro-Grade Detailing Products",
      description: "pH-neutral shampoos, ceramic sealants, and safe interior steam cleaning.",
    },
    {
      title: "24/7 Easy Online Booking",
      description: "Instant slot reservation online with real-time confirmation.",
    },
  ];

  const reviews = [
    {
      name: "Faraz Ahmad",
      review:
        "It was really a good experience washing my car at Kleen Cars Aligarh. The staff are very kind and experienced.",
    },
    {
      name: "Ashish Kumar",
      review:
        "Amazing service. Awesome staff. It's my genuine review so please try them once. I have never seen in Aligarh this kind of cleaning service. They wash and clean every part of the car with responsibility and care.",
    },
    {
      name: "Hamid Ali",
      review:
        "Best car dry cleaning services in Aligarh. My car interior is brand new again. Thank you Kleenkars for the best customer service.",
    },
  ];

  const faqs = [
    {
      question: "Where is Kleenkars located in Aligarh?",
      answer:
        "Kleenkars is located at Mustafa Market, Anoop Shahar Rd, Aligarh, Uttar Pradesh. We also provide doorstep pickup and drop services across Aligarh.",
    },
    {
      question: "What car detailing services do you offer in Aligarh?",
      answer:
        "We specialize in premium foam car washing, interior deep cleaning & sanitization, 9H/10H ceramic coating, TPU paint protection film (PPF), dual-action paint correction, and alloy wheel & tyre dressing.",
    },
    {
      question: "Why should I choose Ceramic Coating for my car?",
      answer:
        "Ceramic coating creates a durable hydrophobic shield over your car's clear coat, protecting it against UV damage, acid rain, bird droppings, and oxidation while giving it a deep mirror shine.",
    },
    {
      question: "Do you offer doorstep car pickup and drop in Aligarh?",
      answer:
        "Yes! We offer hassle-free doorstep pickup and drop services throughout Aligarh so you don't have to wait in line.",
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AutomotiveBusiness",
        "@id": "https://kleenkars.in/#organization",
        "name": "Kleenkars",
        "legalName": "Kleenkars Car Detailing & Wash Studio",
        "url": "https://kleenkars.in",
        "logo": "https://kleenkars.in/logo.png",
        "image": "https://kleenkars.in/logo.png",
        "description":
          "Aligarh's premier car wash, car detailing, ceramic coating, paint protection film (PPF), and interior detailing studio with doorstep pickup and drop.",
        "telephone": "+91-8650007661",
        "priceRange": "₹₹",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Mustafa Market, Anoop Shahar Rd",
          "addressLocality": "Aligarh",
          "addressRegion": "Uttar Pradesh",
          "postalCode": "202001",
          "addressCountry": "IN",
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 27.9152,
          "longitude": 78.0778,
        },
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "10:00",
            "closes": "22:00",
          },
        ],
        "areaServed": [
          { "@type": "City", "name": "Aligarh" },
          { "@type": "AdministrativeArea", "name": "Uttar Pradesh" },
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "5.0",
          "reviewCount": "16",
          "bestRating": "5",
          "worstRating": "1",
        },
      },
      {
        "@type": "FAQPage",
        "@id": "https://kleenkars.in/#faq",
        "mainEntity": faqs.map((faq) => ({
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
    <div className="bg-black text-white min-h-screen relative">
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <OfferModal />

      <main>
        {/* HERO SECTION */}
        <section className={`${styles.heroSection} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,45,45,0.2),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.08),_transparent_30%)]" />
          <div className="main-container relative">
            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
              <div className="space-y-8">
                <div className="inline-flex flex-wrap gap-3 items-center">
                  <span className="text-sm uppercase tracking-[0.3em] text-red-400 bg-white/5 rounded-full px-4 py-2 font-semibold">
                    Premium Detailing Studio
                  </span>
                  <span className="text-sm text-gray-400">Top Rated in Aligarh, UP</span>
                </div>

                <div className="space-y-5">
                  <p className="text-red-500 text-sm uppercase tracking-[0.35em] font-bold">
                    Aligarh&apos;s #1 Car Wash &amp; Detailing Experts
                  </p>
                  <h1 className={`${styles.heroTitle} max-w-3xl font-black`}>
                    Premium Car Wash &amp; Car Detailing in Aligarh.
                  </h1>
                  <p className={`${styles.heroSubtitle} max-w-2xl text-gray-300 leading-relaxed`}>
                    Experience showroom-grade detailing with doorstep pickup &amp; drop in Aligarh. Specializing in 9H Ceramic Coating, Paint Protection Film (PPF), Paint Correction, and Interior Deep Clean.
                  </p>
                </div>

                <div className={`${styles.heroCta}`}>
                  <Link href="/booking" className={styles.primaryBtn}>
                    Book Service Now
                  </Link>
                  <a href="tel:8650007661" className={styles.secondaryBtn}>
                    Call +91 8650007661
                  </a>
                  <Link href="/packages" className={styles.franchiseBtn}>
                    Explore Packages
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className={`${styles.heroPanel}`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent blur-3xl" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-sm text-gray-400 uppercase tracking-[0.35em]">Featured Service</p>
                        <h2 className="text-2xl font-bold mt-3 text-white">Rainy Day Shine Package</h2>
                      </div>
                      <span className="text-red-500 font-black text-xl">₹{featuredPrice}</span>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-3xl overflow-hidden border border-gray-800 bg-[#090909]">
                        <Image
                          src="/rainyday.png"
                          alt="Rainy Day Shine Car Wash Service in Aligarh"
                          width={560}
                          height={350}
                          priority
                          style={{ width: "100%", height: "auto" }}
                        />
                      </div>
                      <p className="text-gray-300 text-sm">
                        A specialized hydrophobia sealant package built on top of our Premium Wash for long-lasting water repellency during rainy seasons.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <span className="pill">Quick Turnaround</span>
                        <span className="pill">Doorstep Pickup</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES SECTION */}
        <section className="main-container py-8 sm:py-12 lg:py-16" id="services">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
            <div>
              <p className="text-red-400 uppercase tracking-[0.35em] font-semibold mb-3">Our Services &amp; Packages</p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black">Professional Detailing for Every Vehicle in Aligarh</h2>
            </div>
            <Link href="/packages" className={styles.secondaryBtn}>
              View All Detailed Packages
            </Link>
          </div>

          <ServicesGrid />
        </section>

        {/* FEATURES & STATS */}
        <section className="bg-[#050505] py-8 sm:py-12 lg:py-16 border-y border-zinc-900">
          <div className="main-container">
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {features.map((feature) => (
                <div key={feature.title} className={`${styles.featureCard}`}>
                  <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((item) => (
                <div key={item.label} className={`${styles.statCard} p-6`}>
                  <div className="text-sm uppercase tracking-[0.3em] text-gray-500 mb-4">{item.label}</div>
                  <div className="text-3xl font-black text-red-500">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SEO CONTENT OVERVIEW SECTION */}
        <section className="main-container py-8 sm:py-12 lg:py-16 space-y-12">
          <div className="max-w-4xl mx-auto space-y-6 text-gray-300 leading-relaxed">
            <p className="text-red-400 uppercase tracking-[0.35em] font-semibold text-center">Comprehensive Auto Care</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white text-center">
              Why Kleenkars is Aligarh&apos;s Preferred Car Detailing Studio
            </h2>
            <p>
              At <strong>Kleenkars</strong>, located on <em>Anoop Shahar Rd (Mustafa Market), Aligarh</em>, we combine state-of-the-art car care technology with expert craftsmanship. Whether your vehicle requires a quick exterior foam wash or advanced multi-stage paint restoration, our team delivers uncompromised quality.
            </p>
            <div className="grid md:grid-cols-2 gap-8 pt-4">
              <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-3 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">9H &amp; 10H Ceramic Coating</h3>
                  <p className="text-sm text-gray-400 mt-2">
                    Protect your vehicle from Aligarh&apos;s harsh sunlight, industrial dust, and hard water spots. Ceramic coatings bond chemically to your paint, forming a glassy, hydrophobic shield that lasts for years.
                  </p>
                </div>
                <Link href="/services/ceramic-coating" className="text-xs font-bold text-red-500 hover:text-red-400 transition pt-2 inline-block">
                  Explore Ceramic Coating →
                </Link>
              </div>

              <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-3 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">TPU Paint Protection Film (PPF)</h3>
                  <p className="text-sm text-gray-400 mt-2">
                    Shield your luxury car from rock chips, minor scratches, and road debris with self-healing ultra-clear thermoplastic polyurethane PPF.
                  </p>
                </div>
                <Link href="/services/paint-protection-film" className="text-xs font-bold text-red-500 hover:text-red-400 transition pt-2 inline-block">
                  Explore PPF Protection →
                </Link>
              </div>

              <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-3 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Interior Deep Clean &amp; Steam Spa</h3>
                  <p className="text-sm text-gray-400 mt-2">
                    Eliminate deep-seated dust, upholstery stains, bacteria, and odours with high-temperature interior steam cleaning, leather conditioning, and AC duct sanitization.
                  </p>
                </div>
                <Link href="/services/interior-detailing" className="text-xs font-bold text-red-500 hover:text-red-400 transition pt-2 inline-block">
                  Explore Interior Spa →
                </Link>
              </div>

              <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-3 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Dual-Action Paint Correction</h3>
                  <p className="text-sm text-gray-400 mt-2">
                    Safely eliminate swirl marks, light scratches, oxidation, and buffer trails using dual-action polishers and safe compound formulations.
                  </p>
                </div>
                <Link href="/services/paint-correction" className="text-xs font-bold text-red-500 hover:text-red-400 transition pt-2 inline-block">
                  Explore Paint Correction →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* GALLERY SECTION */}
        <section className="main-container py-8 sm:py-12 lg:py-16 border-t border-zinc-900">
          <div className="text-center mb-12">
            <p className="text-red-400 uppercase tracking-[0.35em] font-semibold mb-3">Spotless Results</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black">Before &amp; After Detailing Gallery</h2>
            <p className="text-gray-400 max-w-2xl mx-auto mt-3 text-sm">
              Explore recent detailing transformations carried out at our Aligarh studio.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {[
              { title: "Ceramic Coating Finish", image: "/ceramic.png" },
              { title: "Interior Deep Clean", image: "/deepclean.png" },
              { title: "Tyre & Rim Detailing", image: "/tyre&rim.png" },
              { title: "Full Vehicle Detailing", image: "/full_detailing.png" },
            ].map((item) => (
              <div key={item.title} className={`${styles.galleryCard} overflow-hidden`}>
                <div className="overflow-hidden rounded-[1.2rem] border border-gray-800">
                  <Image
                    src={item.image}
                    alt={`${item.title} at Kleenkars Aligarh`}
                    width={320}
                    height={200}
                    style={{ width: "100%", height: "auto" }}
                  />
                </div>
                <h3 className="mt-4 text-lg sm:text-xl font-semibold text-white">{item.title}</h3>
                <p className="text-gray-400 mt-2 text-xs sm:text-sm">Professional care and finish for showroom-level results.</p>
              </div>
            ))}
          </div>
        </section>

        {/* REVIEWS SECTION */}
        <section className="bg-[#0a0a0a] py-8 sm:py-12 lg:py-16 border-t border-zinc-900">
          <div className="main-container">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-10">
              <div>
                <p className="text-red-400 uppercase tracking-[0.35em] font-semibold mb-3">Client Feedback</p>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black">5.0 Star Google Reviews in Aligarh</h2>
              </div>
              <Link href="/booking" className={styles.primaryBtn}>
                Book Your Service
              </Link>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <div key={review.name} className={`${styles.reviewCard} p-6`}>
                  <div className="text-yellow-400 mb-4">★★★★★</div>
                  <p className="text-gray-300 mb-5 text-sm leading-relaxed">&quot;{review.review}&quot;</p>
                  <div className="text-white font-bold text-sm">{review.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICE ESTIMATOR CALCULATOR SECTION */}
        <section className="main-container py-8 sm:py-12 lg:py-16 border-t border-zinc-900" id="estimator">
          <PriceEstimator />
        </section>

        {/* FAQS SECTION */}
        <section className="main-container py-8 sm:py-12 lg:py-16 border-t border-zinc-900" id="faq">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <p className="text-red-400 uppercase tracking-[0.35em] font-semibold text-xs sm:text-sm">Got Questions?</p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black">Frequently Asked Questions</h2>
            </div>

            <div className="grid gap-4 sm:gap-6">
              {faqs.map((faq) => (
                <div key={faq.question} className="bg-zinc-950 p-5 sm:p-6 rounded-2xl border border-zinc-800 space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-white">{faq.question}</h3>
                  <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MAP & LOCATION SECTION */}
        <section className="main-container py-8 sm:py-12 lg:py-16 border-t border-zinc-900">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <p className="text-red-400 uppercase tracking-[0.35em] font-semibold text-xs sm:text-sm">Visit Our Studio</p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black">Find Kleenkars in Aligarh</h2>
              <p className="text-gray-400 max-w-xl leading-relaxed text-sm">
                We are located conveniently at <strong>Mustafa Market, Anoop Shahar Rd, Aligarh, UP 202001</strong>. Book online and let our team handle your vehicle with extreme precision and care.
              </p>
              <div className="pt-2">
                <Link
                  href="https://www.google.com/maps/dir/?api=1&destination=W3VP%2BV5%2C+Aligarh%2C+Uttar+Pradesh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.primaryBtn}
                >
                  Get Driving Directions
                </Link>
              </div>
            </div>
            <div className={styles.mapContainer}>
              <iframe
                src="https://www.google.com/maps?q=W3VP%2BV5%2C+Aligarh%2C+Uttar+Pradesh&z=17&output=embed"
                width="100%"
                height="420"
                loading="lazy"
                title="Kleenkars Location in Aligarh"
                className="border-0"
              />
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-gray-900 py-10">
          <div className="main-container flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className={styles.footerBrand}>Kleenkars</div>
              <p className="text-gray-400 text-sm">Aligarh&apos;s premium doorstep car wash &amp; detailing studio.</p>
            </div>

            <div className="flex flex-wrap gap-6 text-sm text-gray-400">
              <Link href="/services" className="hover:text-red-500 transition-colors duration-200">
                Services
              </Link>
              <Link href="/booking" className="hover:text-red-500 transition-colors duration-200">
                Book Service
              </Link>
              <Link href="/packages" className="hover:text-red-500 transition-colors duration-200">
                Packages
              </Link>
              <Link href="/blog" className="hover:text-red-500 transition-colors duration-200">
                Blog
              </Link>
              <Link href="/franchise" className="hover:text-red-500 transition-colors duration-200">
                Franchise
              </Link>
              <Link href="/privacy" className="hover:text-red-500 transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-red-500 transition-colors duration-200">
                Terms of Service
              </Link>
              <Link href="/refunds" className="hover:text-red-500 transition-colors duration-200">
                Refund Policy
              </Link>
              <Link href="/customer/login" className="hover:text-red-500 transition-colors duration-200">
                Customer Login
              </Link>
              <Link href="/login" className="hover:text-red-500 transition-colors duration-200">
                Staff Login
              </Link>
            </div>
          </div>
        </footer>
      </main>
      <ChatBotWidget />
    </div>
  );
}
