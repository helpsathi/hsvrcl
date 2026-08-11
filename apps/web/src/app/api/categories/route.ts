import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_PRESET_CATEGORIES = [
  { id: "upsc", name: "UPSC & Civil Services", icon: "🏛️", description: "IAS, IPS, IFS toppers & state PSC rankers" },
  { id: "engineering", name: "JEE & Engineering", icon: "⚙️", description: "IIT JEE Advanced, Mains, BITSAT mentors" },
  { id: "medical", name: "NEET & Medical", icon: "🩺", description: "NEET UG, AIIMS rankers & medical students" },
  { id: "software", name: "Software & Tech", icon: "💻", description: "FAANG engineers, system design, coding interviews" },
  { id: "mba", name: "CAT & MBA", icon: "📈", description: "IIM alumni, CAT 99+ percentilers, consulting mentors" },
  { id: "finance", name: "CA & Finance", icon: "💰", description: "Chartered Accountants, CFA charterholders & banking pros" },
  { id: "study-abroad", name: "Study Abroad & GRE", icon: "✈️", description: "GRE/GMAT 330+, Ivy League admits & scholarship winners" },
  { id: "gate", name: "GATE & PSU", icon: "⚡", description: "Top rankers in CS, EE, ME & PSU recruitments" },
];

export async function GET() {
  try {
    const config = await prisma.platformConfig.findUnique({
      where: { key: "DASHBOARD_CATEGORIES" },
    });

    let categories: Array<{ id?: string; name: string; icon?: string; description?: string }> = [];

    if (config?.value) {
      try {
        const parsed = JSON.parse(config.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          categories = parsed.map((cat: any) => typeof cat === "string" ? { name: cat } : cat);
        }
      } catch (e) {
        categories = [];
      }
    }

    if (categories.length === 0) {
      categories = DEFAULT_PRESET_CATEGORIES;
    }

    // Get mentor counts by category from verified mentors
    const verifiedMentors = await prisma.mentorProfile.findMany({
      where: { status: "APPROVED" },
      select: { categories: true },
    });

    const countsByCategory: Record<string, number> = {};
    for (const mentor of verifiedMentors) {
      if (Array.isArray(mentor.categories)) {
        for (const catName of mentor.categories) {
          if (catName) {
            const normalized = catName.trim().toLowerCase();
            countsByCategory[normalized] = (countsByCategory[normalized] || 0) + 1;
          }
        }
      }
    }

    const categoriesWithCount = categories.map((cat) => {
      const name = cat.name;
      const count = countsByCategory[name.toLowerCase()] || 0;
      return {
        ...cat,
        mentorCount: count,
      };
    });

    return NextResponse.json({
      success: true,
      categories: categoriesWithCount,
      totalMentors: verifiedMentors.length,
    });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json({
      success: true,
      categories: DEFAULT_PRESET_CATEGORIES.map((c) => ({ ...c, mentorCount: 0 })),
      totalMentors: 0,
    });
  }
}
