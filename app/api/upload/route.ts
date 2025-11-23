// This ensures that if the Worker is configured, we don't even load the AWS SDK which caused file system issues.
import { NextResponse } from "next/server"

// Standard Node.js runtime
export const runtime = "nodejs"

export async function GET(request: Request) {
  const workerUrl = process.env.R2_UPLOAD_WORKER_URL
  const authKey = process.env.R2_AUTH_KEY

  if (workerUrl && authKey) {
    return NextResponse.json({
      workerUrl,
      authKey,
    })
  }

  // Worker configuration is required
  return NextResponse.json(
    {
      error: "R2 upload worker not configured. Please add R2_UPLOAD_WORKER_URL and R2_AUTH_KEY environment variables.",
    },
    { status: 500 },
  )
}

export async function POST(request: Request) {
  return NextResponse.json(
    { error: "Please use GET to obtain a presigned URL, then PUT the file directly." },
    { status: 405 },
  )
}
