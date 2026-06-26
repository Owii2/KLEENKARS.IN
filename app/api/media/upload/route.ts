import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate safe unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.name) || ".png";
    const filename = `${uniqueSuffix}${ext}`;
    const filePath = path.join(uploadDir, filename);

    // Save file
    await fs.writeFile(filePath, buffer);
    const url = `/uploads/${filename}`;

    // Save to database Media model
    const media = await prisma.media.create({
      data: {
        url,
        altText: file.name,
      },
    });

    return NextResponse.json({ url, id: media.id });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
