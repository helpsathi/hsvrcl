import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (Math.max(page, 1) - 1) * limit;

    const isOnline = searchParams.get("isOnline");
    const category = searchParams.get("category");
    const minRating = searchParams.get("minRating") || searchParams.get("rating");
    const maxPrice = searchParams.get("maxPrice") || searchParams.get("price");
    const query = searchParams.get("query") || searchParams.get("search");

    const whereClause: any = { status: "APPROVED", user: { deletedAt: null, isSuspended: false } };

    if (isOnline === "true") {
      whereClause.isOnline = true;
    }

    if (category && category !== "All" && category.trim() !== "") {
      whereClause.categories = { hasSome: category.split(",").map((c) => c.trim()) };
    }

    if (minRating && !isNaN(Number(minRating)) && Number(minRating) > 0) {
      whereClause.avgRating = { gte: Number(minRating) };
    }

    if (maxPrice && !isNaN(Number(maxPrice)) && Number(maxPrice) > 0) {
      whereClause.perMinutePrice = { lte: Number(maxPrice) };
    }

    if (query && query.trim() !== "") {
      const searchTerm = query.trim();
      whereClause.OR = [
        { user: { name: { contains: searchTerm, mode: "insensitive" } } },
        { bio: { contains: searchTerm, mode: "insensitive" } },
        { categories: { hasSome: [searchTerm] } },
        { skills: { hasSome: [searchTerm] } },
      ];
    }

    const [mentors, total] = await Promise.all([
      prisma.mentorProfile.findMany({
        where: whereClause,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { isOnline: "desc" }, // Online mentors first
        skip,
        take: limit,
      }),
      prisma.mentorProfile.count({ where: whereClause })
    ]);

    const formattedMentors = mentors.map((m: any) => ({
      id: m.userId, // We use userId here so we can initiate chat with the User
      profileId: m.id, // MentorProfile ID for navigating to profile
      name: m.user.name,
      avatar: m.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.user.name)}&background=random`,
      verified: true, // Assuming APPROVED means verified
      tagline: m.bio || "Expert Mentor",
      languages: m.languages.length ? m.languages : ["English"],
      categories: m.categories || [],
      experience: m.experience,
      rating: m.avgRating > 0 ? m.avgRating : 0,
      reviews: m.reviewCount,
      isOnline: m.isOnline,
      pricePerMinute: m.perMinutePrice,
      callPricePerMinute: m.callPricePerMinute ?? m.perMinutePrice,
      monthlyPrice: m.monthlyPrice > 0 ? m.monthlyPrice : undefined,
    }));

    return NextResponse.json({
      success: true,
      mentors: formattedMentors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit))
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
      }
    });
  } catch (error: any) {
    console.error("Fetch Mentors Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
