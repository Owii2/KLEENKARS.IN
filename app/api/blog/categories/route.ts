import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let categories = await prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    });

    if (categories.length === 0) {
      // Seed default categories
      const defaults = [
        { name: "Car Care", slug: "car-care" },
        { name: "Detailing", slug: "detailing" },
        { name: "Maintenance", slug: "maintenance" },
        { name: "News & Updates", slug: "news-updates" },
      ];
      await prisma.category.createMany({
        data: defaults,
        skipDuplicates: true,
      });
      categories = await prisma.category.findMany({
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Categories fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
