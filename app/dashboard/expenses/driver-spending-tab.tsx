"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getDriversWithAllowanceSpending } from "@/app/actions/driver-spending"
import { Wallet, AlertTriangle, TrendingDown, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type DriverWithSpending = {
  driver_id: string
  driver: {
    id: string
    full_name: string
    phone: string
    status: string
  }
  current_balance: number
  spending_limit: number
  daily_spent: number
  weekly_spent: number
  total_spent: number
  has_account: boolean
  is_active: boolean
}

export function DriverSpendingTab() {
  const [drivers, setDrivers] = useState<DriverWithSpending[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchDrivers = async () => {
    setLoading(true)
    const result = await getDriversWithAllowanceSpending()
    if (result.success && result.data) {
      setDrivers(result.data)
    } else if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchDrivers()
  }, [])

  const getBalanceStatus = (balance: number, totalSpent: number) => {
    if (balance < 0) return { color: "destructive", icon: AlertTriangle }
    if (totalSpent > 100000) return { color: "warning", icon: TrendingDown }
    return { color: "default", icon: Wallet }
  }

  const getSpendingProgress = (weeklySpent: number, limit: number) => {
    if (limit === 0) return 0
    return (weeklySpent / limit) * 100
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Active
          </Badge>
        )
      case "Currently on Job":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Currently on Job
          </Badge>
        )
      case "Assigned to Job":
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            Assigned to Job
          </Badge>
        )
      case "Inactive":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Inactive
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
        <p className="text-muted-foreground">Loading drivers...</p>
      </div>
    )
  }

  if (drivers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No drivers found</p>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Add drivers in Settings to get started with driver spending management
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Driver Money Meters</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver Name</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Spent Today</TableHead>
                <TableHead>Spent This Week</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Spending Limit</TableHead>
                <TableHead>Weekly Progress</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((item) => {
                const balance = Number(item.current_balance) || 0
                const dailySpent = Number(item.daily_spent) || 0
                const weeklySpent = Number(item.weekly_spent) || 0
                const totalSpent = Number(item.total_spent) || 0
                const spendingLimit = Number(item.spending_limit) || 0

                const balanceStatus = getBalanceStatus(balance, totalSpent)
                const spendingProgress = getSpendingProgress(weeklySpent, spendingLimit)
                const BalanceIcon = balanceStatus.icon

                return (
                  <TableRow key={item.driver_id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{item.driver.full_name}</p>
                        <div className="flex items-center gap-2 mt-1">{getStatusBadge(item.driver.status)}</div>
                        {item.driver.phone && item.driver.phone !== "N/A" && (
                          <p className="text-xs text-muted-foreground mt-1">{item.driver.phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BalanceIcon className="h-4 w-4" />
                        <span className={balance < 0 ? "text-destructive font-semibold" : ""}>
                          {balance < 0 ? `-₦${Math.abs(balance).toLocaleString()}` : `₦${balance.toLocaleString()}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={dailySpent > 0 ? "text-orange-600 font-medium" : ""}>
                        ₦{dailySpent.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>₦{weeklySpent.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={totalSpent > 0 ? "font-medium" : "text-muted-foreground"}>
                        ₦{totalSpent.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {spendingLimit > 0 ? (
                        `₦${spendingLimit.toLocaleString()}`
                      ) : (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {spendingLimit > 0 ? (
                        <div className="space-y-1 min-w-[120px]">
                          <Progress value={Math.min(spendingProgress, 100)} className="h-2" />
                          <p className="text-xs text-muted-foreground">{spendingProgress.toFixed(0)}% of limit</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No limit set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {balance < 0 ? (
                        <Badge variant="destructive">Negative Balance</Badge>
                      ) : totalSpent > 0 ? (
                        spendingLimit > 0 && spendingProgress >= 100 ? (
                          <Badge variant="destructive">Limit Reached</Badge>
                        ) : spendingLimit > 0 && spendingProgress >= 80 ? (
                          <Badge className="bg-yellow-500">Near Limit</Badge>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )
                      ) : !item.has_account ? (
                        <Badge variant="secondary">No Account</Badge>
                      ) : (
                        <Badge variant="outline">No Spending</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
