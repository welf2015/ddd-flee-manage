# Email Setup and Troubleshooting Guide

## Environment Variables

Ensure these are set in your Vercel environment variables:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL="Fleet Manager <notifications@yourdomain.com>"
NEXT_PUBLIC_APP_URL=https://yourdomain.com  # Optional
```

## Common Issues and Solutions

### 1. Emails Not Sending - Check These

#### Issue: No emails are being sent at all

**Check the server logs** (Vercel Dashboard → Deployments → Functions → Logs):

Look for these log messages:
- `[EMAIL INFO] Sending email...` - Email attempt started
- `[EMAIL SUCCESS] Email sent successfully!` - Email sent
- `[EMAIL ERROR]` - Email failed

**Common causes:**

a) **Environment variables not set**
```
[EMAIL ERROR] RESEND_API_KEY not configured in environment variables
```
**Solution:** Add `RESEND_API_KEY` in Vercel → Settings → Environment Variables

b) **User profiles missing email addresses**
```
[NOTIFICATION] No admin emails found in profiles
```
**Solution:** Add email addresses to user profiles in the database:
- Go to Supabase → Table Editor → `profiles` table
- Add email addresses for users with roles: MD, ED, Head of Operations, Accountant

c) **Invalid API key**
```
[EMAIL ERROR] Status: 401
```
**Solution:** Verify your Resend API key at https://resend.com/api-keys

d) **Unverified domain**
```
[EMAIL ERROR] Status: 403
```
**Solution:**
1. Go to https://resend.com/domains
2. Add and verify your domain
3. Update `RESEND_FROM_EMAIL` to use verified domain

### 2. Testing Email Setup

#### Method 1: Trigger a notification
1. Create a new booking in the dashboard
2. Check Vercel logs for email-related messages
3. Check your Resend dashboard for delivery logs

#### Method 2: Check user profiles
Run this SQL in Supabase SQL Editor:
```sql
SELECT
  id,
  email,
  full_name,
  role
FROM profiles
WHERE role IN ('MD', 'ED', 'Head of Operations', 'Accountant');
```

Make sure users have:
- Valid email addresses
- Appropriate roles assigned

### 3. Vercel Deployment Checklist

After adding environment variables:
1. ✅ Add `RESEND_API_KEY`
2. ✅ Add `RESEND_FROM_EMAIL`
3. ✅ Click "Redeploy" (important - env vars need redeployment)
4. ✅ Wait for deployment to complete
5. ✅ Test by creating a booking

### 4. Resend Dashboard

Check your Resend dashboard at https://resend.com/emails for:
- Email delivery status
- Bounce/complaint rates
- Error messages

## Email Notifications Sent

| Trigger | Recipients | Email Type |
|---------|-----------|------------|
| New booking created | MD, ED | Booking Approval |
| Booking status changed | Team | Status Update |
| Negotiation proposed | Relevant parties | Negotiation |
| Payment marked as paid | Accountant, MD, ED | Payment Confirmation |
| Incident reported | Operations team | Incident Alert |
| Account topped up | Finance team | Top-up Notification |

## Enhanced Logging

All email operations now log detailed information:

### Success logs:
```
[EMAIL INFO] Sending email...
[EMAIL INFO] From: Fleet Manager <notifications@yourdomain.com>
[EMAIL INFO] To: ["user@example.com"]
[EMAIL INFO] Subject: New Booking Approval Required
[EMAIL SUCCESS] Email sent successfully!
```

### Error logs:
```
[EMAIL ERROR] Failed to send email
[EMAIL ERROR] Status: 403
[EMAIL ERROR] Response: {"error": "Domain not verified"}
```

## Quick Checklist

- [ ] RESEND_API_KEY is set in Vercel environment variables
- [ ] RESEND_FROM_EMAIL is set with a verified domain
- [ ] User profiles have email addresses in the database
- [ ] Domain is verified in Resend dashboard
- [ ] Application was redeployed after adding env vars
- [ ] Checked Vercel function logs for email attempts
- [ ] Checked Resend dashboard for delivery status

## Support

If emails still don't work after checking all above:
1. Share the Vercel function logs (look for `[EMAIL ERROR]`)
2. Share the Resend dashboard delivery logs
3. Confirm environment variables are set correctly
