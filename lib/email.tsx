"use server"

type EmailPayload = {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

type TemplateRow = { label: string; value: string }

type TemplateOptions = {
  dashboardUrl: string
  title: string
  intro: string
  rows?: TemplateRow[]
  cta?: { label: string; url: string }
  badge?: { label: string; tone?: "success" | "warning" | "danger" | "info" }
  footerNote?: string
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

type NegotiationEmailInput = {
  jobId: string
  clientName: string
  amount: number
  initiatedBy: string
  eventType: "proposed" | "counter" | "approved"
  dashboardUrl: string
}

type PaymentEmailInput = {
  jobId: string
  clientName: string
  amount: number
  markedBy: string
  dashboardUrl: string
}

type IncidentEmailInput = {
  incidentNumber: string
  severity: string
  vehicle?: string | null
  location?: string | null
  reportedBy: string
  dashboardUrl: string
}

type TopupEmailInput = {
  accountName: string
  vendorType: string
  amount: number
  depositedBy: string
  receiptNumber?: string
  dashboardUrl: string
}

const RESEND_API_URL = "https://api.resend.com/emails"
const DEFAULT_BASE_URL = "https://fleet.voltaamobility.com"

const getFromEmail = () => {
  return (
    process.env.RESEND_FROM_EMAIL ||
    process.env.NOTIFICATION_FROM_EMAIL ||
    "Fleet Manager <notification@fleet.voltaamobility.com>"
  )
}

const resolveBaseUrl = (dashboardUrl?: string) => {
  if (dashboardUrl) return dashboardUrl.replace(/\/$/, "")
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL.replace(/\/$/, "")}`
  }
  return DEFAULT_BASE_URL
}

const toneToColor = (tone?: "success" | "warning" | "danger" | "info") => {
  switch (tone) {
    case "success":
      return "#16a34a"
    case "warning":
      return "#d97706"
    case "danger":
      return "#dc2626"
    case "info":
    default:
      return "#2563eb"
  }
}

function renderEmailLayout({ dashboardUrl, title, intro, rows = [], cta, badge, footerNote }: TemplateOptions) {
  const baseUrl = resolveBaseUrl(dashboardUrl)
  const logoUrl = `${baseUrl}/logo.png`
  const badgeColor = badge ? toneToColor(badge.tone) : undefined

  const rowsHtml = rows
    .map(
      (row) => `
        <tr>
          <td style="padding:8px 0;color:#4b5563;font-weight:500;width:35%;">${row.label}</td>
          <td style="padding:8px 0;color:#111827;">${row.value}</td>
        </tr>
      `,
    )
    .join("")

  return `
    <div style="background:#f3f4f6;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="padding:24px 32px 16px;background:#f8fafc;border-bottom:1px solid #e5e7eb;">
          <table width="100%">
            <tr>
              <td style="vertical-align:middle;">
                <img src="${logoUrl}" alt="Fleet Manager" style="height:32px;display:block;" />
              </td>
              <td style="text-align:right;font-size:12px;color:#64748b;">${new Date().toLocaleString()}</td>
            </tr>
          </table>
          <h1 style="margin:16px 0 4px;font-size:22px;color:#0f172a;">${title}</h1>
          ${badge ? `<span style="display:inline-block;margin-top:4px;padding:4px 12px;font-size:12px;border-radius:999px;background:${badgeColor}1a;color:${badgeColor};">${badge.label}</span>` : ""}
          <p style="margin:12px 0 0;color:#475569;">${intro}</p>
        </div>
        ${
          rows.length
            ? `<div style="padding:24px 32px;">
                <table width="100%" style="border-collapse:collapse;">${rowsHtml}</table>
              </div>`
            : ""
        }
        ${
          cta
            ? `<div style="padding:0 32px 32px;">
                <a href="${cta.url}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600;">${cta.label}</a>
              </div>`
            : ""
        }
        <div style="padding:16px 32px;border-top:1px solid #e5e7eb;background:#f8fafc;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">
            ${footerNote || "This is an automated notification from the Volta Mobility Fleet Management platform."}
          </p>
        </div>
      </div>
    </div>
  `
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

export async function generateBookingApprovalEmail({
  jobId,
  clientName,
  route,
  budget,
  requesterName,
  dashboardUrl,
}: BookingApprovalEmailInput) {
  const formattedBudget = budget ? `₦${budget.toLocaleString()}` : "N/A"

  return {
    subject: `Booking ${jobId} requires approval`,
    html: renderEmailLayout({
      dashboardUrl,
      title: "New booking awaiting your approval",
      intro: "A team member has submitted a new booking that requires approval.",
      rows: [
        { label: "Job ID", value: jobId },
        { label: "Client", value: clientName },
        { label: "Route", value: route || "N/A" },
        { label: "Proposed Budget", value: formattedBudget },
        { label: "Requested By", value: requesterName },
      ],
      cta: {
        label: "Review booking",
        url: `${resolveBaseUrl(dashboardUrl)}/dashboard/bookings/${encodeURIComponent(jobId)}`,
      },
    }),
    text: `Booking ${jobId} (${clientName}) requires approval. Route: ${route}. Budget: ${formattedBudget}. Requested by ${requesterName}.`,
  }
}

export async function generateBookingStatusChangeEmail({
  jobId,
  clientName,
  oldStatus,
  newStatus,
  changedBy,
  dashboardUrl,
}: BookingStatusEmailInput) {
  return {
    subject: `Booking ${jobId} status changed to ${newStatus}`,
    html: renderEmailLayout({
      dashboardUrl,
      title: `Booking ${jobId} status updated`,
      intro: "A booking in your fleet has a new status update.",
      rows: [
        { label: "Client", value: clientName },
        { label: "Previous Status", value: oldStatus },
        { label: "New Status", value: newStatus },
        { label: "Updated By", value: changedBy },
      ],
      cta: {
        label: "View booking timeline",
        url: `${resolveBaseUrl(dashboardUrl)}/dashboard/bookings/${encodeURIComponent(jobId)}`,
      },
    }),
    text: `Booking ${jobId} (${clientName}) status changed from ${oldStatus} to ${newStatus} by ${changedBy}.`,
  }
}

export async function generateNegotiationEmail({
  jobId,
  clientName,
  amount,
  initiatedBy,
  eventType,
  dashboardUrl,
}: NegotiationEmailInput) {
  const eventLabel =
    eventType === "proposed"
      ? "Negotiation Proposed"
      : eventType === "counter"
        ? "Counter Offer Submitted"
        : "Negotiation Approved"

  return {
    subject: `${eventLabel}: ${jobId} (${clientName})`,
    html: renderEmailLayout({
      dashboardUrl,
      title: eventLabel,
      intro: `${initiatedBy} has ${eventType === "approved" ? "approved" : "submitted"} an update on booking ${jobId}.`,
      rows: [
        { label: "Job ID", value: jobId },
        { label: "Client", value: clientName },
        { label: "Amount", value: `₦${amount.toLocaleString()}` },
        { label: "Initiated By", value: initiatedBy },
      ],
      cta: {
        label: "Review negotiation",
        url: `${resolveBaseUrl(dashboardUrl)}/dashboard/bookings/${encodeURIComponent(jobId)}?tab=negotiations`,
      },
    }),
    text: `${initiatedBy} ${eventType === "approved" ? "approved" : "submitted"} ₦${amount.toLocaleString()} for booking ${jobId} (${clientName}).`,
  }
}

export async function generatePaymentReceivedEmail({
  jobId,
  clientName,
  amount,
  markedBy,
  dashboardUrl,
}: PaymentEmailInput) {
  return {
    subject: `Payment recorded for ${jobId}`,
    html: renderEmailLayout({
      dashboardUrl,
      title: "Booking marked as Paid",
      intro: `Payment has been confirmed for booking ${jobId}.`,
      rows: [
        { label: "Job ID", value: jobId },
        { label: "Client", value: clientName },
        { label: "Amount", value: amount ? `₦${amount.toLocaleString()}` : "See booking" },
        { label: "Marked By", value: markedBy },
      ],
      cta: {
        label: "Open booking",
        url: `${resolveBaseUrl(dashboardUrl)}/dashboard/bookings/${encodeURIComponent(jobId)}`,
      },
    }),
    text: `Payment recorded for booking ${jobId} (${clientName}) by ${markedBy}. Amount: ₦${amount?.toLocaleString?.() || "N/A"}.`,
  }
}

export async function generateIncidentReportEmail({
  incidentNumber,
  severity,
  vehicle,
  location,
  reportedBy,
  dashboardUrl,
}: IncidentEmailInput) {
  return {
    subject: `Incident ${incidentNumber} reported (${severity})`,
    html: renderEmailLayout({
      dashboardUrl,
      title: `Incident ${incidentNumber} reported`,
      intro: "A new incident has been logged and requires review.",
      badge: {
        label: severity || "Severity: N/A",
        tone: severity === "High" ? "danger" : severity === "Medium" ? "warning" : "info",
      },
      rows: [
        { label: "Incident #", value: incidentNumber },
        { label: "Severity", value: severity || "N/A" },
        { label: "Vehicle", value: vehicle || "Unassigned" },
        { label: "Location", value: location || "Not specified" },
        { label: "Reported By", value: reportedBy },
      ],
      cta: {
        label: "Review incident",
        url: `${resolveBaseUrl(dashboardUrl)}/dashboard/incidents`,
      },
    }),
    text: `Incident ${incidentNumber} (${severity}) reported for ${vehicle || "N/A"} at ${location || "N/A"} by ${reportedBy}.`,
  }
}

export async function generateTopupEmail({
  accountName,
  vendorType,
  amount,
  depositedBy,
  receiptNumber,
  dashboardUrl,
}: TopupEmailInput) {
  return {
    subject: `${vendorType} account topped up: ₦${amount.toLocaleString()}`,
    html: renderEmailLayout({
      dashboardUrl,
      title: `${vendorType} account funded`,
      intro: `A new deposit has been recorded for ${accountName}.`,
      rows: [
        { label: "Account", value: accountName },
        { label: "Category", value: vendorType },
        { label: "Amount", value: `₦${amount.toLocaleString()}` },
        { label: "Deposited By", value: depositedBy },
        { label: "Receipt #", value: receiptNumber || "N/A" },
      ],
      cta: {
        label: "View prepaid accounts",
        url: `${resolveBaseUrl(dashboardUrl)}/dashboard/expenses`,
      },
    }),
    text: `${vendorType} account ${accountName} received ₦${amount.toLocaleString()} (by ${depositedBy}).`,
  }
}
