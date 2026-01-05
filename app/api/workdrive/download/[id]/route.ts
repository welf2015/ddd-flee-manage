import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { id } = params

    // Get document from database
    const { data: document, error } = await supabase.from("workdrive_documents").select("*").eq("id", id).single()

    if (error || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Get file from Blob storage using the stored file_url
    const fileResponse = await fetch(document.file_url)

    if (!fileResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 })
    }

    const filename = document.name.replace(/[^a-zA-Z0-9._-]/g, "_")

    // Get the file blob
    const blob = await fileResponse.blob()

    return new NextResponse(blob, {
      headers: {
        "Content-Type": document.file_type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
