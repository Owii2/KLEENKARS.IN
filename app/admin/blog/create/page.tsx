// app/admin/blog/create/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MarkdownEditor } from "@/components/ui/MarkdownEditor";
import slugify from "slugify";

interface Author { id: number; name: string; }
interface Category { id: number; name: string; }
interface Tag { id: number; name: string; }

// ── Shared input class ────────────────────────────────────────────────────────
const inputCls =
  "w-full bg-[#0f0f14] border border-white/10 rounded-xl px-4 py-3 text-white text-sm " +
  "placeholder-white/30 focus:outline-none focus:border-indigo-500 focus:ring-2 " +
  "focus:ring-indigo-500/20 transition-all duration-200";

const labelCls = "block text-xs font-semibold uppercase tracking-widest text-white/50 mb-2";

// ── Section card ─────────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-6 space-y-5">
      <h2 className="text-sm font-semibold text-white/40 uppercase tracking-widest">{title}</h2>
      {children}
    </div>
  );
}

// ── Image drop zone ───────────────────────────────────────────────────────────
function ImageDropZone({
  label, file, onFile,
}: { label: string; file: File | null; onFile: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const preview = file ? URL.createObjectURL(file) : null;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith("image/")) onFile(f);
  }, [onFile]);

  return (
    <div>
      <p className={labelCls}>{label}</p>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center h-36 overflow-hidden group
          ${drag ? "border-indigo-400 bg-indigo-500/10" : "border-white/10 hover:border-white/25 bg-white/[0.02]"}`}
      >
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-medium">Change image</span>
            </div>
          </>
        ) : (
          <>
            <svg className="w-8 h-8 text-white/20 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-white/30 text-xs">Click or drag &amp; drop</p>
            <p className="text-white/20 text-[10px] mt-1">PNG, JPG, WebP up to 10 MB</p>
          </>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      </div>
    </div>
  );
}

// ── Status pill selector ──────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "draft",     label: "Draft",     color: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  { value: "published", label: "Published", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  { value: "scheduled", label: "Scheduled", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" },
];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminBlogCreate() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");

  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [ogImage, setOgImage] = useState<File | null>(null);

  const [authorId, setAuthorId] = useState<number | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  const [status, setStatus] = useState("draft");
  const [publishAt, setPublishAt] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiAction, setAiAction] = useState<"review" | "format" | null>(null);
  const [aiResults, setAiResults] = useState<any>(null);

  const handleAIReview = async () => {
    setAiLoading(true);
    setAiAction("review");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "review",
          title,
          content,
          focusKeyword,
          excerpt,
        }),
      });
      if (!res.ok) throw new Error("AI Review failed");
      const data = await res.json();
      setAiResults(data);
    } catch (err) {
      console.error(err);
      setError("AI review failed to load.");
    } finally {
      setAiLoading(false);
      setAiAction(null);
    }
  };

  const handleAIFormat = async () => {
    setAiLoading(true);
    setAiAction("format");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "format",
          content,
        }),
      });
      if (!res.ok) throw new Error("AI Formatting failed");
      const data = await res.json();
      if (data.formatted) {
        setContent(data.formatted);
        if (aiResults) {
          const reviewRes = await fetch("/api/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "review",
              title,
              content: data.formatted,
              focusKeyword,
              excerpt,
            }),
          });
          if (reviewRes.ok) {
            setAiResults(await reviewRes.json());
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError("AI formatting failed.");
    } finally {
      setAiLoading(false);
      setAiAction(null);
    }
  };

  // Auto-slug from title
  useEffect(() => {
    if (!slugEdited && title) {
      setSlug(slugify(title, { lower: true, strict: true }));
    }
  }, [title, slugEdited]);

  // Fetch lookups
  useEffect(() => {
    (async () => {
      try {
        const [aRes, cRes, tRes] = await Promise.all([
          fetch("/api/blog/authors"),
          fetch("/api/blog/categories"),
          fetch("/api/blog/tags"),
        ]);
        if (aRes.ok) {
          const auths = await aRes.json();
          setAuthors(auths);
          if (auths.length > 0) {
            setAuthorId(auths[0].id);
          }
        }
        if (cRes.ok) setCategories(await cRes.json());
        if (tRes.ok) setTags(await tRes.json());
      } catch (_) { /* ignore */ }
    })();
  }, []);

  const handleFileUpload = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/media/upload", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Upload failed");
    return (await res.json()).url as string;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      let featuredImageUrl: string | undefined;
      let openGraphImageUrl: string | undefined;
      if (featuredImage) featuredImageUrl = await handleFileUpload(featuredImage);
      if (ogImage) openGraphImageUrl = await handleFileUpload(ogImage);

      const payload = {
        title, slug, content, excerpt,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
        focusKeyword: focusKeyword || undefined,
        featuredImageUrl, openGraphImageUrl,
        authorId: authorId ?? undefined,
        categoryIds: selectedCategories,
        tagIds: selectedTags,
        status,
        publishAt: publishAt ? new Date(publishAt).toISOString() : undefined,
      };

      const res = await fetch("/api/blog/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create post");
      router.push("/admin/blog");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const metaTitleLen = metaTitle.length;
  const metaDescLen = metaDescription.length;

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-white/8 bg-[#080810]/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/blog"
            className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Blog Posts
          </Link>
          <span className="text-white/20">/</span>
          <span className="text-sm text-white/70">New Post</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Status pill */}
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/8">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200
                  ${status === opt.value
                    ? opt.color + " shadow-sm"
                    : "border-transparent text-white/30 hover:text-white/60"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            form="blog-form"
            onClick={handleSubmit as any}
            disabled={loading}
            className="relative px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-500/25"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Publishing…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {status === "draft" ? "Save Draft" : status === "scheduled" ? "Schedule" : "Publish"}
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <form id="blog-form" onSubmit={handleSubmit}>
        <div className="max-w-7xl mx-auto px-6 py-8 flex gap-6 items-start">

          {/* ── Left: main content ─────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Title */}
            <div>
              <textarea
                rows={2}
                required
                value={title}
                placeholder="Post title…"
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-transparent text-3xl font-bold text-white placeholder-white/20 resize-none focus:outline-none leading-tight"
              />
              {/* Slug row */}
              <div className="flex items-center gap-2 mt-2 text-sm">
                <span className="text-white/30 shrink-0">kleenkars.in/blog/</span>
                <input
                  type="text"
                  value={slug}
                  placeholder="auto-slug"
                  onChange={e => { setSlugEdited(true); setSlug(e.target.value); }}
                  className="flex-1 bg-transparent text-white/60 border-b border-white/10 focus:border-indigo-500 focus:outline-none pb-0.5 transition-colors"
                />
              </div>
            </div>

            {/* Content */}
            <Section title="Content">
              <MarkdownEditor value={content} onChange={setContent} />
            </Section>

            {/* Excerpt */}
            <Section title="Excerpt">
              <textarea
                rows={3}
                value={excerpt}
                placeholder="A short summary shown in blog listings and social cards…"
                onChange={e => setExcerpt(e.target.value)}
                className={inputCls + " resize-none"}
              />
            </Section>

            {/* SEO */}
            <Section title="SEO & Meta">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <p className={labelCls + " mb-0"}>Meta Title</p>
                    <span className={`text-[10px] font-mono ${metaTitleLen > 60 ? "text-red-400" : "text-white/30"}`}>
                      {metaTitleLen}/60
                    </span>
                  </div>
                  <input type="text" value={metaTitle} placeholder={title || "Meta title…"}
                    onChange={e => setMetaTitle(e.target.value)} className={inputCls} />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <p className={labelCls + " mb-0"}>Meta Description</p>
                    <span className={`text-[10px] font-mono ${metaDescLen > 160 ? "text-red-400" : "text-white/30"}`}>
                      {metaDescLen}/160
                    </span>
                  </div>
                  <textarea rows={3} value={metaDescription} placeholder="Describe this post for search engines…"
                    onChange={e => setMetaDescription(e.target.value)} className={inputCls + " resize-none"} />
                </div>

                <div>
                  <p className={labelCls}>Focus Keyword</p>
                  <div className="relative">
                    <svg className="absolute left-3 top-3.5 w-4 h-4 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                    </svg>
                    <input type="text" value={focusKeyword} placeholder="e.g. car wash tips"
                      onChange={e => setFocusKeyword(e.target.value)}
                      className={inputCls + " pl-9"} />
                  </div>
                </div>

                {/* SEO preview card */}
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-3 font-semibold">Google Preview</p>
                  <div className="text-[#4d9cf6] text-base font-medium leading-snug truncate">
                    {metaTitle || title || "Post Title"}
                  </div>
                  <div className="text-[#4db87a] text-xs mt-0.5">
                    kleenkars.in/blog/{slug || "…"}
                  </div>
                  <div className="text-[#bdc1c6] text-sm mt-1 line-clamp-2 leading-relaxed">
                    {metaDescription || excerpt || "A compelling description will appear here."}
                  </div>
                </div>
              </div>
            </Section>

            {/* Media */}
            <Section title="Media">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ImageDropZone label="Featured Image" file={featuredImage} onFile={setFeaturedImage} />
                <ImageDropZone label="OpenGraph Image" file={ogImage} onFile={setOgImage} />
              </div>
            </Section>
          </div>

          {/* ── Right sidebar ──────────────────────────────────────────── */}
          <div className="w-72 shrink-0 space-y-5 sticky top-24">

            {/* AI Assistant */}
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.02] backdrop-blur-xl p-5 space-y-4 relative overflow-hidden group">
              {/* Decorative light */}
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-300"></div>

              <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="animate-pulse">✨</span> AI Content Engine
              </h3>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleAIReview}
                  disabled={aiLoading || !content}
                  className="w-full py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-white text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {aiLoading && aiAction === "review" ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Reviewing Content...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Review SEO & Suggestions
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleAIFormat}
                  disabled={aiLoading || !content}
                  className="w-full py-2.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-white text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {aiLoading && aiAction === "format" ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Formatting Blog...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                      </svg>
                      Fix Blog Formatting
                    </>
                  )}
                </button>
              </div>

              {/* AI review results */}
              {aiResults && (
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2">
                      <div className="text-white/40 text-[9px] uppercase tracking-wider font-semibold">SEO Score</div>
                      <div className={`text-lg font-bold ${aiResults.seoScore >= 80 ? "text-emerald-400" : aiResults.seoScore >= 50 ? "text-amber-400" : "text-red-400"}`}>
                        {aiResults.seoScore}/100
                      </div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2">
                      <div className="text-white/40 text-[9px] uppercase tracking-wider font-semibold">Readability</div>
                      <div className={`text-lg font-bold ${aiResults.readabilityScore >= 80 ? "text-emerald-400" : aiResults.readabilityScore >= 50 ? "text-amber-400" : "text-red-400"}`}>
                        {aiResults.readabilityScore}/100
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Suggestions:</div>
                    <ul className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {aiResults.suggestions.map((suggestion: string, idx: number) => (
                        <li key={idx} className="text-[11px] text-white/70 leading-normal flex items-start gap-1.5 bg-white/[0.01] border border-white/[0.03] p-1.5 rounded-lg">
                          <span className="text-indigo-400 shrink-0 mt-0.5">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {aiResults.isLocal && (
                    <div className="text-[9px] text-white/30 text-center italic bg-white/5 p-1 rounded">
                      Local Analysis (add GEMINI_API_KEY to .env for full LLM engine)
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Scheduling */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-5 space-y-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Publishing</h3>

              {/* Status display */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">Status</span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  status === "draft"     ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                  status === "published" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                                           "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"}`}>
                  {STATUS_OPTIONS.find(s => s.value === status)?.label}
                </span>
              </div>

              {/* Scheduled datetime */}
              {status === "scheduled" && (
                <div>
                  <p className={labelCls}>Publish Date &amp; Time</p>
                  <div className="relative">
                    <svg className="absolute left-3 top-3.5 w-4 h-4 text-white/30 pointer-events-none" fill="none"
                      stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="datetime-local"
                      value={publishAt}
                      onChange={e => setPublishAt(e.target.value)}
                      style={{ colorScheme: "dark" }}
                      className={`${inputCls} pl-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute`}
                    />
                  </div>
                  {publishAt && (
                    <p className="text-[11px] text-indigo-400 mt-2">
                      📅 {new Date(publishAt).toLocaleString("en-IN", {
                        weekday: "short", day: "numeric", month: "short",
                        year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Author */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-5 space-y-3">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Author</h3>
              <select value={authorId ?? ""} onChange={e => setAuthorId(Number(e.target.value) || null)}
                className={inputCls + " appearance-none cursor-pointer"}>
                <option value="">Select author</option>
                {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            {/* Categories */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-5 space-y-3">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {categories.length === 0 && <p className="text-white/25 text-xs">No categories yet</p>}
                {categories.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategories(prev =>
                      prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]
                    )}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all duration-150
                      ${selectedCategories.includes(c.id)
                        ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                        : "bg-white/5 border-white/10 text-white/50 hover:border-white/25 hover:text-white/70"}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-5 space-y-3">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.length === 0 && <p className="text-white/25 text-xs">No tags yet</p>}
                {tags.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTags(prev =>
                      prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id]
                    )}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all duration-150
                      ${selectedTags.includes(t.id)
                        ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                        : "bg-white/5 border-white/10 text-white/50 hover:border-white/25 hover:text-white/70"}`}
                  >
                    #{t.name}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </form>

      <style>{`
        input[type="datetime-local"]::-webkit-calendar-picker-indicator {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          opacity: 0.4;
          cursor: pointer;
          filter: invert(1);
        }
        input[type="datetime-local"]::-webkit-calendar-picker-indicator:hover {
          opacity: 0.8;
        }
        option {
          background: #0f0f14;
          color: white;
        }
      `}</style>
    </div>
  );
}
