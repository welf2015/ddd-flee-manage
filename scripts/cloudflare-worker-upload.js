/**
 * Cloudflare Worker for Secure R2 Uploads
 *
 * Deployment Instructions:
 * 1. Create a new Worker in Cloudflare Dashboard
 * 2. Copy this code into the worker.js file
 * 3. Bind your R2 Bucket to the worker with variable name: BUCKET
 * 4. Add an Environment Variable: AUTH_KEY (a secure random string you choose)
 * 5. Deploy
 */

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

    // Handle Download (GET) - Allow without authentication for file access
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

    // Authorization Check for PUT/POST - Support both X-Auth-Key (new) and Authorization (legacy)
    const authKey = request.headers.get("X-Auth-Key")
    const authHeader = request.headers.get("Authorization")
    
    // Check if AUTH_KEY is configured
    if (!env.AUTH_KEY) {
      return new Response(
        JSON.stringify({ error: "Server configuration error: AUTH_KEY not set" }), 
        { 
          status: 500, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          }
        }
      )
    }
    
    // Validate authentication - check both header formats
    const isValidAuth = 
      (authKey && authKey === env.AUTH_KEY) ||
      (authHeader && authHeader === `Bearer ${env.AUTH_KEY}`)
    
    // Block unauthorized requests for PUT/POST
    if (!isValidAuth) {
      return new Response(
        JSON.stringify({ 
          error: "Unauthorized",
          hint: "Check that X-Auth-Key header matches AUTH_KEY environment variable in Cloudflare Worker"
        }), 
        { 
          status: 401, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          }
        }
      )
    }

    // Handle Upload (PUT)
    if (method === "PUT" || method === "POST") {
      try {
        const folder = url.searchParams.get("folder") || "uploads"
        const filename = url.searchParams.get("filename") || `file-${Date.now()}`
        const key = `${folder}/${filename}`

        await env.BUCKET.put(key, request.body)

        // Use R2 public URL instead of worker URL
        // Format: https://{account-id}.r2.cloudflarestorage.com/{bucket-name}/{key}
        // Or use R2_PUBLIC_URL env var if set (for custom domains)
        const bucketName = "fleetm" // From wrangler.toml
        const accountId = "62bdb1736e32df066a3014665f294d04" // R2 Account ID
        const publicUrl = env.R2_PUBLIC_URL 
          ? `${env.R2_PUBLIC_URL}/${key}`
          : `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${key}`

        return new Response(
          JSON.stringify({
            success: true,
            key: key,
            url: publicUrl,
          }),
          {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        )
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
      }
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders })
  },
}
