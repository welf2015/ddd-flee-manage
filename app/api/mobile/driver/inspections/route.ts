import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { vehicleId, odometerReading, checklist, photos } = body

    // Create inspection record
    const { data: inspection, error: inspectionError } = await supabase
      .from("vehicle_inspections")
      .insert({
        vehicle_id: vehicleId,
        inspector_id: user.id,
        inspection_date: new Date().toISOString(),
        odometer_reading: odometerReading,
        inspection_type: "Pre-Trip",
        status: "Completed",
        ...checklist,
      })
      .select()
      .single()

    if (inspectionError) {
      return NextResponse.json({ error: inspectionError.message }, { status: 400 })
    }

    // Save photos with watermarks
    if (photos && photos.length > 0) {
      const photoInserts = photos.map((photo: any) => ({
        inspection_id: inspection.id,
        photo_url: photo.url,
        gps_latitude: photo.latitude,
        gps_longitude: photo.longitude,
        captured_at: photo.capturedAt,
      }))

      await supabase.from("inspection_photos").insert(photoInserts)
    }

    return NextResponse.json({ success: true, inspection })
  } catch (error) {
    console.error("[v0] Inspection submission error:", error)
    return NextResponse.json({ error: "Failed to submit inspection" }, { status: 500 })
  }
}
