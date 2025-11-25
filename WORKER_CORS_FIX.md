# Cloudflare Worker CORS Configuration Fix

## Issue
CORS error when uploading files: `Request header field x-auth-key is not allowed by Access-Control-Allow-Headers`

## Solution
The Cloudflare Worker has been updated to allow the `X-Auth-Key` header in CORS responses.

## Worker Code Location
The worker code is located at: `scripts/cloudflare-worker-upload.js`

## Deployment Instructions

1. **Copy the updated worker code** from `scripts/cloudflare-worker-upload.js`
2. **Go to Cloudflare Dashboard** → Workers & Pages → Your Worker
3. **Paste the updated code** into the worker editor
4. **Deploy** the updated worker

## What Was Fixed

✅ Added `X-Auth-Key` to `Access-Control-Allow-Headers`  
✅ Updated authorization check to support both `X-Auth-Key` and `Authorization` headers  
✅ Added `Access-Control-Max-Age` header for better CORS caching  
✅ Proper error response with CORS headers for unauthorized requests  

## Important Notes
- The worker now accepts both `X-Auth-Key` header (new) and `Authorization: Bearer` header (legacy support)
- Replace `*` in `Access-Control-Allow-Origin` with your specific domain (`https://fleet.voltaamobility.com`) for better security in production
- All frontend code has been updated to use `X-Auth-Key` header consistently

