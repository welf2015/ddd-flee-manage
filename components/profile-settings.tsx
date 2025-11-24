"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Separator } from "@/components/ui/separator"

export function ProfileSettings() {
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [passwordState, setPasswordState] = useState({ newPassword: "", confirmPassword: "" })
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [updatingPassword, setUpdatingPassword] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setEmail(user.email || "")

        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (profile) {
          setFullName(profile.full_name || "")
        }
      }
    }

    loadProfile()
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setMessage({ type: "error", text: "Not authenticated" })
      setIsLoading(false)
      return
    }

    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id)

    if (error) {
      setMessage({ type: "error", text: error.message })
    } else {
      setMessage({ type: "success", text: "Profile updated successfully" })
    }

    setIsLoading(false)
  }

  const handlePasswordUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordMessage(null)

    if (passwordState.newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "Password must be at least 8 characters" })
      return
    }

    if (passwordState.newPassword !== passwordState.confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match" })
      return
    }

    setUpdatingPassword(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: passwordState.newPassword })

    if (error) {
      setPasswordMessage({ type: "error", text: error.message })
    } else {
      setPasswordMessage({ type: "success", text: "Password updated successfully" })
      setPasswordState({ newPassword: "", confirmPassword: "" })
    }

    setUpdatingPassword(false)
  }

  return (
    <Card className="bg-background/50 backdrop-blur">
      <CardHeader>
        <CardTitle>Profile & Security</CardTitle>
        <CardDescription>Update your personal details and password</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
            />
          </div>

          {message && (
            <div className={`text-sm ${message.type === "success" ? "text-green-500" : "text-red-500"}`}>
              {message.text}
            </div>
          )}

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </form>

        <Separator />

        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordState.newPassword}
              onChange={(e) => setPasswordState((prev) => ({ ...prev, newPassword: e.target.value }))}
              placeholder="Enter a strong password"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordState.confirmPassword}
              onChange={(e) => setPasswordState((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Repeat the new password"
            />
          </div>

          {passwordMessage && (
            <div className={`text-sm ${passwordMessage.type === "success" ? "text-green-500" : "text-red-500"}`}>
              {passwordMessage.text}
            </div>
          )}

          <Button type="submit" variant="outline" disabled={updatingPassword}>
            {updatingPassword ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
