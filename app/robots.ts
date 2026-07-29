import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kleenkars.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/staff",
          "/staff/*",
          "/manager",
          "/manager/*",
          "/api/",
          "/api/*",
          "/customer/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
