"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) throw signInError

      setIsLoading(false)
      setIsAuthenticating(true)

      let attempts = 0
      const maxAttempts = 10

      while (attempts < maxAttempts) {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session) {
          window.location.href = "/dashboard"
          return
        }
        await new Promise((resolve) => setTimeout(resolve, 200))
        attempts++
      }

      window.location.href = "/dashboard"
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsLoading(false)
      setIsAuthenticating(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-black">
      {/* Left side - FULL IMAGE */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="/images/design-mode/Frame-38-768x1299.png"
          alt="Voltaa Fleet"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        {isAuthenticating ? (
          <div className="w-full max-w-sm text-center">
            <div className="mb-6 flex justify-center lg:hidden">
              <img src="/logo.png" alt="Voltaa" className="h-12" />
            </div>
            <Card className="bg-background/50 backdrop-blur border-border">
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Authenticating... Please wait</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <div className="mb-6 flex justify-center lg:hidden">
              <img src="/logo.png" alt="Voltaa" className="h-12" />
            </div>
            <Card className="bg-background/50 backdrop-blur border-border">
              <CardHeader>
                <CardTitle className="text-2xl">Login</CardTitle>
                <p className="text-sm text-muted-foreground">Enter your credentials to access your account</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin}>
                  <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-background/50"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-background/50"
                        disabled={isLoading}
                      />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isLoading}>
                      {isLoading ? "Logging in..." : "Login"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
