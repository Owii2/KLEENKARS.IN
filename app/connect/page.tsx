"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Star,
  MessageCircle,
  Phone,
  Calendar,
  Sparkles,
  Car,
  Globe,
  ShieldCheck,
  Tag,
  ExternalLink,
  Share2,
  Copy,
  Check,
  Clock,
  Camera,
  Video,
} from "lucide-react";

// Clean lightweight brand SVGs
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <polygon points="10 15 15 12 10 9 10 15" fill="currentColor" />
  </svg>
);

interface HubLink {
  id: string;
  title: string;
  subtitle: string | null;
  url: string;
  icon: string | null;
  badge: string | null;
  bgColor: string | null;
  textColor: string | null;
  isFeatured: boolean;
  isActive: boolean;
  order: number;
}

export default function ConnectPage() {
  const [links, setLinks] = useState<HubLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/hub-links")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLinks(data.links);
        }
      })
      .catch((err) => console.error("Error fetching hub links:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleLinkClick = (id: string) => {
    fetch(`/api/hub-links/${id}/click`, { method: "POST" }).catch(() => {});
  };

  const handleShare = async () => {
    const shareData = {
      title: "Kleenkars — Premium Detailing Hub",
      text: "Explore Kleenkars Aligarh links, location, reviews, and instant bookings.",
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderIcon = (iconName: string | null) => {
    const iconClass = "w-5 h-5 flex-shrink-0";
    switch (iconName?.toLowerCase()) {
      case "map-pin":
      case "location":
        return <MapPin className={`${iconClass} text-red-500`} />;
      case "star":
      case "review":
        return <Star className={`${iconClass} text-amber-400 fill-amber-400`} />;
      case "message-circle":
      case "whatsapp":
        return <MessageCircle className={`${iconClass} text-emerald-400`} />;
      case "phone":
      case "call":
        return <Phone className={`${iconClass} text-cyan-400`} />;
      case "calendar":
      case "booking":
        return <Calendar className={`${iconClass} text-red-400`} />;
      case "sparkles":
      case "packages":
        return <Sparkles className={`${iconClass} text-yellow-400`} />;
      case "car":
      case "portal":
        return <Car className={`${iconClass} text-indigo-400`} />;
      case "instagram":
        return <InstagramIcon className={`${iconClass} text-pink-500`} />;
      case "facebook":
        return <FacebookIcon className={`${iconClass} text-blue-500`} />;
      case "youtube":
        return <YoutubeIcon className={`${iconClass} text-red-600`} />;
      case "shield":
      case "shield-check":
        return <ShieldCheck className={`${iconClass} text-green-400`} />;
      case "tag":
      case "offers":
        return <Tag className={`${iconClass} text-orange-400`} />;
      case "camera":
        return <Camera className={`${iconClass} text-purple-400`} />;
      case "video":
        return <Video className={`${iconClass} text-red-400`} />;
      case "globe":
      default:
        return <Globe className={`${iconClass} text-zinc-300`} />;
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-start px-4 py-8 sm:py-12 relative overflow-x-hidden selection:bg-red-600 selection:text-white">
      {/* Background Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[350px] bg-gradient-to-b from-red-600/15 via-red-900/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-80 h-80 bg-red-950/10 blur-3xl pointer-events-none -z-10" />

      {/* Top Header Controls */}
      <div className="w-full max-w-md flex items-center justify-between mb-4">
        <Link
          href="/"
          className="text-[11px] font-mono text-gray-400 hover:text-white flex items-center gap-1.5 transition"
        >
          <span>←</span> Back to Website
        </Link>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-[11px] font-mono text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full transition active:scale-95"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 font-bold">Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Hub</span>
            </>
          )}
        </button>
      </div>

      <div className="w-full max-w-md flex flex-col items-center">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-900 rounded-3xl blur opacity-70 group-hover:opacity-100 transition duration-500" />
            <div className="relative w-20 h-20 bg-black border-2 border-red-600/60 rounded-2xl overflow-hidden p-2.5 flex items-center justify-center shadow-2xl shadow-red-950/60">
              <Image
                src="/logo.png"
                alt="Kleenkars Logo"
                width={70}
                height={70}
                priority
                className="object-contain"
              />
            </div>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>KLEENKARS</span>
            <span className="bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest shadow-sm">
              Official
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">
            Premium Car Detailing, 9H Ceramic Studio &amp; Doorstep Wash in Aligarh
          </p>

          {/* Verification & Trust Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5">
            <a
              href="https://search.google.com/local/writereview?placeid=ChIJywrV6LzBvzkRxD3-Kk8eXy4"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-bold px-3 py-1 rounded-full hover:bg-amber-500/20 transition"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>5.0 ★ Google Rating (16+ Reviews)</span>
            </a>
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-mono px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Studio Open Today (10 AM - 10 PM)</span>
            </div>
          </div>
        </div>

        {/* Quick Action Dock */}
        <div className="w-full grid grid-cols-4 gap-2 mb-6">
          <a
            href="https://maps.google.com/?q=Kleenkars+Mustafa+Market+Anoop+Shahar+Road+Aligarh"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center bg-[#0d0d0d] hover:bg-zinc-900 border border-zinc-800 hover:border-red-500/50 p-2.5 rounded-2xl transition active:scale-95 text-center group"
          >
            <div className="w-9 h-9 rounded-xl bg-red-600/10 group-hover:bg-red-600/20 border border-red-600/20 flex items-center justify-center mb-1 text-red-500 transition">
              <MapPin className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-gray-300 group-hover:text-white">Maps</span>
          </a>

          <a
            href="https://wa.me/918650007661?text=Hi%20Kleenkars%2C%20I%20scanned%20the%20QR%20code%20and%20would%20like%20to%20inquire%20about%20detailing."
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center bg-[#0d0d0d] hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 p-2.5 rounded-2xl transition active:scale-95 text-center group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 group-hover:bg-emerald-600/20 border border-emerald-600/20 flex items-center justify-center mb-1 text-emerald-400 transition">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-gray-300 group-hover:text-white">WhatsApp</span>
          </a>

          <a
            href="tel:+918650007661"
            className="flex flex-col items-center justify-center bg-[#0d0d0d] hover:bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 p-2.5 rounded-2xl transition active:scale-95 text-center group"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-600/10 group-hover:bg-cyan-600/20 border border-cyan-600/20 flex items-center justify-center mb-1 text-cyan-400 transition">
              <Phone className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-gray-300 group-hover:text-white">Call</span>
          </a>

          <a
            href="https://search.google.com/local/writereview?placeid=ChIJywrV6LzBvzkRxD3-Kk8eXy4"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center bg-[#0d0d0d] hover:bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 p-2.5 rounded-2xl transition active:scale-95 text-center group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-600/10 group-hover:bg-amber-600/20 border border-amber-600/20 flex items-center justify-center mb-1 text-amber-400 transition">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <span className="text-[10px] font-bold text-gray-300 group-hover:text-white">Review</span>
          </a>
        </div>

        {/* Dynamic Link Buttons List */}
        <div className="w-full space-y-3">
          {loading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 animate-pulse"
                />
              ))}
            </div>
          ) : links.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-xs">
              No active links configured.
            </div>
          ) : (
            links.map((link) => {
              const isExternal = link.url.startsWith("http") || link.url.startsWith("tel:") || link.url.startsWith("mailto:");
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target={isExternal && !link.url.startsWith("tel:") ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  onClick={() => handleLinkClick(link.id)}
                  className={`group relative w-full p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 text-left active:scale-[0.99] shadow-lg ${
                    link.isFeatured
                      ? "bg-gradient-to-r from-zinc-900 via-[#131313] to-red-950/20 border-red-600/40 hover:border-red-500 hover:shadow-red-600/10 ring-1 ring-red-600/20"
                      : "bg-[#0c0c0c] hover:bg-[#141414] border-zinc-800 hover:border-zinc-700"
                  }`}
                  style={{
                    backgroundColor: link.bgColor || undefined,
                    color: link.textColor || undefined,
                  }}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      {renderIcon(link.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors truncate">
                          {link.title}
                        </h2>
                      </div>
                      {link.subtitle && (
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">
                          {link.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {link.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950/60 border border-red-500/30 text-red-300 whitespace-nowrap">
                        {link.badge}
                      </span>
                    )}
                    <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                  </div>
                </a>
              );
            })
          )}
        </div>

        {/* Studio Location Card */}
        <div className="w-full mt-6 p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 flex-shrink-0 mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-1">
              <div className="font-bold text-white">Aligarh Studio &amp; Workshop</div>
              <div className="text-gray-400 leading-relaxed">
                Mustafa Market, Anoop Shahar Road, Aligarh, Uttar Pradesh 202001
              </div>
              <div className="text-[10px] text-gray-500 flex items-center gap-1 font-mono pt-0.5">
                <Clock className="w-3 h-3 text-red-400" />
                <span>Mon – Sun: 10:00 AM – 10:00 PM</span>
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-zinc-900 flex gap-2">
            <a
              href="https://maps.google.com/?q=Kleenkars+Mustafa+Market+Anoop+Shahar+Road+Aligarh"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 rounded-xl transition"
            >
              Open in Google Maps
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText("Mustafa Market, Anoop Shahar Road, Aligarh, Uttar Pradesh 202001");
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-gray-300 rounded-xl text-xs flex items-center gap-1 transition"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center space-y-2 pb-6">
          <p className="text-[11px] text-gray-500">
            © {new Date().getFullYear()} Kleenkars. All Rights Reserved.
          </p>
          <p className="text-[10px] font-mono text-zinc-600">
            Fast, Reliable &amp; Transparent Automotive Detailing
          </p>
        </footer>
      </div>
    </main>
  );
}
