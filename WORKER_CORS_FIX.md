# Cloudflare Worker CORS Configuration Fix

## Issue
CORS error when uploading files: `Request header field x-auth-key is not allowed by Access-Control-Allow-Headers`

## Solution
The Cloudflare Worker needs to be updated to allow the `X-Auth-Key` header in CORS responses.

## Required Worker Changes

Update your Cloudflare Worker (`worker.js`) to include `X-Auth-Key` in the CORS headers:

```javascript
// Handle CORS preflight requests
if (request.method === 'OPTIONS') {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*', // Or your specific domain
      'Access-Control-Allow-Methods': 'PUT, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Auth-Key, Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}

// In your main response, also include CORS headers:
const headers = {
  'Access-Control-Allow-Origin': '*', // Or your specific domain: 'https://fleet.voltaamobility.com'
  'Access-Control-Allow-Methods': 'PUT, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'X-Auth-Key, Content-Type, Authorization',
  'Content-Type': 'application/json',
}
```

## Important Notes
- Replace `*` with your specific domain (`https://fleet.voltaamobility.com`) for better security
- Make sure `X-Auth-Key` is included in both `Access-Control-Allow-Headers` for OPTIONS and regular responses
- The code has been updated to use `X-Auth-Key` header instead of `Authorization: Bearer`

