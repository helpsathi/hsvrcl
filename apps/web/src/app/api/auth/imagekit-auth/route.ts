import { NextResponse } from "next/server";
import ImageKit from "imagekit";
import { getSession } from "@/lib/auth";

const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "";
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || "";
const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "";

const isImageKitConfigured = Boolean(publicKey && privateKey && urlEndpoint);

const imagekit = isImageKitConfigured
  ? new ImageKit({ publicKey, privateKey, urlEndpoint })
  : null;

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!imagekit) {
      return NextResponse.json({ error: "ImageKit storage is not configured on the server" }, { status: 503 });
    }

    const authenticationParameters = imagekit.getAuthenticationParameters();
    return NextResponse.json(authenticationParameters);
  } catch (error) {
    console.error("ImageKit Auth Error:", error);
    return NextResponse.json({ error: "Failed to generate auth parameters" }, { status: 500 });
  }
}
