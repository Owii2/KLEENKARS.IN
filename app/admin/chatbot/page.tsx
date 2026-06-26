"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlassButton } from "@/components/ui/GlassButton";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface KnowledgeEntry {
  id: number;
  question: string;
  answer: string;
  createdAt: string;
}

interface ChatMessage {
  id: number;
  sender: "user" | "bot";
  text: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  customerName: string;
  customerId: string | null;
  isPermanent: boolean;
  updatedAt: string;
  messages: ChatMessage[];
}

export default function AdminChatbotManager() {
  const [activeTab, setActiveTab] = useState<"knowledge" | "chats" | "interview">("knowledge");
  
  // Knowledge Base State
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  
  // Chat Transcripts State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);

  // Know Me Better State
  const [interviewQuestion, setInterviewQuestion] = useState("");
  const [interviewAnswer, setInterviewAnswer] = useState("");
  const [interviewLoading, setInterviewLoading] = useState(false);

  // Correction State
  const [correctingMessageId, setCorrectingMessageId] = useState<number | null>(null);
  const [correctedAnswer, setCorrectedAnswer] = useState("");
  const [correctionSuccess, setCorrectionSuccess] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // API Diagnostics State
  const [apiStatus, setApiStatus] = useState<{ status: string; message: string } | null>(null);

  const checkApiStatus = async () => {
    try {
      const res = await fetch("/api/chatbot/status");
      if (res.ok) {
        setApiStatus(await res.json());
      }
    } catch (err) {
      console.error("Failed to check API status:", err);
    }
  };

  // Load knowledge base list
  const loadKnowledge = async () => {
    try {
      const res = await fetch("/api/chatbot/knowledge");
      if (res.ok) {
        setKnowledge(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load chat sessions
  const loadSessions = async () => {
    try {
      const res = await fetch("/api/chatbot/sessions");
      if (res.ok) {
        setSessions(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadKnowledge();
    loadSessions();
    checkApiStatus();
  }, []);

  // Trigger interview question fetch
  useEffect(() => {
    if (activeTab === "interview" && !interviewQuestion) {
      fetchNextInterviewQuestion();
    }
  }, [activeTab]);

  // Fetch next interview question from backend (Gemini dynamically resolves gaps)
  const fetchNextInterviewQuestion = async () => {
    setInterviewLoading(true);
    setInterviewQuestion("");
    try {
      const res = await fetch("/api/chatbot/know-me-better", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-question" }),
      });
      if (res.ok) {
        const data = await res.json();
        setInterviewQuestion(data.question);
      }
    } catch (err) {
      console.error(err);
      setInterviewQuestion("What are the main wash steps included in the Rainy Day Shine package?");
    } finally {
      setInterviewLoading(false);
    }
  };

  // Submit interview answer
  const handleSaveInterviewAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewQuestion || !interviewAnswer.trim()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/chatbot/know-me-better", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-answer",
          question: interviewQuestion,
          answer: interviewAnswer,
        }),
      });

      if (res.ok) {
        setInterviewAnswer("");
        setSuccess("Knowledge added to the Chatbot Agent successfully! Fetching next question...");
        loadKnowledge();
        await fetchNextInterviewQuestion();
      } else {
        setError("Failed to submit training answer.");
      }
    } catch (err) {
      setError("Failed to save answer.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Knowledge manually
  const handleAddKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/chatbot/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: newQuestion, answer: newAnswer }),
      });

      if (res.ok) {
        setNewQuestion("");
        setNewAnswer("");
        setSuccess("Information added to Chatbot Knowledge Base successfully!");
        loadKnowledge();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save information.");
      }
    } catch (err) {
      setError("Failed to reach server.");
    } finally {
      setLoading(false);
    }
  };

  // Save admin review correction
  const handleSaveCorrection = async (msgId: number, originalQuestion: string) => {
    if (!correctedAnswer.trim()) return;

    setLoading(true);
    setCorrectionSuccess("");
    try {
      const res = await fetch("/api/chatbot/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: originalQuestion,
          answer: correctedAnswer,
        }),
      });

      if (res.ok) {
        setCorrectedAnswer("");
        setCorrectingMessageId(null);
        setCorrectionSuccess("Correction saved directly to Chatbot Knowledge Base!");
        loadKnowledge();
        
        // Refresh messages of the active session
        if (selectedSession) {
          const sessRes = await fetch(`/api/chatbot/sessions/${selectedSession.id}`);
          if (sessRes.ok) {
            setSelectedSession(await sessRes.json());
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Knowledge
  const handleDeleteKnowledge = async (id: number) => {
    if (!confirm("Delete this information from the chatbot knowledge base?")) return;
    try {
      const res = await fetch(`/api/chatbot/knowledge?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadKnowledge();
      } else {
        alert("Failed to delete entry.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Permanent Status
  const handleTogglePermanent = async (session: ChatSession) => {
    setLoading(true);
    try {
      const nextVal = !session.isPermanent;
      const res = await fetch(`/api/chatbot/sessions/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPermanent: nextVal }),
      });

      if (res.ok) {
        const updated = await res.json();
        
        // Update local session arrays
        setSessions(prev => prev.map(s => s.id === session.id ? { ...s, isPermanent: updated.isPermanent } : s));
        if (selectedSession?.id === session.id) {
          setSelectedSession(prev => prev ? { ...prev, isPermanent: updated.isPermanent } : null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Delete Chat Session
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this customer chat transcript permanently from the database?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/chatbot/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (selectedSession?.id === sessionId) {
          setSelectedSession(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Chatbot Agent Manager">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* API Diagnostics Warning Banner */}
        {apiStatus && apiStatus.status !== "active" && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-1">
              <div className="font-bold flex items-center gap-2 text-sm text-amber-300">
                <span>⚠️</span> Generative AI Offline (Fallback Engine Active)
              </div>
              <p className="text-white/60 leading-relaxed max-w-4xl">
                {apiStatus.message}
              </p>
              <p className="text-white/40 text-[10px]">
                Because the Gemini API key is suspended/missing, the chatbot has automatically switched to a smart database-driven Offline Matcher.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <a
                href="https://aistudio.google.com"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-black font-bold rounded-xl text-xs transition-all duration-200"
              >
                Create Free API Key
              </a>
            </div>
          </div>
        )}

        {apiStatus && apiStatus.status === "active" && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold">Generative AI Active:</span>
                <span className="text-white/70">{apiStatus.message}</span>
              </div>
            </div>
            <span className="text-[10px] text-white/40 font-mono hidden sm:inline">Gemini Engine</span>
          </div>
        )}
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 gap-6 pb-2">
          <button
            onClick={() => { setActiveTab("knowledge"); setError(""); setSuccess(""); }}
            className={`pb-2 px-1 font-bold text-sm transition-all cursor-pointer ${
              activeTab === "knowledge" ? "border-b-2 border-red-500 text-white" : "text-white/40 hover:text-white/70"
            }`}
          >
            📚 Chatbot Knowledge Base
          </button>
          <button
            onClick={() => { setActiveTab("chats"); setError(""); setSuccess(""); }}
            className={`pb-2 px-1 font-bold text-sm transition-all cursor-pointer ${
              activeTab === "chats" ? "border-b-2 border-red-500 text-white" : "text-white/40 hover:text-white/70"
            }`}
          >
            💬 Customer Chat Transcripts
          </button>
          <button
            onClick={() => { setActiveTab("interview"); setError(""); setSuccess(""); }}
            className={`pb-2 px-1 font-bold text-sm transition-all cursor-pointer ${
              activeTab === "interview" ? "border-b-2 border-red-500 text-white" : "text-white/40 hover:text-white/70"
            }`}
          >
            ✨ Know Me Better (AI Onboarding)
          </button>
        </div>

        {/* TAB 1: KNOWLEDGE BASE EDITOR */}
        {activeTab === "knowledge" && (
          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-6 items-start">
            {/* Feed Information Form */}
            <GlassPanel className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-red-500">Feed Custom Knowledge</h2>
              <p className="text-xs text-white/50">Add FAQs, operational timings, package guides, or specific policies that the chatbot representative will use to answer customers.</p>
              
              {error && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">{error}</div>}
              {success && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl">{success}</div>}

              <form onSubmit={handleAddKnowledge} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/40">Topic / Question Match Phrase</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. What is the Rainy Day Guarantee?"
                    value={newQuestion}
                    onChange={e => setNewQuestion(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder-white/20 focus:outline-none focus:border-red-500"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/40">Knowledge details / Agent Response</label>
                  <textarea
                    required
                    rows={6}
                    placeholder="e.g. Kleenkars offers a 24-hour Rainy Day Guarantee on Premium Detailing washes. If it rains within 24 hours of your wash, bring it back for a free dry down!"
                    value={newAnswer}
                    onChange={e => setNewAnswer(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder-white/20 focus:outline-none focus:border-red-500 resize-none"
                  />
                </div>

                <GlassButton type="submit" disabled={loading} className="w-full py-3">
                  {loading ? "Saving Details..." : "Feed Agent details"}
                </GlassButton>
              </form>
            </GlassPanel>

            {/* Knowledge List */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Fed Knowledge Library ({knowledge.length} items)</h2>
              {knowledge.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-10 text-center text-white/20 text-xs">
                  No knowledge fed to the chatbot yet. Add some items on the left to train your AI representative!
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {knowledge.map(item => (
                    <div key={item.id} className="p-5 rounded-2xl border border-white/8 bg-white/[0.02] space-y-2 relative group">
                      <button
                        onClick={() => handleDeleteKnowledge(item.id)}
                        className="absolute top-4 right-4 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-red-500/20 transition-all cursor-pointer"
                      >
                        Remove
                      </button>
                      <h4 className="font-bold text-white text-sm pr-16">{item.question}</h4>
                      <p className="text-white/60 text-xs leading-relaxed">{item.answer}</p>
                      <div className="text-[10px] text-white/20 font-mono">
                        Added: {new Date(item.createdAt).toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CHAT TRANSCRIPTS & REVIEW */}
        {activeTab === "chats" && (
          <div className="grid lg:grid-cols-[1fr_2fr] gap-6 items-start">
            {/* Sessions List */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-white">Active Logs</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {sessions.length === 0 ? (
                  <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-10 text-center text-white/20 text-xs">
                    No chatbot interactions recorded yet.
                  </div>
                ) : (
                  sessions.map(s => {
                    const isSelected = selectedSession?.id === s.id;
                    const lastMsg = s.messages[s.messages.length - 1];
                    return (
                      <div
                        key={s.id}
                        onClick={() => { setSelectedSession(s); setCorrectingMessageId(null); setCorrectionSuccess(""); }}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-red-500/10 border-red-500/40"
                            : "bg-white/[0.02] border-white/8 hover:border-white/20 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-white">{s.customerName}</h4>
                            {s.isPermanent && (
                              <span className="text-[10px]" title="Saved Permanently">📌</span>
                            )}
                          </div>
                          <span className="text-[10px] text-white/30 font-mono">
                            {new Date(s.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-white/50 mt-1.5 truncate">
                          {lastMsg ? `${lastMsg.sender === "user" ? "User" : "Agent"}: ${lastMsg.text}` : "No messages"}
                        </p>
                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5 text-[9px] text-white/20">
                          <span>Messages: {s.messages.length}</span>
                          <span>ID: {s.id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat Transcript Window */}
            <div>
              <h2 className="text-lg font-bold text-white mb-3">Transcript Viewer</h2>
              
              {correctionSuccess && (
                <div className="mb-3 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                  <span>✓</span> {correctionSuccess}
                </div>
              )}

              {selectedSession ? (
                <div className="border border-white/10 bg-black/40 rounded-3xl h-[600px] flex flex-col overflow-hidden">
                  {/* Visualizer Header */}
                  <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm">{selectedSession.customerName}</h3>
                        {selectedSession.isPermanent && (
                          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded">
                            📌 SAVED PERMANENTLY
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-white/40 font-mono">Session ID: {selectedSession.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePermanent(selectedSession)}
                        className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          selectedSession.isPermanent
                            ? "bg-amber-600/25 border-amber-500/30 text-amber-400 hover:bg-amber-600/40"
                            : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {selectedSession.isPermanent ? "📌 Saved permanently" : "📌 Save permanently"}
                      </button>
                      <button
                        onClick={() => handleDeleteSession(selectedSession.id)}
                        className="bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-red-500/20 transition-all cursor-pointer"
                      >
                        🗑️ Delete Log
                      </button>
                    </div>
                  </div>

                  {/* Message Stream */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {selectedSession.messages.map((msg, idx) => {
                      const isBot = msg.sender === "bot";
                      const isCorrecting = correctingMessageId === msg.id;
                      
                      // Find user message directly before this bot message
                      let originalQuestion = "";
                      if (isBot && idx > 0) {
                        const prevMsg = selectedSession.messages[idx - 1];
                        if (prevMsg.sender === "user") {
                          originalQuestion = prevMsg.text;
                        }
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                        >
                          <div className="max-w-[75%] space-y-1">
                            <div className={`text-[10px] text-white/40 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                              {msg.sender === "user" ? "Customer" : "Kleenkars AI Representative"}
                            </div>
                            
                            <div
                              className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed relative group ${
                                msg.sender === "user"
                                  ? "bg-red-600 text-white rounded-tr-none"
                                  : "bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-none"
                              }`}
                            >
                              {msg.text}

                              {/* Review Suggest Button (visible to admin on hover over bot answers) */}
                              {isBot && originalQuestion && !isCorrecting && (
                                <button
                                  onClick={() => {
                                    setCorrectingMessageId(msg.id);
                                    setCorrectedAnswer(msg.text);
                                  }}
                                  className="absolute -right-36 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600/80 hover:bg-indigo-600 text-white text-[9px] font-bold px-2.5 py-1.5 rounded-lg border border-indigo-500/20 shadow-lg cursor-pointer"
                                >
                                  💡 Correct Answer
                                </button>
                              )}
                            </div>

                            <div className={`text-[8px] text-white/20 font-mono ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                              {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>

                          {/* Inline correction box */}
                          {isBot && isCorrecting && (
                            <div className="w-full max-w-[80%] mt-2 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl space-y-2 self-start animate-in fade-in slide-in-from-top-2 duration-200">
                              <div className="text-[10px] font-bold text-indigo-400">Suggest better answer for: "{originalQuestion}"</div>
                              <textarea
                                rows={3}
                                value={correctedAnswer}
                                onChange={e => setCorrectedAnswer(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => setCorrectingMessageId(null)}
                                  className="px-3 py-1.5 rounded-lg bg-white/5 text-[10px] text-white/60 hover:text-white transition cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveCorrection(msg.id, originalQuestion)}
                                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[10px] font-semibold text-white transition cursor-pointer"
                                >
                                  Save Correction
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 bg-white/5 border-t border-white/10 text-center text-[10px] text-white/30 italic">
                    Viewing recorded history log file • Hover over chatbot responses to suggest corrections
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-white/10 rounded-3xl h-[600px] flex flex-col items-center justify-center text-center p-6 bg-white/[0.01]">
                  <span className="text-3xl mb-3">💬</span>
                  <h4 className="font-bold text-white text-sm">Select a Conversation</h4>
                  <p className="text-xs text-white/40 mt-1 max-w-sm">Click on any active chatbot conversation log on the left side menu to visualize the dialogue details transcript.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: KNOW ME BETTER INTERACTIVE ONBOARDING */}
        {activeTab === "interview" && (
          <div className="max-w-3xl mx-auto">
            <GlassPanel className="p-8 space-y-6 relative overflow-hidden">
              {/* Sparkles */}
              <div className="absolute top-4 right-4 text-xl animate-pulse">✨</div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white">Know Me Better</h2>
                <p className="text-xs text-white/60">Help the AI representative learn more about Kleenkars. The chatbot will dynamically identify information gaps in its knowledge base and ask you questions. Your answers will train the bot for future customer conversations.</p>
              </div>

              {error && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">{error}</div>}
              {success && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl">{success}</div>}

              {interviewLoading ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="text-xs text-white/40">AI is analyzing knowledge gaps and preparing next question...</div>
                </div>
              ) : (
                interviewQuestion && (
                  <form onSubmit={handleSaveInterviewAnswer} className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-2.5">
                      <div className="text-[10px] uppercase font-black text-red-500 tracking-wider">Question from AI Chatbot Agent:</div>
                      <div className="text-base text-white font-bold leading-normal">
                        "{interviewQuestion}"
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-white/40">Your Answer (This trains the agent):</label>
                      <textarea
                        required
                        rows={5}
                        placeholder="Type the answer details here..."
                        value={interviewAnswer}
                        onChange={e => setInterviewAnswer(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs placeholder-white/20 focus:outline-none focus:border-red-500 resize-none"
                      />
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={fetchNextInterviewQuestion}
                        className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition border border-white/10 cursor-pointer"
                      >
                        Skip Topic
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !interviewAnswer.trim()}
                        className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-600/25 cursor-pointer"
                      >
                        {loading ? "Training Agent..." : "Train Chatbot Agent"}
                      </button>
                    </div>
                  </form>
                )
              )}
            </GlassPanel>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
