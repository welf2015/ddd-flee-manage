"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  getAllUsers,
  getPagePermissions,
  getRolePermissions,
  updateRolePermission,
  createRolePermission,
  updateUserRole,
} from "@/app/actions/access-control"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { InviteUserCard } from "@/components/settings/invite-user-card"
import { ROLE_SETTINGS_SUMMARY, SETTINGS_TAB_ACCESS, SYSTEM_ROLES, type SystemRole } from "@/lib/roles"

type AccessControlSettingsProps = {
  currentRole: SystemRole
}

export function AccessControlSettings({ currentRole }: AccessControlSettingsProps) {
  const [users, setUsers] = useState<any[]>([])
  const [pages, setPages] = useState<any[]>([])
  const [selectedRole, setSelectedRole] = useState<string>(SYSTEM_ROLES.includes(currentRole) ? currentRole : SYSTEM_ROLES[0])
  const [permissions, setPermissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingPermission, setUpdatingPermission] = useState<string | null>(null)
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)
  const canManage = ["MD", "ED", "Head of Operations"].includes(currentRole)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedRole) {
      loadRolePermissions()
    }
  }, [selectedRole])

  const loadData = async () => {
    setLoading(true)
      const [usersResult, pagesResult] = await Promise.all([getAllUsers(), getPagePermissions()])

    if (usersResult.success) {
      setUsers(usersResult.data)
    }

    if (pagesResult.success) {
      setPages(pagesResult.data)
    }

    setLoading(false)
  }

  const loadRolePermissions = async () => {
    const result = await getRolePermissions(selectedRole)
    if (result.success) {
      setPermissions(result.data)
    }
  }

  const handlePermissionToggle = async (permissionId: string, currentValue: boolean) => {
    setUpdatingPermission(permissionId)
    const result = await updateRolePermission(permissionId, !currentValue)

    if (result.success) {
      toast.success("Permission updated")
      loadRolePermissions()
    } else {
      toast.error(result.error || "Failed to update permission")
    }

    setUpdatingPermission(null)
  }

  const handleCreatePermission = async (pageId: string, canAccess: boolean) => {
    const result = await createRolePermission(selectedRole, pageId, canAccess)

    if (result.success) {
      toast.success("Permission created")
      loadRolePermissions()
    } else {
      toast.error(result.error || "Failed to create permission")
    }
  }

  const handleUserRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUser(userId)
    const result = await updateUserRole(userId, newRole)

    if (result.success) {
      toast.success("User role updated")
      loadData()
    } else {
      toast.error(result.error || "Failed to update user role")
    }

    setUpdatingUser(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <InviteUserCard canManage={canManage} onUserCreated={loadData} />

      <Card className="bg-background/50 backdrop-blur">
        <CardHeader>
          <CardTitle>User Roles</CardTitle>
          <CardDescription>Manage user roles and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge>{user.role || "Staff"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role || "Staff"}
                      onValueChange={(value) => handleUserRoleChange(user.id, value)}
                      disabled={updatingUser === user.id || !canManage}
                    >
                      <SelectTrigger className="w-[220px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SYSTEM_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-background/50 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Page Access Permissions</CardTitle>
              <CardDescription>Configure which roles can access specific pages</CardDescription>
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole} disabled={!canManage}>
              <SelectTrigger className="w-[250px]">
                <SelectValue />
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
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Access</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page) => {
                const permission = permissions.find((p) => p.page_id === page.id)
                return (
                  <TableRow key={page.id}>
                    <TableCell className="font-medium">{page.page_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{page.page_path}</TableCell>
                    <TableCell>
                      <Switch
                        checked={permission?.can_access ?? false}
                        onCheckedChange={() => {
                          if (permission) {
                            handlePermissionToggle(permission.id, permission.can_access)
                          } else {
                            handleCreatePermission(page.id, true)
                          }
                        }}
                        disabled={updatingPermission === permission?.id || !canManage}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-background/50 backdrop-blur">
        <CardHeader>
          <CardTitle>Role Visibility on Settings</CardTitle>
          <CardDescription>Summary of which tabs each role can access when they sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Highlights</TableHead>
                <TableHead>Tabs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROLE_SETTINGS_SUMMARY.map((summary) => (
                <TableRow key={summary.role}>
                  <TableCell className="font-medium">{summary.role}</TableCell>
                  <TableCell>
                    <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                      {summary.highlights.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(SETTINGS_TAB_ACCESS) as (keyof typeof SETTINGS_TAB_ACCESS)[])
                        .filter((tab) => SETTINGS_TAB_ACCESS[tab].includes(summary.role))
                        .map((tab) => (
                          <Badge key={tab} variant="secondary" className="capitalize">
                            {tab.replace("-", " ")}
                          </Badge>
                        ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
