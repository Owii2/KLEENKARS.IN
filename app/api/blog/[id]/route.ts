import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET a single blog post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = Number(id);

    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
      include: { author: true, categories: true, tags: true, featuredImage: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Get single post error:", error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

// UPDATE a single blog post (PUT)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = Number(id);

    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const body = await request.json();
    const {
      title,
      content,
      slug,
      excerpt,
      metaTitle,
      metaDescription,
      focusKeyword,
      featuredImageUrl,
      openGraphImageUrl,
      authorId,
      categoryIds,
      tagIds,
      status,
      publishAt,
    } = body;

    if (!title || !content || !slug) {
      return NextResponse.json({ error: "Title, content, and slug are required" }, { status: 400 });
    }

    // Resolve featured media ID if URL is provided
    let featuredImageId: number | null = null;
    if (featuredImageUrl) {
      const media = await prisma.media.findFirst({
        where: { url: featuredImageUrl }
      });
      if (media) {
        featuredImageId = media.id;
      } else {
        const newMedia = await prisma.media.create({
          data: { url: featuredImageUrl, altText: title }
        });
        featuredImageId = newMedia.id;
      }
    }

    let publishedAtDate: Date | null = null;
    if (status === 'published') {
      publishedAtDate = new Date();
    } else if (status === 'scheduled' && publishAt) {
      publishedAtDate = new Date(publishAt);
    }

    // Clean up current categories/tags and connect new ones
    const post = await prisma.blogPost.update({
      where: { id: postId },
      data: {
        title,
        content,
        slug,
        excerpt,
        status: status || 'draft',
        publishedAt: publishedAtDate,
        seoTitle: metaTitle || null,
        seoDescription: metaDescription || null,
        focusKeyword: focusKeyword || null,
        openGraphImageUrl: openGraphImageUrl || null,
        featuredImageId: featuredImageId,
        categories: {
          set: [], // Disconnect old categories
          connect: categoryIds?.map((cid: number) => ({ id: cid })) || []
        },
        tags: {
          set: [], // Disconnect old tags
          connect: tagIds?.map((tid: number) => ({ id: tid })) || []
        },
      },
      include: { author: true, categories: true, tags: true, featuredImage: true },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("Update blog post error:", error);
    return NextResponse.json({ error: "Failed to update post: " + (error as Error).message }, { status: 500 });
  }
}

// DELETE a single blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postId = Number(id);

    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    // First delete any scheduled task references to avoid foreign key errors
    await prisma.scheduledPost.deleteMany({
      where: { postId: postId }
    });

    await prisma.blogPost.delete({
      where: { id: postId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete blog post error:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
