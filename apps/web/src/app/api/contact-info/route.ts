import { NextResponse } from "next/server";
import { getPlatformConfig, CONFIG_KEYS } from "@/lib/config";

export async function GET() {
  try {
    const formUrl = await getPlatformConfig(CONFIG_KEYS.CONTACT_FORM_URL);
    return NextResponse.json({
      success: true,
      contactFormUrl: formUrl || "https://docs.google.com/forms/d/e/1FAIpQLSc_EXAMPLE_GOOGLE_FORM/viewform?embedded=true",
    });
  } catch (error) {
    console.error("GET /api/contact-info error:", error);
    return NextResponse.json({
      success: true,
      contactFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSc_EXAMPLE_GOOGLE_FORM/viewform?embedded=true",
    });
  }
}
