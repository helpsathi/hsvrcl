import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, DEFAULT_TRANSACTION_OPTIONS } from "@/lib/prisma";
import { dispatchNotification } from "@/lib/notifications";
import { requireAdminPermission } from "@/lib/rbac";
import { syncMentorAvailability } from "@/lib/mentor-availability";
import { formatDatabaseError } from "@/lib/errors";
import { validatePhoneNumber } from "@/lib/phoneValidation";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "SUPPORT", "MODERATOR"] });
    if (!auth.authorized) return auth.response!;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (Math.max(page, 1) - 1) * limit;

    const whereClause = status ? { status: status as any } : undefined;

    const [mentors, total] = await Promise.all([
      prisma.mentorProfile.findMany({
        where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
            createdAt: true,
          }
        }
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.mentorProfile.count({ where: whereClause })
    ]);

    return NextResponse.json({ 
      mentors, 
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    });
  } catch (error: any) {
    console.error("GET /api/admin/mentors error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN"] });
    if (!auth.authorized) return auth.response!;

    const body = await req.json();
    const { userId, bio, linkedinUrl, categories, skills, languages, experience, monthlyPrice, perMinutePrice, callPricePerMinute, commissionRate, freeTrial, subscribedBookingFree } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required to create mentor profile" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { role: "MENTOR" },
      });

      const mentor = await tx.mentorProfile.upsert({
        where: { userId },
        update: {
          status: "APPROVED",
          bio: bio || null,
          linkedinUrl: linkedinUrl || null,
          categories: Array.isArray(categories) ? categories : [],
          skills: Array.isArray(skills) ? skills : [],
          experience: Number(experience) || 0,
          monthlyPrice: Number(monthlyPrice) || 0,
          perMinutePrice: Number(perMinutePrice) || 15,
          callPricePerMinute: callPricePerMinute !== undefined ? Number(callPricePerMinute) : (Number(perMinutePrice) || 15),
          commissionRate: commissionRate !== undefined ? Number(commissionRate) : undefined,
          freeTrial: Boolean(freeTrial),
          subscribedBookingFree: subscribedBookingFree !== undefined ? Boolean(subscribedBookingFree) : true,
        },
        create: {
          userId,
          status: "APPROVED",
          bio: bio || null,
          linkedinUrl: linkedinUrl || null,
          categories: Array.isArray(categories) ? categories : [],
          skills: Array.isArray(skills) ? skills : [],
          languages: Array.isArray(languages) ? languages : [],
          experience: Number(experience) || 0,
          monthlyPrice: Number(monthlyPrice) || 0,
          perMinutePrice: Number(perMinutePrice) || 15,
          callPricePerMinute: callPricePerMinute !== undefined ? Number(callPricePerMinute) : (Number(perMinutePrice) || 15),
          commissionRate: commissionRate !== undefined ? Number(commissionRate) : null,
          freeTrial: Boolean(freeTrial),
          subscribedBookingFree: subscribedBookingFree !== undefined ? Boolean(subscribedBookingFree) : true,
        },
      });

      return mentor;
    }, DEFAULT_TRANSACTION_OPTIONS);

    await prisma.auditLog.create({
      data: {
        userId: session?.userId || null,
        action: "MENTOR_CREATE_ADMIN",
        targetId: result.id,
        details: `Created/approved mentor profile for user ${user.email}`,
      },
    });

    await dispatchNotification({
      userId,
      title: "🎉 You are now a Mentor!",
      message: "An administrator has directly activated and approved your HelpSathi mentor profile. Welcome abroad!",
      type: "ACCOUNT",
      link: "/mentor-dashboard",
    });

    return NextResponse.json({ success: true, mentor: result });
  } catch (error: any) {
    console.error("POST /api/admin/mentors error:", error);
    const friendlyMsg = formatDatabaseError(error, "Failed to create mentor profile. Please try again.");
    return NextResponse.json({ error: friendlyMsg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] });
    if (!auth.authorized) return auth.response!;

    const body = await req.json();
    const { 
      id, 
      userId, 
      name, 
      phone, 
      email, 
      username, 
      bio, 
      linkedinUrl, 
      resumeUrl, 
      categories, 
      skills, 
      languages, 
      experience, 
      monthlyPrice, 
      perMinutePrice, 
      callPricePerMinute, 
      commissionRate, 
      availability, 
      freeTrial, 
      subscribedBookingFree, 
      holidayMode, 
      status 
    } = body;

    if (!id && !userId) {
      return NextResponse.json({ error: "mentor profile id or userId required" }, { status: 400 });
    }

    const mentorProfile = await prisma.mentorProfile.findFirst({
      where: {
        OR: [
          ...(id ? [{ id }] : []),
          ...(userId ? [{ userId }] : []),
        ]
      }
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (bio !== undefined) updateData.bio = bio;
    if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl;
    if (resumeUrl !== undefined) updateData.resumeUrl = resumeUrl;
    if (categories !== undefined) updateData.categories = Array.isArray(categories) ? categories : [];
    if (skills !== undefined) updateData.skills = Array.isArray(skills) ? skills : [];
    if (languages !== undefined) updateData.languages = Array.isArray(languages) ? languages : [];
    if (experience !== undefined) updateData.experience = Number(experience);
    if (monthlyPrice !== undefined) updateData.monthlyPrice = Number(monthlyPrice);
    if (perMinutePrice !== undefined) updateData.perMinutePrice = Number(perMinutePrice);
    if (callPricePerMinute !== undefined) updateData.callPricePerMinute = Number(callPricePerMinute);
    if (commissionRate !== undefined) updateData.commissionRate = Number(commissionRate);
    if (availability !== undefined) updateData.availability = availability;
    if (freeTrial !== undefined) updateData.freeTrial = Boolean(freeTrial);
    if (subscribedBookingFree !== undefined) updateData.subscribedBookingFree = Boolean(subscribedBookingFree);
    if (holidayMode !== undefined) updateData.holidayMode = Boolean(holidayMode);
    if (status !== undefined) updateData.status = status;

    if (username !== undefined) {
      const cleanUsername = username ? username.trim().toLowerCase() : null;
      if (cleanUsername) {
        const taken = await prisma.mentorProfile.findFirst({
          where: {
            username: cleanUsername,
            id: { not: mentorProfile.id }
          }
        });
        if (taken) {
          return NextResponse.json({ error: `Username @${cleanUsername} is already taken by another mentor.` }, { status: 400 });
        }
      }
      updateData.username = cleanUsername;
    }

    if (phone !== undefined && phone && phone.trim()) {
      const phoneValidation = validatePhoneNumber(phone);
      if (!phoneValidation.isValid) {
        return NextResponse.json({ error: phoneValidation.error || "Invalid mobile number" }, { status: 400 });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (name !== undefined || phone !== undefined || email !== undefined) {
        const userUpdate: any = {};
        if (name !== undefined) userUpdate.name = name.trim();
        if (phone !== undefined) {
          if (phone && phone.trim()) {
            const phoneValidation = validatePhoneNumber(phone);
            userUpdate.phone = phoneValidation.cleanPhone;
          } else {
            userUpdate.phone = null;
          }
        }
        if (email !== undefined) userUpdate.email = email.trim();
        await tx.user.update({
          where: { id: mentorProfile.userId },
          data: userUpdate,
        });
      }

      const prof = await tx.mentorProfile.update({
        where: { id: mentorProfile.id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              role: true,
              createdAt: true,
            }
          }
        }
      });

      if (availability !== undefined) {
        await syncMentorAvailability(tx, mentorProfile.id, availability);
      }

      return prof;
    }, DEFAULT_TRANSACTION_OPTIONS);

    await prisma.auditLog.create({
      data: {
        userId: session?.userId || null,
        action: "MENTOR_UPDATE_ADMIN",
        targetId: updated.id,
        details: JSON.stringify({ ...updateData, name, phone, email }),
      },
    });

    await dispatchNotification({
      userId: updated.userId,
      title: "✨ Mentor Profile Updated by Admin",
      message: "An administrator has updated details on your mentor application.",
      type: "ACCOUNT",
      link: "/mentor-dashboard",
    });

    return NextResponse.json({ success: true, mentor: updated });
  } catch (error: any) {
    console.error("PATCH /api/admin/mentors error:", error);
    const friendlyMsg = formatDatabaseError(error, "Failed to update mentor profile. Please try again.");
    return NextResponse.json({ error: friendlyMsg }, { status: 500 });
  }
}
