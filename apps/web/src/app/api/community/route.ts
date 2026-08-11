import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlatformConfigBoolean, CONFIG_KEYS } from "@/lib/config";

export async function GET(req: Request) {
  try {
    const isEnabled = await getPlatformConfigBoolean(CONFIG_KEYS.COMMUNITY_ENABLED);
    const session = await getSession();
    const isAdmin = session?.role === "ADMIN" || session?.adminSubRole;

    if (!isEnabled && !isAdmin) {
      return NextResponse.json({ enabled: false, posts: [] });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where: { isDeleted: false, author: { deletedAt: null } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: { select: { name: true, avatar: true, role: true } },
          _count: { select: { comments: { where: { isDeleted: false } } } }
        }
      }),
      prisma.communityPost.count({
        where: { isDeleted: false, author: { deletedAt: null } }
      })
    ]);

    let isSubscribed = false;
    if (session) {
      if (session.role === "ADMIN" || session.adminSubRole || session.role === "MENTOR") {
        isSubscribed = true;
      } else {
        const user = await prisma.user.findUnique({
          where: { id: session.userId },
          include: { 
            subscriptions: { 
              where: { isActive: true, endDate: { gte: new Date() } } 
            } 
          }
        });
        if (user && user.subscriptions.length > 0) {
          isSubscribed = true;
        }
      }
    }

    const hasMore = (page * limit) < total;

    return NextResponse.json({ enabled: true, posts, isSubscribed, hasMore });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isEnabled = await getPlatformConfigBoolean(CONFIG_KEYS.COMMUNITY_ENABLED);
    if (!isEnabled) {
      return NextResponse.json({ error: "Community is disabled" }, { status: 403 });
    }

    const { content } = await req.json();
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    
    // Strip URLs and HTML
    const sanitizedContent = content
      .replace(/<[^>]*>?/gm, "") // HTML
      .replace(/(?:https?|ftp):\/\/[\n\S]+/g, "[Link removed]") // URLs
      .substring(0, 1000); // Max 1000 chars

    // Check privileges
    const user = await prisma.user.findUnique({ 
      where: { id: session.userId },
      include: { 
        subscriptions: { 
          where: { isActive: true, endDate: { gte: new Date() } } 
        } 
      }
    });
    
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isMentorOrAdmin = user.role === "ADMIN" || user.adminSubRole || user.role === "MENTOR";
    const isSubscribed = user.subscriptions.length > 0;

    if (!isMentorOrAdmin && !isSubscribed) {
      return NextResponse.json({ error: "You must have an active subscription to post in the community." }, { status: 403 });
    }

    // Rate Limiting
    if (!isMentorOrAdmin) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const postCount = await prisma.communityPost.count({
        where: {
          authorId: user.id,
          createdAt: { gte: today }
        }
      });

      if (postCount >= 5) {
        return NextResponse.json({ error: "You have reached your daily limit of 5 posts." }, { status: 429 });
      }
    }

    const post = await prisma.communityPost.create({
      data: {
        authorId: user.id,
        content: sanitizedContent
      },
      include: {
        author: { select: { name: true, avatar: true, role: true } },
        _count: { select: { comments: true } }
      }
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
