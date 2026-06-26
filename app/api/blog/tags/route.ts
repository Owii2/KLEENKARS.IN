import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let tags = await prisma.tag.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    });

    if (tags.length === 0) {
      // Seed default tags
      const defaults = [
        { name: "DIY", slug: "diy" },
        { name: "Ceramic Coating", slug: "ceramic-coating" },
        { name: "Eco Friendly", slug: "eco-friendly" },
        { name: "Polishing", slug: "polishing" },
        { name: "Interior Cleaning", slug: "interior-cleaning" },
      ];
      await prisma.tag.createMany({
        data: defaults,
        skipDuplicates: true,
      });
      tags = await prisma.tag.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json(tags);
  } catch (error) {
    console.error("Tags fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}
