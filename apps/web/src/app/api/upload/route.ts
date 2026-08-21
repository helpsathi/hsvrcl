import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_S3_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB Limit

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
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
    
    // Create a unique filename
    const uniqueFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const objectKey = `uploads/${session.userId}/${uniqueFilename}`;
    const bucketName = process.env.AWS_S3_BUCKET || "helpsathi-uploads";

    let url: string;
    try {
      await s3.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: buffer,
        ContentType: file.type,
      }));
      
      const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || `https://${bucketName}.s3.${process.env.AWS_S3_REGION || "ap-south-1"}.amazonaws.com`;
      url = `${cdnUrl}/${objectKey}`;
    } catch (s3Error: any) {
      console.warn("S3 upload failed, falling back to base64 data URI storage:", s3Error.message || s3Error);
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
