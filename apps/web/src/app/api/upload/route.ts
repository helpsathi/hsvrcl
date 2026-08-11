import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "",
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB Limit

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    const isImage = file.type.startsWith("image/") || file.name.toLowerCase().endsWith(".svg") || file.name.toLowerCase().endsWith(".ico");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      return NextResponse.json({ error: "Only image formats (JPG, PNG, WEBP, GIF, SVG, ICO) and PDF documents are allowed" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let url: string;
    try {
      const response = await imagekit.upload({
        file: buffer,
        fileName: file.name,
        folder: "/helpsathi_chat_attachments",
      });
      url = response.url;
    } catch (ikError: any) {
      console.warn("ImageKit cloud upload failed, falling back to base64 data URI storage:", ikError.message || ikError);
      url = `data:${file.type};base64,${buffer.toString("base64")}`;
    }

    return NextResponse.json({
      success: true,
      url,
      fileName: file.name,
      fileType: file.type.startsWith("image/") ? "IMAGE" : "PDF",
    });
  } catch (error: any) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
  }
}
