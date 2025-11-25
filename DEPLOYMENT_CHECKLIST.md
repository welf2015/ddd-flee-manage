# Email Notification Setup

## Required Environment Variables

To enable email notifications, you need to configure the following environment variables in your Vercel project:

### Resend API Configuration

1. **RESEND_API_KEY** (Required)
   - Get your API key from: https://resend.com/api-keys
   - Sign up for a free account at Resend
   - Generate a new API key from the dashboard

2. **RESEND_FROM_EMAIL** (Required)
   - Format: `"Fleet Manager <notification@yourdomain.com>"`
   - Must be from a verified domain in Resend
   - Default fallback: `"Fleet Manager <notification@fleet.voltaamobility.com>"`

3. **NEXT_PUBLIC_APP_URL** (Optional but recommended)
   - Your production app URL: `https://fleet.voltaamobility.com`
   - Used for generating correct links in emails
   - Auto-detected from NEXT_PUBLIC_VERCEL_URL if not set

## Setup Steps

1. Go to your Vercel project → Settings → Environment Variables
2. Add the three variables above
3. Redeploy your application for changes to take effect

## Email Notifications Sent

- **Booking Approval Requests** → MD/ED when new booking needs approval
- **Booking Status Changes** → Team when booking status updates
- **Negotiations** → Relevant parties when proposals/counteroffers are made
- **Payment Confirmations** → Accountant/MD/ED when payment is marked as paid
- **Incident Reports** → Operations team when incidents are reported
- **Prepaid Top-ups** → Finance team when accounts are funded

## Testing

1. Create a test booking to trigger approval email
2. Check Resend dashboard for delivery logs
3. Verify emails arrive at configured recipient addresses
