import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/rbac";

export async function DELETE(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;

    const existingPost = await prisma.communityPost.findUnique({
      where: { id: postId }
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (session.role === "MENTOR") {
      if (existingPost.authorId !== session.userId) {
        return NextResponse.json({ error: "Forbidden: You can only delete your own posts" }, { status: 403 });
      }
    } else {
      const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] });
      if (!auth.authorized) return auth.response!;
    }

    const post = await prisma.communityPost.update({
      where: { id: postId },
      data: { isDeleted: true, deletedBy: session.userId }
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "MENTOR") {
      const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] });
      if (!auth.authorized) return auth.response!;
    }

    const { postId } = await params;
    const { content, isDeleted } = await req.json();

    const existingPost = await prisma.communityPost.findUnique({
      where: { id: postId }
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (session.role === "MENTOR" && existingPost.authorId !== session.userId) {
      return NextResponse.json({ error: "Forbidden: You can only edit your own posts" }, { status: 403 });
    }
    
    const dataToUpdate: any = {};
    if (content) {
      dataToUpdate.content = content
        .replace(/<[^>]*>?/gm, "")
        .replace(/(?:https?|ftp):\/\/[\n\S]+/g, "[Link removed]")
        .substring(0, 1000);
      dataToUpdate.editedAt = new Date();
    }
    if (isDeleted !== undefined) {
      dataToUpdate.isDeleted = Boolean(isDeleted);
    }

    const post = await prisma.communityPost.update({
      where: { id: postId },
      data: dataToUpdate
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
