import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlatformConfigBoolean, CONFIG_KEYS } from "@/lib/config";

export async function GET(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const isEnabled = await getPlatformConfigBoolean(CONFIG_KEYS.COMMUNITY_ENABLED);

    if (!isEnabled) return NextResponse.json({ enabled: false, comments: [] });

    const { postId } = await params;
    const comments = await prisma.communityComment.findMany({
      where: { postId, isDeleted: false },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { name: true, avatar: true, role: true } } }
    });

    return NextResponse.json({ enabled: true, comments });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isEnabled = await getPlatformConfigBoolean(CONFIG_KEYS.COMMUNITY_ENABLED);
    if (!isEnabled) {
      return NextResponse.json({ error: "Community is disabled" }, { status: 403 });
    }

    const { postId } = await params;
    const { content } = await req.json();
    
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    
    const sanitizedContent = content
      .replace(/<[^>]*>?/gm, "")
      .replace(/(?:https?|ftp):\/\/[\n\S]+/g, "[Link removed]")
      .substring(0, 500);

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
      return NextResponse.json({ error: "You must have an active subscription to comment." }, { status: 403 });
    }

    if (!isMentorOrAdmin) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const commentCount = await prisma.communityComment.count({
        where: { authorId: user.id, createdAt: { gte: today } }
      });

      if (commentCount >= 10) {
        return NextResponse.json({ error: "You have reached your daily limit of 10 comments." }, { status: 429 });
      }
    }

    const comment = await prisma.communityComment.create({
      data: { postId, authorId: user.id, content: sanitizedContent },
      include: { author: { select: { name: true, avatar: true, role: true } } }
    });

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
