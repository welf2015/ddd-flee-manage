"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, AlertTriangle } from "lucide-react"
import { InventoryPartsTable } from "@/components/inventory/inventory-parts-table"
import { InventoryTransactionsTable } from "@/components/inventory/inventory-transactions-table"
import { AddPartDialog } from "@/components/inventory/add-part-dialog"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

export function InventoryClient() {
  const [showAddPart, setShowAddPart] = useState(false)
  const supabase = createClient()

  const { data: lowStock = [] } = useSWR(
    "low-stock",
    async () => {
      const { data } = await supabase
        .from("inventory_parts")
        .select("*")
        .lte("current_stock", "reorder_level")
        .order("current_stock", { ascending: true })

      return data || []
    },
    { refreshInterval: 10000 },
  )

  const { data: stats } = useSWR("inventory-stats", async () => {
    const { count: totalParts } = await supabase.from("inventory_parts").select("*", { count: "exact", head: true })

    const { count: lowStockCount } = await supabase
      .from("inventory_parts")
      .select("*", { count: "exact", head: true })
      .lte("current_stock", "reorder_level")

    return { totalParts: totalParts || 0, lowStockCount: lowStockCount || 0 }
  })

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Parts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalParts || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Parts in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.lowStockCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Below reorder level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground mt-1">Inventory categories</p>
          </CardContent>
        </Card>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
            <CardDescription className="text-yellow-800">{lowStock.length} part(s) below reorder level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStock.slice(0, 5).map((part: any) => (
                <div key={part.id} className="flex items-center justify-between text-sm">
                  <span>
                    {part.name} ({part.part_number})
                  </span>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                    {part.current_stock}/{part.reorder_level}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="parts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="parts">Parts Inventory</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="parts" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Inventory Parts</h2>
              <p className="text-sm text-muted-foreground">Manage vehicle parts and supplies</p>
            </div>
            <Button onClick={() => setShowAddPart(true)} className="bg-accent hover:bg-accent/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Part
            </Button>
          </div>

          <InventoryPartsTable />

          {showAddPart && <AddPartDialog open={showAddPart} onOpenChange={setShowAddPart} />}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4 mt-4">
          <div>
            <h2 className="text-lg font-semibold">Transaction History</h2>
            <p className="text-sm text-muted-foreground">Track all inventory movements</p>
          </div>

          <InventoryTransactionsTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
