"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, User, Calendar, AlertCircle, Fuel, Ticket, Wallet, Settings } from "lucide-react"
import { useState, useEffect } from "react"
import { assignDriverWithExpenses } from "@/app/actions/bookings"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { getPrepaidAccounts } from "@/app/actions/expenses"
import { formatCurrency } from "@/lib/utils"
import { FuelRateSettingsDialog } from "@/components/fuel-rate-settings-dialog"

type AssignDriverDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookingId: string
  onSuccess: () => void
}

export function AssignDriverDialog({ open, onOpenChange, bookingId, onSuccess }: AssignDriverDialogProps) {
  const [drivers, setDrivers] = useState<any[]>([])
  const [selectedDriver, setSelectedDriver] = useState("")
  const [driverDetails, setDriverDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showRateSettings, setShowRateSettings] = useState(false)

  // Expense fields
  const [fuelAmount, setFuelAmount] = useState("")
  const [fuelLiters, setFuelLiters] = useState("")
  const [ticketingAmount, setTicketingAmount] = useState("")
  const [allowanceAmount, setAllowanceAmount] = useState("")
  const [fuelRate, setFuelRate] = useState(1019) // Default rate

  // Account balances
  const [fuelAccount, setFuelAccount] = useState<any>(null)
  const [ticketingAccount, setTicketingAccount] = useState<any>(null)
  const [allowanceAccount, setAllowanceAccount] = useState<any>(null)

  useEffect(() => {
    if (open) {
      fetchDrivers()
      fetchAccounts()
      fetchFuelRate()
      // Reset expense fields when dialog opens - fuel defaults to 0 (required for accounting)
      setFuelAmount("")
      setFuelLiters("")
      setTicketingAmount("")
      setAllowanceAmount("")
    }
  }, [open])

  const fetchAccounts = async () => {
    try {
      // Fetch all accounts first
      const { data: allAccounts, error } = await getPrepaidAccounts()
      
      if (error) {
        console.error("❌ [Assign Driver] Error fetching accounts:", error)
        toast.error("Failed to load expense accounts. Please ensure default accounts are created.")
        return
      }

      if (!allAccounts || allAccounts.length === 0) {
        console.warn("⚠️ [Assign Driver] No prepaid accounts found. Please run migration scripts to create default accounts.")
        toast.error("No expense accounts found. Please contact administrator.")
        return
      }

      // Filter by vendor type - check both nested vendor object and direct vendor_type
      const fuelOnly = allAccounts?.filter((a: any) => {
        const vendorType = a.vendor?.vendor_type || a.vendor_type
        return vendorType === "Fuel"
      }) || []
      
      const ticketingOnly = allAccounts?.filter((a: any) => {
        const vendorType = a.vendor?.vendor_type || a.vendor_type
        return vendorType === "Ticketing"
      }) || []
      
      const allowanceOnly = allAccounts?.filter((a: any) => {
        const vendorType = a.vendor?.vendor_type || a.vendor_type
        return vendorType === "Allowance"
      }) || []
      
      // Helper function to select the account with actual data (prefer non-zero balance or most recent)
      const selectBestAccount = (accounts: any[]) => {
        if (accounts.length === 0) return null
        if (accounts.length === 1) return accounts[0]
        
        // Prefer account with non-zero balance or transactions
        const withData = accounts.find((a: any) => 
          (a.current_balance && parseFloat(a.current_balance) !== 0) || 
          (a.total_deposited && parseFloat(a.total_deposited) !== 0) ||
          (a.total_spent && parseFloat(a.total_spent) !== 0)
        )
        
        if (withData) {
          console.log("✅ Selected account with data:", withData.account_name, "balance:", withData.current_balance)
          return withData
        }
        
        // If all are zero, prefer the one with most recent update
        const sorted = accounts.sort((a: any, b: any) => 
          new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
        )
        
        console.log("⚠️ All accounts have zero balance, selecting most recent:", sorted[0].account_name)
        return sorted[0]
      }

      
      if (fuelOnly.length > 0) {
        // Select the account with actual data (not the empty duplicate)
        const selectedFuelAccount = selectBestAccount(fuelOnly)
        if (!selectedFuelAccount) {
          console.warn("⚠️ [Fuel Account] No valid account found after filtering")
          return
        }
        
        // Ensure current_balance is a number
        const rawBalance = selectedFuelAccount.current_balance
        const parsedBalance = parseFloat(rawBalance || 0)
        const fuelAcc = { ...selectedFuelAccount, current_balance: parsedBalance }
        
        console.log("⛽ [Fuel Account] Selected:", fuelAcc.account_name, "Balance:", parsedBalance)
        setFuelAccount(fuelAcc)
      } else {
        console.warn("⚠️ [Fuel Account] No fuel account found!")
        console.warn("⚠️ [Fuel Account] Available accounts:", allAccounts.map((a: any) => ({
          id: a.id,
          name: a.account_name,
          current_balance: a.current_balance,
          balance_type: typeof a.current_balance,
          total_deposited: a.total_deposited,
          total_spent: a.total_spent,
          vendor_type: a.vendor?.vendor_type,
        })))
      }
      
      if (ticketingOnly.length > 0) {
        // Select the account with actual data (not the empty duplicate)
        const selectedTicketingAccount = selectBestAccount(ticketingOnly)
        if (!selectedTicketingAccount) {
          console.warn("⚠️ [Ticketing Account] No valid account found after filtering")
          return
        }
        
        // Ensure current_balance is a number
        const rawBalance = selectedTicketingAccount.current_balance
        const parsedBalance = parseFloat(rawBalance || 0)
        const ticketingAcc = { ...selectedTicketingAccount, current_balance: parsedBalance }
        
        console.log("🎫 [Ticketing Account] Selected:", ticketingAcc.account_name, "Balance:", parsedBalance)
        setTicketingAccount(ticketingAcc)
      } else {
        console.warn("⚠️ [Ticketing Account] No ticketing account found!")
      }
      
      if (allowanceOnly.length > 0) {
        // Select the account with actual data (not the empty duplicate)
        const selectedAllowanceAccount = selectBestAccount(allowanceOnly)
        if (!selectedAllowanceAccount) {
          console.warn("⚠️ [Allowance Account] No valid account found after filtering")
          return
        }
        
        // Ensure current_balance is a number
        const rawBalance = selectedAllowanceAccount.current_balance
        const parsedBalance = parseFloat(rawBalance || 0)
        const allowanceAcc = { ...selectedAllowanceAccount, current_balance: parsedBalance }
        
        console.log("💰 [Allowance Account] Selected:", allowanceAcc.account_name, "Balance:", parsedBalance)
        setAllowanceAccount(allowanceAcc)
      } else {
        console.warn("⚠️ [Allowance Account] No allowance account found!")
      }
      
    } catch (error) {
      console.error("Failed to fetch accounts:", error)
      toast.error("Failed to load expense accounts")
    }
  }

  const fetchFuelRate = async () => {
    try {
      const { getFuelRate } = await import("@/app/actions/settings")
      const result = await getFuelRate()
      if (result.success && result.rate) {
        setFuelRate(result.rate)
        console.log("⛽ [Assign Driver] Fuel rate loaded:", result.rate)
      }
    } catch (error) {
      console.error("Error fetching fuel rate:", error)
    }
  }

  useEffect(() => {
    if (fuelLiters && Number(fuelLiters) > 0) {
      const calculatedAmount = (Number(fuelLiters) * fuelRate).toFixed(2)
      setFuelAmount(calculatedAmount)
    } else if (!fuelLiters || fuelLiters === "0") {
      setFuelAmount("")
    }
  }, [fuelLiters, fuelRate])

  useEffect(() => {
    if (selectedDriver) {
      const driver = drivers.find((d) => d.id === selectedDriver)
      setDriverDetails(driver)
    } else {
      setDriverDetails(null)
    }
  }, [selectedDriver, drivers])

  const fetchDrivers = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("drivers")
      .select("*, vehicles:assigned_vehicle_id(*)")
      .eq("status", "Active")

    if (error) {
      toast.error("Failed to fetch drivers")
      return
    }

    setDrivers(data || [])
  }

  const handleAssign = async () => {
    if (!selectedDriver) {
      toast.error("Please select a driver")
      return
    }

    setLoading(true)

    // Prepare expenses object - fuel is always required for accounting
    const expenses: any = {}
    
    // Fuel is always required (defaults to 0 if not entered)
    if (!fuelAccount) {
      toast.error("Fuel account not found. Please contact administrator.")
      setLoading(false)
      return
    }
    
    // Always set fuel expense (required for accounting)
    const fuelAmt = fuelAmount ? Number.parseFloat(fuelAmount) : 0
    expenses.fuelAmount = fuelAmt
    expenses.fuelLiters = fuelLiters ? Number.parseFloat(fuelLiters) : undefined
    expenses.fuelAccountId = fuelAccount.id
    
    // Set ticketing expense if provided
    if (ticketingAmount && ticketingAccount) {
      expenses.ticketingAmount = Number.parseFloat(ticketingAmount)
      expenses.ticketingAccountId = ticketingAccount.id
    }
    
    // Set allowance expense if provided
    if (allowanceAmount && allowanceAccount) {
      expenses.allowanceAmount = Number.parseFloat(allowanceAmount)
    }

    console.log("📊 [Assign Driver] Submitting expenses:", expenses)
    const result = await assignDriverWithExpenses(bookingId, selectedDriver, expenses)
    
    if (result.success) {
      console.log("✅ [Assign Driver] Expenses saved successfully")
    } else {
      console.error("❌ [Assign Driver] Failed to save expenses:", result.error)
    }
    setLoading(false)

    if (result.success) {
      toast.success("Driver assigned and expenses logged successfully")
      onSuccess()
    } else {
      toast.error(result.error || "Failed to assign driver")
    }
  }

  const isVehicleAvailable = (vehicle: any) => {
    return vehicle && vehicle.status === "Active"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle>Assign Driver to Job</DialogTitle>
          <DialogDescription>Select an available driver to assign to this booking</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Driver</Label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a driver..." />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => {
                  const hasVehicle = driver.vehicles
                  const vehicleAvailable = hasVehicle && isVehicleAvailable(driver.vehicles)

                  return (
                    <SelectItem
                      key={driver.id}
                      value={driver.id}
                      disabled={!vehicleAvailable}
                      className={!vehicleAvailable ? "opacity-50" : ""}
                    >
                      {driver.full_name}
                      {!hasVehicle && " (No Vehicle)"}
                      {hasVehicle && !vehicleAvailable && " (Vehicle Unavailable)"}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Only drivers with available vehicles are selectable</p>
          </div>

          {driverDetails && (
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {driverDetails.photo_url ? (
                      <img
                        src={driverDetails.photo_url || "/placeholder.svg"}
                        alt={driverDetails.full_name}
                        className="h-12 w-12 rounded-full object-cover border-2 border-accent"
                      />
                    ) : (
                      <div className="p-2 rounded-full bg-green-500/10">
                        <User className="h-5 w-5 text-green-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{driverDetails.full_name}</p>
                      <p className="text-sm text-muted-foreground">{driverDetails.phone}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500">
                    {driverDetails.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-muted-foreground">License Number</label>
                    <p className="font-medium">{driverDetails.license_number}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">License Expiry</label>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span className="font-medium">
                        {driverDetails.license_expiry
                          ? new Date(driverDetails.license_expiry).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {driverDetails.vehicles ? (
                  <>
                    <div className="border-t pt-4">
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Assigned Vehicle</label>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-500/10">
                          <Truck className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{driverDetails.vehicles.vehicle_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {driverDetails.vehicles.make} {driverDetails.vehicles.model} (
                            {driverDetails.vehicles.vehicle_type})
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            isVehicleAvailable(driverDetails.vehicles)
                              ? "bg-green-500/10 text-green-500"
                              : "bg-gray-500/10 text-gray-500"
                          }
                        >
                          {driverDetails.vehicles.status}
                        </Badge>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="border-t pt-4 flex items-center gap-2 text-yellow-500">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">No vehicle assigned to this driver</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Trip Expenses Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Trip Expenses</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter expense amounts for this trip. Expenses will be automatically logged and deducted from prepaid accounts.
              </p>
            </div>

            {/* Fuel Required */}
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Fuel className="h-5 w-5 text-blue-500" />
                  <Label className="text-base font-semibold">Fuel Required</Label>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="fuelLiters">Liters *</Label>
                      <Input
                        id="fuelLiters"
                        type="number"
                        step="0.01"
                        min="0"
                        value={fuelLiters}
                        onChange={(e) => setFuelLiters(e.target.value)}
                        placeholder="0.00"
                      />
                      <p className="text-xs text-muted-foreground">Enter liters used</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fuelAmount">Amount (₦)</Label>
                      <Input
                        id="fuelAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={fuelAmount}
                        onChange={(e) => setFuelAmount(e.target.value)}
                        placeholder="Auto-calculated"
                        className="bg-muted"
                        disabled
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Rate: ₦{fuelRate}/L</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => setShowRateSettings(true)}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Update
                        </Button>
                      </div>
                    </div>
                  </div>
                  {fuelAccount ? (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Account Balance</p>
                      <p
                        className={`text-sm font-medium ${
                          (fuelAccount.current_balance || 0) < 0 ? "text-red-500" : "text-green-500"
                        }`}
                      >
                        {formatCurrency(fuelAccount.current_balance || 0, "NGN")}
                        {(fuelAccount.current_balance || 0) < 0 && " (Overdrawn)"}
                      </p>
                    </div>
                  ) : (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">No fuel account found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Government Ticketing */}
            <Card className="border-purple-500/20 bg-purple-500/5">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Ticket className="h-5 w-5 text-purple-500" />
                  <Label className="text-base font-semibold">Government Ticketing</Label>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="ticketingAmount">Amount (NGN)</Label>
                    <Input
                      id="ticketingAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={ticketingAmount}
                      onChange={(e) => setTicketingAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  {ticketingAccount ? (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Account Balance</p>
                      <p
                        className={`text-sm font-medium ${
                          (ticketingAccount.current_balance || 0) < 0 ? "text-red-500" : "text-green-500"
                        }`}
                      >
                        {formatCurrency(ticketingAccount.current_balance || 0, "NGN")}
                        {(ticketingAccount.current_balance || 0) < 0 && " (Overdrawn)"}
                      </p>
                    </div>
                  ) : (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">No ticketing account found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Driver Allowance */}
            <Card className="border-orange-500/20 bg-orange-500/5">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-5 w-5 text-orange-500" />
                  <Label className="text-base font-semibold">Driver Allowance</Label>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="allowanceAmount">Amount (NGN)</Label>
                    <Input
                      id="allowanceAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={allowanceAmount}
                      onChange={(e) => setAllowanceAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  {allowanceAccount ? (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Account Balance</p>
                      <p
                        className={`text-sm font-medium ${
                          (allowanceAccount.current_balance || 0) < 0 ? "text-red-500" : "text-green-500"
                        }`}
                      >
                        {formatCurrency(allowanceAccount.current_balance || 0, "NGN")}
                        {(allowanceAccount.current_balance || 0) < 0 && " (Overdrawn)"}
                      </p>
                    </div>
                  ) : (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">No allowance account found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedDriver || loading || (driverDetails && !isVehicleAvailable(driverDetails.vehicles))}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? "Assigning..." : "Assign Driver & Log Expenses"}
            </Button>
          </div>
        </div>
      </DialogContent>

      <FuelRateSettingsDialog
        open={showRateSettings}
        onOpenChange={setShowRateSettings}
        currentRate={fuelRate}
        onSuccess={() => fetchFuelRate()}
      />
    </Dialog>
  )
}
