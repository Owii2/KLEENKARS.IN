"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

export function OfferModal() {
  const [activeOffer, setActiveOffer] = useState<Offer | null>(null);
  const [showOfferPopup, setShowOfferPopup] = useState(false);

  useEffect(() => {
    const hasSeenOffer = sessionStorage.getItem("offerPopupSeen");

    if (!hasSeenOffer) {
      fetch("/api/offers")
        .then((res) => res.json() as Promise<OffersResponse>)
        .then((data) => {
          if (data.success && data.offers && data.offers.length > 0) {
            const offerWithImage = data.offers.find(
              (o) => o.isActive && o.imageUrl
            );

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

  if (!showOfferPopup || !activeOffer) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative bg-zinc-900 border border-red-500/50 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-red-500/20 animate-in fade-in zoom-in duration-300">
        <button
          onClick={closeOfferPopup}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-red-600 text-white w-8 h-8 flex items-center justify-center rounded-full transition"
          aria-label="Close offer modal"
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
            <Link
              href="/booking"
              onClick={closeOfferPopup}
              className="inline-block bg-red-600 hover:bg-red-700 font-bold px-8 py-3 rounded-xl transition text-white"
            >
              Claim Offer Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
