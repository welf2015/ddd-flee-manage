"use client"

import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface OverdraftDetailsSheetProps {
  isOpen: boolean
  driverId: string | null
  onClose: () => void
}

interface DriverOverdraftDetail {
  driver_id: string
  full_name: string
  phone: string
  current_balance: number
  spending_limit: number
  overdraft_amount: number
  weekly_expenses: number
  daily_expenses: number
  last_transaction_date: string | null
  status: string
}

interface Transaction {
  id: string
  created_at: string
  amount: number
  transaction_type: string
  notes: string | null
}

export function OverdraftDetailsSheet({ isOpen, driverId, onClose }: OverdraftDetailsSheetProps) {
  const [details, setDetails] = useState<DriverOverdraftDetail | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !driverId) return

    const fetchDetails = async () => {
      setLoading(true)
      try {
        const [detailsRes, transactionsRes] = await Promise.all([
          fetch(`/api/driver-spending/overdrafts?limit=100`),
          fetch(`/api/driver-spending/driver-transactions?driver_id=${driverId}&limit=50`),
        ])

        const detailsData = await detailsRes.json()
        const transactionsData = await transactionsRes.json()

        const driverDetail = detailsData.all_drivers_status?.find((d: any) => d.driver_id === driverId)
        setDetails(driverDetail)
        setTransactions(transactionsData.transactions || [])
      } catch (error) {
        console.error("[v0] Error fetching overdraft details:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [isOpen, driverId])

  if (!details) return null

  const getStatusColor = (status: string) => {
    if (details.overdraft_amount > details.spending_limit * 0.5) return "destructive"
    if (details.overdraft_amount > 0) return "secondary"
    return "default"
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl max-h-screen overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{details.full_name}</SheetTitle>
          <SheetDescription>{details.phone}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Current Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${details.current_balance < 0 ? "text-destructive" : "text-green-600"}`}
                >
                  ₦{details.current_balance.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Overdraft Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">₦{details.overdraft_amount.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Spending Limit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{details.spending_limit.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Weekly Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{details.weekly_expenses.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Status and Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={getStatusColor(details.status)}>
                {details.overdraft_amount > details.spending_limit * 0.5 ? "Critical Overdraft" : "Overdrawn"}
              </Badge>
            </div>

            {details.last_transaction_date && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Transaction</span>
                <span className="text-sm text-gray-600">
                  {new Date(details.last_transaction_date).toLocaleDateString()}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overdraft %</span>
              <span className="text-sm font-bold text-destructive">
                {Math.round((details.overdraft_amount / details.spending_limit) * 100)}% of limit
              </span>
            </div>
          </div>

          {/* Transactions */}
          <div className="space-y-3">
            <h3 className="font-semibold">Recent Transactions</h3>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No transactions found</div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm">{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-sm">
                          <Badge variant="outline">{tx.transaction_type}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">₦{tx.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-gray-600">{tx.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
