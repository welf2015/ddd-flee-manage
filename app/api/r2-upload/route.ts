import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const filename = formData.get("filename") as string

    if (!file || !filename) {
      return NextResponse.json({ error: "File and filename required" }, { status: 400 })
    }

    // Upload to Vercel Blob for now (R2 integration requires R2 credentials)
    // You can replace this with R2 API calls when you have R2 credentials
    const { put } = await import("@vercel/blob")
    const blob = await put(filename, file, {
      access: "public",
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
