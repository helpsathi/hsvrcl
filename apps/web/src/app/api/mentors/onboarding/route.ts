import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncMentorAvailability } from "@/lib/mentor-availability";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      bio, 
      categories, 
      skills, 
      languages, 
      experience, 
      perMinutePrice, 
      callPricePerMinute, 
      monthlyPrice, 
      linkedinUrl, 
      resumeUrl, 
      availability, 
      username,
      freeTrial
    } = body;

    // Validation
    if (!bio || !categories || !skills || !languages || experience === undefined || !perMinutePrice || !resumeUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if mentor profile already exists
    const existingProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.userId },
    });

    if (existingProfile && existingProfile.status === "APPROVED") {
      return NextResponse.json({ error: "You are already an approved mentor." }, { status: 400 });
    }

    let cleanUsername: string | undefined = undefined;
    if (username && typeof username === "string" && username.trim() !== "") {
      cleanUsername = username.trim().toLowerCase();
      if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
        return NextResponse.json({ error: "Username must be 3-20 characters, letters, numbers and underscores only." }, { status: 400 });
      }

      // Check if taken by another mentor
      const taken = await prisma.mentorProfile.findFirst({ 
        where: { 
          username: cleanUsername,
          NOT: { userId: session.userId }
        }, 
        select: { id: true } 
      });
      if (taken) {
        return NextResponse.json({ error: "Username is already taken by another mentor." }, { status: 400 });
      }
    }

    // Document URL validation
    if (resumeUrl && !resumeUrl.startsWith("http://") && !resumeUrl.startsWith("https://") && !resumeUrl.startsWith("data:") && !resumeUrl.startsWith("/")) {
      return NextResponse.json({ error: "Invalid resume URL format" }, { status: 400 });
    }

    // Create or Update Mentor Profile inside a transaction
    await prisma.$transaction(async (tx) => {
      let profileId: string;
      if (existingProfile) {
        // User is re-applying or updating their pending/rejected application
        const updated = await tx.mentorProfile.update({
          where: { userId: session.userId },
          data: {
            username: cleanUsername !== undefined ? cleanUsername : existingProfile.username,
            bio,
            linkedinUrl: linkedinUrl || null,
            categories,
            skills,
            languages,
            experience: Number(experience),
            perMinutePrice: Number(perMinutePrice),
            callPricePerMinute: callPricePerMinute !== undefined ? Number(callPricePerMinute) : Number(perMinutePrice),
            monthlyPrice: Number(monthlyPrice) || 0,
            availability: availability || {},
            resumeUrl,
            status: "PENDING", // Reset to pending for admin review
            rejectionReason: null, // Clear previous rejection reason
            freeTrial: Boolean(freeTrial),
          },
        });
        profileId = updated.id;
      } else {
        // First time application
        const created = await tx.mentorProfile.create({
          data: {
            userId: session.userId,
            username: cleanUsername,
            bio,
            linkedinUrl: linkedinUrl || null,
            categories,
            skills,
            languages,
            experience: Number(experience),
            perMinutePrice: Number(perMinutePrice),
            callPricePerMinute: callPricePerMinute !== undefined ? Number(callPricePerMinute) : Number(perMinutePrice),
            monthlyPrice: Number(monthlyPrice) || 0,
            availability: availability || {},
            resumeUrl,
            status: "PENDING",
            rejectionReason: null,
            freeTrial: Boolean(freeTrial),
            commissionRate: 30, // Default for new mentors
          },
        });
        profileId = created.id;
      }

      // Automatically sync mentor availability slots
      if (availability) {
        await syncMentorAvailability(tx, profileId, availability);
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: existingProfile ? "Application updated and re-submitted successfully!" : "Mentor application submitted successfully!" 
    });

  } catch (error: any) {
    console.error("Mentor Onboarding Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
