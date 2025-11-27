"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { updateSpendingLimit, getAllDriversWithAccounts } from "@/app/actions/driver-spending"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save } from "lucide-react"

type DriverWithAccount = {
  id: string
  full_name: string
  phone: string
  status: string
  account: {
    current_balance: number
    spending_limit: number
    is_active: boolean
  } | null
}

type SpendingLimitsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function SpendingLimitsDialog({ open, onOpenChange, onSuccess }: SpendingLimitsDialogProps) {
  const [drivers, setDrivers] = useState<DriverWithAccount[]>([])
  const [limits, setLimits] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [fetchingDrivers, setFetchingDrivers] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      const loadDrivers = async () => {
        setFetchingDrivers(true)
        console.log("[v0] Loading drivers for spending limits dialog...")
        const result = await getAllDriversWithAccounts()
        console.log("[v0] getAllDriversWithAccounts result:", result)
        if (result.success && result.data) {
          setDrivers(result.data)
          console.log("[v0] Loaded drivers:", result.data.length)

          // Initialize limits with current values or default
          const initialLimits: Record<string, string> = {}
          result.data.forEach((driver) => {
            initialLimits[driver.id] = driver.account?.spending_limit?.toString() || "50000"
          })
          setLimits(initialLimits)
        } else {
          console.log("[v0] Error loading drivers:", result.error)
          toast({
            title: "Error",
            description: result.error || "Failed to fetch drivers",
            variant: "destructive",
          })
        }
        setFetchingDrivers(false)
      }
      loadDrivers()
    }
  }, [open, toast])

  useEffect(() => {
    if (!open) {
      setDrivers([])
      setLimits({})
    }
  }, [open])

  const handleUpdateLimit = async (driverId: string) => {
    const newLimit = Number.parseFloat(limits[driverId])

    if (isNaN(newLimit) || newLimit <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid spending limit",
        variant: "destructive",
      })
      return
    }

    setLoading({ ...loading, [driverId]: true })
    const result = await updateSpendingLimit(driverId, newLimit)

    if (result.success) {
      toast({
        title: "Success",
        description: "Spending limit updated successfully",
      })
      setDrivers(
        drivers.map((d) =>
          d.id === driverId
            ? {
                ...d,
                account: d.account
                  ? { ...d.account, spending_limit: newLimit }
                  : { current_balance: 0, spending_limit: newLimit, is_active: true },
              }
            : d,
        ),
      )
      onSuccess()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update spending limit",
        variant: "destructive",
      })
    }
    setLoading({ ...loading, [driverId]: false })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
            Active
          </Badge>
        )
      case "Currently on Job":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs">
            On Job
          </Badge>
        )
      case "Assigned to Job":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs">
            Assigned
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {status}
          </Badge>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Spending Limits</DialogTitle>
          <DialogDescription>Set weekly spending limits for drivers. Limits reset every Monday.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {fetchingDrivers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No drivers found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver Name</TableHead>
                  <TableHead>Current Limit</TableHead>
                  <TableHead>New Limit (₦)</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{driver.full_name}</p>
                        <div className="flex items-center gap-2 mt-1">{getStatusBadge(driver.status)}</div>
                        <p className="text-xs text-muted-foreground mt-1">{driver.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {driver.account?.spending_limit ? (
                        <span className="font-medium">₦{driver.account.spending_limit.toLocaleString()}</span>
                      ) : (
                        <Badge variant="secondary">Not Set</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={limits[driver.id] || ""}
                        onChange={(e) => setLimits({ ...limits, [driver.id]: e.target.value })}
                        min="1"
                        step="1000"
                        placeholder="Enter limit"
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => handleUpdateLimit(driver.id)} disabled={loading[driver.id]}>
                        {loading[driver.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Set Limit
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-medium">Important Notes:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Weekly limits reset every Monday at midnight</li>
              <li>Drivers can spend beyond their limit (account goes negative)</li>
              <li>Top-ups cannot exceed the spending limit</li>
              <li>Setting a limit will create an account if one doesn't exist</li>
              <li>Recommended limit: ₦50,000 per week</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
