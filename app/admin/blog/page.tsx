"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlassButton } from "@/components/ui/GlassButton";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface Post {
  id: number;
  title: string;
  slug: string;
  createdAt: string;
  viewCount: number;
  likeCount: number;
}

export default function AdminBlogList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/blog/posts");
        if (!res.ok) throw new Error("Failed to load posts");
        const data = await res.json();
        setPosts(data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const deletePost = async (id: number) => {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/blog/${id}`, { method: "DELETE" });
    if (res.ok) setPosts(posts.filter(p => p.id !== id));
    else alert("Delete failed");
  };

  return (
    <DashboardLayout title="Blog Posts Management">
      <GlassPanel className="max-w-5xl mx-auto mt-8">
        <h1 className="text-2xl font-bold mb-4">Blog Posts</h1>
        <GlassButton className="mb-4">
          <Link href="/admin/blog/create">Create New Post</Link>
        </GlassButton>
        {loading && <p>Loading…</p>}
        {error && <p className="text-red-400">{error}</p>}
        <table className="w-full table-auto text-left">
          <thead>
            <tr className="border-b">
              <th className="p-2">Title</th>
              <th className="p-2">Slug</th>
              <th className="p-2">Views</th>
              <th className="p-2">Likes</th>
              <th className="p-2">Created</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(p => (
              <tr key={p.id} className="border-b hover:bg-white/5 transition">
                <td className="p-2">{p.title}</td>
                <td className="p-2">{p.slug}</td>
                <td className="p-2">{p.viewCount}</td>
                <td className="p-2">{p.likeCount}</td>
                <td className="p-2">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="p-2 space-x-2">
                  <GlassButton>
                    <Link href={`/admin/blog/${p.id}/edit`}>Edit</Link>
                  </GlassButton>
                  <GlassButton
                    className="bg-red-600/20 hover:bg-red-600/40"
                    onClick={() => deletePost(p.id)}
                  >
                    Delete
                  </GlassButton>
                  <GlassButton>
                    <Link href={`/blog/${p.slug}`} target="_blank">View</Link>
                  </GlassButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassPanel>
    </DashboardLayout>
  );
}
