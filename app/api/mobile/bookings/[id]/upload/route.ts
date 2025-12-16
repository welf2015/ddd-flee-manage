import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Auth check
    const authHeader = request.headers.get("Authorization")
    let user = null

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1]
      const { data } = await supabase.auth.getUser(token)
      user = data.user
    } else {
      const { data } = await supabase.auth.getUser()
      user = data.user
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get file from form data
    const formData = await request.formData()
    const file = formData.get("file") as File
    const documentType = formData.get("document_type") as string // "Waybill" or "Fuel Receipt"

    if (!file) {
      return NextResponse.json({
        success: false,
        error: "File is required"
      }, { status: 400 })
    }

    if (!documentType || !["Waybill", "Fuel Receipt"].includes(documentType)) {
      return NextResponse.json({
        success: false,
        error: "Valid document_type is required (Waybill or Fuel Receipt)"
      }, { status: 400 })
    }

    // Get R2 upload config
    const workerUrl = process.env.R2_UPLOAD_WORKER_URL
    const authKey = process.env.R2_UPLOAD_AUTH_KEY

    if (!workerUrl || !authKey) {
      throw new Error("Upload service not configured")
    }

    // Sanitize filename - remove spaces and special chars
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const folder = documentType === "Waybill" ? "waybills" : "fuel-receipts"

    // Upload to R2
    const uploadUrl = new URL(workerUrl)
    uploadUrl.searchParams.set("filename", sanitizedFilename)
    uploadUrl.searchParams.set("folder", `${folder}/${params.id}`)

    const uploadRes = await fetch(uploadUrl.toString(), {
      method: "PUT",
      headers: {
        "X-Auth-Key": authKey,
        "Content-Type": file.type,
      },
      body: file,
    })

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text()
      console.error("R2 upload error:", errorText)
      throw new Error("Failed to upload file to storage")
    }

    const uploadData = await uploadRes.json()
    const fileUrl = uploadData.url || uploadData.key

    // Save to database
    const { error: dbError } = await supabase.from("waybill_uploads").insert({
      booking_id: params.id,
      file_url: fileUrl,
      file_name: sanitizedFilename,
      file_type: file.type,
      document_type: documentType,
      uploaded_by: user.id,
    })

    if (dbError) throw dbError

    // Add timeline entry
    await supabase.from("job_timeline").insert({
      booking_id: params.id,
      action_type: `${documentType} Uploaded`,
      action_by: user.id,
      notes: `${documentType} document uploaded via mobile`,
    })

    return NextResponse.json({
      success: true,
      file_url: fileUrl,
      message: `${documentType} uploaded successfully`
    })
  } catch (error: any) {
    console.error("[MOBILE API] Upload document error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to upload document"
    }, { status: 500 })
  }
}
