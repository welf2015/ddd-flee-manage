import { NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
})

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = formData.get("folder") as string || "voltaa" // Default to "voltaa" subfolder

    if (!file) {
      return NextResponse.json({ error: "File required" }, { status: 400 })
    }

    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID) {
      console.log("[v0] R2 not configured, using Vercel Blob")
      const { put } = await import("@vercel/blob")
      const blob = await put(`${folder}/${file.name}`, file, {
        access: "public",
      })
      return NextResponse.json({ url: blob.url })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const key = `${folder}/${Date.now()}-${file.name}` // voltaa/timestamp-filename.ext

    await r2Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || "meeting",
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    )

    const url = `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`
    
    return NextResponse.json({ url })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
