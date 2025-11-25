"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { SYSTEM_ROLES, type SystemRole } from "@/lib/roles"
import { createUserFromLogin } from "@/app/actions/public-users"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [fullName, setFullName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [newRole, setNewRole] = useState<SystemRole>("Staff")
  const [createUserMessage, setCreateUserMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()
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

  const handleCreateUser = (event: React.FormEvent) => {
    event.preventDefault()
    setCreateUserMessage(null)

    if (newPassword !== confirmPassword) {
      setCreateUserMessage({ type: "error", text: "Passwords do not match" })
      return
    }

    startTransition(async () => {
      const result = await createUserFromLogin({
        fullName,
        email: newUserEmail,
        role: newRole,
        password: newPassword,
      })

      if (result.success) {
        setCreateUserMessage({
          type: "success",
          text: "User created successfully. They can now log in with the credentials provided.",
        })
        setFullName("")
        setNewUserEmail("")
        setNewPassword("")
        setConfirmPassword("")
        setNewRole("Staff")
      } else {
        setCreateUserMessage({ type: "error", text: result.error || "Failed to create user" })
      }
    })
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
            <Tabs defaultValue="login" className="space-y-4">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="create">Add User</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
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
              </TabsContent>
              <TabsContent value="create">
                <Card className="bg-background/50 backdrop-blur border-border">
                  <CardHeader>
                    <CardTitle className="text-2xl">Add User</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Create a platform user by entering their details and selecting a role.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Jane Doe"
                          required
                          disabled={isPending}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="newUserEmail">Email</Label>
                        <Input
                          id="newUserEmail"
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="user@voltaamobility.com"
                          required
                          disabled={isPending}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Role</Label>
                        <Select value={newRole} onValueChange={(value) => setNewRole(value as SystemRole)} disabled={isPending}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {SYSTEM_ROLES.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="newPassword">Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          required
                          disabled={isPending}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          disabled={isPending}
                        />
                      </div>
                      {createUserMessage && (
                        <p
                          className={`text-sm ${
                            createUserMessage.type === "success" ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {createUserMessage.text}
                        </p>
                      )}
                      <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isPending}>
                        {isPending ? "Creating..." : "Create User"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
