"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import { useEffect, useState } from "react";

interface Offer {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
}

interface OffersResponse {
  success: boolean;
  offers?: Offer[];
}

export default function HomePage() {
  const [activeOffer, setActiveOffer] = useState<Offer | null>(null);
  const [showOfferPopup, setShowOfferPopup] = useState(false);

  useEffect(() => {
    // Check if offer popup was already shown in this session
    const hasSeenOffer = sessionStorage.getItem("offerPopupSeen");
    
    if (!hasSeenOffer) {
      // Fetch active offers
      fetch("/api/offers")
        .then(res => res.json() as Promise<OffersResponse>)
        .then(data => {
          if (data.success && data.offers && data.offers.length > 0) {
            // Find the first active offer that has an image poster
            const offerWithImage = data.offers.find((o) => o.isActive && o.imageUrl);
            if (offerWithImage) {
              setActiveOffer(offerWithImage);
              setShowOfferPopup(true);
            }
          }
        })
        .catch(console.error);
    }
  }, []);

  const closeOfferPopup = () => {
    setShowOfferPopup(false);
    sessionStorage.setItem("offerPopupSeen", "true");
  };

  const services = [
    { title: "Express Wash", price: "₹149", description: "Fast exterior wash to keep your car shining daily." },
    { title: "Classic Wash", price: "₹199", description: "Full exterior + interior vacuum for a spotless ride." },
    { title: "Premium Wash", price: "₹299", description: "Deep clean, polish, tyre shine & fragrance finish." },
  ];

  const stats = [
    { label: "Google Rating", value: "5.0★" },
    { label: "Google Reviews", value: "16+" },
    { label: "Working Hours", value: "10AM-10PM" },
    { label: "Pickup & Drop", value: "Available" },
  ];

  const features = [
    { title: "Doorstep Service", description: "We come to you and deliver a sparkling car." },
    { title: "Premium Products", description: "Safe, high-grade cleaning products for every finish." },
    { title: "24/7 Booking", description: "Fast online booking with instant confirmation." },
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

  return (
    <div className="bg-black text-white min-h-screen relative">
      
      {/* OFFER POPUP MODAL */}
      {showOfferPopup && activeOffer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative bg-zinc-900 border border-red-500/50 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-red-500/20 animate-in fade-in zoom-in duration-300">
            <button 
              onClick={closeOfferPopup}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-red-600 text-white w-8 h-8 flex items-center justify-center rounded-full transition"
            >
              ✕
            </button>
            <div className="relative aspect-auto max-h-[60vh] overflow-hidden bg-black flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={activeOffer.imageUrl} 
                alt={activeOffer.title} 
                className="w-full h-auto object-contain max-h-[60vh]"
              />
            </div>
            <div className="p-6 text-center space-y-4">
              <h2 className="text-2xl font-black text-white">{activeOffer.title}</h2>
              {activeOffer.description && (
                <p className="text-gray-400">{activeOffer.description}</p>
              )}
              <div className="pt-2">
                <Link href="/booking" onClick={closeOfferPopup} className="inline-block bg-red-600 hover:bg-red-700 font-bold px-8 py-3 rounded-xl transition">
                  Claim Offer Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <main>
        <section className={`${styles.heroSection} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,45,45,0.2),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.08),_transparent_30%)]" />
          <div className="main-container relative">
            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
              <div className="space-y-8">
                <div className="inline-flex flex-wrap gap-3 items-center">
                  <span className="text-sm uppercase tracking-[0.3em] text-red-400 bg-white/5 rounded-full px-4 py-2">Premium Detailing</span>
                  <span className="text-sm text-gray-400">Trusted by Aligarh drivers</span>
                </div>

                <div className="space-y-5">
                  <p className="text-red-500 text-sm uppercase tracking-[0.35em] font-bold">Now serving local customers</p>
                  <h1 className={`${styles.heroTitle} max-w-3xl font-black`}>
                    Glossy car care for every ride, delivered to your doorstep.
                  </h1>
                  <p className={`${styles.heroSubtitle} max-w-2xl`}>
                    Experience premium wash and detailing with pickup & drop, pro-grade products, and a spotless finish every time.
                  </p>
                </div>

                <div className={`${styles.heroCta}`}>
                  <Link href="/booking" className={styles.primaryBtn}>Book Now</Link>
                  <a href="tel:8650007661" className={styles.secondaryBtn}>Call Now</a>
                  <Link href="/franchise" className={styles.franchiseBtn}>Franchise Opportunity</Link>
                </div>
              </div>

              <div className="relative">
                <div className={`${styles.heroPanel}`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent blur-3xl" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-sm text-gray-400 uppercase tracking-[0.35em]">Featured Service</p>
                        <h2 className="text-2xl font-bold mt-3">Rainy Day Shine</h2>
                      </div>
                      <span className="text-red-500 font-black text-xl">₹399</span>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-3xl overflow-hidden border border-gray-800 bg-[#090909]">
                        <Image src="/rainyday.png" alt="Rainy Day Shine service" width={560} height={350} style={{ width: "100%", height: "auto" }} />
                      </div>
                      <p className="text-gray-300">A premium add-on package built on top of Premium Wash for the perfect glossy finish.</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <span className="pill">Quick Turnaround</span>
                        <span className="pill">Pickup & Drop</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="main-container py-16">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
            <div>
              <p className="text-red-400 uppercase tracking-[0.35em] font-semibold mb-3">Our Packages</p>
              <h2 className="text-4xl font-black">Choose the service that fits your car.</h2>
            </div>
            <Link href="/booking" className={styles.secondaryBtn}>View all packages</Link>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {services.map((item) => (
              <div key={item.title} className={`${styles.serviceCard} p-8`}>
                <div className="mb-4">
                  <h3 className="text-2xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
                <div className="flex items-center justify-between gap-4 mt-6">
                  <span className="text-3xl font-black text-red-500">{item.price}</span>
                  <Link href="/booking" className={styles.primaryBtn}>Book now</Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#050505] py-16">
          <div className="main-container">
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {features.map((feature) => (
                <div key={feature.title} className={`${styles.featureCard}`}>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
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

        <section className="main-container py-16">
          <div className="text-center mb-12">
            <p className="text-red-400 uppercase tracking-[0.35em] font-semibold mb-3">Spotless results</p>
            <h2 className="text-4xl font-black">Before & After Gallery</h2>
            <p className="text-gray-400 max-w-2xl mx-auto mt-3">See the transformations from our premium car detailing packages.</p>
          </div>

          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {[
              { title: "Ceramic Finish", image: "/ceramic.png" },
              { title: "Deep Clean", image: "/deepclean.png" },
              { title: "Tyre & Rim", image: "/tyre&rim.png" },
              { title: "Full Detailing", image: "/full_detailing.png" },
            ].map((item) => (
              <div key={item.title} className={`${styles.galleryCard} overflow-hidden`}>
                <div className="overflow-hidden rounded-[1.2rem] border border-gray-800">
                  <Image src={item.image} alt={item.title} width={320} height={200} style={{ width: "100%", height: "auto" }} />
                </div>
                <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                <p className="text-gray-400 mt-2">Premium care and finish for showroom-level results.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#0a0a0a] py-16">
          <div className="main-container">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-10">
              <div>
                <p className="text-red-400 uppercase tracking-[0.35em] font-semibold mb-3">Client Feedback</p>
                <h2 className="text-4xl font-black">Google Reviews from happy customers</h2>
              </div>
              <Link href="/booking" className={styles.primaryBtn}>Book Your Wash</Link>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <div key={review.name} className={`${styles.reviewCard} p-6`}>
                  <div className="text-yellow-400 mb-4">★★★★★</div>
                  <p className="text-gray-300 mb-5">&quot;{review.review}&quot;</p>
                  <div className="text-white font-bold">{review.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="main-container py-16">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <p className="text-red-400 uppercase tracking-[0.35em] font-semibold">Visit our location</p>
              <h2 className="text-4xl font-black">Find Kleenkars in Aligarh</h2>
              <p className="text-gray-400 max-w-xl">We’re located at Mustafa Market, Anoop Shahar Rd. Book online and let us handle the rest with premium wash and detailing.</p>
              <Link href="https://www.google.com/maps/dir/?api=1&destination=W3VP%2BV5%2C+Aligarh%2C+Uttar+Pradesh" target="_blank" rel="noopener noreferrer" className={styles.primaryBtn}>Get Directions</Link>
            </div>
            <div className={styles.mapContainer}>
              <iframe src="https://www.google.com/maps?q=W3VP%2BV5%2C+Aligarh%2C+Uttar+Pradesh&z=17&output=embed" width="100%" height="420" loading="lazy" className="border-0" />
            </div>
          </div>
        </section>

        <footer className="border-t border-gray-900 py-10">
          <div className="main-container flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className={styles.footerBrand}>Kleenkars</div>
              <p className="text-gray-400">Premium doorstep car wash and detailing service.</p>
            </div>

            <div className="flex flex-wrap gap-4 text-gray-400">
              <Link href="/booking">Book Service</Link>
              <Link href="/login">Staff Login</Link>
              <Link href="/franchise">Franchise</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
