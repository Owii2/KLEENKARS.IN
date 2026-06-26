import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let authors = await prisma.author.findMany();
    if (authors.length === 0) {
      // Seed a default author
      const defaultAuthor = await prisma.author.create({
        data: {
          name: "Kleenkars Admin",
          email: "admin@kleenkars.in",
          bio: "Official Kleenkars Admin",
        },
      });
      authors = [defaultAuthor];
    }
    return NextResponse.json(authors);
  } catch (error) {
    console.error("Authors fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch authors" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, bio } = await request.json();
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }
    const author = await prisma.author.create({
      data: { name, email, bio },
    });
    return NextResponse.json(author, { status: 201 });
  } catch (error) {
    console.error("Author create error:", error);
    return NextResponse.json({ error: "Failed to create author" }, { status: 500 });
  }
}
