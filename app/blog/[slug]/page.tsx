import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const revalidate = 60; // Revalidate every minute

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: { featuredImage: true },
  });

  if (!post || post.status !== "published") {
    return {
      title: "Post Not Found",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kleenkars.in";
  const canonicalUrl = `${siteUrl}/blog/${post.slug}`;
  const description =
    post.excerpt ||
    post.content.slice(0, 160).replace(/\n/g, " ").trim() + "...";

  return {
    title: `${post.title} | Kleenkars Detailing Blog`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.title,
      description,
      url: canonicalUrl,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
      images: post.featuredImage?.url
        ? [{ url: post.featuredImage.url, alt: post.title }]
        : [{ url: "/logo.png", alt: "Kleenkars Car Detailing Aligarh" }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: post.featuredImage?.url ? [post.featuredImage.url] : ["/logo.png"],
    },
  };
}

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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kleenkars.in";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": siteUrl,
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Blog",
            "item": `${siteUrl}/blog`,
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": post.title,
            "item": `${siteUrl}/blog/${post.slug}`,
          },
        ],
      },
      {
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.excerpt || post.title,
        "image": post.featuredImage?.url ? [post.featuredImage.url] : [`${siteUrl}/logo.png`],
        "datePublished": post.publishedAt?.toISOString(),
        "dateModified": post.updatedAt?.toISOString(),
        "author": {
          "@type": "Person",
          "name": post.author.name,
        },
        "publisher": {
          "@type": "Organization",
          "name": "Kleenkars",
          "logo": {
            "@type": "ImageObject",
            "url": `${siteUrl}/logo.png`,
          },
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `${siteUrl}/blog/${post.slug}`,
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-black text-white py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
        {/* Back Link & Breadcrumb */}
        <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
          <Link
            href="/blog"
            className="text-xs uppercase tracking-[0.25em] text-red-500 hover:text-red-400 transition-colors"
          >
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
              <span
                key={cat.id}
                className="text-[10px] uppercase font-bold tracking-widest text-red-400 bg-red-950/30 border border-red-500/20 px-2 py-0.5 rounded"
              >
                {cat.name}
              </span>
            ))}
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="font-semibold text-white/80">By {post.author.name}</span>
            <span>•</span>
            <span>
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : ""}
            </span>
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
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">
              Tags:
            </span>
            {post.tags.map((tag) => (
              <span
                key={tag.id}
                className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-1 rounded-lg"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* CONTEXTUAL CALL TO ACTION BANNER */}
        <div className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-zinc-900 to-black border border-red-500/30 text-center space-y-4">
          <h3 className="text-xl font-bold text-white">Looking for Professional Car Detailing in Aligarh?</h3>
          <p className="text-gray-400 text-xs max-w-md mx-auto">
            Book our doorstep pickup service or visit our detailing studio on Anoop Shahar Rd for 9H Ceramic Coating, PPF, or Interior Spa.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-4">
            <Link
              href="/booking"
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition"
            >
              Book Service Online
            </Link>
            <Link
              href="/packages"
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition"
            >
              View Packages &amp; Pricing
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
