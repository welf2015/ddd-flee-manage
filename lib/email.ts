"use server"

type EmailPayload = {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

type BookingApprovalEmailInput = {
  jobId: string
  clientName: string
  route: string
  budget: number
  requesterName: string
  dashboardUrl: string
}

type BookingStatusEmailInput = {
  jobId: string
  clientName: string
  oldStatus: string
  newStatus: string
  changedBy: string
  dashboardUrl: string
}

const RESEND_API_URL = "https://api.resend.com/emails"

const getFromEmail = () => {
  return (
    process.env.RESEND_FROM_EMAIL ||
    process.env.NOTIFICATION_FROM_EMAIL ||
    "Fleet Manager <notifications@voltaamobility.com>"
  )
}

export async function sendEmailNotification({ to, subject, html, text }: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.warn("[notifications] RESEND_API_KEY not configured. Email not sent.")
    return
  }

  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean)

  if (recipients.length === 0) {
    console.warn("[notifications] No recipients provided for email.")
    return
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: getFromEmail(),
      to: recipients,
      subject,
      html,
      text,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error("[notifications] Failed to send email:", response.status, errorBody)
  }
}

export function generateBookingApprovalEmail({
  jobId,
  clientName,
  route,
  budget,
  requesterName,
  dashboardUrl,
}: BookingApprovalEmailInput) {
  const formattedBudget = budget ? `₦${budget.toLocaleString()}` : "N/A"

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2 style="color:#003e31;">New Booking Awaiting Approval</h2>
      <p>A new booking requires your attention.</p>
      <table style="width:100%; border-collapse:collapse;">
        <tr>
          <td style="padding:4px 0;"><strong>Job ID:</strong></td>
          <td style="padding:4px 0;">${jobId}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;"><strong>Client:</strong></td>
          <td style="padding:4px 0;">${clientName}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;"><strong>Route:</strong></td>
          <td style="padding:4px 0;">${route || "N/A"}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;"><strong>Budget:</strong></td>
          <td style="padding:4px 0;">${formattedBudget}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;"><strong>Requested By:</strong></td>
          <td style="padding:4px 0;">${requesterName}</td>
        </tr>
      </table>
      <p style="margin-top:16px;">
        <a href="${dashboardUrl}/dashboard/bookings" style="background-color:#003e31;color:#fff;padding:10px 16px;text-decoration:none;border-radius:4px;">Review Booking</a>
      </p>
      <p style="color:#6b7280;font-size:12px;margin-top:24px;">
        This is an automated message from Volta Mobility's Fleet Manager.
      </p>
    </div>
  `

  return {
    subject: `Booking ${jobId} requires approval`,
    html,
    text: `Booking ${jobId} (${clientName}) requires approval. Route: ${route}. Budget: ${formattedBudget}. Requested by ${requesterName}.`,
  }
}

export function generateBookingStatusChangeEmail({
  jobId,
  clientName,
  oldStatus,
  newStatus,
  changedBy,
  dashboardUrl,
}: BookingStatusEmailInput) {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2 style="color:#003e31;">Booking Status Updated</h2>
      <p>The status for booking <strong>${jobId}</strong> has changed.</p>
      <table style="width:100%; border-collapse:collapse;">
        <tr>
          <td style="padding:4px 0;"><strong>Client:</strong></td>
          <td style="padding:4px 0;">${clientName}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;"><strong>Previous Status:</strong></td>
          <td style="padding:4px 0;">${oldStatus}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;"><strong>New Status:</strong></td>
          <td style="padding:4px 0;">${newStatus}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;"><strong>Changed By:</strong></td>
          <td style="padding:4px 0;">${changedBy}</td>
        </tr>
      </table>
      <p style="margin-top:16px;">
        <a href="${dashboardUrl}/dashboard/bookings" style="background-color:#003e31;color:#fff;padding:10px 16px;text-decoration:none;border-radius:4px;">View Booking</a>
      </p>
      <p style="color:#6b7280;font-size:12px;margin-top:24px;">
        This is an automated message from Volta Mobility's Fleet Manager.
      </p>
    </div>
  `

  return {
    subject: `Booking ${jobId} status changed to ${newStatus}`,
    html,
    text: `Booking ${jobId} (${clientName}) status changed from ${oldStatus} to ${newStatus} by ${changedBy}.`,
  }
}


