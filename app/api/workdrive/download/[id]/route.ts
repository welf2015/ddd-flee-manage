import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { id } = params

    // Get document from database
    const { data: document, error } = await supabase.from("workdrive_documents").select("*").eq("id", id).single()

    if (error || !document) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Document Not Found</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .container { background: white; padding: 40px; border-radius: 8px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.1); max-width: 400px; }
            h1 { color: #333; margin: 0 0 10px 0; font-size: 24px; }
            p { color: #666; margin: 10px 0; }
            a { color: #667eea; text-decoration: none; font-weight: 500; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📄 Document Not Found</h1>
            <p>The document you're looking for doesn't exist or has been deleted.</p>
            <p><a href="/dashboard/workdrive">← Back to WorkDrive</a></p>
          </div>
        </body>
        </html>
        `,
        {
          status: 404,
          headers: { "Content-Type": "text/html" },
        },
      )
    }

    const fileResponse = await fetch(document.file_url)

    if (!fileResponse.ok) {
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>File Unavailable</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
            .container { background: white; padding: 40px; border-radius: 8px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.1); max-width: 400px; }
            h1 { color: #333; margin: 0 0 10px 0; font-size: 24px; }
            p { color: #666; margin: 10px 0; }
            a { color: #f5576c; text-decoration: none; font-weight: 500; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⚠️ File Unavailable</h1>
            <p>The file cannot be accessed at the moment. Please try again later.</p>
            <p><a href="/dashboard/workdrive">← Back to WorkDrive</a></p>
          </div>
        </body>
        </html>
        `,
        {
          status: 503,
          headers: { "Content-Type": "text/html" },
        },
      )
    }

    const filename = document.name.replace(/[^a-zA-Z0-9._-]/g, "_")

    // Get the file blob from R2
    const blob = await fileResponse.blob()

    return new NextResponse(blob, {
      headers: {
        "Content-Type": fileResponse.headers.get("Content-Type") || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    console.error("[v0] Download error:", error)

    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Server Error</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
          .container { background: white; padding: 40px; border-radius: 8px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.1); max-width: 400px; }
          h1 { color: #333; margin: 0 0 10px 0; font-size: 24px; }
          p { color: #666; margin: 10px 0; }
          a { color: #fa709a; text-decoration: none; font-weight: 500; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>😕 Oops! Something went wrong</h1>
          <p>We encountered an error while processing your request.</p>
          <p><a href="/dashboard/workdrive">← Back to WorkDrive</a></p>
        </div>
      </body>
      </html>
      `,
      {
        status: 500,
        headers: { "Content-Type": "text/html" },
      },
    )
  }
}
