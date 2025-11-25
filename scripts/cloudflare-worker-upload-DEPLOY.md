# Cloudflare Worker - Ready to Deploy

Copy this code and paste it into your Cloudflare Worker editor:

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const method = request.method

    // CORS Headers - Updated to include X-Auth-Key
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // Change to "https://fleet.voltaamobility.com" for production
      "Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Auth-Key, X-Folder",
      "Access-Control-Max-Age": "86400",
    }

    // Handle CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders })
    }

    // Authorization Check - Support both X-Auth-Key (new) and Authorization (legacy)
    const authKey = request.headers.get("X-Auth-Key")
    const authHeader = request.headers.get("Authorization")
    
    // Validate authentication - check both header formats
    const isValidAuth = 
      (authKey && authKey === env.AUTH_KEY) ||
      (authHeader && authHeader === `Bearer ${env.AUTH_KEY}`)
    
    // Block unauthorized requests
    if (!isValidAuth) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }), 
        { 
          status: 401, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          }
        }
      )
    }

    // Handle Upload (PUT or POST)
    if (method === "PUT" || method === "POST") {
      try {
        const folder = url.searchParams.get("folder") || "uploads"
        const filename = url.searchParams.get("filename") || `file-${Date.now()}`
        const key = `${folder}/${filename}`

        await env.BUCKET.put(key, request.body)

        const publicUrl = `https://${url.hostname}/${key}`

        return new Response(
          JSON.stringify({
            success: true,
            key: key,
            url: publicUrl,
          }),
          {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        )
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { 
          status: 500, 
          headers: corsHeaders 
        })
      }
    }

    // Handle Download (GET)
    if (method === "GET") {
      const key = url.pathname.slice(1) // Remove leading slash
      if (!key) return new Response("File not found", { status: 404, headers: corsHeaders })

      const object = await env.BUCKET.get(key)
      if (!object) return new Response("File not found", { status: 404, headers: corsHeaders })

      const headers = new Headers(object.httpMetadata)
      headers.set("etag", object.httpEtag)
      Object.keys(corsHeaders).forEach((k) => headers.set(k, corsHeaders[k]))

      return new Response(object.body, { headers })
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders })
  },
}
```

## Key Changes from Current Deployed Version:

1. ✅ Added `X-Auth-Key` to `Access-Control-Allow-Headers` (fixes CORS error)
2. ✅ Added `Access-Control-Max-Age` header
3. ✅ Fixed authorization check to actually block unauthorized requests (was empty before)
4. ✅ Support for both `X-Auth-Key` header (new) and `Authorization: Bearer` header (legacy)

## Deployment Steps:

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your worker: `fleet-r2-upload`
3. Click "Edit code"
4. Replace the entire worker code with the code above
5. Click "Save and deploy"

After deployment, file uploads should work without CORS errors!

