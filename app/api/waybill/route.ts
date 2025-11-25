import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const fileUrl = searchParams.get("url")
  const bookingId = searchParams.get("bookingId")

  if (!fileUrl) {
    return NextResponse.json({ error: "File URL required" }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user has access to this booking
    if (bookingId) {
      const { data: booking } = await supabase
        .from("bookings")
        .select("id")
        .eq("id", bookingId)
        .single()

      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 })
      }
    }

    // Extract the file path from the R2 URL
    // R2 URL format: https://{account-id}.r2.cloudflarestorage.com/{bucket-name}/{key}
    // or: https://fleet-r2-upload.mrolabola.workers.dev/{key}
    let filePath = ""
    if (fileUrl.includes("workers.dev")) {
      // Already a worker URL, use it directly
      filePath = fileUrl
    } else if (fileUrl.includes("r2.cloudflarestorage.com")) {
      // Extract the key from R2 URL
      const urlObj = new URL(fileUrl)
      const pathParts = urlObj.pathname.split("/")
      const bucketName = pathParts[1]
      const key = pathParts.slice(2).join("/")
      // Use Cloudflare Worker to fetch the file
      const workerUrl = process.env.R2_UPLOAD_WORKER_URL || "https://fleet-r2-upload.mrolabola.workers.dev"
      filePath = `${workerUrl}/${key}`
    } else {
      // Try to use the URL as-is
      filePath = fileUrl
    }

    // Fetch the file from Cloudflare Worker (which has access to R2)
    const response = await fetch(filePath, {
      headers: {
        Accept: "*/*",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Failed to fetch file from worker:", errorText)
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream"
    const fileBuffer = await response.arrayBuffer()

    // Return the file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${fileUrl.split("/").pop()}"`,
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error: any) {
    console.error("Error fetching waybill:", error)
    console.error("File URL:", fileUrl)
    return NextResponse.json({ error: `Failed to fetch file: ${error.message}` }, { status: 500 })
  }
}
