import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SERVICES_DATA } from "@/lib/services-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kleenkars.in";

  // Service landing page routes
  const serviceSlugs = Object.keys(SERVICES_DATA);
  const serviceRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...serviceSlugs.map((slug) => ({
      url: `${baseUrl}/services/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];

  // Core static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/packages`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/booking`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/franchise`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // Dynamic blog posts from database
  try {
    const posts = await prisma.blogPost.findMany({
      where: {
        status: "published",
        publishedAt: {
          lte: new Date(),
        },
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...serviceRoutes, ...blogRoutes];
  } catch (error) {
    console.error("Error generating sitemap for blog posts:", error);
    return [...staticRoutes, ...serviceRoutes];
  }
}
