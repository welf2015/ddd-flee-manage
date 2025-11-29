import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get document from database
    const { data: document, error } = await supabase
      .from("workdrive_documents")
      .select("file_url, name, file_type")
      .eq("id", id)
      .single()

    if (error || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Fetch the file from the worker URL
    const fileResponse = await fetch(document.file_url)

    if (!fileResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 })
    }

    // Get the file content
    const fileBuffer = await fileResponse.arrayBuffer()

    // Determine content type
    const contentType = fileResponse.headers.get("content-type") || "application/octet-stream"

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${document.name}"`,
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch (error) {
    console.error("Error proxying download:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
