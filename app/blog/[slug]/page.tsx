import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const revalidate = 60; // Revalidate every minute

export default async function BlogPostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Query blog post detail directly from database
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: {
      author: true,
      categories: true,
      tags: true,
      featuredImage: true,
    },
  });

  if (!post || post.status !== "published") {
    notFound();
  }

  // Increment view count inside database background
  try {
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    });
  } catch (err) {
    console.error("Failed to increment blog post view count:", err);
  }

  return (
    <div className="min-h-screen bg-black text-white py-16 px-4 sm:px-6 lg:px-8">
      <article className="max-w-3xl mx-auto space-y-8">
        
        {/* Back Link */}
        <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
          <Link href="/blog" className="text-xs uppercase tracking-[0.25em] text-red-500 hover:text-red-400 transition-colors">
            ← Back to Blog
          </Link>
          <span className="text-[10px] text-gray-500 font-mono">
            {post.viewCount + 1} views
          </span>
        </div>

        {/* Header Block */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {post.categories.map((cat) => (
              <span key={cat.id} className="text-[10px] uppercase font-bold tracking-widest text-red-400 bg-red-950/30 border border-red-500/20 px-2 py-0.5 rounded">
                {cat.name}
              </span>
            ))}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="font-semibold text-white/80">By {post.author.name}</span>
            <span>•</span>
            <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' }) : ""}</span>
          </div>
        </div>

        {/* Featured Image */}
        {post.featuredImage?.url && (
          <div className="rounded-3xl overflow-hidden aspect-[16/9] border border-zinc-800/80 bg-zinc-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={post.featuredImage.url} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content Body */}
        <div className="prose prose-invert max-w-none text-gray-300 text-sm leading-relaxed space-y-6">
          {post.content.split("\n\n").map((para, i) => (
            <p key={i} className="whitespace-pre-line">
              {para}
            </p>
          ))}
        </div>

        {/* Tags Footer */}
        {post.tags.length > 0 && (
          <div className="pt-6 border-t border-zinc-900 flex flex-wrap gap-2 items-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">Tags:</span>
            {post.tags.map((tag) => (
              <span key={tag.id} className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-1 rounded-lg">
                #{tag.name}
              </span>
            ))}
          </div>
        )}

      </article>
    </div>
  );
}
