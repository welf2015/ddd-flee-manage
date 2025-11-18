"use server"

import { createClient } from "@/lib/supabase/server"
import { sendEmailNotification, generateBookingApprovalEmail, generateBookingStatusChangeEmail } from "./email"

export async function notifyAdminsForBookingApproval(bookingData: {
  jobId: string
  clientName: string
  route: string
  budget: number
  createdBy: string
  bookingId?: string
}) {
  const supabase = await createClient()

  // Get MD and ED profiles
  const { data: admins } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .in("role", ["MD", "ED"])

  if (!admins || admins.length === 0) {
    console.log("No admins found to notify")
    return
  }

  // Get creator name
  const { data: creator } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", bookingData.createdBy)
    .single()

  const dashboardUrl = process.env.NEXT_PUBLIC_VERCEL_URL 
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : "http://localhost:3000"

  const emailData = generateBookingApprovalEmail({
    ...bookingData,
    requesterName: creator?.full_name || "Unknown",
    dashboardUrl,
  })

  // Send emails to all admins
  const adminEmails = admins.filter((a) => a.email).map((a) => a.email!)
  
  if (adminEmails.length > 0) {
    await sendEmailNotification({
      to: adminEmails,
      ...emailData,
    })
  }

  // Create in-app notifications
  const notifications = admins.map((admin) => ({
    user_id: admin.id,
    title: "New Booking Approval Required",
    message: `Booking ${bookingData.jobId} from ${bookingData.clientName} requires your approval`,
    type: "Approval",
    related_id: bookingData.bookingId || null,
    read: false,
  }))

  await supabase.from("notifications").insert(notifications)
}

export async function notifyStatusChange(data: {
  jobId: string
  clientName: string
  oldStatus: string
  newStatus: string
  changedBy: string
  notifyRoles: string[]
  bookingId?: string
}) {
  const supabase = await createClient()

  // Get users with specified roles
  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .in("role", data.notifyRoles)

  if (!users || users.length === 0) {
    return
  }

  // Get person who made the change
  const { data: changer } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", data.changedBy)
    .single()

  const dashboardUrl = process.env.NEXT_PUBLIC_VERCEL_URL 
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : "http://localhost:3000"

  const emailData = generateBookingStatusChangeEmail({
    ...data,
    changedBy: changer?.full_name || "Unknown",
    dashboardUrl,
  })

  // Send emails
  const userEmails = users.filter((u) => u.email).map((u) => u.email!)
  
  if (userEmails.length > 0) {
    await sendEmailNotification({
      to: userEmails,
      ...emailData,
    })
  }

  // Create in-app notifications
  const notifications = users.map((user) => ({
    user_id: user.id,
    title: `Booking ${data.jobId} Status Updated`,
    message: `Status changed from ${data.oldStatus} to ${data.newStatus}`,
    type: "Booking",
    related_id: data.bookingId || null,
    read: false,
  }))

  await supabase.from("notifications").insert(notifications)
}
