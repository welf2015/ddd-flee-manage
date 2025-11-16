"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

export function InventoryTransactionsTable() {
  const supabase = createClient()

  const { data: transactions = [], isLoading } = useSWR(
    "inventory-transactions",
    async () => {
      const { data } = await supabase
        .from("inventory_transactions")
        .select("*, part:inventory_parts(name, part_number), created_by:profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(50)

      return data || []
    },
    { refreshInterval: 5000 },
  )

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "IN":
        return "bg-green-500/10 text-green-500"
      case "OUT":
        return "bg-red-500/10 text-red-500"
      case "RETURN":
        return "bg-blue-500/10 text-blue-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>Track all inventory movements and adjustments</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No transactions yet</div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{tx.part?.name}</p>
                    <Badge className="text-xs">{tx.part?.part_number}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div>
                      <p className="text-xs">Type</p>
                      <Badge className={getTransactionColor(tx.transaction_type)}>{tx.transaction_type}</Badge>
                    </div>
                    <div>
                      <p className="text-xs">Quantity</p>
                      <p className="font-medium text-foreground">{tx.quantity} units</p>
                    </div>
                    <div>
                      <p className="text-xs">Reference</p>
                      <p className="font-medium text-foreground">{tx.reference_type || "Manual"}</p>
                    </div>
                  </div>
                  {tx.notes && <p className="text-xs text-muted-foreground mt-2">{tx.notes}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    By {tx.created_by?.full_name} • {new Date(tx.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
