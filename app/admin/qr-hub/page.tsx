"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Card from "@/components/ui/Card";
import Image from "next/image";
import QRCode from "qrcode";
import {
  QrCode,
  Download,
  Printer,
  Copy,
  Check,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Sparkles,
  MapPin,
  Star,
  MessageCircle,
  Phone,
  Calendar,
  Car,
  Globe,
  ShieldCheck,
  Tag,
  MousePointerClick,
  Layers,
  RefreshCw,
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
  clicksCount: number;
}

const AVAILABLE_ICONS = [
  { id: "map-pin", label: "Map / Location", component: MapPin },
  { id: "star", label: "5-Star Review", component: Star },
  { id: "message-circle", label: "WhatsApp Chat", component: MessageCircle },
  { id: "phone", label: "Phone Call", component: Phone },
  { id: "calendar", label: "Booking Slot", component: Calendar },
  { id: "sparkles", label: "Packages & Detailing", component: Sparkles },
  { id: "car", label: "Customer Car Portal", component: Car },
  { id: "globe", label: "Website", component: Globe },
  { id: "instagram", label: "Instagram", component: InstagramIcon },
  { id: "facebook", label: "Facebook", component: FacebookIcon },
  { id: "youtube", label: "YouTube", component: YoutubeIcon },
  { id: "shield", label: "Warranty / Shield", component: ShieldCheck },
  { id: "tag", label: "Offers / Discounts", component: Tag },
  { id: "camera", label: "Photos / Gallery", component: Camera },
  { id: "video", label: "Video / Reels", component: Video },
];

export default function QrHubAdminPage() {
  const [links, setLinks] = useState<HubLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    url: "",
    icon: "globe",
    badge: "",
    isFeatured: false,
    isActive: true,
  });

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hub-links?all=true");
      const data = await res.json();
      if (data.success) {
        setLinks(data.links);
      }
    } catch (err) {
      console.error("Error fetching hub links:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
    // Generate QR Code for /connect
    QRCode.toDataURL(
      "https://kleenkars.in/connect",
      {
        width: 600,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      },
      (err, url) => {
        if (!err && url) setQrDataUrl(url);
      }
    );
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      title: "",
      subtitle: "",
      url: "",
      icon: "globe",
      badge: "",
      isFeatured: false,
      isActive: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (link: HubLink) => {
    setEditingId(link.id);
    setForm({
      title: link.title,
      subtitle: link.subtitle || "",
      url: link.url,
      icon: link.icon || "globe",
      badge: link.badge || "",
      isFeatured: link.isFeatured,
      isActive: link.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.url.trim()) {
      alert("Title and URL are required.");
      return;
    }

    try {
      if (editingId) {
        const res = await fetch(`/api/hub-links/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (data.success) {
          setShowModal(false);
          await fetchLinks();
          alert("✅ Link updated successfully!");
        } else {
          alert(data.message || "Failed to update link.");
        }
      } else {
        const res = await fetch("/api/hub-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (data.success) {
          setShowModal(false);
          await fetchLinks();
          alert("✅ Link created successfully!");
        } else {
          alert(data.message || "Failed to create link.");
        }
      }
    } catch (err) {
      console.error("Error saving link:", err);
      alert("Network error saving link.");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const res = await fetch(`/api/hub-links/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await fetchLinks();
        alert("✅ Link deleted successfully!");
      }
    } catch (err) {
      console.error("Error deleting link:", err);
    }
  };

  const handleToggleActive = async (link: HubLink) => {
    try {
      const res = await fetch(`/api/hub-links/${link.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !link.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setLinks((prev) =>
          prev.map((l) => (l.id === link.id ? { ...l, isActive: !l.isActive } : l))
        );
      }
    } catch (err) {
      console.error("Error toggling active status:", err);
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const newLinks = [...links];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLinks.length) return;

    const temp = newLinks[index];
    newLinks[index] = newLinks[targetIndex];
    newLinks[targetIndex] = temp;

    const payload = newLinks.map((item, idx) => ({
      id: item.id,
      order: idx + 1,
    }));

    setLinks(newLinks);

    try {
      await fetch("/api/hub-links/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });
    } catch (err) {
      console.error("Error reordering:", err);
      fetchLinks();
    }
  };

  const downloadQrPng = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = "kleenkars-connect-qr.png";
    link.href = qrDataUrl;
    link.click();
  };

  const printStandee = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kleenkars Studio QR Standee</title>
          <style>
            @page { size: A5 portrait; margin: 10mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              background: #ffffff;
              color: #000000;
            }
            .card {
              border: 3px solid #dc2626;
              border-radius: 24px;
              padding: 36px 24px;
              max-width: 380px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }
            .logo { font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #dc2626; margin-bottom: 4px; }
            .tagline { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 24px; }
            .qr-wrapper {
              background: #fff;
              padding: 16px;
              border-radius: 20px;
              border: 2px dashed #dc2626;
              display: inline-block;
              margin-bottom: 20px;
            }
            .qr-img { width: 220px; height: 220px; display: block; }
            .scan-text { font-size: 16px; font-weight: 800; color: #111; margin-bottom: 6px; }
            .sub-text { font-size: 12px; color: #555; line-height: 1.4; margin-bottom: 16px; }
            .badges { display: flex; justify-content: center; gap: 8px; font-size: 10px; font-weight: 700; }
            .badge { background: #fee2e2; color: #dc2626; padding: 4px 10px; border-radius: 12px; }
            .url { font-family: monospace; font-size: 11px; color: #888; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">KLEENKARS</div>
            <div class="tagline">Premium Car Detailing Studio</div>
            <div class="qr-wrapper">
              <img src="${qrDataUrl}" class="qr-img" />
            </div>
            <div class="scan-text">📱 SCAN TO CONNECT</div>
            <div class="sub-text">Google Reviews • Studio Location • WhatsApp Chat • Instant Booking & Pricing</div>
            <div class="badges">
              <span class="badge">⭐ 5.0 Rating</span>
              <span class="badge">📍 Aligarh Studio</span>
              <span class="badge">💬 Instant WhatsApp</span>
            </div>
            <div class="url">https://kleenkars.in/connect</div>
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const renderIcon = (iconName: string | null) => {
    const iconObj = AVAILABLE_ICONS.find((i) => i.id === iconName?.toLowerCase());
    if (iconObj) {
      const IconComponent = iconObj.component;
      return <IconComponent className="w-4 h-4 text-red-400" />;
    }
    return <Globe className="w-4 h-4 text-gray-400" />;
  };

  const totalClicks = links.reduce((sum, l) => sum + (l.clicksCount || 0), 0);
  const activeCount = links.filter((l) => l.isActive).length;

  return (
    <DashboardLayout title="QR Hub & Link Management">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <span>QR Code Customer Portal &amp; Links</span>
              <span className="text-xs font-mono font-bold bg-red-600/20 border border-red-500/30 text-red-300 px-2.5 py-0.5 rounded-full">
                /connect
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Customize the landing page customers see when scanning your studio QR code (Maps, Reviews, WhatsApp, Booking, Pricing &amp; Socials).
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleOpenAdd}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition shadow-lg shadow-red-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Link</span>
            </button>
            <a
              href="/connect"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-gray-300 text-xs font-bold px-3 py-2.5 rounded-xl transition"
            >
              <Eye className="w-4 h-4" />
              <span>View Live Hub</span>
            </a>
          </div>
        </div>

        {/* Top Metrics & QR Showcase */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* QR Code Standee Card */}
          <div className="bg-[#0b0b0b] border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-widest font-mono text-red-400 font-bold bg-red-950/40 border border-red-500/20 px-2.5 py-0.5 rounded-full">
                  Official QR Standee
                </span>
                <span className="text-[11px] text-gray-400 font-mono">kleenkars.in/connect</span>
              </div>

              <div className="flex flex-col items-center justify-center bg-black border border-zinc-800 rounded-2xl p-4 mb-4">
                {qrDataUrl ? (
                  <div className="bg-white p-2.5 rounded-xl shadow-md">
                    <img src={qrDataUrl} alt="Kleenkars Connect QR" className="w-40 h-40 object-contain" />
                  </div>
                ) : (
                  <div className="w-40 h-40 bg-zinc-900 animate-pulse rounded-xl" />
                )}
                <div className="text-center mt-3">
                  <div className="text-xs font-bold text-white">Scan for Kleenkars Studio Hub</div>
                  <div className="text-[10px] text-gray-500">Maps • Reviews • WhatsApp • Booking</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-900">
              <button
                onClick={downloadQrPng}
                className="flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs py-2 rounded-xl transition active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save PNG</span>
              </button>
              <button
                onClick={printStandee}
                className="flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 rounded-xl transition active:scale-95 shadow-md shadow-red-950/40"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Standee</span>
              </button>
            </div>
          </div>

          {/* Engagement Analytics & Quick Copy */}
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
            <div className="bg-[#0b0b0b] border border-zinc-800 rounded-3xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400">Total Customer Clicks</span>
                <div className="w-8 h-8 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
                  <MousePointerClick className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-white font-mono">{totalClicks.toLocaleString()}</div>
                <p className="text-[11px] text-gray-500 mt-1">Total button interactions from scanned QR visitors</p>
              </div>
              <div className="pt-3 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-gray-400">
                <span>Active Buttons: {activeCount}</span>
                <span>Total Registered: {links.length}</span>
              </div>
            </div>

            <div className="bg-[#0b0b0b] border border-zinc-800 rounded-3xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400">Direct Share URL</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Globe className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-xs font-mono text-gray-300 bg-black border border-zinc-800 p-2.5 rounded-xl break-all">
                  https://kleenkars.in/connect
                </div>
                <p className="text-[11px] text-gray-500 mt-2">
                  Aliased URLs <span className="text-red-400">/hub</span>, <span className="text-red-400">/links</span>, and <span className="text-red-400">/qr</span> redirect automatically.
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText("https://kleenkars.in/connect");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="w-full flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs py-2 rounded-xl transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied to Clipboard!" : "Copy Portal Link"}</span>
              </button>
            </div>

            {/* Quick Tips */}
            <div className="sm:col-span-2 bg-[#0b0b0b] border border-zinc-800 rounded-3xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs text-gray-300">
                <span className="font-bold text-white">Studio Pro-Tip:</span> Print this QR Standee on your reception counter, billing receipts, windshield delivery hang-tags, and waiting lounge tables so customers can easily write 5-star Google reviews and chat on WhatsApp!
              </div>
            </div>
          </div>
        </div>

        {/* Links Management Table & Mobile Preview */}
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* Links Table */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-500" />
                <span>Link Buttons Registry</span>
                <span className="text-xs font-mono text-gray-400 font-normal">({links.length} buttons)</span>
              </h3>
              <button
                onClick={fetchLinks}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 font-mono transition"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-red-600 text-xs uppercase tracking-wider text-left text-white">
                      <th className="p-3 w-12 text-center">Order</th>
                      <th className="p-3">Button Details</th>
                      <th className="p-3">Icon &amp; Badge</th>
                      <th className="p-3 font-mono text-center">Clicks</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-850">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500 font-mono">
                          Loading Portal Links...
                        </td>
                      </tr>
                    ) : links.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">
                          No links configured. Click "+ Add New Link" to get started.
                        </td>
                      </tr>
                    ) : (
                      links.map((link, index) => (
                        <tr key={link.id} className="hover:bg-white/5 transition">
                          <td className="p-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={() => handleMoveOrder(index, "up")}
                                disabled={index === 0}
                                className="text-gray-500 hover:text-white disabled:opacity-20 transition"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-mono text-xs text-gray-400 font-bold">{index + 1}</span>
                              <button
                                onClick={() => handleMoveOrder(index, "down")}
                                disabled={index === links.length - 1}
                                className="text-gray-500 hover:text-white disabled:opacity-20 transition"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{link.title}</span>
                              {link.isFeatured && (
                                <span className="text-[9px] bg-red-600/20 text-red-300 border border-red-500/30 px-1.5 py-0.2 rounded font-bold uppercase">
                                  Featured
                                </span>
                              )}
                            </div>
                            {link.subtitle && (
                              <div className="text-[11px] text-gray-400 line-clamp-1">{link.subtitle}</div>
                            )}
                            <div className="text-[10px] font-mono text-gray-500 truncate max-w-xs mt-0.5">
                              {link.url}
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-black border border-zinc-800 flex items-center justify-center">
                                {renderIcon(link.icon)}
                              </div>
                              {link.badge ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-950/60 border border-red-500/30 text-red-300">
                                  {link.badge}
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-600">—</span>
                              )}
                            </div>
                          </td>

                          <td className="p-3 text-center font-mono font-bold text-green-400">
                            {link.clicksCount || 0}
                          </td>

                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleToggleActive(link)}
                              className={`text-xs font-bold px-2.5 py-1 rounded-full border transition ${
                                link.isActive
                                  ? "bg-green-950/40 border-green-800/40 text-green-400"
                                  : "bg-zinc-900 border-zinc-800 text-gray-500"
                              }`}
                            >
                              {link.isActive ? "Active" : "Hidden"}
                            </button>
                          </td>

                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => handleOpenEdit(link)}
                              className="text-cyan-400 font-bold hover:underline text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(link.id, link.title)}
                              className="text-red-400 font-bold hover:underline text-xs"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Live Mobile Simulator Preview */}
          <div className="sticky top-6">
            <div className="bg-[#0c0c0c] border border-zinc-800 rounded-3xl p-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-900 mb-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-red-500" />
                  <span>Live Mobile Preview</span>
                </span>
                <span className="text-[10px] font-mono text-gray-500">Customer View</span>
              </div>

              {/* Phone Mockup Frame */}
              <div className="w-full bg-[#050505] border-2 border-zinc-800 rounded-2xl p-3 max-h-[560px] overflow-y-auto space-y-2.5 text-center">
                <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto mb-2" />

                {/* Brand in Mockup */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-black border border-red-600/60 rounded-xl p-1.5 mb-1.5 flex items-center justify-center">
                    <Image src="/logo.png" alt="Logo" width={40} height={40} className="object-contain" />
                  </div>
                  <div className="text-xs font-black text-white">KLEENKARS</div>
                  <div className="text-[9px] text-gray-400">Aligarh Detailing Studio</div>
                </div>

                {/* Mockup Links */}
                <div className="space-y-1.5 pt-2">
                  {links
                    .filter((l) => l.isActive)
                    .map((l) => (
                      <div
                        key={l.id}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs ${
                          l.isFeatured
                            ? "bg-zinc-900 border-red-600/40 text-white font-bold"
                            : "bg-[#0f0f0f] border-zinc-800 text-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-6 h-6 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
                            {renderIcon(l.icon)}
                          </div>
                          <span className="truncate text-[11px] font-medium">{l.title}</span>
                        </div>
                        {l.badge && (
                          <span className="text-[8px] bg-red-950 text-red-400 px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap">
                            {l.badge}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingId ? "Edit Link Button" : "Add New Hub Link Button"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Button Title *</label>
                <input
                  type="text"
                  placeholder="e.g. 📍 Studio Location & Directions"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-black border border-zinc-700 p-3 rounded-xl text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Subtitle / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Mustafa Market, Anoop Shahar Rd, Aligarh"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full bg-black border border-zinc-700 p-3 rounded-xl text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Destination URL *</label>
                <input
                  type="text"
                  placeholder="e.g. https://maps.google.com/... or https://kleenkars.in/booking"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="w-full bg-black border border-zinc-700 p-3 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Icon Selector Grid */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Choose Icon</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-black border border-zinc-800 p-2.5 rounded-xl max-h-36 overflow-y-auto">
                  {AVAILABLE_ICONS.map((item) => {
                    const IconComp = item.component;
                    const isSelected = form.icon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setForm({ ...form, icon: item.id })}
                        className={`flex items-center gap-1.5 p-2 rounded-lg text-xs font-medium transition ${
                          isSelected
                            ? "bg-red-600 text-white font-bold"
                            : "bg-zinc-900 text-gray-400 hover:text-white hover:bg-zinc-800"
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Badge Tag (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 5.0 ★, Instant Reply, Studio Menu, Free Pickup"
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  className="w-full bg-black border border-zinc-700 p-3 rounded-xl text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                    className="w-4 h-4 accent-red-600 rounded"
                  />
                  <span>Featured Button (Glowing Red Highlight)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 accent-red-600 rounded"
                  />
                  <span>Active &amp; Visible</span>
                </label>
              </div>

              <div className="flex gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-750 text-gray-300 p-3 rounded-xl font-bold text-xs uppercase tracking-wider transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-red-950/40"
                >
                  {editingId ? "Save Changes" : "Create Link Button"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
