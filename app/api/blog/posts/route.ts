import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const posts = await prisma.blogPost.findMany({
    select: { id: true, title: true, slug: true, createdAt: true, viewCount: true, likeCount: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  try {
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

    // Ensure we have an author
    let finalAuthorId = authorId;
    if (!finalAuthorId) {
      let author = await prisma.author.findFirst();
      if (!author) {
        author = await prisma.author.create({
          data: {
            name: "Kleenkars Admin",
            email: "admin@kleenkars.in",
            bio: "Official Kleenkars Admin",
          },
        });
      }
      finalAuthorId = author.id;
    }

    // Find featured media if URL is provided
    let featuredImageId: number | undefined;
    if (featuredImageUrl) {
      const media = await prisma.media.findFirst({
        where: { url: featuredImageUrl }
      });
      if (media) {
        featuredImageId = media.id;
      } else {
        // Create media entry if url isn't in database
        const newMedia = await prisma.media.create({
          data: { url: featuredImageUrl, altText: title }
        });
        featuredImageId = newMedia.id;
      }
    }

    // Determine publishedAt date
    let publishedAtDate: Date | null = null;
    if (status === 'published') {
      publishedAtDate = new Date();
    } else if (status === 'scheduled' && publishAt) {
      publishedAtDate = new Date(publishAt);
    }

    const post = await prisma.blogPost.create({
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
        authorId: finalAuthorId,
        featuredImageId: featuredImageId || null,
        categories: {
          connect: categoryIds?.map((id: number) => ({ id })) || []
        },
        tags: {
          connect: tagIds?.map((id: number) => ({ id })) || []
        },
      },
      include: { author: true, categories: true, tags: true, featuredImage: true },
    });

    // If scheduled, also create a ScheduledPost entry
    if (status === 'scheduled' && publishedAtDate) {
      await prisma.scheduledPost.create({
        data: {
          postId: post.id,
          scheduledFor: publishedAtDate,
          timezone: 'IST', // Default timezone
          status: 'queued',
        }
      });
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Blog post creation error:", error);
    return NextResponse.json({ error: "Failed to create blog post: " + (error as Error).message }, { status: 500 });
  }
}
