import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const revalidate = 60; // Revalidate every minute

export default async function BlogListPage() {
  // Query all published blog posts from database directly
  const posts = await prisma.blogPost.findMany({
    where: {
      status: "published",
      publishedAt: {
        lte: new Date(),
      },
    },
    include: {
      author: true,
      categories: true,
      tags: true,
      featuredImage: true,
    },
    orderBy: {
      publishedAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-black text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <Link href="/" className="text-xs uppercase tracking-[0.3em] text-red-500 hover:text-red-400 transition-colors">
            ← Back to Homepage
          </Link>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mt-4">
            The Kleenkars Blog
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto text-sm leading-relaxed">
            Professional car wash guides, detailing techniques, company news, and auto care tips from Aligarh's premium detailers.
          </p>
        </div>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-3xl bg-zinc-950/20 backdrop-blur-xl">
            <span className="text-4xl">📚</span>
            <p className="text-gray-400 text-sm mt-4">No articles published yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article 
                key={post.id} 
                className="flex flex-col bg-zinc-950/40 border border-zinc-800/60 rounded-3xl overflow-hidden hover:border-red-500/40 hover:shadow-2xl hover:shadow-red-500/5 transition-all duration-300 group"
              >
                {/* Featured Image */}
                <div className="relative aspect-[16/10] overflow-hidden bg-zinc-900 border-b border-zinc-800/40">
                  {post.featuredImage?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={post.featuredImage.url} 
                      alt={post.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-950/80">
                      🚗 Kleenkars Care
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    {/* Categories */}
                    <div className="flex flex-wrap gap-2">
                      {post.categories.map((cat) => (
                        <span key={cat.id} className="text-[10px] uppercase font-bold tracking-widest text-red-400 bg-red-950/30 border border-red-500/20 px-2 py-0.5 rounded">
                          {cat.name}
                        </span>
                      ))}
                    </div>

                    <Link href={`/blog/${post.slug}`} className="block">
                      <h2 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors leading-snug">
                        {post.title}
                      </h2>
                    </Link>

                    <p className="text-gray-400 text-xs line-clamp-3 leading-relaxed">
                      {post.excerpt || "Click to read this full vehicle care guide and detailing tutorial."}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-zinc-900 flex items-center justify-between text-[10px] text-gray-500">
                    <span className="font-semibold text-white/80">By {post.author.name}</span>
                    <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : ""}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
