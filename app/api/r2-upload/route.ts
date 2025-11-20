import { NextResponse } from "next/server"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const r2Client =
  process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
    ? new S3Client({
        region: "auto",
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      })
    : null

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = (formData.get("folder") as string) || "voltaa"

    if (!file) {
      return NextResponse.json({ error: "File required" }, { status: 400 })
    }

    if (!r2Client) {
      console.log("[v0] R2 not configured, using Vercel Blob")
      const { put } = await import("@vercel/blob")
      const blob = await put(`${folder}/${file.name}`, file, {
        access: "public",
      })
      return NextResponse.json({ url: blob.url })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const key = `${folder}/${Date.now()}-${file.name}`

    await r2Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || "meeting",
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }),
    )

    const url = `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`

    return NextResponse.json({ url })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
