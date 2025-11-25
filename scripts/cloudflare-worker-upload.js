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

    // CORS Headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // Or specific domain: "https://fleet.voltaamobility.com"
      "Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Auth-Key, X-Folder",
      "Access-Control-Max-Age": "86400",
    }

    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders })
    }

    // Authorization Check - Support both X-Auth-Key and Authorization header
    const authKey = request.headers.get("X-Auth-Key")
    const authHeader = request.headers.get("Authorization")
    
    // Check if either header matches the AUTH_KEY
    const isValidAuth = 
      (authKey && authKey === env.AUTH_KEY) ||
      (authHeader && authHeader === `Bearer ${env.AUTH_KEY}`)
    
    if (!isValidAuth) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // Handle Upload (PUT)
    if (method === "PUT" || method === "POST") {
      try {
        const folder = url.searchParams.get("folder") || "uploads"
        const filename = url.searchParams.get("filename") || `file-${Date.now()}`
        const key = `${folder}/${filename}`

        await env.BUCKET.put(key, request.body)

        // Construct Public URL (Assumes bucket is connected to custom domain or public access enabled)
        // If you have a custom domain for R2, use it here.
        // Otherwise, you might need to return the S3 compatible URL or just the key.
        const publicUrl = `https://${url.hostname}/${key}` // This assumes worker handles download too, or replace with R2 public domain

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

    // Handle Download (GET) - Optional if you want the worker to serve files
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
