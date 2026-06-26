"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlassButton } from "@/components/ui/GlassButton";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface PostData {
  id: number;
  title: string;
  slug: string;
  content: string;
  categoryIds: number[];
  tagIds: number[];
  featuredImageId: number | null;
}

export default function EditPost() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);

  const [post, setPost] = useState<PostData | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [tags, setTags] = useState<{ id: number; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load post data + categories/tags
  useEffect(() => {
    if (!postId) return;
    (async () => {
      try {
        const [postRes, catRes, tagRes] = await Promise.all([
          fetch(`/api/blog/${postId}`),
          fetch(`/api/blog/categories`),
          fetch(`/api/blog/tags`),
        ]);
        if (!postRes.ok) throw new Error("Failed to load post");
        const postData = await postRes.json();
        const catData = await catRes.json();
        const tagData = await tagRes.json();
        setPost({
          id: postData.id,
          title: postData.title,
          slug: postData.slug,
          content: postData.content,
          categoryIds: postData.categories?.map((c: any) => c.id) ?? [],
          tagIds: postData.tags?.map((t: any) => t.id) ?? [],
          featuredImageId: postData.featuredImage?.id ?? null,
        });
        setCategories(catData);
        setTags(tagData);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [postId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/blog/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: post.title,
          slug: post.slug,
          content: post.content,
          categoryIds: post.categoryIds,
          tagIds: post.tagIds,
          featuredImageId: post.featuredImageId,
        }),
      });
      if (!res.ok) throw new Error("Update failed");
      router.push("/admin/blog");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (error) return <p className="text-red-400">{error}</p>;
  if (!post) return <p>Loading…</p>;

  return (
    <DashboardLayout title="Edit Blog Post">
      <GlassPanel className="max-w-3xl mx-auto mt-8">
        <h1 className="text-2xl font-bold mb-4">Edit Post</h1>
        <form onSubmit={submit} className="space-y-4">
          <input
            className="w-full p-2 rounded bg-white/10 text-white"
            value={post.title}
            onChange={e => setPost({ ...post, title: e.target.value })}
            placeholder="Title"
            required
          />
          <input
            className="w-full p-2 rounded bg-white/10 text-white"
            value={post.slug}
            onChange={e => setPost({ ...post, slug: e.target.value })}
            placeholder="Slug"
            required
          />
          <textarea
            className="w-full p-2 rounded bg-white/10 text-white h-48"
            value={post.content}
            onChange={e => setPost({ ...post, content: e.target.value })}
            placeholder="Content"
            required
          />
          {/* Category multiselect */}
          <label className="block text-sm font-medium">Categories</label>
          <select
            multiple
            className="w-full p-2 rounded bg-white/10 text-white"
            value={post.categoryIds.map(String)}
            onChange={e =>
              setPost({
                ...post,
                categoryIds: Array.from(e.target.selectedOptions, opt => Number(opt.value)),
              })
            }
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {/* Tag multiselect */}
          <label className="block text-sm font-medium">Tags</label>
          <select
            multiple
            className="w-full p-2 rounded bg-white/10 text-white"
            value={post.tagIds.map(String)}
            onChange={e =>
              setPost({
                ...post,
                tagIds: Array.from(e.target.selectedOptions, opt => Number(opt.value)),
              })
            }
          >
            {tags.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {/* Featured image */}
          <label className="block text-sm font-medium">Featured Image ID</label>
          <input
            type="number"
            className="w-full p-2 rounded bg-white/10 text-white"
            value={post.featuredImageId ?? ""}
            onChange={e =>
              setPost({
                ...post,
                featuredImageId: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
          {error && <p className="text-red-400">{error}</p>}
          <GlassButton type="submit" disabled={saving} className="bg-blue-600/20 hover:bg-blue-600/40">
            {saving ? "Saving…" : "Update Post"}
          </GlassButton>
        </form>
      </GlassPanel>
    </DashboardLayout>
  );
}
