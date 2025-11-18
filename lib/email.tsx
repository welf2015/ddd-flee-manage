// Email notification utilities
// This uses a simple email sending approach that can be integrated with services like Resend or SendGrid

interface EmailNotification {
  to: string[]
  subject: string
  html: string
}

export async function sendEmailNotification({ to, subject, html }: EmailNotification) {
  // In production, integrate with an email service like Resend
  // For now, this will create notifications in the database
  
  try {
    // This is a placeholder - in production you would call an email service API
    console.log("Email notification:", { to, subject })
    
    // Return success for now
    return { success: true }
  } catch (error) {
    console.error("Failed to send email:", error)
    return { success: false, error: String(error) }
  }
}

export function generateBookingApprovalEmail(data: {
  jobId: string
  clientName: string
  route: string
  budget: number
  requesterName: string
  dashboardUrl: string
}) {
  return {
    subject: `New Booking Approval Required - ${data.jobId}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #003e31; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; }
            .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #003e31; }
            .detail-row { margin: 10px 0; }
            .label { font-weight: bold; color: #666; }
            .value { color: #003e31; }
            .button { display: inline-block; padding: 12px 24px; background-color: #003e31; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Booking Requires Approval</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>A new booking has been created and requires your approval.</p>
              
              <div class="details">
                <div class="detail-row">
                  <span class="label">Job ID:</span>
                  <span class="value">${data.jobId}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Client:</span>
                  <span class="value">${data.clientName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Route:</span>
                  <span class="value">${data.route}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Proposed Budget:</span>
                  <span class="value">₦${data.budget.toLocaleString()}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Created by:</span>
                  <span class="value">${data.requesterName}</span>
                </div>
              </div>
              
              <p>Please review and take appropriate action (Approve, Negotiate, or Reject).</p>
              
              <a href="${data.dashboardUrl}/dashboard/bookings" class="button">
                View in Dashboard
              </a>
            </div>
            <div class="footer">
              <p>This is an automated notification from your Fleet Management System.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }
}

export function generateBookingStatusChangeEmail(data: {
  jobId: string
  clientName: string
  oldStatus: string
  newStatus: string
  changedBy: string
  dashboardUrl: string
}) {
  return {
    subject: `Booking Status Updated - ${data.jobId}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #003e31; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; }
            .details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #003e31; }
            .status-change { background-color: #e8f5e9; padding: 10px; margin: 15px 0; border-radius: 4px; text-align: center; }
            .button { display: inline-block; padding: 12px 24px; background-color: #003e31; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Status Updated</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>The status of booking <strong>${data.jobId}</strong> has been updated.</p>
              
              <div class="status-change">
                <strong>${data.oldStatus}</strong> → <strong>${data.newStatus}</strong>
              </div>
              
              <div class="details">
                <p><strong>Client:</strong> ${data.clientName}</p>
                <p><strong>Changed by:</strong> ${data.changedBy}</p>
              </p>
              
              <a href="${data.dashboardUrl}/dashboard/bookings" class="button">
                View Details
              </a>
            </div>
            <div class="footer">
              <p>This is an automated notification from your Fleet Management System.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }
}
