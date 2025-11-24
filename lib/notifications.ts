"use server"

import { createClient } from "@/lib/supabase/server"
import {
  sendEmailNotification,
  generateBookingApprovalEmail,
  generateBookingStatusChangeEmail,
  generateNegotiationEmail,
  generatePaymentReceivedEmail,
  generateIncidentReportEmail,
  generateTopupEmail,
} from "./email"

const ROLE_MD_ED = ["MD", "ED"]
const ROLE_OPERATIONS = ["Head of Operations"]
const ROLE_ACCOUNTANT = ["Accountant"]

const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "http://localhost:3000")

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

type Profile = {
  id: string
  email: string | null
  full_name: string | null
  role: string
}

async function getProfilesByRoles(roles: string[], supabase: SupabaseServerClient): Promise<Profile[]> {
  if (!roles.length) return []
  const { data } = await supabase.from("profiles").select("id, email, full_name, role").in("role", roles)
  return data || []
}

async function getProfileById(id: string, supabase: SupabaseServerClient) {
  if (!id) return null
  const { data } = await supabase.from("profiles").select("id, email, full_name, role").eq("id", id).single()
  return data || null
}

const uniqueById = (profiles: Profile[]) => {
  const seen = new Set<string>()
  return profiles.filter((p) => {
    if (!p?.id || seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
}

export async function notifyAdminsForBookingApproval(bookingData: {
  jobId: string
  clientName: string
  route: string
  budget: number
  createdBy: string
  bookingId?: string
}) {
  const supabase = await createClient()

  const admins = await getProfilesByRoles(ROLE_MD_ED, supabase)

  if (!admins.length) {
    console.log("No admins found to notify")
    return
  }

  // Get creator name
  const creator = await getProfileById(bookingData.createdBy, supabase)

  const emailData = await generateBookingApprovalEmail({
    ...bookingData,
    requesterName: creator?.full_name || "Unknown",
    dashboardUrl: DASHBOARD_URL,
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
  const { data: changer } = await supabase.from("profiles").select("full_name").eq("id", data.changedBy).single()

  const emailData = await generateBookingStatusChangeEmail({
    ...data,
    changedBy: changer?.full_name || "Unknown",
    dashboardUrl: DASHBOARD_URL,
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

export async function notifyNegotiationEvent(params: {
  bookingId: string
  amount: number
  initiatedByUserId: string
  initiatedByRole: string
  eventType: "proposed" | "counter" | "approved"
}) {
  const supabase = await createClient()
  const { data: booking } = await supabase
    .from("bookings")
    .select("job_id, client_name, created_by")
    .eq("id", params.bookingId)
    .single()

  if (!booking) return

  const initiator = await getProfileById(params.initiatedByUserId, supabase)
  const recipients: Profile[] = []

  if (params.initiatedByRole === "MD" || params.initiatedByRole === "ED") {
    recipients.push(...(await getProfilesByRoles(ROLE_OPERATIONS, supabase)))
    if (booking.created_by) {
      const creator = await getProfileById(booking.created_by, supabase)
      if (creator) recipients.push(creator)
    }
  } else {
    recipients.push(...(await getProfilesByRoles(ROLE_MD_ED, supabase)))
  }

  if (params.eventType === "approved") {
    recipients.push(...(await getProfilesByRoles(ROLE_OPERATIONS, supabase)))
  }

  const uniqueRecipients = uniqueById(recipients)
  const emails = uniqueRecipients.map((p) => p.email).filter(Boolean) as string[]

  if (emails.length > 0) {
    const emailData = await generateNegotiationEmail({
      jobId: booking.job_id,
      clientName: booking.client_name,
      amount: params.amount,
      initiatedBy: initiator?.full_name || "Team Member",
      eventType: params.eventType,
      dashboardUrl: DASHBOARD_URL,
    })

    await sendEmailNotification({
      to: emails,
      ...emailData,
    })
  }

  if (uniqueRecipients.length > 0) {
    await supabase.from("notifications").insert(
      uniqueRecipients.map((recipient) => ({
        user_id: recipient.id,
        title: "Booking negotiation update",
        message: `${booking.job_id} updated by ${initiator?.full_name || "team member"} (${params.eventType})`,
        type: "Booking",
        related_id: params.bookingId,
        read: false,
      })),
    )
  }
}

export async function notifyPaymentReceived(bookingId: string, markedBy: string) {
  const supabase = await createClient()

  const { data: booking } = await supabase
    .from("bookings")
    .select("job_id, client_name, current_negotiation_amount, proposed_client_budget")
    .eq("id", bookingId)
    .single()

  if (!booking) return

  const marker = await getProfileById(markedBy, supabase)
  const amount = Number(booking.current_negotiation_amount) || Number(booking.proposed_client_budget) || undefined

  const recipients = uniqueById([
    ...(await getProfilesByRoles([...new Set([...ROLE_MD_ED, ...ROLE_ACCOUNTANT])], supabase)),
  ])

  const emails = recipients.map((p) => p.email).filter(Boolean) as string[]
  if (emails.length > 0) {
    const emailData = await generatePaymentReceivedEmail({
      jobId: booking.job_id,
      clientName: booking.client_name,
      amount: amount || 0,
      markedBy: marker?.full_name || "Team member",
      dashboardUrl: DASHBOARD_URL,
    })

    await sendEmailNotification({
      to: emails,
      ...emailData,
    })
  }

  if (recipients.length > 0) {
    await supabase.from("notifications").insert(
      recipients.map((recipient) => ({
        user_id: recipient.id,
        title: "Payment confirmed",
        message: `Booking ${booking.job_id} marked as Paid by ${marker?.full_name || "team member"}.`,
        type: "Finance",
        related_id: bookingId,
        read: false,
      })),
    )
  }
}

export async function notifyIncidentCreated(payload: {
  incidentNumber: string
  severity: string
  vehicleLabel?: string | null
  location?: string | null
  reportedBy: string
}) {
  const supabase = await createClient()
  const reporter = await getProfileById(payload.reportedBy, supabase)
  const recipients = uniqueById([
    ...(await getProfilesByRoles(ROLE_MD_ED, supabase)),
    ...(await getProfilesByRoles(ROLE_OPERATIONS, supabase)),
  ])

  const emails = recipients.map((p) => p.email).filter(Boolean) as string[]
  if (emails.length > 0) {
    const emailData = await generateIncidentReportEmail({
      incidentNumber: payload.incidentNumber,
      severity: payload.severity,
      vehicle: payload.vehicleLabel,
      location: payload.location,
      reportedBy: reporter?.full_name || "Team member",
      dashboardUrl: DASHBOARD_URL,
    })

    await sendEmailNotification({
      to: emails,
      ...emailData,
    })
  }

  if (recipients.length > 0) {
    await supabase.from("notifications").insert(
      recipients.map((recipient) => ({
        user_id: recipient.id,
        title: `Incident ${payload.incidentNumber} reported`,
        message: `${payload.severity || "Incident"} logged${payload.vehicleLabel ? ` - ${payload.vehicleLabel}` : ""}`,
        type: "Incident",
        related_id: null,
        read: false,
      })),
    )
  }
}

export async function notifyTopup(data: {
  accountId: string
  amount: number
  depositedBy: string
  receiptNumber?: string
}) {
  const supabase = await createClient()
  const { data: account } = await supabase
    .from("prepaid_accounts")
    .select("account_name, vendor:expense_vendors(vendor_name)")
    .eq("id", data.accountId)
    .single<{ account_name: string; vendor: { vendor_name: string | null } | null }>()

  if (!account) return

  const depositor = await getProfileById(data.depositedBy, supabase)
  const recipients = uniqueById([
    ...(await getProfilesByRoles([...new Set([...ROLE_MD_ED, ...ROLE_ACCOUNTANT])], supabase)),
  ])

  const emails = recipients.map((p) => p.email).filter(Boolean) as string[]
  if (emails.length > 0) {
    const emailData = await generateTopupEmail({
      accountName: account.account_name,
      vendorType: account.vendor?.vendor_name || "Prepaid Account",
      amount: data.amount,
      depositedBy: depositor?.full_name || "Team member",
      receiptNumber: data.receiptNumber,
      dashboardUrl: DASHBOARD_URL,
    })

    await sendEmailNotification({
      to: emails,
      ...emailData,
    })
  }

  if (recipients.length > 0) {
    await supabase.from("notifications").insert(
      recipients.map((recipient) => ({
        user_id: recipient.id,
        title: `${account.vendor?.vendor_name || "Prepaid"} top-up`,
        message: `${account.account_name} received ₦${data.amount.toLocaleString()}`,
        type: "Finance",
        related_id: null,
        read: false,
      })),
    )
  }
}
