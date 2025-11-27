"use client"

import type React from "react"

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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { topUpDriverAccount, getAllDriversWithAccounts } from "@/app/actions/driver-spending"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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

type DriverSpendingAccount = {
  id: string
  driver_id: string
  current_balance: number
  spending_limit: number
  driver: {
    id: string
    full_name: string
  }
}

type TopUpDriverDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: DriverSpendingAccount | null
  onSuccess: () => void
}

export function TopUpDriverDialog({ open, onOpenChange, account: initialAccount, onSuccess }: TopUpDriverDialogProps) {
  const [selectedDriverId, setSelectedDriverId] = useState<string>("")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [drivers, setDrivers] = useState<DriverWithAccount[]>([])
  const [fetchingDrivers, setFetchingDrivers] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open && !initialAccount) {
      const loadDrivers = async () => {
        setFetchingDrivers(true)
        console.log("[v0] Loading drivers for top-up dialog...")
        const result = await getAllDriversWithAccounts()
        console.log("[v0] getAllDriversWithAccounts result:", result)
        if (result.success && result.data) {
          setDrivers(result.data)
          console.log("[v0] Loaded drivers:", result.data.length)
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
    } else if (open && initialAccount) {
      setSelectedDriverId(initialAccount.driver_id)
    }
  }, [open, initialAccount, toast])

  useEffect(() => {
    if (!open) {
      setSelectedDriverId("")
      setAmount("")
      setDescription("")
      setDrivers([])
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const driverId = initialAccount?.driver_id || selectedDriverId
    if (!driverId) {
      toast({
        title: "Error",
        description: "Please select a driver",
        variant: "destructive",
      })
      return
    }

    const topUpAmount = Number.parseFloat(amount)
    if (isNaN(topUpAmount) || topUpAmount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    const result = await topUpDriverAccount(driverId, topUpAmount, description)

    if (result.success) {
      toast({
        title: "Success",
        description: "Driver account topped up successfully",
      })
      onSuccess()
      onOpenChange(false)
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to top up driver account",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  const selectedDriver = drivers.find((d) => d.id === selectedDriverId)
  const selectedAccount =
    initialAccount ||
    (selectedDriver?.account
      ? {
          ...selectedDriver.account,
          driver_id: selectedDriver.id,
          driver: { id: selectedDriver.id, full_name: selectedDriver.full_name },
        }
      : null)

  const remainingLimit = selectedAccount
    ? Number(selectedAccount.spending_limit) - Number(selectedAccount.current_balance)
    : 50000

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600 text-xs ml-2">
            Active
          </Badge>
        )
      case "Currently on Job":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs ml-2">
            On Job
          </Badge>
        )
      case "Assigned to Job":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs ml-2">
            Assigned
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs ml-2">
            {status}
          </Badge>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Top Up Driver Account</DialogTitle>
          <DialogDescription>Add funds to a driver's spending account</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!initialAccount && (
            <div className="space-y-2">
              <Label htmlFor="driver">Select Driver</Label>
              {fetchingDrivers ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading drivers...</span>
                </div>
              ) : drivers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No drivers found</p>
              ) : (
                <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        <div className="flex items-center">
                          <span>{driver.full_name}</span>
                          {driver.account ? (
                            <span className="ml-2 text-muted-foreground">
                              - ₦{Number(driver.account.current_balance).toLocaleString()}
                            </span>
                          ) : (
                            <span className="ml-2 text-muted-foreground">- New account</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {selectedDriverId && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex items-center mb-2">
                <span className="font-medium">{selectedDriver?.full_name}</span>
                {selectedDriver && getStatusBadge(selectedDriver.status)}
              </div>
              {selectedAccount ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Balance:</span>
                    <span className="font-semibold">₦{Number(selectedAccount.current_balance).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Spending Limit:</span>
                    <span className="font-semibold">₦{Number(selectedAccount.spending_limit).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Available to Top Up:</span>
                    <span className="font-semibold">₦{remainingLimit.toLocaleString()}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This driver doesn't have a spending account yet. A new account will be created with a default limit of
                  ₦50,000.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₦)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="0.01"
              required
            />
            {selectedAccount && amount && Number(amount) > remainingLimit && (
              <p className="text-sm text-destructive">
                Amount exceeds available limit by ₦{(Number(amount) - remainingLimit).toLocaleString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a note about this top-up..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || (!initialAccount && !selectedDriverId)}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Top Up Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
