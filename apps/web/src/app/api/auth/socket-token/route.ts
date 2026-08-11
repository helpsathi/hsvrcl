import { NextResponse } from "next/server";
import { getSession, signToken } from "@/lib/auth";

export async function GET() {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    // Short-lived token just for socket auth (1 hour)
    const socketToken = await signToken(
        { userId: session.userId, role: session.role },
        "1h"
    );
    return NextResponse.json({ token: socketToken });
}
