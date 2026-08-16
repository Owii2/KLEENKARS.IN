"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface Message {
  sender: "user" | "bot";
  text: string;
  createdAt?: string;
  isEnquiryCard?: boolean;
}

export function ChatBotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: "bot", text: "Hello! Welcome to Kleenkars Customer Support. How can I help you today?" }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestedFAQs, setSuggestedFAQs] = useState<string[]>([]);
  
  // Enquiry Drawer / Modal state inside chatbot
  const [showEnquiryMode, setShowEnquiryMode] = useState(false);
  const [enquiryService, setEnquiryService] = useState("");
  const [enquiryNotes, setEnquiryNotes] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load FAQ suggestions from Knowledge Base on mount
  useEffect(() => {
    fetch("/api/chatbot/knowledge")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          // Take first 3 questions as suggested topics
          setSuggestedFAQs(data.slice(0, 3).map(k => k.question));
        }
      })
      .catch(console.error);

    // Auto-detect authentication via /api/auth/me
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.customer) {
          setCustomerName(data.customer.customerName || "");
          if (data.customer.phoneNumber) setCustomerPhone(data.customer.phoneNumber);
          if (data.customer.vehicles && data.customer.vehicles.length > 0) {
            const v = data.customer.vehicles[0];
            setVehicleInfo(`${v.type || 'Car'} ${v.brand || ''} ${v.model || ''} (${v.plateNumber || ''})`.trim());
          }
          setNameSubmitted(true);
          setMessages([
            {
              sender: "bot",
              text: `Hello ${data.customer.customerName || 'Customer'}! Welcome back to Kleenkars Support. How can I assist you with your booking or wash packages today?`
            }
          ]);
        }
      })
      .catch(console.error);
  }, []);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showEnquiryMode]);

  // Helper to compile structured WhatsApp link with full context
  const buildWhatsAppUrl = (customNotes?: string, customService?: string) => {
    const targetPhoneNumber = "918650007661";
    const timeStr = new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    // Compile recent chat history snippet (last 6 messages)
    const historySnippet = messages
      .filter(m => !m.isEnquiryCard)
      .slice(-6)
      .map(m => `${m.sender === "user" ? "👤 Customer" : "🤖 Bot"}: ${m.text.replace(/\n+/g, " ")}`)
      .join("\n");

    let text = `🚗 *KLEENKARS CUSTOMER ENQUIRY*\n`;
    text += `===============================\n`;
    text += `👤 *Name:* ${customerName.trim() || "Guest Customer"}\n`;
    if (customerPhone.trim()) text += `📱 *Phone:* ${customerPhone.trim()}\n`;
    if (vehicleInfo.trim()) text += `🚘 *Vehicle Info:* ${vehicleInfo.trim()}\n`;
    if (customService || enquiryService) text += `🏷️ *Interested Service:* ${customService || enquiryService}\n`;
    text += `🕒 *Time:* ${timeStr}\n\n`;

    if (customNotes || enquiryNotes) {
      text += `💬 *Enquiry Details:*\n"${(customNotes || enquiryNotes).trim()}"\n\n`;
    }

    if (historySnippet) {
      text += `📋 *Chat History Summary:*\n${historySnippet}\n\n`;
    }

    text += `Please share information, pricing, and availability! Thank you.`;

    return `https://wa.me/${targetPhoneNumber}?text=${encodeURIComponent(text)}`;
  };

  const handleForwardToWhatsApp = (notes?: string, service?: string) => {
    const url = buildWhatsAppUrl(notes, service);
    window.open(url, "_blank", "noopener,noreferrer");

    // Push bot confirmation message in chat
    setMessages(prev => [
      ...prev,
      {
        sender: "bot",
        text: `📲 **Enquiry Forwarded to WhatsApp!**\n\nI have pre-filled all your enquiry details, vehicle info, and chat transcript. A WhatsApp tab has opened so you can send it directly to our detailing team (` + "`+91 8650007661`" + `).\n\n*Our team usually responds on WhatsApp within a few minutes!* 🚗✨`
      }
    ]);
    setShowEnquiryMode(false);
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message to state
    setMessages(prev => [...prev, { sender: "user", text: textToSend }]);
    setInputVal("");
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          sessionId: sessionId,
          name: customerName,
          phone: customerPhone,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSessionId(data.sessionId);
        setMessages(prev => [...prev, { sender: "bot", text: data.reply }]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            sender: "bot",
            text: "Sorry, I am having trouble connecting to my service right now. Please reach out to us on WhatsApp or call **8650007661**!"
          }
        ]);
      }
    } catch (error) {
      console.error("Chat message error:", error);
      setMessages(prev => [
        ...prev,
        {
          sender: "bot",
          text: "Something went wrong. Please check your connection or contact us at **8650007661**!"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerName.trim()) {
      setNameSubmitted(true);
      setMessages([
        {
          sender: "bot",
          text: `Nice to meet you, ${customerName}! I am your Kleenkars support representative. How can I help you today?`
        }
      ]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl shadow-red-600/30 transition-all duration-300 group cursor-pointer"
          aria-label="Open Chatbot"
        >
          <span className="absolute -top-1 -right-1 text-xs animate-bounce">✨</span>
          <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="bg-zinc-950/95 border border-zinc-800 rounded-3xl w-[370px] h-[530px] flex flex-col shadow-2xl shadow-red-500/10 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-6 duration-300 overflow-hidden">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-red-700 via-red-800 to-zinc-900 flex items-center justify-between border-b border-zinc-800/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center font-bold text-white text-xs border border-white/10 shrink-0">
                🚗
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white leading-tight">Kleenkars Representative</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                  <span className="text-[10px] text-white/70">Online &amp; Instant WhatsApp Forwarding</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Direct WhatsApp Forward Button in Header */}
              {nameSubmitted && (
                <button
                  onClick={() => setShowEnquiryMode(!showEnquiryMode)}
                  title="Forward Enquiry to WhatsApp"
                  className="bg-[#25D366]/20 hover:bg-[#25D366] text-[#25D366] hover:text-black border border-[#25D366]/40 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <span>💬 WhatsApp</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white transition p-1 cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Enquiry Drawer overlay if triggered */}
          {showEnquiryMode ? (
            <div className="flex-1 p-4 bg-zinc-900/90 flex flex-col justify-between overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <span>📱</span> Forward Enquiry to WhatsApp
                  </div>
                  <button
                    onClick={() => setShowEnquiryMode(false)}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    ← Back to Chat
                  </button>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  We'll format your contact info, vehicle details, custom question, and chat context into a pre-filled WhatsApp message.
                </p>

                <div className="space-y-2">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Your Name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Phone / WhatsApp Number</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Vehicle Model (Optional)</label>
                    <input
                      type="text"
                      value={vehicleInfo}
                      onChange={e => setVehicleInfo(e.target.value)}
                      placeholder="e.g. Creta / Swift / Honda City"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Interested Service / Package</label>
                    <select
                      value={enquiryService}
                      onChange={e => setEnquiryService(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="">General Enquiry / Pricing Quote</option>
                      <option value="Express Wash">Express Wash</option>
                      <option value="Classic Wash">Classic Wash</option>
                      <option value="Premium Wash">Premium Wash</option>
                      <option value="9H Ceramic Coating">9H Ceramic Coating</option>
                      <option value="PPF (Paint Protection Film)">PPF (Paint Protection Film)</option>
                      <option value="Interior Spa & Detailing">Interior Spa &amp; Detailing</option>
                      <option value="Doorstep Pickup & Drop">Doorstep Pickup &amp; Drop</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Enquiry Message / Specific Request</label>
                    <textarea
                      rows={3}
                      value={enquiryNotes}
                      onChange={e => setEnquiryNotes(e.target.value)}
                      placeholder="e.g. I need slot availability for this Sunday at 11 AM..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex gap-2">
                <button
                  onClick={() => setShowEnquiryMode(false)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleForwardToWhatsApp()}
                  className="flex-[2] py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-black font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-[#25D366]/20 cursor-pointer"
                >
                  <span>Open in WhatsApp</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          ) : (
            /* Messages stream */
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {!nameSubmitted ? (
                /* Get customer name first if guest */
                <form onSubmit={handleNameSubmit} className="h-full flex flex-col items-center justify-center space-y-4 text-center p-4">
                  <div className="text-2xl">✨</div>
                  <div>
                    <h5 className="text-sm font-bold text-white">Welcome to Kleenkars!</h5>
                    <p className="text-xs text-zinc-400 mt-1">Please enter your name to start chatting or send enquiries directly to our WhatsApp care team.</p>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
                  />
                  <button
                    type="submit"
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Start Chatting
                  </button>
                </form>
              ) : (
                <>
                  {messages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed
                          ${m.sender === "user"
                            ? "bg-red-600 text-white rounded-tr-none"
                            : "bg-zinc-900 text-zinc-200 border border-zinc-800/80 rounded-tl-none"}`}
                      >
                        {m.sender === "user" ? (
                          m.text
                        ) : (
                          <div className="space-y-2">
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                                h3: ({ children }) => <h3 className="text-xs font-bold text-white mt-2.5 mb-1 first:mt-0 border-b border-zinc-800/60 pb-0.5">{children}</h3>,
                                ul: ({ children }) => <ul className="list-disc pl-4 space-y-0.5 my-1">{children}</ul>,
                                li: ({ children }) => <li className="list-item text-zinc-300">{children}</li>,
                                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                                em: ({ children }) => <em className="italic text-zinc-400">{children}</em>,
                                a: ({ href, children }) => (
                                  <Link href={href || "#"} className="text-red-400 hover:text-red-300 underline font-medium">
                                    {children}
                                  </Link>
                                )
                              }}
                            >
                              {m.text}
                            </ReactMarkdown>

                            {/* Render Inline WhatsApp Action Card if bot message suggests human support or quotes */}
                            {(m.text.toLowerCase().includes("whatsapp") || m.text.toLowerCase().includes("query received") || m.text.toLowerCase().includes("quote") || m.text.toLowerCase().includes("follow up")) && (
                              <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex flex-col gap-1.5">
                                <button
                                  onClick={() => handleForwardToWhatsApp(undefined, undefined)}
                                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-black font-extrabold text-[11px] py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition shadow-md shadow-[#25D366]/20 cursor-pointer"
                                >
                                  <span>💬 Forward this Enquiry to WhatsApp</span>
                                  <span>→</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* AI loading indicator */}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>
          )}

          {/* Footer Input Area */}
          {nameSubmitted && !showEnquiryMode && (
            <div className="p-3 border-t border-zinc-800/40 bg-zinc-950 flex flex-col gap-2">
              {/* Quick WhatsApp enquiry banner pill */}
              <div className="flex items-center justify-between bg-zinc-900/90 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-[10px]">
                <span className="text-zinc-400">Need direct human assistance?</span>
                <button
                  onClick={() => setShowEnquiryMode(true)}
                  className="text-[#25D366] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>📱 Send Enquiry to WhatsApp</span>
                  <span>→</span>
                </button>
              </div>

              {/* Suggestions */}
              {suggestedFAQs.length > 0 && messages.length === 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {suggestedFAQs.map((faq, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(faq)}
                      className="shrink-0 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-[10px] text-zinc-300 px-3 py-1.5 rounded-full transition-all cursor-pointer"
                    >
                      {faq}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Input form */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendMessage(inputVal);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputVal.trim() || loading}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white w-9 h-9 rounded-xl flex items-center justify-center transition cursor-pointer shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
