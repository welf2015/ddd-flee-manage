"use client"

import { useState, useTransition } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SYSTEM_ROLES } from "@/lib/roles"
import { invitePlatformUser } from "@/app/actions/users"
import { toast } from "sonner"
import { Loader2, ShieldCheck } from "lucide-react"

type InviteUserCardProps = {
  canManage: boolean
  onUserCreated?: () => void
}

export function InviteUserCard({ canManage, onUserCreated }: InviteUserCardProps) {
  const [formState, setFormState] = useState({ fullName: "", email: "", role: "Staff" })
  const [generatedPassword, setGeneratedPassword] = useState<{ email: string; password: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canManage) return

    startTransition(async () => {
      const result = await invitePlatformUser(formState)
      if (!result.success) {
        toast.error(result.error || "Failed to create user")
        return
      }

      setGeneratedPassword({ email: formState.email, password: result.password })
      setFormState({ fullName: "", email: "", role: "Staff" })
      toast.success("User created and profile provisioned")
      onUserCreated?.()
    })
  }

  return (
    <Card className="bg-background/50 backdrop-blur">
      <CardHeader>
        <CardTitle>Invite Platform User</CardTitle>
        <CardDescription>
          Create managed accounts for MD/ED, Operations, or Accounting stakeholders. Passwords are generated
          automatically and shown once.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                required
                value={formState.fullName}
                onChange={(e) => setFormState((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder="Jane Doe"
                disabled={!canManage || isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={formState.email}
                onChange={(e) => setFormState((prev) => ({ ...prev, email: e.target.value.trim() }))}
                placeholder="name@voltaamobility.com"
                disabled={!canManage || isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={formState.role}
              onValueChange={(role) => setFormState((prev) => ({ ...prev, role }))}
              disabled={!canManage || isPending}
            >
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

          <Button type="submit" disabled={!canManage || isPending} className="w-full sm:w-auto">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating User...
              </>
            ) : (
              "Generate Account"
            )}
          </Button>
        </form>

        {!canManage && (
          <Alert className="mt-4" variant="destructive">
            <AlertTitle>Restricted</AlertTitle>
            <AlertDescription>You need MD, ED, or Head of Operations access to invite new users.</AlertDescription>
          </Alert>
        )}

        {generatedPassword && (
          <Alert className="mt-4">
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Temporary password generated</AlertTitle>
            <AlertDescription className="space-y-1">
              <p>
                <strong>{generatedPassword.email}</strong>
              </p>
              <p className="font-mono text-sm">{generatedPassword.password}</p>
              <p className="text-xs text-muted-foreground">
                Share this password securely. The user should change it from Settings ▸ Profile ▸ Password.
              </p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

